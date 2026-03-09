import { createServerComponentClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { getGamesByIds, getTopGamesByGenres } from "@/lib/igdb";
import { NextResponse } from "next/server";

// How long cached recommendations stay fresh (24 hours)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Category values considered "recommendable" standalone games
const BASE_CATEGORIES = new Set([0, 8, 9]); // Main, Remake, Remaster

function normalizeRating(rating: number | null): number {
  if (rating === null) return 0.6;
  return (rating - 0.5) / 4.5;
}

interface DbGame {
  igdb_id: number;
  title: string;
  cover_url: string | null;
  igdb_rating: number | null;
  genres: number[] | null;
}

interface UserGameRow {
  user_id: string;
  rating: number | null;
  play_status: string | null;
  games: DbGame | null;
}

interface Recommendation {
  igdb_id: number;
  score: number;
  recommended_by_count: number;
  game: {
    igdb_id: number;
    title: string;
    cover_url: string | null;
    igdb_rating: number | null;
    genres: number[] | null;
  };
}

// ── GET — return recommendations (from cache if fresh, else compute + cache) ──
export async function GET() {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ error: "Service not configured" }, { status: 500 });
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // ── Check cache ──────────────────────────────────────────────
    const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();
    const { data: cached } = await adminSupabase
      .from("recommendations")
      .select("igdb_id, score, recommended_by_count, is_collaborative, game_title, game_cover_url, game_igdb_rating, game_genres")
      .eq("user_id", user.id)
      .gte("computed_at", cutoff)
      .order("score", { ascending: false })
      .limit(10);

    if (cached && cached.length > 0) {
      console.log(`[Recommendations] Cache hit — ${cached.length} results`);
      const recommendations = cached.map((r) => ({
        igdb_id: r.igdb_id,
        score: r.score,
        recommended_by_count: r.recommended_by_count,
        game: {
          igdb_id: r.igdb_id,
          title: r.game_title,
          cover_url: r.game_cover_url,
          igdb_rating: r.game_igdb_rating,
          genres: r.game_genres,
        },
      }));
      const reason = cached.every((r) => !r.is_collaborative) ? "genre_based" : undefined;
      return NextResponse.json({ recommendations, ...(reason ? { reason } : {}), cached: true });
    }

    console.log(`[Recommendations] Cache miss — computing for user ${user.id}`);

    // ── Compute ──────────────────────────────────────────────────
    const recommendations = await computeRecommendations(user.id, adminSupabase);

    // ── Save to cache ────────────────────────────────────────────
    if (recommendations.recs.length > 0) {
      const rows = recommendations.recs.map((r) => ({
        user_id: user.id,
        igdb_id: r.igdb_id,
        score: r.score,
        recommended_by_count: r.recommended_by_count,
        is_collaborative: r.recommended_by_count > 0,
        game_title: r.game.title,
        game_cover_url: r.game.cover_url,
        game_igdb_rating: r.game.igdb_rating,
        game_genres: r.game.genres,
        computed_at: new Date().toISOString(),
      }));

      // Upsert — replaces any stale rows for this user
      await adminSupabase
        .from("recommendations")
        .upsert(rows, { onConflict: "user_id,igdb_id" });

      // Remove any old recs that aren't in the new set
      const newIgdbIds = recommendations.recs.map((r) => r.igdb_id);
      await adminSupabase
        .from("recommendations")
        .delete()
        .eq("user_id", user.id)
        .not("igdb_id", "in", `(${newIgdbIds.join(",")})`);
    }

    return NextResponse.json({
      recommendations: recommendations.recs,
      ...(recommendations.reason ? { reason: recommendations.reason } : {}),
    });

  } catch (err) {
    console.error("Recommendations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE — invalidate cache for the current user ──────────────────────────
// Called fire-and-forget whenever the user's library changes.
export async function DELETE() {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) return new NextResponse(null, { status: 204 });

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    await adminSupabase.from("recommendations").delete().eq("user_id", user.id);
    console.log(`[Recommendations] Cache invalidated for user ${user.id}`);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Recommendations invalidation error:", err);
    return new NextResponse(null, { status: 204 }); // never block the caller
  }
}

