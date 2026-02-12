"use client";

import { useMemo } from "react";

interface UserGame {
  id: string;
  playtime_hours: number;
  rating: number | null;
  games: {
    genres: number[] | null;
  };
}

interface Genre {
  id: number;
  name: string;
}

interface StatsBarProps {
  library: UserGame[];
  availableGenres: Genre[];
}

interface ComputedStats {
  totalPlaytime: number;
  gamesCount: number;
  favoriteGenre: string | null;
  averageRating: number | null;
  hundredPlusHours: number;
}

export default function StatsBar({ library, availableGenres }: StatsBarProps) {
  const stats = useMemo((): ComputedStats => {
    // Total playtime
    const totalPlaytime = library.reduce(
      (sum, game) => sum + (game.playtime_hours || 0),
      0
    );

    // Games count
    const gamesCount = library.length;

    // Games with 100+ hours
    const hundredPlusHours = library.filter(
      (game) => game.playtime_hours >= 100
    ).length;

    // Average user rating (only rated games)
    const ratedGames = library.filter((game) => game.rating !== null);
    const averageRating =
      ratedGames.length > 0
        ? ratedGames.reduce((sum, game) => sum + (game.rating || 0), 0) /
          ratedGames.length
        : null;

    // Favorite genre (most common)
    const genreCounts: Record<number, number> = {};
    library.forEach((game) => {
      const genres = game.games?.genres || [];
      genres.forEach((genreId) => {
        genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
      });
    });

    let favoriteGenreId: number | null = null;
    let maxCount = 0;
    for (const [genreId, count] of Object.entries(genreCounts)) {
      if (count > maxCount) {
        maxCount = count;
        favoriteGenreId = parseInt(genreId);
      }
    }

    const favoriteGenre =
      favoriteGenreId !== null
        ? availableGenres.find((g) => g.id === favoriteGenreId)?.name || null
        : null;

    return {
      totalPlaytime: Math.round(totalPlaytime),
      gamesCount,
      favoriteGenre,
      averageRating,
      hundredPlusHours,
    };
  }, [library, availableGenres]);

  const statItems = [
    { label: "Total Hours", value: stats.totalPlaytime.toLocaleString() },
    { label: "Games", value: stats.gamesCount.toString() },
    { label: "Favorite Genre", value: stats.favoriteGenre || "N/A" },
    {
      label: "Avg Rating",
      value: stats.averageRating ? `${stats.averageRating.toFixed(1)}★` : "N/A",
    },
    { label: "100+ Hours", value: stats.hundredPlusHours.toString() },
  ];

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 lg:p-6 border border-gray-700">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statItems.map((stat) => (
          <div key={stat.label} className="text-center lg:text-left">
            <p className="text-2xl lg:text-3xl font-bold text-white">
              {stat.value}
            </p>
            <p className="text-xs lg:text-sm text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
