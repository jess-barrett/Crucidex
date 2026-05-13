"use client";

interface ReviewCardProps {
  review: {
    id: string;
    content: string;
    contains_spoilers?: boolean;
    created_at: string;
    rating?: number | null;
    hours?: number | null;
    game: {
      igdb_id: number;
      title: string;
      cover_url: string | null;
    };
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const date = new Date(review.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Build filled stars from rating
  const stars: ("full" | "half")[] = [];
  if (review.rating) {
    const fullCount = Math.floor(review.rating);
    const hasHalf = review.rating % 1 !== 0;
    for (let i = 0; i < fullCount; i++) stars.push("full");
    if (hasHalf) stars.push("half");
  }

  return (
    <div className="flex gap-3 sm:gap-4 py-4 border-b border-gray-700/50 last:border-b-0">
      {/* Cover Art */}
      <a
        href={`/games/${review.game.igdb_id}`}
        className="flex-shrink-0 w-16 h-24 sm:w-20 sm:h-28 rounded-md overflow-hidden"
      >
        {review.game.cover_url ? (
          <img
            src={review.game.cover_url}
            alt={review.game.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-md">
            <i className="fa-solid fa-gamepad text-gray-500 text-xl"></i>
          </div>
        )}
      </a>

      {/* Review Content */}
      <div className="flex-1 min-w-0">
        {/* Top row: "Reviewed" label + timestamp right-aligned */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Reviewed</span>
          <span className="text-xs text-gray-600">{date}</span>
        </div>

        {/* Game title + hours */}
        <div className="flex items-baseline gap-2 mt-0.5">
          <a
            href={`/games/${review.game.igdb_id}`}
            className="text-lg font-bold text-white hover:text-[#b8253d] transition-colors truncate"
          >
            {review.game.title}
          </a>
          {review.hours != null && review.hours > 0 && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              {review.hours} Hrs
            </span>
          )}
        </div>

        {/* Stars */}
        {stars.length > 0 && (
          <div className="flex items-center gap-0.5 mt-1">
            {stars.map((type, i) => (
              <i
                key={i}
                className={`text-sm text-[#b8253d] ${
                  type === "full"
                    ? "fa-solid fa-star"
                    : "fa-solid fa-star-half"
                }`}
              ></i>
            ))}
          </div>
        )}

        {/* Review text */}
        <p className="text-sm text-gray-300 mt-2 leading-relaxed line-clamp-4">
          {review.content}
        </p>
      </div>
    </div>
  );
}
