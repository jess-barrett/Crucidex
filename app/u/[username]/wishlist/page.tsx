"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import Skeleton from "@/app/components/Skeleton";
import { useProfileLayout } from "@/lib/profile-layout-context";

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
  const { profile } = useProfileLayout();

  const [wishlist, setWishlist] = useState<WishlistGame[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;

    supabase
      .from("user_games")
      .select(`id, added_at, games (id, igdb_id, title, cover_url)`)
      .eq("user_id", profile.id)
      .eq("play_status", "wishlist")
      .order("added_at", { ascending: false })
      .then(({ data }) => {
        if (data) setWishlist(data as unknown as WishlistGame[]);
        setDataLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  if (!profile) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold text-white">
        Wishlist
        {wishlist.length > 0 && (
          <span className="text-sm text-gray-500 font-normal ml-2">
            {wishlist.length}
          </span>
        )}
      </h2>
      <hr className="border-gray-700 mt-2 mb-4" />

      {dataLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <div className="py-12 text-center">
          <i className="fa-solid fa-bookmark text-4xl text-gray-600 mb-4"></i>
          <p className="text-gray-400">No wishlisted games yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {wishlist.map((item) => (
            <a
              key={item.id}
              href={
                item.games?.igdb_id ? `/games/${item.games.igdb_id}` : "#"
              }
              className="aspect-[3/4] rounded-lg overflow-hidden hover:ring-2 hover:ring-[#b8253d] transition-all"
            >
              {item.games?.cover_url ? (
                <img
                  src={item.games.cover_url}
                  alt={item.games?.title || "Game"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center p-2 text-xs text-center text-gray-400">
                  {item.games?.title || "Unknown"}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
