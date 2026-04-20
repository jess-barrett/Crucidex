"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { UserGame } from "@/lib/types";

interface RecentActivityFeedProps {
  library: UserGame[];
}

interface ActivityItem {
  id: string;
  game: UserGame;
  date: Date;
  type: "added" | "played";
}

export default function RecentActivityFeed({
  library,
}: RecentActivityFeedProps) {
  const recentActivity = useMemo(() => {
    // Get recently played (Steam data)
    const recentlyPlayed = library
      .filter((g) => g.last_played_at !== null)
      .map((g) => ({
        id: g.id,
        game: g,
        date: new Date(g.last_played_at!),
        type: "played" as const,
      }));

    // Get recently added
    const recentlyAdded = library.map((g) => ({
      id: g.id,
      game: g,
      date: new Date(g.added_at!),
      type: "added" as const,
    }));

    // Combine and dedupe (prefer played over added for same game)
    const combined = [...recentlyPlayed, ...recentlyAdded];
    const uniqueMap = new Map<string, ActivityItem>();

    combined.forEach((item) => {
      const existing = uniqueMap.get(item.game.id);
      if (!existing || item.date > existing.date) {
        uniqueMap.set(item.game.id, item);
      }
    });

    // Sort by date (most recent first) and take top 3
    return Array.from(uniqueMap.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 3);
  }, [library]);

  // Helper to format relative time
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 lg:p-8">
      <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>

      {recentActivity.length > 0 ? (
        <div className="space-y-3">
          {recentActivity.map((item) => (
            <Link
              key={item.id}
              href={`/games/${item.game.games.igdb_id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/30 transition-colors"
            >
              {/* Game cover thumbnail */}
              <div className="w-12 h-16 flex-shrink-0 bg-gray-700 rounded overflow-hidden">
                {item.game.games.cover_url ? (
                  <img
                    src={item.game.games.cover_url}
                    alt={item.game.games.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                    ?
                  </div>
                )}
              </div>

              {/* Activity info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {item.game.games.title}
                </p>
                <p className="text-sm text-gray-400">
                  {item.type === "played" ? "Played" : "Added"} •{" "}
                  {getRelativeTime(item.date)}
                </p>
              </div>

              {/* Arrow icon */}
              <i className="fa-solid fa-chevron-right text-gray-600 text-sm"></i>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">No recent activity</p>
          <p className="text-sm text-gray-500 mt-2">
            Start adding games to see activity
          </p>
        </div>
      )}
    </div>
  );
}