// ── Core algorithm ───────────────────────────────────────────────────────────
async function computeRecommendations(
  userId: string,
  adminSupabase: any
): Promise<{ recs: Recommendation[]; reason?: string }> {

  const { data: allUserGames, error } = await adminSupabase
    .from("user_games")
    .select(`
      user_id,
      rating,
      play_status,
      games (
        igdb_id,
        title,
        cover_url,
        igdb_rating,
        genres
      )
    `)
    .or("play_status.neq.wishlist,play_status.is.null");

  if (error || !allUserGames) return { recs: [] };

  const rows = allUserGames as unknown as UserGameRow[];
  const targetLibrary = rows.filter((r) => r.user_id === userId);
  const otherLibrary  = rows.filter((r) => r.user_id !== userId);

  const targetIgdbIds = new Set<number>(
    targetLibrary.map((r) => r.games?.igdb_id).filter((id): id is number => id != null)
  );

  console.log(`[Recommendations] Computing: user has ${targetIgdbIds.size} games, ${otherLibrary.length} other rows`);

  if (targetIgdbIds.size === 0) return { recs: [], reason: "empty_library" };

  // Genre profile
  const genreCounts = new Map<number, number>();
  for (const row of targetLibrary) {
    if (Array.isArray(row.games?.genres)) {
      for (const genre of row.games!.genres!) {
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
      }
    }
  }
  const topGenres = [...genreCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([genre]) => genre);

  // Rating profile
  const targetProfile = new Map<number, number>();
  for (const row of targetLibrary) {
    const id = row.games?.igdb_id;
    if (id != null) targetProfile.set(id, normalizeRating(row.rating));
  }

  // Other users' profiles
  const userProfiles = new Map<string, Map<number, number>>();
  for (const row of otherLibrary) {
    const id = row.games?.igdb_id;
    if (id == null) continue;
    if (!userProfiles.has(row.user_id)) userProfiles.set(row.user_id, new Map());
    userProfiles.get(row.user_id)!.set(id, normalizeRating(row.rating));
  }

  // Collaborative filtering — Jaccard + rating alignment
  const userSimilarities = new Map<string, number>();
  for (const [otherUserId, otherProfile] of userProfiles) {
    const sharedIds = [...targetIgdbIds].filter((id) => otherProfile.has(id));
    if (sharedIds.length === 0) continue;

    const jaccard = sharedIds.length / new Set([...targetIgdbIds, ...otherProfile.keys()]).size;

    let ratingBoost = 0;
    for (const id of sharedIds) {
      ratingBoost += 1 - Math.abs(targetProfile.get(id)! - otherProfile.get(id)!);
    }
    const ratingAlignment = ratingBoost / sharedIds.length;

    userSimilarities.set(otherUserId, jaccard * 0.7 + ratingAlignment * 0.3);
  }

  // Score candidates
  const candidateScores = new Map<number, { score: number; count: number; dbGame: DbGame }>();
  for (const row of otherLibrary) {
    const id = row.games?.igdb_id;
    if (id == null || !row.games) continue;
    if (targetIgdbIds.has(id)) continue;

    const similarity = userSimilarities.get(row.user_id) ?? 0;
    if (similarity <= 0) continue;

    const contribution = similarity * normalizeRating(row.rating);
    const existing = candidateScores.get(id);
    if (existing) { existing.score += contribution; existing.count++; }
    else candidateScores.set(id, { score: contribution, count: 1, dbGame: row.games });
  }

  console.log(`[Recommendations] ${candidateScores.size} collaborative candidates`);

  const topCandidates = [...candidateScores.entries()]
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 15);

  // Validate via IGDB
  const igdbGameMap = new Map<number, any>();
  if (topCandidates.length > 0) {
    try {
      const raw = await getGamesByIds(topCandidates.map(([id]) => id));
      if (Array.isArray(raw)) {
        for (const g of raw) {
          if (BASE_CATEGORIES.has(g.category ?? 0)) igdbGameMap.set(g.id, g);
        }
      }
    } catch (err) {
      console.error("[Recommendations] IGDB lookup error:", err);
    }
  }

  const useIgdbFilter = igdbGameMap.size > 0;
  const collaborativeRecs: Recommendation[] = topCandidates
    .filter(([id]) => !useIgdbFilter || igdbGameMap.has(id))
    .slice(0, 10)
    .map(([id, data]) => {
      const g = igdbGameMap.get(id);
      return {
        igdb_id: id,
        score: Math.round(data.score * 100) / 100,
        recommended_by_count: data.count,
        game: {
          igdb_id: id,
          title: g?.name ?? data.dbGame.title,
          cover_url: g?.cover?.url
            ? `https:${g.cover.url.replace("t_thumb", "t_cover_big")}`
            : data.dbGame.cover_url,
          igdb_rating: g?.total_rating ? Math.round(g.total_rating) : data.dbGame.igdb_rating,
          genres: g?.genres ?? data.dbGame.genres,
        },
      };
    });

  // Genre supplement — fill remaining slots up to 10
  const needed = 10 - collaborativeRecs.length;
  let genreRecs: Recommendation[] = [];

  if (needed > 0 && topGenres.length > 0) {
    try {
      const usedIds = new Set([...targetIgdbIds, ...collaborativeRecs.map((r) => r.igdb_id)]);
      const raw = await getTopGamesByGenres(topGenres, needed + 20);
      if (Array.isArray(raw)) {
        genreRecs = raw
          .filter((g: any) => BASE_CATEGORIES.has(g.category ?? 0) && !usedIds.has(g.id))
          .slice(0, needed)
          .map((g: any) => ({
            igdb_id: g.id,
            score: 0,
            recommended_by_count: 0,
            game: {
              igdb_id: g.id,
              title: g.name,
              cover_url: g.cover?.url
                ? `https:${g.cover.url.replace("t_thumb", "t_cover_big")}`
                : null,
              igdb_rating: g.total_rating ? Math.round(g.total_rating) : null,
              genres: g.genres ?? null,
            },
          }));
      }
    } catch (err) {
      console.error("[Recommendations] Genre supplement error:", err);
    }
  }

  const recs = [...collaborativeRecs, ...genreRecs];
  const reason = collaborativeRecs.length === 0 ? "genre_based" : undefined;

  console.log(`[Recommendations] Computed: ${collaborativeRecs.length} collaborative + ${genreRecs.length} genre`);
  return { recs, reason };
}
