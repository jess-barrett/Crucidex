import { createServerComponentClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { getGamesByIds, getTopGamesByGenres } from "@/lib/igdb";
import { NextResponse } from "next/server";

// Category values considered "recommendable" standalone games
const BASE_CATEGORIES = new Set([0, 8, 9]); // Main, Remake, Remaster

// Normalize a 0.5–5 rating to 0–1 scale
function normalizeRating(rating: number | null): number {
  if (rating === null) return 0.6; // treat unrated as slightly positive
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

export async function GET() {
  try {
    // ── Auth ────────────────────────────────────────────────────
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "Recommendation service not configured" },
        { status: 500 }
      );
    }

    // ── Fetch all libraries (bypasses RLS) ──────────────────────
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

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

    if (error) {
      console.error("Recommendations fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }

    const rows = (allUserGames || []) as unknown as UserGameRow[];
    const targetLibrary = rows.filter((r) => r.user_id === user.id);
    const otherLibrary  = rows.filter((r) => r.user_id !== user.id);

    // ── User's game set ─────────────────────────────────────────
    const targetIgdbIds = new Set<number>(
      targetLibrary
        .map((r) => r.games?.igdb_id)
        .filter((id): id is number => id != null)
    );

    console.log(`[Recommendations] User has ${targetIgdbIds.size} games, other users have ${otherLibrary.length} rows`);

    if (targetIgdbIds.size === 0) {
      return NextResponse.json({ recommendations: [], reason: "empty_library" });
    }

    // ── User's genre profile ────────────────────────────────────
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

    // ── User's rating profile ───────────────────────────────────
    const targetProfile = new Map<number, number>();
    for (const row of targetLibrary) {
      const id = row.games?.igdb_id;
      if (id != null) targetProfile.set(id, normalizeRating(row.rating));
    }

    // ── Other users' profiles ───────────────────────────────────
    const userProfiles = new Map<string, Map<number, number>>();
    for (const row of otherLibrary) {
      const id = row.games?.igdb_id;
      if (id == null) continue;
      if (!userProfiles.has(row.user_id)) {
        userProfiles.set(row.user_id, new Map());
      }
      userProfiles.get(row.user_id)!.set(id, normalizeRating(row.rating));
    }

    console.log(`[Recommendations] Found ${userProfiles.size} other users with valid game data`);

    // ── Step 1: Collaborative filtering ─────────────────────────
    // For each other user: compute Jaccard similarity boosted by rating alignment.
    // Users with no games in common are ignored entirely.
    const userSimilarities = new Map<string, number>();
    for (const [otherUserId, otherProfile] of userProfiles) {
      const otherIds = new Set(otherProfile.keys());
      const sharedIds = [...targetIgdbIds].filter((id) => otherIds.has(id));
      if (sharedIds.length === 0) continue; // no common ground — skip

      const intersection = sharedIds.length;
      const union = new Set([...targetIgdbIds, ...otherIds]).size;
      const jaccard = intersection / union;

      // Rating alignment: how similarly did we rate the shared games?
      let ratingBoost = 0;
      for (const id of sharedIds) {
        const diff = Math.abs(targetProfile.get(id)! - otherProfile.get(id)!);
        ratingBoost += 1 - diff;
      }
      const ratingAlignment = ratingBoost / sharedIds.length;

      // Weighted blend: Jaccard captures taste overlap, rating alignment refines it
      userSimilarities.set(otherUserId, jaccard * 0.7 + ratingAlignment * 0.3);
    }

    // Score every game that similar users own but the current user doesn't
    const candidateScores = new Map<
      number,
      { score: number; count: number; dbGame: DbGame }
    >();

    for (const row of otherLibrary) {
      const id = row.games?.igdb_id;
      if (id == null || !row.games) continue;
      if (targetIgdbIds.has(id)) continue; // user already owns it

      const similarity = userSimilarities.get(row.user_id) ?? 0;
      if (similarity <= 0) continue;

      const contribution = similarity * normalizeRating(row.rating);
      const existing = candidateScores.get(id);
      if (existing) {
        existing.score += contribution;
        existing.count += 1;
      } else {
        candidateScores.set(id, { score: contribution, count: 1, dbGame: row.games });
      }
    }

    console.log(`[Recommendations] ${candidateScores.size} candidate games from collaborative filtering`);

    // Sort by score, take top 15 to send to IGDB for validation
    const topCandidates = [...candidateScores.entries()]
      .sort(([, a], [, b]) => b.score - a.score)
      .slice(0, 15);

    // ── Step 2: Validate collaborative candidates via IGDB ───────
    const igdbGameMap = new Map<number, any>();
    if (topCandidates.length > 0) {
      try {
        const ids = topCandidates.map(([id]) => id);
        const igdbGames = await getGamesByIds(ids);
        if (Array.isArray(igdbGames) && igdbGames.length > 0) {
          const valid = igdbGames.filter((g: any) => BASE_CATEGORIES.has(g.category ?? 0));
          for (const g of valid) igdbGameMap.set(g.id, g);
          console.log(`[Recommendations] IGDB: ${igdbGames.length} games, ${valid.length} base games`);
        } else {
          console.warn("[Recommendations] IGDB returned no results, using DB fallback");
        }
      } catch (err) {
        console.error("[Recommendations] IGDB lookup failed, using DB fallback:", err);
      }
    }

    // Build collaborative recommendations
    const useIgdbFilter = igdbGameMap.size > 0;
    const collaborativeRecs: Recommendation[] = topCandidates
      .filter(([id]) => !useIgdbFilter || igdbGameMap.has(id))
      .slice(0, 10)
      .map(([id, data]) => {
        const igdbGame = igdbGameMap.get(id);
        return {
          igdb_id: id,
          score: Math.round(data.score * 100) / 100,
          recommended_by_count: data.count,
          game: {
            igdb_id: id,
            title: igdbGame?.name ?? data.dbGame.title,
            cover_url: igdbGame?.cover?.url
              ? `https:${igdbGame.cover.url.replace("t_thumb", "t_cover_big")}`
              : data.dbGame.cover_url,
            igdb_rating: igdbGame?.total_rating
              ? Math.round(igdbGame.total_rating)
              : data.dbGame.igdb_rating,
            genres: igdbGame?.genres ?? data.dbGame.genres,
          },
        };
      });

    console.log(`[Recommendations] Collaborative: ${collaborativeRecs.length} results`);

    // ── Step 3: Supplement with genre-based if < 10 results ─────
    // Fills remaining slots so the section always feels full.
    const needed = 10 - collaborativeRecs.length;
    let genreRecs: Recommendation[] = [];

    if (needed > 0 && topGenres.length > 0) {
      try {
        const usedIds = new Set([
          ...targetIgdbIds,
          ...collaborativeRecs.map((r) => r.igdb_id),
        ]);
        const raw = await getTopGamesByGenres(topGenres, needed + 20); // fetch extra to account for filtering
        if (Array.isArray(raw)) {
          genreRecs = raw
            .filter((g: any) => BASE_CATEGORIES.has(g.category ?? 0))
            .filter((g: any) => !usedIds.has(g.id))
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
      console.log(`[Recommendations] Genre supplement: ${genreRecs.length} results`);
    }

    const recommendations = [...collaborativeRecs, ...genreRecs];
    const reason = collaborativeRecs.length === 0 ? "genre_based" : undefined;

    console.log(`[Recommendations] Returning ${recommendations.length} total (${collaborativeRecs.length} collaborative, ${genreRecs.length} genre)`);
    return NextResponse.json({ recommendations, ...(reason ? { reason } : {}) });

  } catch (err) {
    console.error("Recommendations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
