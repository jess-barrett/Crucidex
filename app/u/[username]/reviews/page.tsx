"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase-client";
import ProfileNavBar from "@/app/components/ProfileNavBar";
import ReviewCard from "@/app/components/ReviewCard";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface Review {
  id: string;
  content: string;
  contains_spoilers?: boolean;
  created_at: string;
  game_id: string;
  games: {
    igdb_id: number;
    title: string;
    cover_url: string | null;
  };
  rating?: number | null;
  hours?: number | null;
}

export default function ReviewsPage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendsCount, setFriendsCount] = useState(0);
  const [gameCount, setGameCount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
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

      const [reviewsRes, libraryRes, friendsRes] = await Promise.all([
        supabase
          .from("reviews")
          .select(
            `id, content, contains_spoilers, created_at, game_id,
             games (igdb_id, title, cover_url)`
          )
          .eq("user_id", profileData.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("user_games")
          .select("game_id, playtime_hours, rating, play_status")
          .eq("user_id", profileData.id),

        supabase
          .from("friendships")
          .select("id", { count: "exact" })
          .or(
            `requester_id.eq.${profileData.id},addressee_id.eq.${profileData.id}`
          )
          .eq("status", "accepted"),
      ]);

      if (reviewsRes.data && libraryRes.data) {
        const lib = libraryRes.data as any[];
        const enriched = (reviewsRes.data as any[]).map((r: any) => {
          const ug = lib.find((g: any) => g.game_id === r.game_id);
          return {
            ...r,
            rating: ug?.rating ?? null,
            hours: ug?.playtime_hours ?? null,
          };
        });
        setReviews(enriched as Review[]);
      }

      if (libraryRes.data) {
        const nonWishlist = libraryRes.data.filter(
          (g: any) => g.play_status !== "wishlist"
        );
        setGameCount(nonWishlist.length);
        setTotalHours(
          Math.round(
            nonWishlist.reduce(
              (s: number, g: any) => s + (g.playtime_hours || 0),
              0
            )
          )
        );
      }

      setFriendsCount(friendsRes.count || 0);
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

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-white">User Not Found</h1>
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
            </div>
          </div>

          <div className="flex items-center gap-8">
            {[
              { value: gameCount, label: "Games" },
              { value: totalHours, label: "Hours" },
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

        {/* ── Reviews ── */}
        <section>
          <h2 className="text-lg font-semibold text-white">
            Reviews
            {reviews.length > 0 && (
              <span className="text-sm text-gray-500 font-normal ml-2">
                {reviews.length}
              </span>
            )}
          </h2>
          <hr className="border-gray-700 mt-2 mb-2" />

          {reviews.length === 0 ? (
            <div className="py-12 text-center">
              <i className="fa-solid fa-star text-4xl text-gray-600 mb-4"></i>
              <p className="text-gray-400">No reviews yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={{
                    ...review,
                    game: review.games,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
