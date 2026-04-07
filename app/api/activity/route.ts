import { createServerComponentClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/activity?username=xxx&limit=30
export async function GET(req: NextRequest) {
  const supabase = await createServerComponentClient();
  const username = req.nextUrl.searchParams.get("username");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "30", 10);

  if (!username) {
    return NextResponse.json(
      { error: "username is required" },
      { status: 400 }
    );
  }

  // Look up user
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch activity log entries
  const { data: entries, error: logError } = await supabase
    .from("activity_log")
    .select("id, user_id, game_id, review_id, event_type, metadata, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (logError) {
    return NextResponse.json({ error: logError.message }, { status: 500 });
  }

  if (!entries || entries.length === 0) {
    return NextResponse.json([]);
  }

  // Collect unique game_ids and review_ids to batch-fetch
  const gameIds = [...new Set(entries.map((e) => e.game_id).filter(Boolean))];
  const reviewIds = [...new Set(entries.map((e) => e.review_id).filter(Boolean))];

  // Fetch games, reviews, and user_games in parallel
  const [gamesRes, reviewsRes, userGamesRes] = await Promise.all([
    gameIds.length > 0
      ? supabase
          .from("games")
          .select("id, igdb_id, title, cover_url")
          .in("id", gameIds)
      : Promise.resolve({ data: [] }),
    reviewIds.length > 0
      ? supabase
          .from("reviews")
          .select("id, content, contains_spoilers, created_at, game_id")
          .in("id", reviewIds)
      : Promise.resolve({ data: [] }),
    // Fetch user_games for rating+hours on reviewed games
    gameIds.length > 0
      ? supabase
          .from("user_games")
          .select("game_id, rating, playtime_hours")
          .eq("user_id", profile.id)
          .in("game_id", gameIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Build lookup maps
  const gamesMap = new Map(
    (gamesRes.data || []).map((g: any) => [g.id, g])
  );
  const reviewsMap = new Map(
    (reviewsRes.data || []).map((r: any) => [r.id, r])
  );
  const userGamesMap = new Map(
    (userGamesRes.data || []).map((ug: any) => [ug.game_id, ug])
  );

  // Deduplicate: when multiple events for the same game happen within 10 seconds,
  // keep only the "highest priority" one.
  // Priority: review_created > review_updated > game_added > game_wishlisted > rating_set > rating_changed > status_changed > hours_updated > rating_cleared > game_removed
  const EVENT_PRIORITY: Record<string, number> = {
    review_created: 10,
    review_updated: 9,
    game_added: 8,
    game_wishlisted: 7,
    status_changed: 6,
    hours_updated: 5,
    rating_set: 4,
    rating_changed: 3,
    rating_cleared: 2,
    game_removed: 1,
  };

  const DEDUP_WINDOW_MS = 10_000; // 10 seconds

  const deduped: typeof entries = [];
  const seen = new Map<string, { index: number; time: number; priority: number }>();

  for (const entry of entries) {
    if (!entry.game_id) {
      deduped.push(entry);
      continue;
    }

    const entryTime = new Date(entry.created_at).getTime();
    const priority = EVENT_PRIORITY[entry.event_type] ?? 0;
    const key = entry.game_id;
    const prev = seen.get(key);

    if (prev && Math.abs(entryTime - prev.time) < DEDUP_WINDOW_MS) {
      // Same game within the window — keep the higher priority one
      if (priority > prev.priority) {
        deduped[prev.index] = entry;
        seen.set(key, { index: prev.index, time: entryTime, priority });
      }
      // Otherwise skip this lower-priority entry
    } else {
      // New window — keep this entry
      seen.set(key, { index: deduped.length, time: entryTime, priority });
      deduped.push(entry);
    }
  }

  // Assemble the response
  const result = deduped.map((entry) => {
    const review = entry.review_id
      ? reviewsMap.get(entry.review_id) || null
      : null;
    const userGame = entry.game_id
      ? userGamesMap.get(entry.game_id) || null
      : null;

    return {
      id: entry.id,
      event_type: entry.event_type,
      metadata: entry.metadata,
      created_at: entry.created_at,
      games: entry.game_id ? gamesMap.get(entry.game_id) || null : null,
      reviews: review
        ? {
            ...review,
            rating: userGame?.rating ?? null,
            hours: userGame?.playtime_hours ?? null,
          }
        : null,
    };
  });

  return NextResponse.json(result);
}
