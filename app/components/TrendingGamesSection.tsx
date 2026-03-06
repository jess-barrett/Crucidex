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
            Start building your library and we'll suggest games based on what
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
            <Link
              key={rec.igdb_id}
              href={`/games/${rec.igdb_id}`}
              className="group border border-gray-700 rounded-xl overflow-hidden bg-gray-900 hover:border-[#b8253d] transition-all"
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
                    : `${rec.recommended_by_count} similar players`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
