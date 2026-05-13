"use client";

import { useState, useEffect } from "react";

interface Game {
  id: number;
  name: string;
  summary?: string;
  cover?: {
    url: string;
  };
  first_release_date?: number;
  category?: number;
  total_rating?: number;
  total_rating_count?: number;
  follows?: number;
  genres?: number[];
  game_modes?: number[];
}

interface SearchGameModalProps {
  onClose: () => void;
  onSelectGame: (game: Game) => void;
}

export default function SearchGameModal({
  onClose,
  onSelectGame,
}: SearchGameModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced live search — fetch as the user types, 300ms after they stop.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/games/search?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        if (!cancelled) setResults(data);
      } catch (error) {
        if (!cancelled) console.error("Search error:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function getCoverUrl(game: Game): string {
    if (game.cover?.url) {
      return `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`;
    }
    return "";
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-white">Add A Game</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-3xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a game..."
              className="w-full bg-gray-800 border border-gray-600 text-white placeholder-gray-400 px-4 py-2 pr-10 rounded-lg focus:outline-none focus:border-[#b8253d]"
              autoFocus
            />
            {loading ? (
              <i className="fa-solid fa-spinner animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            ) : (
              <i className="fa-solid fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {results.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {loading
                ? "Searching..."
                : query
                  ? "No results found"
                  : "Search for a game to get started"}
            </div>
          ) : (
            <div className="grid gap-4">
              {results.map((game) => (
                <button
                  key={game.id}
                  onClick={() => onSelectGame(game)}
                  className="flex gap-4 border border-gray-700 p-4 rounded-lg hover:border-[#b8253d] hover:bg-gray-800/50 transition-colors text-left w-full"
                >
                  {getCoverUrl(game) ? (
                    <img
                      src={getCoverUrl(game)}
                      alt={game.name}
                      className="w-24 h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="w-24 h-32 bg-gray-700 rounded flex items-center justify-center">
                      <i className="fa-solid fa-gamepad text-gray-500 text-2xl"></i>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-white text-lg">
                      {game.name}
                    </h2>
                    {game.first_release_date && (
                      <p className="text-sm text-gray-400 mt-1">
                        {new Date(game.first_release_date * 1000).getFullYear()}
                      </p>
                    )}
                    {game.summary && (
                      <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                        {game.summary}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
