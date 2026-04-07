"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";

interface WishlistGame {
  id: string;
  games: {
    id: string;
    igdb_id: number;
    title: string;
    cover_url: string | null;
  };
  added_at: string;
}

export default function WishlistPage() {
  const params = useParams();
  const username = params.username as string;
  const [wishlist, setWishlist] = useState<WishlistGame[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      // Get profile by username
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Fetch wishlist games
      const { data } = await supabase
        .from("user_games")
        .select(`
          id,
          added_at,
          games (
            id,
            igdb_id,
            title,
            cover_url
          )
        `)
        .eq("user_id", profile.id)
        .eq("play_status", "wishlist")
        .order("added_at", { ascending: false });

      if (data) {
        setWishlist(data as unknown as WishlistGame[]);
      }
      setLoading(false);
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-white mb-6">Wishlist</h1>

        {wishlist.length === 0 ? (
          <div className="bg-gray-800/50 rounded-xl p-12 text-center">
            <i className="fa-solid fa-bookmark text-4xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">No wishlisted games yet. Browse games and add them to your wishlist!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {wishlist.map((item) => (
              <a
                key={item.id}
                href={item.games?.igdb_id ? `/games/${item.games.igdb_id}` : "#"}
                className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900 hover:border-[#b8253d] transition-all"
              >
                <div className="aspect-[3/4] relative">
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
                  <div className="absolute top-2 left-2 bg-[#b8253d] text-white text-xs px-2 py-1 rounded font-medium shadow-lg">
                    <i className="fa-solid fa-bookmark mr-1"></i>
                    Wishlist
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-white truncate text-sm">
                    {item.games?.title || "Unknown"}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
