import { createClient } from "@/lib/supabase";

export interface AggregateStats {
  totalPlays: number;
  totalRatings: number;
  averageRating: number | null;
  averageHours: number | null;
  ratingDistribution: Record<number, number>; // rating (0.5-5 stars) => count
  topFourCount: number;
}

/**
 * Fetches aggregate statistics for a specific game from user_games table
 */
export async function getGameAggregateStats(
  gameId: string
): Promise<AggregateStats> {
  const supabase = createClient();

  // Fetch all user_games entries for this game
  const { data: userGames, error } = await supabase
    .from("user_games")
    .select("playtime_hours, rating, top_four_position")
    .eq("game_id", gameId);

  if (error || !userGames) {
    console.error("Error fetching game stats:", error);
    return {
      totalPlays: 0,
      totalRatings: 0,
      averageRating: null,
      averageHours: null,
      ratingDistribution: {},
      topFourCount: 0,
    };
  }

  // Compute statistics
  const totalPlays = userGames.length;
  const ratedGames = userGames.filter((g) => g.rating !== null);
  const totalRatings = ratedGames.length;

  const averageRating =
    totalRatings > 0
      ? ratedGames.reduce((sum, g) => sum + (g.rating || 0), 0) / totalRatings
      : null;

  const averageHours =
    totalPlays > 0
      ? userGames.reduce((sum, g) => sum + g.playtime_hours, 0) / totalPlays
      : null;

  // Rating distribution (count of each rating 0.5-5 stars)
  const ratingDistribution: Record<number, number> = {};
  ratedGames.forEach((g) => {
    if (g.rating) {
      ratingDistribution[g.rating] = (ratingDistribution[g.rating] || 0) + 1;
    }
  });

  const topFourCount = userGames.filter(
    (g) => g.top_four_position !== null
  ).length;

  return {
    totalPlays,
    totalRatings,
    averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
    averageHours: averageHours ? Math.round(averageHours * 10) / 10 : null,
    ratingDistribution,
    topFourCount,
  };
}

/**
 * Gets basic game info from database by IGDB ID
 */
export async function getGameFromDb(igdbId: number) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("igdb_id", igdbId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching game from DB:", error);
    return null;
  }

  return data;
}

/**
 * Gets user's personal data for a specific game (if they have it in their library)
 */
export async function getUserGameData(userId: string | undefined, gameId: string | null) {
  if (!userId || !gameId) {
    return null;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_games")
    .select("*")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user game data:", error);
    return null;
  }

  return data;
}
