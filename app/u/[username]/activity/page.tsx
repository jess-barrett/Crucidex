"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import ReviewCard from "@/app/components/ReviewCard";
import { useProfileLayout } from "@/lib/profile-layout-context";

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
  const hasHalf = rating % 1 !== 0;
  for (let i = 0; i < fullCount; i++) stars.push("full");
  if (hasHalf) stars.push("half");

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

export default function ActivityPage() {
  const params = useParams();
  const username = params.username as string;
  const { profile } = useProfileLayout();

  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setDataLoading(true);
    fetch(`/api/activity?username=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setActivity(data);
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [profile?.id, username]);

  if (!profile) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
      <hr className="border-gray-700 mt-2 mb-4" />

      {dataLoading ? (
        <div className="py-12 text-center text-gray-500 text-sm">Loading...</div>
      ) : activity.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
          <i className="fa-solid fa-clock-rotate-left text-4xl text-gray-600 mb-4"></i>
          <p className="text-gray-400">No activity yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-700/50">
          {activity.map((entry) => {
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
                <a
                  key={entry.id}
                  href={igdbId ? `/games/${igdbId}` : "#"}
                  className="flex items-center justify-between py-3 px-1 hover:bg-gray-800/30 transition-colors"
                >
                  <p className="text-sm text-gray-300">
                    <i className="fa-solid fa-plus text-[#b8253d] mr-2"></i>
                    Added <span className="text-white font-medium">{gameName}</span> to library
                    {m.rating && <> and rated {renderStars(m.rating)}</>}
                    {m.hours > 0 && <> with <span className="text-white font-medium">{m.hours}</span> hours played</>}
                    {m.status && <> as <span className="text-white font-medium">{capitalize(m.status)}</span></>}
                  </p>
                  <span className="text-xs text-gray-600 flex-shrink-0 ml-4">{time}</span>
                </a>
              );
            }

            if (entry.event_type === "game_wishlisted") {
              return (
                <a
                  key={entry.id}
                  href={igdbId ? `/games/${igdbId}` : "#"}
                  className="flex items-center justify-between py-3 px-1 hover:bg-gray-800/30 transition-colors"
                >
                  <p className="text-sm text-gray-300">
                    <i className="fa-solid fa-bookmark text-[#b8253d] mr-2"></i>
                    Added <span className="text-white font-medium">{gameName}</span> to wishlist
                  </p>
                  <span className="text-xs text-gray-600 flex-shrink-0 ml-4">{time}</span>
                </a>
              );
            }

            if (entry.event_type === "rating_set") {
              return (
                <a
                  key={entry.id}
                  href={igdbId ? `/games/${igdbId}` : "#"}
                  className="flex items-center justify-between py-3 px-1 hover:bg-gray-800/30 transition-colors"
                >
                  <p className="text-sm text-gray-300">
                    <i className="fa-solid fa-star text-[#b8253d] mr-2"></i>
                    Rated <span className="text-white font-medium">{gameName}</span> {renderStars(m.rating)}
                  </p>
                  <span className="text-xs text-gray-600 flex-shrink-0 ml-4">{time}</span>
                </a>
              );
            }

            if (entry.event_type === "rating_changed") {
              return (
                <a
                  key={entry.id}
                  href={igdbId ? `/games/${igdbId}` : "#"}
                  className="flex items-center justify-between py-3 px-1 hover:bg-gray-800/30 transition-colors"
                >
                  <p className="text-sm text-gray-300">
                    <i className="fa-solid fa-star text-[#b8253d] mr-2"></i>
                    Changed rating for <span className="text-white font-medium">{gameName}</span> from {renderStars(m.old_rating)} to {renderStars(m.rating)}
                  </p>
                  <span className="text-xs text-gray-600 flex-shrink-0 ml-4">{time}</span>
                </a>
              );
            }

            if (entry.event_type === "rating_cleared") {
              return (
                <a
                  key={entry.id}
                  href={igdbId ? `/games/${igdbId}` : "#"}
                  className="flex items-center justify-between py-3 px-1 hover:bg-gray-800/30 transition-colors"
                >
                  <p className="text-sm text-gray-300">
                    <i className="fa-regular fa-star text-gray-400 mr-2"></i>
                    Cleared rating for <span className="text-white font-medium">{gameName}</span>
                  </p>
                  <span className="text-xs text-gray-600 flex-shrink-0 ml-4">{time}</span>
                </a>
              );
            }

            if (entry.event_type === "status_changed") {
              return (
                <a
                  key={entry.id}
                  href={igdbId ? `/games/${igdbId}` : "#"}
                  className="flex items-center justify-between py-3 px-1 hover:bg-gray-800/30 transition-colors"
                >
                  <p className="text-sm text-gray-300">
                    <i className="fa-solid fa-arrow-right-arrow-left text-blue-400 mr-2"></i>
                    Changed <span className="text-white font-medium">{gameName}</span> status to <span className="text-white font-medium">{capitalize(m.status)}</span>
                    {m.old_status && <span className="text-gray-500"> (was {capitalize(m.old_status)})</span>}
                  </p>
                  <span className="text-xs text-gray-600 flex-shrink-0 ml-4">{time}</span>
                </a>
              );
            }

            if (entry.event_type === "hours_updated") {
              return (
                <a
                  key={entry.id}
                  href={igdbId ? `/games/${igdbId}` : "#"}
                  className="flex items-center justify-between py-3 px-1 hover:bg-gray-800/30 transition-colors"
                >
                  <p className="text-sm text-gray-300">
                    <i className="fa-solid fa-gamepad text-green-400 mr-2"></i>
                    Logged <span className="text-white font-medium">{Math.round(m.hours)}</span> hours on <span className="text-white font-medium">{gameName}</span>
                    {m.old_hours > 0 && <span className="text-gray-500"> (was {Math.round(m.old_hours)})</span>}
                  </p>
                  <span className="text-xs text-gray-600 flex-shrink-0 ml-4">{time}</span>
                </a>
              );
            }

            if (entry.event_type === "game_removed") {
              return (
                <div key={entry.id} className="flex items-center justify-between py-3 px-1">
                  <p className="text-sm text-gray-300">
                    <i className="fa-solid fa-trash text-gray-500 mr-2"></i>
                    Removed <span className="text-white font-medium">{gameName}</span> from library
                  </p>
                  <span className="text-xs text-gray-600 flex-shrink-0 ml-4">{time}</span>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </section>
  );
}
