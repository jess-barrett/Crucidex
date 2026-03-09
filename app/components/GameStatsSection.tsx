import { AggregateStats } from "@/lib/game-stats";

interface GameStatsSectionProps {
  stats: AggregateStats;
}

export default function GameStatsSection({ stats }: GameStatsSectionProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon="fa-solid fa-play"
          label="Total Plays"
          value={stats.totalPlays.toLocaleString()}
          subtitle={stats.totalPlays === 1 ? "user" : "users"}
        />
        <StatCard
          icon="fa-solid fa-star"
          label="Total Ratings"
          value={stats.totalRatings.toLocaleString()}
          subtitle={
            stats.averageRating
              ? `${stats.averageRating}★ avg`
              : undefined
          }
        />
        <StatCard
          icon="fa-solid fa-clock"
          label="Average Hours"
          value={
            stats.averageHours !== null
              ? `${stats.averageHours}`
              : "No data"
          }
          subtitle={stats.averageHours !== null ? "hours" : undefined}
        />
        <StatCard
          icon="fa-solid fa-trophy"
          label="In Top 4"
          value={stats.topFourCount.toLocaleString()}
          subtitle={stats.topFourCount === 1 ? "user" : "users"}
        />
      </div>

      {/* Crucidex Rating Distribution */}
      {stats.totalRatings > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-6 lg:p-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Crucidex Rating Distribution
          </h2>

          {/* Average Rating Indicator */}
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
            const ratingValues = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
            const maxCount = Math.max(
              ...ratingValues.map((r) => stats.ratingDistribution[r] || 0),
              1,
            );
            const maxHeight = 160;

            return (
              <div>
                <div className="flex items-end gap-1.5" style={{ height: `${maxHeight}px` }}>
                  {ratingValues.map((rating) => {
                    const count = stats.ratingDistribution[rating] || 0;
                    const barHeight = count > 0 ? Math.max((count / maxCount) * maxHeight, 8) : 0;
                    const percentage =
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
                              {count} ({Math.round(percentage)}%)
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
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: string;
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <i className={`${icon} text-gray-400 text-lg`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white truncate">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
