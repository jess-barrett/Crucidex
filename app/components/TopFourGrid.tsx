"use client";

import Link from "next/link";

interface UserGame {
  id: string;
  playtime_hours: number;
  rating: number | null;
  top_four_position: number | null;
  games: {
    id: string;
    igdb_id: number;
    title: string;
    cover_url: string | null;
  };
}

interface TopFourGridProps {
  topFour: UserGame[];
  isOwnProfile: boolean;
  onSelectPosition: (position: number) => void;
  onRemove: (gameId: string) => void;
}

export default function TopFourGrid({
  topFour,
  isOwnProfile,
  onSelectPosition,
  onRemove,
}: TopFourGridProps) {
  const filledPositions = topFour.map((g) => g.top_four_position);
  const leftmostEmpty = [1, 2, 3, 4].find(
    (pos) => !filledPositions.includes(pos)
  );

  return (
    <div className="grid grid-cols-4 gap-2">
      {[1, 2, 3, 4].map((position) => {
        const game = topFour.find((g) => g.top_four_position === position);
        const isLeftmostEmpty = !game && position === leftmostEmpty;

        return (
          <div
            key={position}
            className="aspect-[3/4] rounded-lg bg-gray-800 relative group overflow-hidden transition-colors"
          >
            {game ? (
              <>
                <Link
                  href={`/games/${game.games?.igdb_id}`}
                  className="block w-full h-full"
                >
                  <img
                    src={game.games?.cover_url || ""}
                    alt={game.games?.title || "Game"}
                    className="w-full h-full object-cover rounded-md"
                  />
                </Link>
                {isOwnProfile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(game.id);
                    }}
                    className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-all"
                    title="Remove from Top 4"
                  >
                    ×
                  </button>
                )}
              </>
            ) : isLeftmostEmpty && isOwnProfile ? (
              <button
                onClick={() => onSelectPosition(position)}
                className="w-full h-full flex items-center justify-center hover:bg-[#b8253d] transition-colors rounded-md"
                title="Add to Top 4"
              >
                <span className="text-3xl text-gray-500 group-hover:text-white transition-colors">
                  +
                </span>
              </button>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-3xl text-gray-600">+</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
