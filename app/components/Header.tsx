"use client";

import { createClient } from "@/lib/supabase-client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import SearchGameModal from "./SearchGameModal";
import AddGameModal from "./AddGameModal";
import Toast from "./Toast";

interface Game {
  id: number;
  name: string;
  summary?: string;
  cover?: {
    url: string;
  };
  first_release_date?: number;
  category?: number; // 0=main_game, 1=dlc, 2=expansion, 3=bundle, etc.
  total_rating?: number;
  total_rating_count?: number;
  follows?: number;
  genres?: number[];
  game_modes?: number[];
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (data.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", data.user.id)
          .single();

        if (profileData) {
          setUsername(profileData.username);
        }
      } else {
        setUsername(null);
      }
    }

    getUser();

    // Listen for auth state changes (login, logout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profileData }) => {
            if (profileData) {
              setUsername(profileData.username);
            }
          });
      } else {
        setUsername(null);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    setShowResults(true);
    try {
      const response = await fetch(
        `/api/games/search?q=${encodeURIComponent(query)}`,
      );
      const data = await response.json();
      setSearchResults(data.slice(0, 5)); // Show only top 5 results
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  }

  function getCoverUrl(game: Game): string {
    if (game.cover?.url) {
      return `https:${game.cover.url.replace("t_thumb", "t_cover_small")}`;
    }
    return "";
  }

  function handleGameClick(igdbId: number) {
    setShowResults(false);
    setSearchQuery("");
    setSearchResults([]);
    router.push(`/games/${igdbId}`);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  function handleSelectGame(game: Game) {
    setShowSearchModal(false);
    setSelectedGame(game);
  }

  function handleGameAdded() {
    setSelectedGame(null);
    setToast({ message: "Game added to your library!", type: "success" });
    router.refresh(); // Refresh to update library
  }

  return (
    <header className="border-b border-gray-700">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <a
          href="/"
          className="text-xl font-bold text-white hover:text-[#b8253d] transition-colors flex-shrink-0"
        >
          Crucidex
        </a>

        {/* Search Bar (only shown when logged in) */}
        {user && (
          <div ref={searchRef} className="relative flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowResults(true)}
                placeholder="Search games..."
                className="w-full bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 px-4 py-2 rounded-lg focus:outline-none focus:border-[#b8253d] transition-colors"
              />
              <i className="fa-solid fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto custom-scrollbar z-50">
                {searching ? (
                  <div className="p-4 text-center text-gray-400">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => handleGameClick(game.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-700/50 transition-colors text-left border-b border-gray-700 last:border-b-0"
                    >
                      {getCoverUrl(game) ? (
                        <img
                          src={getCoverUrl(game)}
                          alt={game.name}
                          className="w-12 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center">
                          <i className="fa-solid fa-gamepad text-gray-500"></i>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {game.name}
                        </p>
                        {game.first_release_date && (
                          <p className="text-sm text-gray-400">
                            {new Date(
                              game.first_release_date * 1000,
                            ).getFullYear()}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 flex-shrink-0">
          {user ? (
            <>
              <button
                onClick={() => setShowSearchModal(true)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Add Game
              </button>
              <a
                href={username ? `/u/${username}` : "/profile"}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Profile
              </a>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Log In
              </a>
              <a
                href="/signup"
                className="bg-[#b8253d] text-white px-3 py-1 rounded hover:bg-[#8a1c2e] transition-colors"
              >
                Sign Up
              </a>
            </>
          )}
        </div>
      </nav>

      {/* Modals */}
      {showSearchModal && (
        <SearchGameModal
          onClose={() => setShowSearchModal(false)}
          onSelectGame={handleSelectGame}
        />
      )}

      {selectedGame && user && (
        <AddGameModal
          game={selectedGame}
          userId={user.id}
          onClose={() => setSelectedGame(null)}
          onAdded={handleGameAdded}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </header>
  );
}
