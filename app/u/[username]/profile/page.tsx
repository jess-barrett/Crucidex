"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import ReviewCard from "@/app/components/ReviewCard";
import SelectGameModal from "@/app/components/SelectGameModal";
import { useProfileLayout } from "@/lib/profile-layout-context";
import type { UserGame } from "@/lib/types";

interface Review {
  id: string;
  content: string;
  contains_spoilers?: boolean;
  created_at: string;
  game_id?: string;
  user_games_rating?: number | null;
  user_games_hours?: number | null;
  games: {
    igdb_id: number;
    title: string;
    cover_url: string | null;
  };
}

interface ActivityEntry {
  id: string;
  event_type: string;
  metadata: Record<string, any>;
  created_at: string;
  games: {
    id: string;
    igdb_id: number;
    title: string;
    cover_url: string | null;
  } | null;
  reviews: {
    id: string;
    content: string;
    contains_spoilers?: boolean;
    created_at: string;
    rating?: number | null;
    hours?: number | null;
  } | null;
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { profile, isOwnProfile, refresh: refreshLayout } = useProfileLayout();

  const [library, setLibrary] = useState<UserGame[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectingPosition, setSelectingPosition] = useState<number | null>(null);
  const supabase = createClient();

  async function loadData() {
    if (!profile) return;

    const [libraryRes, reviewsRes, activityRes] = await Promise.all([
      supabase
        .from("user_games")
        .select(
          `id, playtime_hours, rating, top_four_position, play_status, added_at, last_played_at,
           games (id, igdb_id, title, cover_url)`
        )
        .eq("user_id", profile.id)
        .order("added_at", { ascending: false }),

      supabase
        .from("reviews")
        .select(
          `id, content, contains_spoilers, created_at, game_id,
           games (igdb_id, title, cover_url)`
        )
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(2),

      fetch(`/api/activity?username=${encodeURIComponent(username)}&limit=4`).then(
        (r) => r.json()
      ),
    ]);

    if (libraryRes.data) {
      setLibrary(libraryRes.data as unknown as UserGame[]);
    }
    if (reviewsRes.data && libraryRes.data) {
      const lib = libraryRes.data as any[];
      const enriched = (reviewsRes.data as any[]).map((r: any) => {
        const ug = lib.find(
          (g: any) =>
            g.games?.id === r.game_id || g.games?.igdb_id === r.games?.igdb_id
        );
        return {
          ...r,
          user_games_rating: ug?.rating ?? null,
          user_games_hours: ug?.playtime_hours ?? null,
        };
      });
      setReviews(enriched as unknown as Review[]);
    } else if (reviewsRes.data) {
      setReviews(reviewsRes.data as unknown as Review[]);
    }
    if (Array.isArray(activityRes)) {
      setRecentActivity(activityRes);
    }

    setDataLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const topFour = useMemo(
    () =>
      library
        .filter((g) => g.top_four_position !== null)
        .sort((a, b) => (a.top_four_position || 0) - (b.top_four_position || 0)),
    [library]
  );

  function getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function renderStars(rating: number) {
    const stars: ("full" | "half")[] = [];
    const fullCount = Math.floor(rating);
    if (rating % 1 !== 0) {
      for (let i = 0; i < fullCount; i++) stars.push("full");
      stars.push("half");
    } else {
      for (let i = 0; i < fullCount; i++) stars.push("full");
    }
    return (
      <span className="inline-flex items-center gap-0.5 align-middle">
        {stars.map((type, i) => (
          <i
            key={i}
            className={`text-xs text-[#b8253d] ${
              type === "full" ? "fa-solid fa-star" : "fa-solid fa-star-half"
            }`}
          ></i>
        ))}
      </span>
    );
  }

  function capitalize(s: string | null | undefined): string {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  async function handleRemoveTopFour(gameId: string) {
    await supabase
      .from("user_games")
      .update({ top_four_position: null })
      .eq("id", gameId);
    loadData();
  }

  async function handleSelectTopFour(gameId: string, position: number) {
    await supabase
      .from("user_games")
      .update({ top_four_position: position })
      .eq("id", gameId);
    setSelectingPosition(null);
    loadData();
    refreshLayout();
  }

  if (!profile) return null;

  if (dataLoading) {
    return (
      <div className="py-12 text-center text-gray-500 text-sm">Loading...</div>
    );
  }

  const filledPositions = topFour.map((g) => g.top_four_position);
  const leftmostEmpty = [1, 2, 3, 4].find(
    (pos) => !filledPositions.includes(pos)
  );

  return (
    <>
      {/* ── Favorite Games ── */}
      <section>
        <h2 className="text-lg font-semibold text-white">Favorite Games</h2>
        <hr className="border-gray-700 mt-2 mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((position) => {
            const game = topFour.find(
              (g) => g.top_four_position === position
            );
            const isLeftmostEmpty = !game && position === leftmostEmpty;

            return (
              <div
                key={position}
                className="aspect-[3/4] rounded-lg bg-gray-800/50 border border-gray-700 relative group overflow-hidden"
              >
                {game ? (
                  <>
                    <Link
                      href={`/games/${game.games?.igdb_id}`}
                      className="block w-full h-full"
                    >
                      {game.games?.cover_url ? (
                        <img
                          src={game.games.cover_url}
                          alt={game.games.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm p-2 text-center">
                          {game.games?.title}
                        </div>
                      )}
                    </Link>
                    {isOwnProfile && (
                      <button
                        onClick={() => handleRemoveTopFour(game.id)}
                        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 bg-[#b8253d] hover:bg-[#8a1c2e] text-white rounded-full w-6 h-6 flex items-center justify-center transition-all"
                        title="Remove from Favorites"
                      >
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                    )}
                  </>
                ) : isLeftmostEmpty && isOwnProfile ? (
                  <button
                    onClick={() => setSelectingPosition(position)}
                    className="w-full h-full flex items-center justify-center hover:bg-gray-700/50 transition-colors rounded-lg"
                    title="Add Favorite"
                  >
                    <i className="fa-solid fa-plus text-2xl text-gray-500 group-hover:text-white transition-colors"></i>
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fa-solid fa-plus text-2xl text-gray-700"></i>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Recent Activity ── */}
      <section>
        <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        <hr className="border-gray-700 mt-2 mb-4" />

        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((entry) => {
              const gameName = entry.games?.title || "Unknown";
              const igdbId = entry.games?.igdb_id;
              const m = entry.metadata;
              const time = getRelativeTime(entry.created_at);

              if (
                (entry.event_type === "review_created" ||
                  entry.event_type === "review_updated") &&
                entry.reviews &&
                entry.games
              ) {
                return (
                  <div key={entry.id}>
                    <p className="text-xs text-gray-500 mb-1.5 ml-1">
                      {entry.event_type === "review_created"
                        ? "Wrote a review"
                        : "Updated a review"}{" "}
                      &middot; {time}
                    </p>
                    <ReviewCard
                      review={{
                        id: entry.reviews.id,
                        content: entry.reviews.content,
                        created_at: entry.reviews.created_at,
                        rating: entry.reviews.rating ?? null,
                        hours: entry.reviews.hours ?? null,
                        game: {
                          igdb_id: entry.games.igdb_id,
                          title: entry.games.title,
                          cover_url: entry.games.cover_url,
                        },
                      }}
                    />
                  </div>
                );
              }

              if (entry.event_type === "game_added") {
                return (
                  <a key={entry.id} href={igdbId ? `/games/${igdbId}` : "#"} className="block bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 hover:border-gray-600 transition-colors">
                    <p className="text-sm text-gray-300">
                      <i className="fa-solid fa-plus text-[#b8253d] mr-2"></i>
                      Added <span className="text-white font-medium">{gameName}</span> to library
                      {m.rating && <> and rated {renderStars(m.rating)}</>}
                      {m.hours > 0 && <> with <span className="text-white font-medium">{m.hours}</span> hours played</>}
                      {m.status && <> as <span className="text-white font-medium">{capitalize(m.status)}</span></>}
                      <span className="text-gray-500 ml-2 text-xs">{time}</span>
                    </p>
                  </a>
                );
              }

              if (entry.event_type === "game_wishlisted") {
                return (
                  <a key={entry.id} href={igdbId ? `/games/${igdbId}` : "#"} className="block bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 hover:border-gray-600 transition-colors">
                    <p className="text-sm text-gray-300">
                      <i className="fa-solid fa-bookmark text-[#b8253d] mr-2"></i>
                      Added <span className="text-white font-medium">{gameName}</span> to wishlist
                      <span className="text-gray-500 ml-2 text-xs">{time}</span>
                    </p>
                  </a>
                );
              }

              if (entry.event_type === "rating_set") {
                return (
                  <a key={entry.id} href={igdbId ? `/games/${igdbId}` : "#"} className="block bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 hover:border-gray-600 transition-colors">
                    <p className="text-sm text-gray-300">
                      <i className="fa-solid fa-star text-[#b8253d] mr-2"></i>
                      Rated <span className="text-white font-medium">{gameName}</span> {renderStars(m.rating)}
                      <span className="text-gray-500 ml-2 text-xs">{time}</span>
                    </p>
                  </a>
                );
              }

              if (entry.event_type === "rating_changed") {
                return (
                  <a key={entry.id} href={igdbId ? `/games/${igdbId}` : "#"} className="block bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 hover:border-gray-600 transition-colors">
                    <p className="text-sm text-gray-300">
                      <i className="fa-solid fa-star text-[#b8253d] mr-2"></i>
                      Changed rating for <span className="text-white font-medium">{gameName}</span> from {renderStars(m.old_rating)} to {renderStars(m.rating)}
                      <span className="text-gray-500 ml-2 text-xs">{time}</span>
                    </p>
                  </a>
                );
              }

              if (entry.event_type === "status_changed") {
                return (
                  <a key={entry.id} href={igdbId ? `/games/${igdbId}` : "#"} className="block bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 hover:border-gray-600 transition-colors">
                    <p className="text-sm text-gray-300">
                      <i className="fa-solid fa-arrow-right-arrow-left text-blue-400 mr-2"></i>
                      Changed <span className="text-white font-medium">{gameName}</span> status to <span className="text-white font-medium">{capitalize(m.status)}</span>
                      {m.old_status && <span className="text-gray-500"> (was {capitalize(m.old_status)})</span>}
                      <span className="text-gray-500 ml-2 text-xs">{time}</span>
                    </p>
                  </a>
                );
              }

              if (entry.event_type === "hours_updated") {
                return (
                  <a key={entry.id} href={igdbId ? `/games/${igdbId}` : "#"} className="block bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 hover:border-gray-600 transition-colors">
                    <p className="text-sm text-gray-300">
                      <i className="fa-solid fa-gamepad text-green-400 mr-2"></i>
                      Logged <span className="text-white font-medium">{Math.round(m.hours)}</span> hours on <span className="text-white font-medium">{gameName}</span>
                      {m.old_hours > 0 && <span className="text-gray-500"> (was {Math.round(m.old_hours)})</span>}
                      <span className="text-gray-500 ml-2 text-xs">{time}</span>
                    </p>
                  </a>
                );
              }

              return null;
            })}
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-sm">No recent activity</p>
          </div>
        )}
      </section>

      {/* ── Recent Reviews ── */}
      <section>
        <h2 className="text-lg font-semibold text-white">Recent Reviews</h2>
        <hr className="border-gray-700 mt-2 mb-4" />

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={{
                  ...review,
                  rating: review.user_games_rating,
                  hours: review.user_games_hours,
                  game: review.games,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-sm">No reviews yet</p>
          </div>
        )}
      </section>

      {/* Select Game Modal for Top 4 */}
      {selectingPosition !== null && (
        <SelectGameModal
          position={selectingPosition}
          library={library}
          excludeIds={topFour.map((g) => g.games?.id || "")}
          onSelect={(gameId) =>
            handleSelectTopFour(gameId, selectingPosition!)
          }
          onClose={() => setSelectingPosition(null)}
        />
      )}
    </>
  );
}
