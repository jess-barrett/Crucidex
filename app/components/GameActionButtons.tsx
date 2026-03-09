"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddGameModal from "./AddGameModal";

interface GameActionButtonsProps {
  igdbGame: any;
  dbGame: any | null;
  userGame: any | null;
  isLoggedIn: boolean;
}

export default function GameActionButtons({
  igdbGame,
  dbGame,
  userGame,
  isLoggedIn,
}: GameActionButtonsProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);

  // Handler for adding game to library
  const handleAddToLibrary = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setShowAddModal(true);
  };

  // Handler for editing existing library entry
  const handleEdit = () => {
    // TODO: Open edit modal (can reuse AddGameModal or create EditGameModal)
    alert("Edit functionality coming soon!");
  };

  // Handler for adding to Top 4
  const handleAddToTopFour = () => {
    // TODO: Implement Top 4 selection
    alert("Top 4 functionality coming soon!");
  };

  return (
    <div className="space-y-4">
      {/* User's personal data and actions (if in library) */}
      {userGame ? (
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
        // Not in library - show Add button
        <button
          onClick={handleAddToLibrary}
          className="bg-[#b8253d] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          {isLoggedIn ? "Add to Library" : "Log in to Add"}
        </button>
      )}

      {/* Add Game Modal */}
      {showAddModal && dbGame && (
        <AddGameModal
          game={{
            id: igdbGame.id,
            name: igdbGame.name,
            summary: igdbGame.summary,
            cover: igdbGame.cover,
            first_release_date: igdbGame.first_release_date,
          }}
          onClose={() => {
            setShowAddModal(false);
            router.refresh(); // Refresh to show updated data
          }}
        />
      )}
    </div>
  );
}
