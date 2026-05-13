"use client";

import type { UserGame } from "@/lib/types";

interface SelectGameModalProps {
  position: number;
  library: UserGame[];
  excludeIds: string[];
  onSelect: (gameId: string) => void;
  onClose: () => void;
}

export default function SelectGameModal({
  position,
  library,
  excludeIds,
  onSelect,
  onClose,
}: SelectGameModalProps) {
  // Filter out games already in Top 4, sorted by hours played
  const availableGames = library
    .filter((game) => !excludeIds.includes(game.games?.id || ""))
    .sort((a, b) => b.playtime_hours - a.playtime_hours);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">
              Select Game for Position {position}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {availableGames.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No games available. All your games are either already in your Top
              4 or your library is empty.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableGames.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className="rounded-lg overflow-hidden bg-gray-900 hover:ring-2 hover:ring-[#b8253d] transition-all text-left"
                >
                  <div className="aspect-[3/4]">
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
                  <div className="p-3">
                    <h3 className="font-medium text-white truncate">
                      {item.games?.title || "Unknown"}
                    </h3>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-gray-300">
                        {item.playtime_hours} hrs
                      </span>
                      {item.rating && (
                        <span className="bg-[#b8253d] text-white px-2 py-0.5 rounded font-medium">
                          {item.rating}★
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-700 px-4 sm:px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
