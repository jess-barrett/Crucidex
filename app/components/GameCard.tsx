"use client";

import Link from "next/link";
import GameCardMenu from "./GameCardMenu";
import type { PlayStatus } from "@/lib/types";

interface UserGame {
  id: string;
  playtime_hours: number;
  rating: number | null;
  top_four_position: number | null;
  play_status: PlayStatus | null;
  games: {
    id: string;
    igdb_id: number;
    title: string;
    cover_url: string | null;
  };
}

interface GameCardProps {
  item: UserGame;
  isOwnProfile: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_LABELS: Record<PlayStatus, string> = {
  playing: "Playing",
  completed: "Completed",
  played: "Played",
  backlog: "Backlog",
  wishlist: "Wishlist",
  shelved: "Shelved",
  retired: "Retired",
  abandoned: "Abandoned",
};

const STATUS_COLORS: Record<PlayStatus, string> = {
  playing: "text-green-400",
  completed: "text-[#b8253d]",
  played: "text-gray-400",
  backlog: "text-yellow-400",
  wishlist: "text-purple-400",
  shelved: "text-orange-400",
  retired: "text-indigo-400",
  abandoned: "text-red-400",
};

export default function GameCard({
  item,
  isOwnProfile,
  onEdit,
  onDelete,
}: GameCardProps) {
  const igdbId = item.games?.igdb_id;
  const status = item.play_status;

  // Build array of filled stars (supports half stars)
  const stars: ("full" | "half")[] = [];
  if (item.rating) {
    const fullCount = Math.floor(item.rating);
    const hasHalf = item.rating % 1 !== 0;
    for (let i = 0; i < fullCount; i++) stars.push("full");
    if (hasHalf) stars.push("half");
  }

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900 relative group transition-all hover:border-[#b8253d]">
      {isOwnProfile && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <GameCardMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}

      <Link
        href={igdbId ? `/games/${igdbId}` : "#"}
        className="block cursor-pointer"
        onClick={(e) => {
          if (!igdbId) e.preventDefault();
        }}
      >
        <div className="aspect-[3/4] relative">
          {item.games?.cover_url ? (
            <img
              src={item.games.cover_url}
              alt={item.games?.title || "Game"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center p-2 text-sm text-center text-white">
              {item.games?.title || "Unknown"}
            </div>
          )}
        </div>

        <div className="p-3 group-hover:bg-gray-800 transition-colors">
          {/* Game name */}
          <h3 className="font-medium text-white truncate">
            {item.games?.title || "Unknown"}
          </h3>

          {/* Hours + Status */}
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-gray-300">{item.playtime_hours} hrs</span>
            {status && (
              <span className={`text-xs font-medium ${STATUS_COLORS[status]}`}>
                {STATUS_LABELS[status]}
              </span>
            )}
          </div>

          {/* Star rating — only filled stars shown */}
          {stars.length > 0 && (
            <div className="flex items-center gap-0.5 mt-1.5">
              {stars.map((type, i) => (
                <i
                  key={i}
                  className={`text-xs text-[#b8253d] ${
                    type === "full"
                      ? "fa-solid fa-star"
                      : "fa-solid fa-star-half"
                  }`}
                ></i>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
