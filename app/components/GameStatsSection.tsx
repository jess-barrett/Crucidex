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

          <div className="flex items-end justify-between gap-1.5 h-40">
            {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((rating) => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage =
                stats.totalRatings > 0
                  ? (count / stats.totalRatings) * 100
                  : 0;

              const hasVotes = count > 0;

              return (
                <div
                  key={rating}
                  className="flex-1 flex flex-col items-center justify-end group"
                  style={{ minWidth: '20px' }}
                >
                  {/* Percentage tooltip on hover */}
                  {hasVotes && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                      <span className="text-xs text-gray-400">
                        {count} ({Math.round(percentage)}%)
                      </span>
                    </div>
                  )}
                  {/* Vertical bar or dash */}
                  {hasVotes ? (
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${Math.max(percentage, 5)}%`,
                        minHeight: '20px',
                        backgroundColor: '#0047AB',
                        border: '1px solid #0047AB'
                      }}
                    />
                  ) : (
                    <div className="w-full h-1 bg-gray-600 rounded mb-1" />
                  )}
                  {/* Rating label */}
                  <div className="mt-2 text-xs text-gray-400 font-medium">
                    {rating}★
                  </div>
                </div>
              );
            })}
          </div>
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
