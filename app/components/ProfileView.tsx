"use client";

import { useState, useMemo } from "react";
import SelectGameModal from "./SelectGameModal";
import Toast from "./Toast";
import GameCardMenu from "./GameCardMenu";
import EditGameModal from "./EditGameModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import LibraryControls, {
  SortOption,
  HoursFilter,
  ModeFilter,
} from "./LibraryControls";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface UserGame {
  id: string;
  playtime_hours: number;
  rating: number | null;
  top_four_position: number | null;
  added_at?: string;
  last_played_at?: string;
  games: {
    id: string;
    title: string;
    cover_url: string | null;
    igdb_rating: number | null;
    genres: number[] | null;
    game_modes: number[] | null;
  };
}

interface Genre {
  id: number;
  name: string;
}

interface ProfileViewProps {
  profile: Profile;
  library: UserGame[];
  isOwnProfile: boolean;
  availableGenres?: Genre[];
  onSelectTopFour: (gameId: string, position: number) => Promise<void>;
  onRemoveTopFour: (gameId: string) => Promise<void>;
  onEditGame: (
    gameId: string,
    hours: number,
    rating: number | null,
  ) => Promise<void>;
  onDeleteGame: (gameId: string) => Promise<void>;
}

export default function ProfileView({
  profile,
  library,
  isOwnProfile,
  availableGenres = [],
  onSelectTopFour,
  onRemoveTopFour,
  onEditGame,
  onDeleteGame,
}: ProfileViewProps) {
  const [selectingPosition, setSelectingPosition] = useState<number | null>(
    null,
  );
  const [editingGame, setEditingGame] = useState<UserGame | null>(null);
  const [deletingGame, setDeletingGame] = useState<UserGame | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Sorting and filtering state
  const [sortOption, setSortOption] = useState<SortOption>("title-asc");
  const [hoursFilter, setHoursFilter] = useState<HoursFilter>("all");
  const [genreFilter, setGenreFilter] = useState<number | null>(null);
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");

  // Compute genres that exist in user's library
  const genresInLibrary = useMemo(() => {
    const genreIds = new Set<number>();
    library.forEach((item) => {
      (item.games?.genres || []).forEach((id) => genreIds.add(id));
    });
    const result = availableGenres.filter((g) => genreIds.has(g.id));

    // Debug logging - remove after fixing
    console.log("DEBUG genres:", {
      availableGenresCount: availableGenres.length,
      libraryCount: library.length,
      genreIdsInLibrary: Array.from(genreIds),
      genresInLibraryCount: result.length,
      sampleGame: library[0]?.games,
    });

    return result;
  }, [library, availableGenres]);

  // Filter library
  const filteredLibrary = useMemo(() => {
    return library.filter((item) => {
      // Hours filter
      if (hoursFilter !== "all") {
        const hours = item.playtime_hours;
        switch (hoursFilter) {
          case "0-10":
            if (hours >= 10) return false;
            break;
          case "10-50":
            if (hours < 10 || hours >= 50) return false;
            break;
          case "50-100":
            if (hours < 50 || hours >= 100) return false;
            break;
          case "100+":
            if (hours < 100) return false;
            break;
        }
      }

      // Genre filter
      if (genreFilter !== null) {
        const genres = item.games?.genres || [];
        if (!genres.includes(genreFilter)) return false;
      }

      // Game mode filter
      if (modeFilter !== "all") {
        const modes = item.games?.game_modes || [];
        if (modeFilter === "single" && !modes.includes(1)) return false;
        if (
          modeFilter === "multi" &&
          !modes.some((m) => [2, 3, 4, 5].includes(m))
        )
          return false;
      }

      return true;
    });
  }, [library, hoursFilter, genreFilter, modeFilter]);

  // Sort library
  const displayedLibrary = useMemo(() => {
    return [...filteredLibrary].sort((a, b) => {
      switch (sortOption) {
        case "title-asc":
          return (a.games?.title || "").localeCompare(b.games?.title || "");
        case "title-desc":
          return (b.games?.title || "").localeCompare(a.games?.title || "");
        case "hours-desc":
          return b.playtime_hours - a.playtime_hours;
        case "hours-asc":
          return a.playtime_hours - b.playtime_hours;
        case "rating-desc":
          // Unrated games go to bottom
          if (a.rating === null && b.rating === null) return 0;
          if (a.rating === null) return 1;
          if (b.rating === null) return -1;
          return b.rating - a.rating;
        case "igdb-rating-desc":
          const aRating = a.games?.igdb_rating ?? 0;
          const bRating = b.games?.igdb_rating ?? 0;
          return bRating - aRating;
        case "recent":
          // Sort by last_played_at descending (from Steam)
          if (!a.last_played_at && !b.last_played_at) return 0;
          if (!a.last_played_at) return 1;
          if (!b.last_played_at) return -1;
          return (
            new Date(b.last_played_at).getTime() -
            new Date(a.last_played_at).getTime()
          );
        default:
          return 0;
      }
    });
  }, [filteredLibrary, sortOption]);

  const topFour = library
    .filter((g) => g.top_four_position !== null)
    .sort((a, b) => (a.top_four_position || 0) - (b.top_four_position || 0));

  const filledPositions = topFour.map((g) => g.top_four_position);
  const leftmostEmpty = [1, 2, 3, 4].find(
    (pos) => !filledPositions.includes(pos),
  );

  async function handleSelect(gameId: string) {
    if (!selectingPosition) return;
    try {
      await onSelectTopFour(gameId, selectingPosition);
      setSelectingPosition(null);
      setToast({ message: "Added to Top 4!", type: "success" });
    } catch (err) {
      setToast({ message: "Failed to update", type: "error" });
    }
  }

  async function handleRemove(gameId: string) {
    try {
      await onRemoveTopFour(gameId);
      setToast({ message: "Removed from Top 4", type: "success" });
    } catch (err) {
      setToast({ message: "Failed to remove", type: "error" });
    }
  }

  async function handleEditSave(
    gameId: string,
    hours: number,
    rating: number | null,
  ) {
    try {
      await onEditGame(gameId, hours, rating);
      setEditingGame(null);
      setToast({ message: "Game updated!", type: "success" });
    } catch (err) {
      setToast({ message: "Failed to update", type: "error" });
      throw err;
    }
  }

  async function handleDeleteConfirm(gameId: string) {
    try {
      await onDeleteGame(gameId);
      setDeletingGame(null);
      setToast({ message: "Game deleted", type: "success" });
    } catch (err) {
      setToast({ message: "Failed to delete", type: "error" });
      throw err;
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              profile.display_name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            <p className="text-gray-500">@{profile.username}</p>
          </div>
        </div>
        {isOwnProfile && (
          <a
            href="/settings"
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
          >
            Edit Profile
          </a>
        )}
      </div>

      {profile.bio && <p className="mb-6">{profile.bio}</p>}

      <p className="text-sm text-gray-400 mb-8">
        Joined {new Date(profile.created_at).toLocaleDateString()}
      </p>

      <div className="mb-8">
        <h2 className="font-semibold mb-4">Top 4 Games</h2>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((position) => {
            const game = topFour.find((g) => g.top_four_position === position);
            const isLeftmostEmpty = !game && position === leftmostEmpty;

            return (
              <div
                key={position}
                className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded bg-gray-50 relative group"
              >
                {game ? (
                  <>
                    <img
                      src={game.games?.cover_url || ""}
                      alt={game.games?.title || "Game"}
                      className="w-full h-full object-cover rounded"
                    />
                    {isOwnProfile && (
                      <button
                        onClick={() => handleRemove(game.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-all"
                        title="Remove from Top 4"
                      >
                        ×
                      </button>
                    )}
                  </>
                ) : isLeftmostEmpty && isOwnProfile ? (
                  <button
                    onClick={() => setSelectingPosition(position)}
                    className="w-full h-full flex items-center justify-center hover:bg-[#0047AB] transition-colors group/slot"
                    title="Add to Top 4"
                  >
                    <span className="text-3xl text-gray-400 group-hover/slot:text-white transition-colors">
                      +
                    </span>
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl text-gray-300">+</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">
            Library ({displayedLibrary.length}
            {displayedLibrary.length !== library.length &&
              ` of ${library.length}`}
            )
          </h2>
          {isOwnProfile && (
            <a
              href="/add-game"
              className="text-blue-500 hover:underline text-sm"
            >
              + Add games
            </a>
          )}
        </div>

        {library.length > 0 && (
          <LibraryControls
            sortOption={sortOption}
            onSortChange={setSortOption}
            hoursFilter={hoursFilter}
            onHoursFilterChange={setHoursFilter}
            genreFilter={genreFilter}
            onGenreFilterChange={setGenreFilter}
            modeFilter={modeFilter}
            onModeFilterChange={setModeFilter}
            availableGenres={genresInLibrary}
          />
        )}

        {library.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {isOwnProfile ? "Your library is empty." : "No games in library."}
          </p>
        ) : displayedLibrary.length === 0 ? (
          <p className="text-gray-500 text-sm">No games match your filters.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {displayedLibrary.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg overflow-hidden bg-gray-900 relative"
              >
                {isOwnProfile && (
                  <div className="absolute top-2 right-2 z-10">
                    <GameCardMenu
                      onEdit={() => setEditingGame(item)}
                      onDelete={() => setDeletingGame(item)}
                    />
                  </div>
                )}

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
                    <span className="text-white">
                      {item.playtime_hours} hrs
                    </span>
                    {item.rating ? (
                      <span className="bg-[#0047AB] text-white px-2 py-0.5 rounded font-medium">
                        {item.rating}/10
                      </span>
                    ) : (
                      <span className="text-gray-400">No rating</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <a href="/" className="inline-block mt-8 text-blue-500 hover:underline">
        ← Back home
      </a>

      {isOwnProfile && selectingPosition && (
        <SelectGameModal
          position={selectingPosition}
          library={library}
          excludeIds={topFour.map((g) => g.games?.id || "")}
          onSelect={handleSelect}
          onClose={() => setSelectingPosition(null)}
        />
      )}

      {isOwnProfile && editingGame && (
        <EditGameModal
          game={editingGame}
          onSave={(hours, rating) =>
            handleEditSave(editingGame.id, hours, rating)
          }
          onClose={() => setEditingGame(null)}
        />
      )}

      {isOwnProfile && deletingGame && (
        <ConfirmDeleteModal
          gameName={deletingGame.games?.title || "this game"}
          onConfirm={() => handleDeleteConfirm(deletingGame.id)}
          onCancel={() => setDeletingGame(null)}
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
