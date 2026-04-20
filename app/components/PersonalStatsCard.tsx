"use client";

import { useMemo } from "react";
import type { PlayStatus } from "@/lib/types";

interface UserGame {
  id: string;
  playtime_hours: number;
  rating: number | null;
  play_status: PlayStatus | null;
  games: {
    genres: number[] | null;
  };
}

interface Genre {
  id: number;
  name: string;
}

interface PersonalStatsCardProps {
  library: UserGame[];
  availableGenres?: Genre[];
}

export default function PersonalStatsCard({
  library,
  availableGenres = [],
}: PersonalStatsCardProps) {
  const stats = useMemo(() => {
    // Total playtime
    const totalPlaytime = library.reduce(
      (sum, game) => sum + (game.playtime_hours || 0),
      0,
    );

    // Games count (excluding wishlist)
    const gamesCount = library.filter(
      (game) => game.play_status !== "wishlist"
    ).length;

    // Games with 100+ hours
    const hundredPlusHours = library.filter(
      (game) => game.playtime_hours >= 100,
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

    // Play status counts
    const playingCount = library.filter((game) => game.play_status === "playing").length;
    const backlogCount = library.filter((game) => game.play_status === "backlog").length;
    const wishlistCount = library.filter((game) => game.play_status === "wishlist").length;

    return {
      totalPlaytime: Math.round(totalPlaytime),
      gamesCount,
      favoriteGenre,
      averageRating,
      hundredPlusHours,
      playingCount,
      backlogCount,
      wishlistCount,
    };
  }, [library, availableGenres]);

  const statItems = [
    {
      icon: "fa-solid fa-gamepad",
      label: "Played",
      value: stats.gamesCount.toLocaleString(),
    },
    {
      icon: "fa-solid fa-clock",
      label: "Total Hours",
      value: stats.totalPlaytime.toLocaleString(),
    },
    {
      icon: "fa-solid fa-star",
      label: "Avg Rating",
      value: stats.averageRating ? `${stats.averageRating.toFixed(1)}` : "N/A",
    },
    {
      icon: "fa-solid fa-heart",
      label: "Favorite Genre",
      value: stats.favoriteGenre || "N/A",
    },
    {
      icon: "fa-solid fa-trophy",
      label: "100+ Hours",
      value: stats.hundredPlusHours.toString(),
    },
    {
      icon: "fa-solid fa-play-circle",
      label: "Playing",
      value: stats.playingCount.toString(),
    },
    {
      icon: "fa-solid fa-list-check",
      label: "Backlog",
      value: stats.backlogCount.toString(),
    },
    {
      icon: "fa-solid fa-bookmark",
      label: "Wishlist",
      value: stats.wishlistCount.toString(),
    },
  ];

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 lg:p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Your Stats</h2>

      {/* Stats Grid - 2 rows x 4 columns */}
      <div className="grid grid-cols-4 gap-4">
        {statItems.map((stat) => {
          const valueStr = String(stat.value);
          // Scale font down for long text (e.g. long genre names)
          const valueSize =
            valueStr.length > 12
              ? "text-sm"
              : valueStr.length > 9
              ? "text-base"
              : valueStr.length > 7
              ? "text-lg"
              : valueStr.length > 5
              ? "text-xl"
              : "text-2xl";
          return (
            <div key={stat.label} className="text-center min-w-0">
              <i
                className={`${stat.icon} text-[#b8253d] text-2xl mb-2 block`}
              ></i>
              <p
                className={`${valueSize} font-bold text-white mb-1 truncate`}
                title={valueStr}
              >
                {stat.value}
              </p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
