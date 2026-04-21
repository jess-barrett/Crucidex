"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RecommendedGame {
  igdb_id: number;
  score: number;
  recommended_by_count: number;
  game: {
    igdb_id: number;
    title: string;
    cover_url: string | null;
    igdb_rating: number | null;
    genres: number[] | null;
  };
}

export default function TrendingGamesSection() {
  const [recommendations, setRecommendations] = useState<RecommendedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await fetch("/api/recommendations");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setRecommendations(data.recommendations || []);
        setReason(data.reason || null);
      } catch {
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommendations();
  }, []);

  async function handleDismiss(igdbId: number) {
    setDismissingId(igdbId);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          igdb_id: igdbId,
          currentIds: recommendations.map((r) => r.igdb_id),
        }),
      });

      if (!res.ok) throw new Error("Failed to dismiss");
      const data = await res.json();

      setRecommendations((prev) => {
        // Remove the dismissed one, then append the replacement (if any)
        const filtered = prev.filter((r) => r.igdb_id !== igdbId);
        if (data.replacement) {
          return [...filtered, data.replacement];
        }
        return filtered;
      });
    } catch {
      // silently fail; the rec stays put
    }
    setDismissingId(null);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-3xl font-bold text-white">Recommended For You</h2>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
          Based on your library
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded-xl animate-pulse">
              <div className="aspect-3/4 rounded-t-xl bg-gray-700" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : reason === "empty_library" ? (
        <div className="bg-gray-800/50 rounded-xl p-12 text-center">
          <i className="fa-solid fa-book-open text-gray-600 text-5xl mb-4"></i>
          <p className="text-xl text-gray-400 mb-2">Add games to get recommendations</p>
          <p className="text-gray-500">
            Start building your library and we&apos;ll suggest games based on what
            players with similar taste enjoy.
          </p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl p-12 text-center">
          <i className="fa-solid fa-magnifying-glass text-gray-600 text-5xl mb-4"></i>
          <p className="text-xl text-gray-400 mb-2">No recommendations yet</p>
          <p className="text-gray-500">
            Try adding more games to your library so we can find players with
            similar taste.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.igdb_id}
              className="group relative border border-gray-700 rounded-xl overflow-hidden bg-gray-900 hover:border-[#b8253d] transition-all"
            >
              {/* Dismiss X button — visible on hover, expands with text on hover */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDismiss(rec.igdb_id);
                }}
                disabled={dismissingId === rec.igdb_id}
                className="group/dismiss absolute top-2 right-2 z-10 h-7 bg-black/70 hover:bg-[#b8253d] text-white rounded-full flex items-center opacity-0 group-hover:opacity-100 transition-all disabled:opacity-100 overflow-hidden pl-2 pr-2"
                title="Not interested"
              >
                {dismissingId === rec.igdb_id ? (
                  <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                ) : (
                  <>
                    <i className="fa-solid fa-xmark text-sm flex-shrink-0"></i>
                    <span className="max-w-0 opacity-0 group-hover/dismiss:max-w-[100px] group-hover/dismiss:opacity-100 group-hover/dismiss:ml-1.5 whitespace-nowrap text-xs font-medium transition-all duration-300 overflow-hidden">
                      Not Interested
                    </span>
                  </>
                )}
              </button>

              <Link
                href={`/games/${rec.igdb_id}`}
                className="block"
              >
                <div className="aspect-3/4 relative">
                  {rec.game.cover_url ? (
                    <img
                      src={rec.game.cover_url}
                      alt={rec.game.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center p-2 text-sm text-center text-white">
                      {rec.game.title}
                    </div>
                  )}
                </div>
                <div className="p-3 group-hover:bg-gray-800 transition-colors">
                  <h3 className="font-medium text-white truncate text-sm">
                    {rec.game.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {rec.recommended_by_count === 1
                      ? "1 similar player"
                      : rec.recommended_by_count > 0
                      ? `${rec.recommended_by_count} similar players`
                      : "Based on your genres"}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
