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

export default function GameCard({
  item,
  isOwnProfile,
  onEdit,
  onDelete,
}: GameCardProps) {
  const igdbId = item.games?.igdb_id;

  // Helper to get play status badge info
  const getStatusBadge = (status: PlayStatus | null) => {
    if (!status) return null;

    const badges: Record<PlayStatus, { label: string; color: string }> = {
      playing: { label: "Playing", color: "bg-green-600" },
      completed: { label: "Completed", color: "bg-[#b8253d]" },
      played: { label: "Played", color: "bg-gray-600" },
      backlog: { label: "Backlog", color: "bg-yellow-600" },
      wishlist: { label: "Wishlist", color: "bg-purple-600" },
      shelved: { label: "Shelved", color: "bg-orange-600" },
      retired: { label: "Retired", color: "bg-indigo-600" },
      abandoned: { label: "Abandoned", color: "bg-red-600" },
    };

    return badges[status];
  };

  const statusBadge = getStatusBadge(item.play_status);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900 relative group transition-all hover:border-[#b8253d]">
      {isOwnProfile && (
        <div className="absolute top-2 right-2 z-10">
          <GameCardMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}

      <Link
        href={igdbId ? `/games/${igdbId}` : "#"}
        className="block cursor-pointer"
        onClick={(e) => {
          // Prevent navigation if clicking on menu or if no igdb_id
          if (!igdbId) {
            e.preventDefault();
          }
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

          {/* Play Status Badge */}
          {statusBadge && (
            <div className={`absolute top-2 left-2 ${statusBadge.color} text-white text-xs px-2 py-1 rounded font-medium shadow-lg`}>
              {statusBadge.label}
            </div>
          )}
        </div>

        <div className="p-3 group-hover:bg-gray-800 transition-colors">
          <h3 className="font-medium text-white truncate">
            {item.games?.title || "Unknown"}
          </h3>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-gray-300">{item.playtime_hours} hrs</span>
            {item.rating ? (
              <span className="bg-[#b8253d] text-white px-2 py-0.5 rounded font-medium">
                {item.rating}★
              </span>
            ) : (
              <span className="text-gray-500">No rating</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
