"use client";

import { useState, useMemo } from "react";
import SelectGameModal from "./SelectGameModal";
import Toast from "./Toast";
import EditGameModal from "./EditGameModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import SearchGameModal from "./SearchGameModal";
import AddGameModal from "./AddGameModal";
import LibraryControls, {
  SortOption,
  HoursFilter,
  ModeFilter,
  PlayStatusFilter,
} from "./LibraryControls";
import ProfileSidebar from "./ProfileSidebar";
import StatsBar from "./StatsBar";
import GameCard from "./GameCard";
import type { UserGame, Profile, Genre } from "@/lib/types";

interface ProfileViewProps {
  profile: Profile;
  library: UserGame[];
  isOwnProfile: boolean;
  isLoggedIn?: boolean;
  availableGenres?: Genre[];
  onSelectTopFour: (gameId: string, position: number) => Promise<void>;
  onRemoveTopFour: (gameId: string) => Promise<void>;
  onEditGame: (
    gameId: string,
    hours: number,
    rating: number | null,
    playStatus: string
  ) => Promise<void>;
  onDeleteGame: (gameId: string) => Promise<void>;
}

export default function ProfileView({
  profile,
  library,
  isOwnProfile,
  isLoggedIn = false,
  availableGenres = [],
  onSelectTopFour,
  onRemoveTopFour,
  onEditGame,
  onDeleteGame,
}: ProfileViewProps) {
  const [selectingPosition, setSelectingPosition] = useState<number | null>(
    null
  );
  const [editingGame, setEditingGame] = useState<UserGame | null>(null);
  const [deletingGame, setDeletingGame] = useState<UserGame | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Sorting and filtering state
  const [sortOption, setSortOption] = useState<SortOption>("hours-desc");
  const [hoursFilter, setHoursFilter] = useState<HoursFilter>("all");
  const [genreFilter, setGenreFilter] = useState<number | null>(null);
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [playStatusFilter, setPlayStatusFilter] = useState<PlayStatusFilter>("all");

  // Compute genres that exist in user's library
  const genresInLibrary = useMemo(() => {
    const genreIds = new Set<number>();
    library.forEach((item) => {
      (item.games?.genres || []).forEach((id) => genreIds.add(id));
    });
    return availableGenres.filter((g) => genreIds.has(g.id));
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

      // Play status filter
      if (playStatusFilter !== "all") {
        if (item.play_status !== playStatusFilter) return false;
      }

      return true;
    });
  }, [library, hoursFilter, genreFilter, modeFilter, playStatusFilter]);

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
          if (a.rating === null && b.rating === null) return 0;
          if (a.rating === null) return 1;
          if (b.rating === null) return -1;
          return b.rating - a.rating;
        case "igdb-rating-desc":
          const aRating = a.games?.igdb_rating ?? 0;
          const bRating = b.games?.igdb_rating ?? 0;
          return bRating - aRating;
        case "recent":
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
    playStatus: string
  ) {
    try {
      await onEditGame(gameId, hours, rating, playStatus);
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

  function handleSelectGameFromSearch(game: any) {
    setShowSearchModal(false);
    setSelectedGame(game);
  }

  function handleGameAdded() {
    setSelectedGame(null);
    setToast({ message: "Game added to your library!", type: "success" });
    window.location.reload(); // Refresh to update library
  }

  return (
    <main className="h-screen overflow-hidden">
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="h-full lg:flex lg:gap-6">
          {/* Sidebar - fixed */}
          <aside className="lg:w-1/3 flex-shrink-0">
            <ProfileSidebar
              profile={profile}
              topFour={topFour}
              isOwnProfile={isOwnProfile}
              isLoggedIn={isLoggedIn}
              onSelectTopFour={(position) => setSelectingPosition(position)}
              onRemoveTopFour={handleRemove}
            />
          </aside>

          {/* Main content - flex column */}
          <div className="lg:w-2/3 mt-6 lg:mt-0 flex flex-col h-full lg:min-h-0">
            {/* Stats Bar - fixed */}
            <div className="flex-shrink-0">
              <StatsBar library={library} availableGenres={availableGenres} />
            </div>

            {/* Library Header and Controls - fixed */}
            <div className="flex-shrink-0 mt-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <i className="fa-solid fa-gamepad text-[#b8253d]"></i>
                  Library ({displayedLibrary.length}
                  {displayedLibrary.length !== library.length &&
                    ` of ${library.length}`}
                  )
                </h2>
                {isOwnProfile && (
                  <button
                    onClick={() => setShowSearchModal(true)}
                    className="text-[#b8253d] hover:text-[#8a1c2e] text-sm font-medium transition-colors"
                  >
                    + Add games
                  </button>
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
                  playStatusFilter={playStatusFilter}
                  onPlayStatusFilterChange={setPlayStatusFilter}
                  availableGenres={genresInLibrary}
                />
              )}
            </div>

            {/* Library Grid - scrollable */}
            <div className="flex-1 overflow-y-auto mt-4 min-h-0 custom-scrollbar pr-2">
              {library.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  {isOwnProfile
                    ? "Your library is empty."
                    : "No games in library."}
                </p>
              ) : displayedLibrary.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No games match your filters.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
                  {displayedLibrary.map((item) => (
                    <GameCard
                      key={item.id}
                      item={item}
                      isOwnProfile={isOwnProfile}
                      onEdit={() => setEditingGame(item)}
                      onDelete={() => setDeletingGame(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
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
          userId={profile.id}
          onSave={(hours, rating, playStatus) =>
            handleEditSave(editingGame.id, hours, rating, playStatus)
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

      {isOwnProfile && showSearchModal && (
        <SearchGameModal
          onClose={() => setShowSearchModal(false)}
          onSelectGame={handleSelectGameFromSearch}
        />
      )}

      {isOwnProfile && selectedGame && (
        <AddGameModal
          game={selectedGame}
          userId={profile.id}
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
