"use client";

import { createClient } from "@/lib/supabase";
import { useState } from "react";

interface Game {
  id: number;
  name: string;
  summary?: string;
  cover?: {
    url: string;
  };
  first_release_date?: number;
}

interface AddGameModalProps {
  game: Game;
  userId: string;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddGameModal({
  game,
  userId,
  onClose,
  onAdded,
}: AddGameModalProps) {
  const [playtimeHours, setPlaytimeHours] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  function getCoverUrl(): string {
    if (game.cover?.url) {
      return `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`;
    }
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if game exists in our database
      const { data: existingGame } = await supabase
        .from("games")
        .select("id")
        .eq("igdb_id", game.id)
        .maybeSingle();

      let gameId = existingGame?.id;

      // If not, insert it
      if (!gameId) {
        const { data: newGame, error: gameError } = await supabase
          .from("games")
          .insert({
            igdb_id: game.id,
            title: game.name,
            summary: game.summary || null,
            cover_url: getCoverUrl() || null,
            release_date: game.first_release_date
              ? new Date(game.first_release_date * 1000)
                  .toISOString()
                  .split("T")[0]
              : null,
          })
          .select("id")
          .single();

        if (gameError) {
          setError("Failed to add game");
          setLoading(false);
          return;
        }

        gameId = newGame.id;
      }

      // Add to user's library
      const { error: libraryError } = await supabase.from("user_games").insert({
        user_id: userId,
        game_id: gameId,
        playtime_hours: parseFloat(playtimeHours) || 0,
        rating: rating,
      });

      if (libraryError) {
        if (libraryError.code === "23505") {
          setError("This game is already in your library!");
        } else {
          setError("Failed to add to library");
        }
        setLoading(false);
        return;
      }

      onAdded();
    } catch (err) {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Add to Library
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex gap-4 mb-6">
              {getCoverUrl() ? (
                <img
                  src={getCoverUrl()}
                  alt={game.name}
                  className="w-24 h-32 object-cover rounded"
                />
              ) : (
                <div className="w-24 h-32 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                  No cover
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{game.name}</h3>
                {game.first_release_date && (
                  <p className="text-sm text-gray-700">
                    {new Date(game.first_release_date * 1000).getFullYear()}
                  </p>
                )}
                {game.summary && (
                  <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                    {game.summary}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Hours Played
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={playtimeHours}
                  onChange={(e) => setPlaytimeHours(e.target.value)}
                  placeholder="0"
                  className="w-full border rounded p-2 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Rating {rating ? `(${rating}/10)` : "(optional)"}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={rating ?? 5}
                    onChange={(e) => setRating(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900 w-10 text-center">
                      {rating ?? "—"}
                    </span>
                    {rating && (
                      <button
                        type="button"
                        onClick={() => setRating(null)}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          </div>

          <div className="border-t px-6 py-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add to Library"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
