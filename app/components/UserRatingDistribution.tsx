"use client";

import { useMemo } from "react";

interface UserGame {
  id: string;
  rating: number | null;
}

interface UserRatingDistributionProps {
  library: UserGame[];
}

export default function UserRatingDistribution({
  library,
}: UserRatingDistributionProps) {
  const stats = useMemo(() => {
    const ratedGames = library.filter((g) => g.rating !== null);
    const totalRatings = ratedGames.length;

    const averageRating =
      totalRatings > 0
        ? ratedGames.reduce((sum, g) => sum + (g.rating || 0), 0) / totalRatings
        : null;

    const ratingDistribution: Record<number, number> = {};
    ratedGames.forEach((g) => {
      if (g.rating) {
        ratingDistribution[g.rating] = (ratingDistribution[g.rating] || 0) + 1;
      }
    });

    return {
      totalRatings,
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
      ratingDistribution,
    };
  }, [library]);

  const ratingValues = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  const maxHeight = 160;

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 lg:p-8">
      <h2 className="text-2xl font-bold text-white mb-4">
        Your Rating Distribution
      </h2>

      {stats.totalRatings > 0 ? (
        <>
          {stats.averageRating && (
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {stats.averageRating}★
                </div>
                <div className="text-sm text-gray-400 mt-1">Avg Rating</div>
              </div>
            </div>
          )}

          {(() => {
            const maxCount = Math.max(
              ...ratingValues.map((r) => stats.ratingDistribution[r] || 0),
              1,
            );

            return (
              <div>
                <div className="flex items-end gap-1.5" style={{ height: `${maxHeight}px` }}>
                  {ratingValues.map((rating) => {
                    const count = stats.ratingDistribution[rating] || 0;
                    const barHeight = count > 0 ? Math.max((count / maxCount) * maxHeight, 8) : 0;
                    const distributionPercentage =
                      stats.totalRatings > 0
                        ? (count / stats.totalRatings) * 100
                        : 0;

                    return (
                      <div
                        key={rating}
                        className="flex-1 flex flex-col items-end justify-end h-full group"
                        style={{ minWidth: "20px" }}
                      >
                        {count > 0 && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {count} ({Math.round(distributionPercentage)}%)
                            </span>
                          </div>
                        )}
                        {count > 0 ? (
                          <div
                            className="w-full rounded-t transition-all"
                            style={{
                              height: `${barHeight}px`,
                              backgroundColor: "#b8253d",
                              border: "1px solid #b8253d",
                            }}
                          />
                        ) : (
                          <div className="w-full h-1 bg-gray-600 rounded" />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1.5 mt-2">
                  {ratingValues.map((rating) => (
                    <div
                      key={rating}
                      className="flex-1 text-center text-xs text-gray-400 font-medium"
                      style={{ minWidth: "20px" }}
                    >
                      {rating}★
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">No rated games yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Start rating games to see your distribution
          </p>
        </div>
      )}
    </div>
  );
}
