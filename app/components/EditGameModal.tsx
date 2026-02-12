"use client";

import { useState } from "react";

interface UserGame {
  id: string;
  playtime_hours: number;
  rating: number | null;
  games: {
    id: string;
    title: string;
    cover_url: string | null;
  };
}

interface EditGameModalProps {
  game: UserGame;
  onSave: (hours: number, rating: number | null) => void;
  onClose: () => void;
}

export default function EditGameModal({ game, onSave, onClose }: EditGameModalProps) {
  const [playtimeHours, setPlaytimeHours] = useState<string>(
    game.playtime_hours.toString()
  );
  const [rating, setRating] = useState<number | null>(game.rating);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await onSave(hours, rating);
    } catch (err) {
      setError("Failed to save changes");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Game</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
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
                <div className="w-24 h-32 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm">
                  No cover
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">
                  {game.games?.title || "Unknown"}
                </h3>
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
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Rating {rating ? `(${rating}★)` : "(optional)"}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.5"
                    value={rating ?? 2.5}
                    onChange={(e) => setRating(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900 w-10 text-center">
                      {rating ? `${rating}★` : "—"}
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
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
