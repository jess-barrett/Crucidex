import Image from "next/image";

interface GameDetailHeaderProps {
  igdbGame: any;
  dbGame: any | null;
}

export default function GameDetailHeader({
  igdbGame,
  dbGame,
}: GameDetailHeaderProps) {
  // Format release date
  const releaseDate = igdbGame.first_release_date
    ? new Date(igdbGame.first_release_date * 1000).getFullYear()
    : "TBA";

  // Extract developer names
  const developers =
    igdbGame.involved_companies
      ?.filter((ic: any) => ic.developer)
      .map((ic: any) => ic.company?.name)
      .filter(Boolean) || [];

  const developerText =
    developers.length > 0 ? developers.join(", ") : "Unknown Developer";

  // Extract platform names
  const platforms =
    igdbGame.platforms?.map((p: any) => p.abbreviation || p.name) || [];

  // Format cover URL
  const coverUrl = igdbGame.cover?.url
    ? igdbGame.cover.url.replace("t_thumb", "t_cover_big")
    : null;

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-8">
      {/* Cover Art */}
      <div className="flex justify-center lg:justify-start">
        {coverUrl ? (
          <div className="relative w-full max-w-[300px] aspect-[3/4] bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
            <Image
              src={`https:${coverUrl}`}
              alt={igdbGame.name}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="w-full max-w-[300px] aspect-[3/4] bg-gray-700 rounded-xl flex items-center justify-center">
            <span className="text-gray-400 text-center p-4">
              No cover available
            </span>
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="space-y-6">
        {/* Title and Metadata */}
        <div>
          <h1 className="text-5xl font-bold text-white mb-3">
            {igdbGame.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-lg text-gray-300">
            <span>{developerText}</span>
            <span className="text-gray-600">•</span>
            <span>{releaseDate}</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          {igdbGame.summary && (
            <p className="text-gray-300 leading-relaxed">{igdbGame.summary}</p>
          )}
          {igdbGame.storyline && !igdbGame.summary && (
            <p className="text-gray-300 leading-relaxed">
              {igdbGame.storyline}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700"></div>

        {/* Genres and Platforms */}
        <div className="space-y-3">
          {platforms.length > 0 && (
            <div className="pb-3">
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Platforms:
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {platforms.map((platform: string, index: number) => (
                  <span
                    key={index}
                    className="bg-gray-700 text-gray-200 px-3 py-1 rounded-md text-sm"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {platforms.length > 0 && igdbGame.total_rating && (
            <div className="border-t border-gray-700"></div>
          )}

          {igdbGame.total_rating && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                IGDB Rating:
              </span>
              <span className="text-2xl font-bold text-white">
                {Math.round(igdbGame.total_rating)}/100
              </span>
              {igdbGame.total_rating_count && (
                <span className="text-sm text-gray-400">
                  ({igdbGame.total_rating_count.toLocaleString()} ratings)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
