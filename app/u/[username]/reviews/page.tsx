"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import ReviewCard from "@/app/components/ReviewCard";
import { useProfileLayout } from "@/lib/profile-layout-context";

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
  const { profile } = useProfileLayout();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;

    async function load() {
      const [reviewsRes, libraryRes] = await Promise.all([
        supabase
          .from("reviews")
          .select(
            `id, content, contains_spoilers, created_at, game_id,
             games (igdb_id, title, cover_url)`
          )
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("user_games")
          .select("game_id, playtime_hours, rating, play_status")
          .eq("user_id", profile.id),
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
      setDataLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  if (!profile) return null;

  return (
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

      {dataLoading ? (
        <div className="py-12 text-center text-gray-500 text-sm">Loading...</div>
      ) : reviews.length === 0 ? (
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
  );
}
