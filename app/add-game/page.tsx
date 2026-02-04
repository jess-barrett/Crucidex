"use client";

import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddGameModal from "../components/AddGameModal";
import Toast from "../components/Toast";

interface Game {
  id: number;
  name: string;
  summary?: string;
  cover?: {
    url: string;
  };
  first_release_date?: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
    }
    getUser();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const response = await fetch(
      `/api/games/search?q=${encodeURIComponent(query)}`,
    );
    const data = await response.json();
    setResults(data);
    setLoading(false);
  }

  function getCoverUrl(game: Game): string {
    if (game.cover?.url) {
      return `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`;
    }
    return "";
  }

  function handleGameAdded() {
    setSelectedGame(null);
    setToast({ message: "Game added to your library!", type: "success" });
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add A Game</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a game..."
          className="flex-1 border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      <div className="grid gap-4">
        {results.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game)}
            className="flex gap-4 border p-4 rounded hover:border-blue-500 hover:bg-blue-50 transition-colors text-left w-full"
          >
            {getCoverUrl(game) ? (
              <img
                src={getCoverUrl(game)}
                alt={game.name}
                className="w-24 h-32 object-cover rounded"
              />
            ) : (
              <div className="w-24 h-32 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                No cover
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-semibold">{game.name}</h2>
              {game.first_release_date && (
                <p className="text-sm text-gray-500">
                  {new Date(game.first_release_date * 1000).getFullYear()}
                </p>
              )}
              {game.summary && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {game.summary}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedGame && userId && (
        <AddGameModal
          game={selectedGame}
          userId={userId}
          onClose={() => setSelectedGame(null)}
          onAdded={handleGameAdded}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  );
}
