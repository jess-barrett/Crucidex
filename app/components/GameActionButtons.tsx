"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import AddGameModal from "./AddGameModal";

interface GameActionButtonsProps {
  igdbGame: any;
  dbGame: any | null;
  userGame: any | null;
  isLoggedIn: boolean;
  userId?: string;
}

export default function GameActionButtons({
  igdbGame,
  dbGame,
  userGame,
  isLoggedIn,
  userId,
}: GameActionButtonsProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [showWishlistText, setShowWishlistText] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const supabase = createClient();

  // Check if the game is wishlisted on mount
  useEffect(() => {
    if (!userId || !dbGame) return;

    async function checkWishlist() {
      const { data } = await supabase
        .from("user_games")
        .select("id")
        .eq("user_id", userId!)
        .eq("game_id", dbGame.id)
        .eq("play_status", "wishlist")
        .maybeSingle();

      setWishlisted(!!data);
    }
    checkWishlist();
  }, [userId, dbGame]);

  // Handler for adding game to library
  const handleAddToLibrary = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setShowAddModal(true);
  };

  // Handler for toggling wishlist
  const handleToggleWishlist = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (!userId) return;
    setWishlistLoading(true);

    try {
      if (wishlisted) {
        // Remove wishlist entry
        await supabase
          .from("user_games")
          .delete()
          .eq("user_id", userId)
          .eq("game_id", dbGame?.id)
          .eq("play_status", "wishlist");

        setWishlisted(false);
      } else {
        // Ensure game exists in DB first
        let gameId = dbGame?.id;
        if (!gameId) {
          const coverUrl = igdbGame.cover?.url
            ? `https:${igdbGame.cover.url.replace("t_thumb", "t_cover_big")}`
            : null;

          const { data: newGame, error: gameError } = await supabase
            .from("games")
            .insert({
              igdb_id: igdbGame.id,
              title: igdbGame.name,
              summary: igdbGame.summary || null,
              cover_url: coverUrl,
              release_date: igdbGame.first_release_date
                ? new Date(igdbGame.first_release_date * 1000)
                    .toISOString()
                    .split("T")[0]
                : null,
              igdb_rating: igdbGame.total_rating || null,
              genres: igdbGame.genres || null,
              game_modes: igdbGame.game_modes || null,
            })
            .select("id")
            .single();

          if (gameError) {
            setWishlistLoading(false);
            return;
          }
          gameId = newGame.id;
        }

        // Insert wishlist entry
        const { error } = await supabase.from("user_games").insert({
          user_id: userId,
          game_id: gameId,
          playtime_hours: 0,
          rating: null,
          play_status: "wishlist",
        });

        if (!error) {
          setWishlisted(true);
          setShowWishlistText(true);
          setTimeout(() => setShowWishlistText(false), 1000);
        }
      }
    } catch {
      // silently fail
    }

    setWishlistLoading(false);
    router.refresh();
  };

  // Handler for editing existing library entry
  const handleEdit = () => {
    alert("Edit functionality coming soon!");
  };

  // Handler for adding to Top 4
  const handleAddToTopFour = () => {
    alert("Top 4 functionality coming soon!");
  };

  // Is this game in library (not just wishlisted)?
  const inLibrary = userGame && userGame.play_status !== "wishlist";

  return (
    <div className="space-y-4">
      {/* User's personal data and actions (if in library) */}
      {inLibrary ? (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 flex-1 max-w-lg">
            <p className="text-gray-300">
              <span className="font-semibold text-white">Your stats:</span>{" "}
              {userGame.playtime_hours} hours played
              {userGame.rating && (
                <>
                  {" "}
                  • Rated <span className="text-[#b8253d] font-semibold">
                    {userGame.rating}★
                  </span>
                </>
              )}
              {userGame.top_four_position && (
                <>
                  {" "}
                  • <span className="text-[#00C853]">In your Top 4</span> (#
                  {userGame.top_four_position})
                </>
              )}
            </p>
          </div>
          <button
            onClick={handleEdit}
            className="bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
          >
            Edit
          </button>
          {!userGame.top_four_position && (
            <button
              onClick={handleAddToTopFour}
              className="bg-[#00C853] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              ⭐ Add to Top 4
            </button>
          )}
        </div>
      ) : (
        // Not in library - show Add button + Wishlist button
        <div className="flex gap-3 items-center">
          <button
            onClick={handleAddToLibrary}
            className="bg-[#b8253d] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#8a1c2e] transition-colors"
          >
            {isLoggedIn ? "Add to Library" : "Log in to Add"}
          </button>

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className={`py-3 rounded-lg font-semibold transition-all flex items-center overflow-hidden ${
              wishlisted
                ? "bg-[#b8253d] text-white hover:bg-[#8a1c2e]"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
            } disabled:opacity-50 ${wishlisted && !showWishlistText ? "px-4" : "px-4 gap-2"}`}
            title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <i
              className={
                wishlisted
                  ? "fa-solid fa-book-bookmark text-lg"
                  : "fa-regular fa-bookmark text-lg"
              }
            ></i>
            <span
              className={`whitespace-nowrap transition-all duration-300 ${
                wishlisted && !showWishlistText
                  ? "max-w-0 opacity-0 overflow-hidden"
                  : "max-w-[100px] opacity-100"
              }`}
            >
              {wishlisted ? "Wishlisted" : "Wishlist"}
            </span>
          </button>
        </div>
      )}

      {/* Add Game Modal */}
      {showAddModal && userId && (
        <AddGameModal
          game={{
            id: igdbGame.id,
            name: igdbGame.name,
            summary: igdbGame.summary,
            cover: igdbGame.cover,
            first_release_date: igdbGame.first_release_date,
          }}
          userId={userId}
          onClose={() => {
            setShowAddModal(false);
            router.refresh();
          }}
          onAdded={() => {
            setShowAddModal(false);
            // If they were wishlisted, remove the wishlist entry since they're adding to library
            if (wishlisted && dbGame) {
              supabase
                .from("user_games")
                .delete()
                .eq("user_id", userId!)
                .eq("game_id", dbGame.id)
                .eq("play_status", "wishlist")
                .then(() => setWishlisted(false));
            }
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
