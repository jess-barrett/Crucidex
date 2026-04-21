"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase-client";
import ProfileNavBar from "@/app/components/ProfileNavBar";
import LibraryControls, {
  SortOption,
  HoursFilter,
  ModeFilter,
  PlayStatusFilter,
} from "@/app/components/LibraryControls";
import GameCard from "@/app/components/GameCard";
import EditGameModal from "@/app/components/EditGameModal";
import ConfirmDeleteModal from "@/app/components/ConfirmDeleteModal";
import SearchGameModal from "@/app/components/SearchGameModal";
import AddGameModal from "@/app/components/AddGameModal";
import Toast from "@/app/components/Toast";
import type { UserGame, Profile, Genre } from "@/lib/types";

export default function LibraryPage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [library, setLibrary] = useState<UserGame[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);

  // Library UI state
  const [editingGame, setEditingGame] = useState<UserGame | null>(null);
  const [deletingGame, setDeletingGame] = useState<UserGame | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Sorting and filtering
  const [sortOption, setSortOption] = useState<SortOption>("hours-desc");
  const [hoursFilter, setHoursFilter] = useState<HoursFilter>("all");
  const [genreFilter, setGenreFilter] = useState<number | null>(null);
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [playStatusFilter, setPlayStatusFilter] =
    useState<PlayStatusFilter>("all");

  const supabase = createClient();

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData);
    setIsOwnProfile(user?.id === profileData.id);

    const [libraryRes, genresRes, friendsRes] = await Promise.all([
      supabase
        .from("user_games")
        .select(
          `id, playtime_hours, rating, top_four_position, play_status, added_at, last_played_at,
           games (id, igdb_id, title, cover_url, igdb_rating, genres, game_modes)`
        )
        .eq("user_id", profileData.id)
        .or("play_status.neq.wishlist,play_status.is.null")
        .order("added_at", { ascending: false }),

      supabase.from("genres").select("id, name").order("name"),

      supabase
        .from("friendships")
        .select("id", { count: "exact" })
        .or(
          `requester_id.eq.${profileData.id},addressee_id.eq.${profileData.id}`
        )
        .eq("status", "accepted"),
    ]);

    if (libraryRes.data)
      setLibrary(libraryRes.data as unknown as UserGame[]);
    if (genresRes.data) setGenres(genresRes.data);
    setFriendsCount(friendsRes.count || 0);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [username]);

  // Stats
  const stats = useMemo(() => {
    const nonWishlist = library.filter((g) => g.play_status !== "wishlist");
    return {
      games: nonWishlist.length,
      hours: Math.round(
        nonWishlist.reduce((s, g) => s + (g.playtime_hours || 0), 0)
      ),
    };
  }, [library]);

  // Genres in library
  const genresInLibrary = useMemo(() => {
    const ids = new Set<number>();
    library.forEach((item) =>
      (item.games?.genres || []).forEach((id) => ids.add(id))
    );
    return genres.filter((g) => ids.has(g.id));
  }, [library, genres]);

  // Filter
  const filteredLibrary = useMemo(() => {
    return library.filter((item) => {
      if (hoursFilter !== "all") {
        const h = item.playtime_hours;
        if (hoursFilter === "0-10" && h >= 10) return false;
        if (hoursFilter === "10-50" && (h < 10 || h >= 50)) return false;
        if (hoursFilter === "50-100" && (h < 50 || h >= 100)) return false;
        if (hoursFilter === "100+" && h < 100) return false;
      }
      if (genreFilter !== null) {
        if (!(item.games?.genres || []).includes(genreFilter)) return false;
      }
      if (modeFilter !== "all") {
        const modes = item.games?.game_modes || [];
        if (modeFilter === "single" && !modes.includes(1)) return false;
        if (
          modeFilter === "multi" &&
          !modes.some((m) => [2, 3, 4, 5].includes(m))
        )
          return false;
      }
      if (playStatusFilter !== "all") {
        if (item.play_status !== playStatusFilter) return false;
      }
      return true;
    });
  }, [library, hoursFilter, genreFilter, modeFilter, playStatusFilter]);

  // Sort
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
          return (b.games?.igdb_rating ?? 0) - (a.games?.igdb_rating ?? 0);
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

  // Handlers
  async function handleEditSave(
    gameId: string,
    hours: number,
    rating: number | null,
    playStatus: string
  ) {
    const { error } = await supabase
      .from("user_games")
      .update({ playtime_hours: hours, rating, play_status: playStatus })
      .eq("id", gameId);

    if (error) throw error;
    fetch("/api/recommendations", { method: "DELETE" }).catch(() => {});
    setEditingGame(null);
    setToast({ message: "Game updated!", type: "success" });
    loadData();
  }

  async function handleDeleteConfirm(gameId: string) {
    const { error } = await supabase
      .from("user_games")
      .delete()
      .eq("id", gameId);

    if (error) throw error;
    fetch("/api/recommendations", { method: "DELETE" }).catch(() => {});
    setDeletingGame(null);
    setToast({ message: "Game deleted", type: "success" });
    loadData();
  }

  function handleGameAdded() {
    setSelectedGame(null);
    setToast({ message: "Game added to your library!", type: "success" });
    loadData();
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-white">
            User Not Found
          </h1>
          <p className="text-gray-500">@{username} does not exist.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ── Row 1: User Info + Stats ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#b8253d] to-[#8a1c2e] rounded-full flex items-center justify-center text-2xl overflow-hidden flex-shrink-0 ring-2 ring-[#b8253d]/30">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold">
                  {profile.display_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {profile.display_name}
              </h1>
              <p className="text-gray-400 text-sm">@{profile.username}</p>
              {isOwnProfile && (
                <a
                  href="/settings"
                  className="inline-block mt-1.5 text-xs text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded px-3 py-1 transition-colors"
                >
                  Edit Profile
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-8">
            {[
              { value: stats.games, label: "Games" },
              { value: stats.hours, label: "Hours" },
              { value: friendsCount, label: "Friends" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Row 2: Nav Bar ── */}
        <ProfileNavBar username={username} />

        {/* ── Library Controls ── */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
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
          {isOwnProfile && (
            <button
              onClick={() => setShowSearchModal(true)}
              className="text-[#b8253d] hover:text-[#8a1c2e] text-sm font-medium transition-colors flex-shrink-0"
            >
              + Add games
            </button>
          )}
        </div>

        {/* ── Library Grid — full width ── */}
        <div>
          {library.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
              <i className="fa-solid fa-gamepad text-4xl text-gray-600 mb-4"></i>
              <p className="text-gray-400">
                {isOwnProfile
                  ? "Your library is empty. Add some games!"
                  : "No games in library."}
              </p>
            </div>
          ) : displayedLibrary.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No games match your filters.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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

      {/* Modals */}
      {isOwnProfile && editingGame && profile && (
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
          onSelectGame={(game) => {
            setShowSearchModal(false);
            setSelectedGame(game);
          }}
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
