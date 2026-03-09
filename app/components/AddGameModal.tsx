"use client";

import { createClient } from "@/lib/supabase-client";
import { useState } from "react";
import type { PlayStatus } from "@/lib/types";

interface Game {
  id: number;
  name: string;
  summary?: string;
  cover?: {
    url: string;
  };
  first_release_date?: number;
  total_rating?: number;
  genres?: number[];
  game_modes?: number[];
}

interface AddGameModalProps {
  game: Game;
  userId: string;
  onClose: () => void;
  onAdded: () => void;
}

const PLAY_STATUS_OPTIONS: { value: PlayStatus; label: string; description: string }[] = [
  { value: "playing", label: "Playing", description: "Currently playing" },
  { value: "completed", label: "Completed", description: "Accomplished main objective" },
  { value: "played", label: "Played", description: "Played (not specific)" },
  { value: "backlog", label: "Backlog", description: "Own it but haven't started" },
  { value: "wishlist", label: "Wishlist", description: "Want to play (don't own yet)" },
  { value: "shelved", label: "Shelved", description: "Unfinished but could play again" },
  { value: "retired", label: "Retired", description: "No longer playing (no ending)" },
  { value: "abandoned", label: "Abandoned", description: "Unfinished and not picking back up" },
];

export default function AddGameModal({
  game,
  userId,
  onClose,
  onAdded,
}: AddGameModalProps) {
  const [playStatus, setPlayStatus] = useState<PlayStatus>("played");
  const [playtimeHours, setPlaytimeHours] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
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
            igdb_rating: game.total_rating || null,
            genres: game.genres || null,
            game_modes: game.game_modes || null,
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
        play_status: playStatus,
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

      // Invalidate recommendations cache so next visit recomputes
      fetch("/api/recommendations", { method: "DELETE" }).catch(() => {});
      onAdded();
    } catch (err) {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white">
                Add to Collection
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-white text-3xl leading-none"
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
                <div className="w-24 h-32 bg-gray-700 rounded flex items-center justify-center">
                  <i className="fa-solid fa-gamepad text-gray-500 text-2xl"></i>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-lg">{game.name}</h3>
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
            </div>

            <div className="space-y-4">
              {/* Play Status Dropdown */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Play Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={playStatus}
                  onChange={(e) => setPlayStatus(e.target.value as PlayStatus)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#b8253d] transition-colors"
                >
                  {PLAY_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hours Played */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Hours Played {playStatus === "wishlist" || playStatus === "backlog" ? "(optional)" : ""}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={playtimeHours}
                  onChange={(e) => setPlaytimeHours(e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-800 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#b8253d] transition-colors"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Your Rating {rating ? `(${rating}★)` : "(optional)"}
                </label>
                <div className="flex items-center gap-3">
                  {/* Star Rating */}
                  <div
                    className="flex items-center gap-1"
                    onMouseLeave={() => setHoverRating(null)}
                  >
                    {[1, 2, 3, 4, 5].map((starIndex) => {
                      const fullValue = starIndex;
                      const halfValue = starIndex - 0.5;
                      const displayRating = hoverRating ?? rating;

                      return (
                        <div key={starIndex} className="relative inline-block">
                          {/* Container for the star */}
                          <div className="relative w-7 h-7">
                            {/* Left half clickable area */}
                            <button
                              type="button"
                              onClick={() => setRating(halfValue)}
                              onMouseEnter={() => setHoverRating(halfValue)}
                              className="absolute left-0 top-0 w-1/2 h-full z-10"
                              aria-label={`${halfValue} stars`}
                            />
                            {/* Right half clickable area */}
                            <button
                              type="button"
                              onClick={() => setRating(fullValue)}
                              onMouseEnter={() => setHoverRating(fullValue)}
                              className="absolute right-0 top-0 w-1/2 h-full z-10"
                              aria-label={`${fullValue} stars`}
                            />
                            {/* Visual star */}
                            <i
                              className={`fa-star absolute inset-0 text-2xl pointer-events-none transition-colors ${
                                displayRating && displayRating >= fullValue
                                  ? "fa-solid text-[#b8253d]"
                                  : displayRating && displayRating >= halfValue
                                  ? "fa-solid text-[#b8253d] half-star"
                                  : "fa-regular text-gray-600"
                              }`}
                              style={{
                                background: displayRating && displayRating >= halfValue && displayRating < fullValue
                                  ? 'linear-gradient(90deg, #b8253d 50%, #4b5563 50%)'
                                  : undefined,
                                WebkitBackgroundClip: displayRating && displayRating >= halfValue && displayRating < fullValue
                                  ? 'text'
                                  : undefined,
                                WebkitTextFillColor: displayRating && displayRating >= halfValue && displayRating < fullValue
                                  ? 'transparent'
                                  : undefined,
                                backgroundClip: displayRating && displayRating >= halfValue && displayRating < fullValue
                                  ? 'text'
                                  : undefined,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {rating && (
                    <button
                      type="button"
                      onClick={() => setRating(null)}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          </div>

          <div className="border-t border-gray-700 px-6 py-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#b8253d] text-white px-4 py-2 rounded-lg hover:bg-[#8a1c2e] disabled:opacity-50 transition-colors"
            >
              {loading ? "Adding..." : "Add to Collection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
