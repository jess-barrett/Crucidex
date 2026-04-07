import { getGameDetails } from "@/lib/igdb";
import {
  getGameFromDb,
  getUserGameData,
  getGameAggregateStats,
} from "@/lib/game-stats";
import { createServerComponentClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import GameDetailHeader from "@/app/components/GameDetailHeader";
import GameStatsSection from "@/app/components/GameStatsSection";
import GameActionButtons from "@/app/components/GameActionButtons";

interface PageProps {
  params: Promise<{
    igdb_id: string;
  }>;
}

export default async function GameDetailPage({ params }: PageProps) {
  const { igdb_id } = await params;

  // Validate IGDB ID is numeric
  const igdbId = parseInt(igdb_id, 10);
  if (isNaN(igdbId)) {
    notFound();
  }

  // Fetch game details from IGDB
  const igdbGame = await getGameDetails(igdbId);

  if (!igdbGame) {
    // Game doesn't exist in IGDB
    notFound();
  }

  // Check if game exists in our database
  const dbGame = await getGameFromDb(igdbId);

  // Get current user (if logged in)
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user's personal data and aggregate stats in parallel
  const [userGame, aggregateStats] = await Promise.all([
    dbGame ? getUserGameData(user?.id, dbGame.id) : Promise.resolve(null),
    dbGame
      ? getGameAggregateStats(dbGame.id)
      : Promise.resolve({
          totalPlays: 0,
          totalRatings: 0,
          averageRating: null,
          averageHours: null,
          ratingDistribution: {},
          topFourCount: 0,
        }),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Game Header */}
        <GameDetailHeader igdbGame={igdbGame} dbGame={dbGame} />

        {/* Action Buttons */}
        <div className="mt-6">
          <GameActionButtons
            igdbGame={igdbGame}
            dbGame={dbGame}
            userGame={userGame}
            isLoggedIn={!!user}
            userId={user?.id}
          />
        </div>

        {/* Statistics Section */}
        {dbGame && (
          <div className="mt-8">
            <GameStatsSection stats={aggregateStats} />
          </div>
        )}

        {/* No stats yet message */}
        {!dbGame && (
          <div className="mt-8 bg-gray-800/50 rounded-xl p-12 text-center">
            <p className="text-xl text-gray-300">
              No one has added this game to Crucidex yet.
            </p>
            <p className="text-gray-400 mt-2">
              Be the first to add it to your library!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

// Enable revalidation for caching
export const revalidate = 3600; // 1 hour for IGDB data
