"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import type { PlayStatus, UserGame } from "@/lib/types";

interface EditGameModalProps {
  game: UserGame;
  userId: string;
  onSave: (hours: number, rating: number | null, playStatus: PlayStatus) => void;
  onClose: () => void;
}

const PLAY_STATUS_OPTIONS: { value: PlayStatus; label: string; description: string }[] = [
  { value: "playing", label: "Playing", description: "Currently playing" },
  { value: "completed", label: "Completed", description: "Accomplished main objective" },
  { value: "played", label: "Played", description: "Played (not specific)" },
  { value: "backlog", label: "Backlog", description: "Own it but haven't started" },

  { value: "shelved", label: "Shelved", description: "Unfinished but could play again" },
  { value: "retired", label: "Retired", description: "No longer playing (no ending)" },
  { value: "abandoned", label: "Abandoned", description: "Unfinished and not picking back up" },
];

export default function EditGameModal({ game, userId, onSave, onClose }: EditGameModalProps) {
  const [playtimeHours, setPlaytimeHours] = useState<string>(
    game.playtime_hours.toString()
  );
  const [rating, setRating] = useState<number | null>(game.rating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [playStatus, setPlayStatus] = useState<PlayStatus>(game.play_status ?? "played");
  const [reviewBody, setReviewBody] = useState<string>("");
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch existing review on mount
  useEffect(() => {
    async function fetchReview() {
      // Get authenticated user ID
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data } = await supabase
        .from("reviews")
        .select("id, content")
        .eq("user_id", authUser.id)
        .eq("game_id", game.games.id)
        .maybeSingle();

      if (data) {
        setReviewBody(data.content || "");
        setExistingReviewId(data.id);
      }
    }
    fetchReview();
  }, [game.games.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const hours = parseFloat(playtimeHours);
    if (isNaN(hours) || hours < 0) {
      setError("Hours must be a positive number");
      setLoading(false);
      return;
    }

    if (rating !== null && (rating < 0.5 || rating > 5)) {
      setError("Rating must be between 0.5 and 5 stars");
      setLoading(false);
      return;
    }

    try {
      // Handle review update/create/delete FIRST
      const trimmedReview = reviewBody.trim();

      if (trimmedReview) {
        // User has written a review - upsert it
        if (existingReviewId) {
          // Update existing review
          console.log("Updating review:", existingReviewId);
          const { error: reviewError } = await supabase
            .from("reviews")
            .update({ content: trimmedReview })
            .eq("id", existingReviewId);

          if (reviewError) {
            console.error("Review update error:", reviewError);
            throw new Error(`Failed to update review: ${reviewError.message}`);
          }
          console.log("Review updated successfully");
        } else {
          // Create new review
          console.log("Creating new review for game:", game.games.id);

          // Get the authenticated user's ID directly
          const { data: { user: authUser } } = await supabase.auth.getUser();

          if (!authUser) {
            throw new Error("Not authenticated");
          }

          console.log("Using auth user ID:", authUser.id);

          const { data, error: reviewError } = await supabase.from("reviews").insert({
            user_id: authUser.id,  // Use auth user ID instead of userId prop
            game_id: game.games.id,
            content: trimmedReview,
          }).select();

          if (reviewError) {
            console.error("Review creation error:", reviewError);
            throw new Error(`Failed to create review: ${reviewError.message}`);
          }
          console.log("Review created successfully:", data);
        }
      } else if (existingReviewId) {
        // User cleared the review - delete it
        console.log("Deleting review:", existingReviewId);
        const { error: reviewError } = await supabase
          .from("reviews")
          .delete()
          .eq("id", existingReviewId);

        if (reviewError) {
          console.error("Review deletion error:", reviewError);
          throw new Error(`Failed to delete review: ${reviewError.message}`);
        }
        console.log("Review deleted successfully");
      }

      // Save game details after review is saved
      await onSave(hours, rating, playStatus);
    } catch (err: any) {
      console.error("Error saving game/review:", err);
      setError(err.message || "Failed to save changes");
      setLoading(false);
      throw err; // Re-throw to prevent modal from closing
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white">Edit Game</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-white text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex gap-4 mb-6">
              {game.games?.cover_url ? (
                <img
                  src={game.games.cover_url}
                  alt={game.games?.title || "Game"}
                  className="w-24 h-32 object-cover rounded"
                />
              ) : (
                <div className="w-24 h-32 bg-gray-700 rounded flex items-center justify-center">
                  <i className="fa-solid fa-gamepad text-gray-500 text-2xl"></i>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-lg">
                  {game.games?.title || "Unknown"}
                </h3>
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
                  Hours Played
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={playtimeHours}
                  onChange={(e) => setPlaytimeHours(e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-800 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#b8253d] transition-colors"
                  required
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Your Rating {rating ? `(${rating}★)` : "(optional)"}
                </label>
                <div className="flex items-center gap-3">
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
                          <div className="relative w-7 h-7">
                            <button
                              type="button"
                              onClick={() => setRating(halfValue)}
                              onMouseEnter={() => setHoverRating(halfValue)}
                              className="absolute left-0 top-0 w-1/2 h-full z-10"
                              aria-label={`${halfValue} stars`}
                            />
                            <button
                              type="button"
                              onClick={() => setRating(fullValue)}
                              onMouseEnter={() => setHoverRating(fullValue)}
                              className="absolute right-0 top-0 w-1/2 h-full z-10"
                              aria-label={`${fullValue} stars`}
                            />
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

              {/* Review (optional) */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Review (optional)
                </label>
                <textarea
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="Write a review..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#b8253d] transition-colors resize-none"
                />
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
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
