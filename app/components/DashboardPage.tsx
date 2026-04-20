"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import Header from "./Header";
import PersonalStatsCard from "./PersonalStatsCard";
import UserRatingDistribution from "./UserRatingDistribution";
import RecentActivityFeed from "./RecentActivityFeed";
import TrendingGamesSection from "./TrendingGamesSection";

interface UserGame {
  id: string;
  playtime_hours: number;
  rating: number | null;
  top_four_position: number | null;
  play_status: string | null;
  added_at: string;
  last_played_at: string | null;
  games: {
    id: string;
    igdb_id: number;
    title: string;
    cover_url: string | null;
    igdb_rating: number | null;
    genres: number[] | null;
    game_modes: number[] | null;
  };
}

interface Genre {
  id: number;
  name: string;
}

export default function DashboardPage({ userId }: { userId: string }) {
  const [library, setLibrary] = useState<UserGame[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch user's profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", userId)
          .single();

        if (profileError) throw profileError;
        setDisplayName(profileData?.display_name || "");

        // Fetch user's library
        const { data: libraryData, error: libraryError } = await supabase
          .from("user_games")
          .select(
            `
            id,
            playtime_hours,
            rating,
            top_four_position,
            play_status,
            added_at,
            last_played_at,
            games (
              id,
              igdb_id,
              title,
              cover_url,
              igdb_rating,
              genres,
              game_modes
            )
          `
          )
          .eq("user_id", userId)
          .order("added_at", { ascending: false });

        if (libraryError) throw libraryError;

        // Fetch available genres
        const { data: genresData, error: genresError } = await supabase
          .from("genres")
          .select("*")
          .order("name");

        if (genresError) throw genresError;

        setLibrary((libraryData as unknown as UserGame[]) || []);
        setGenres((genresData as unknown as Genre[]) || []);
      } catch (err: any) {
        console.error("Error loading dashboard data:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [userId]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-800/50 rounded-xl p-6 lg:p-8 h-96 animate-pulse"
              />
            ))}
          </div>
        </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 text-center">
            <p className="text-red-400 font-semibold">Error loading dashboard</p>
            <p className="text-gray-400 text-sm mt-2">{error}</p>
          </div>
        </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <h1 className="text-3xl font-bold text-white mb-8">
          Welcome back, {displayName}!
        </h1>

        {/* Top row - 3 columns on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <PersonalStatsCard library={library} availableGenres={genres} />
          <UserRatingDistribution library={library} />
          <RecentActivityFeed library={library} />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-8" />

        {/* Trending section */}
        <TrendingGamesSection />
      </div>
      </main>
    </>
  );
}
