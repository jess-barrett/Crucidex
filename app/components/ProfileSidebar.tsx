"use client";

import TopFourGrid from "./TopFourGrid";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface UserGame {
  id: string;
  playtime_hours: number;
  rating: number | null;
  top_four_position: number | null;
  games: {
    id: string;
    title: string;
    cover_url: string | null;
  };
}

interface ProfileSidebarProps {
  profile: Profile;
  topFour: UserGame[];
  isOwnProfile: boolean;
  onSelectTopFour: (position: number) => void;
  onRemoveTopFour: (gameId: string) => void;
}

export default function ProfileSidebar({
  profile,
  topFour,
  isOwnProfile,
  onSelectTopFour,
  onRemoveTopFour,
}: ProfileSidebarProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 lg:p-5 space-y-4">
      {/* Avatar and Name */}
      <div className="flex flex-col items-center lg:flex-row lg:items-center lg:gap-4">
        <div className="w-20 h-20 lg:w-16 lg:h-16 bg-gradient-to-br from-[#b8253d] to-[#8a1c2e] rounded-full flex items-center justify-center text-2xl lg:text-xl overflow-hidden flex-shrink-0 ring-2 ring-[#b8253d]/30">
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

        <div className="mt-3 lg:mt-0 text-center lg:text-left">
          <h1 className="text-xl lg:text-lg font-bold text-white">
            {profile.display_name}
          </h1>
          <p className="text-gray-400 text-sm">@{profile.username}</p>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-gray-300 text-sm line-clamp-3">{profile.bio}</p>
      )}

      {/* Joined date */}
      <p className="text-xs text-gray-500">
        Joined {new Date(profile.created_at).toLocaleDateString()}
      </p>

      {/* Top 4 Games */}
      <div>
        <h2 className="font-semibold text-white text-sm mb-2 flex items-center gap-2">
          <i className="fa-solid fa-trophy text-[#b8253d]"></i>
          Top 4 Games
        </h2>
        <TopFourGrid
          topFour={topFour}
          isOwnProfile={isOwnProfile}
          onSelectPosition={onSelectTopFour}
          onRemove={onRemoveTopFour}
        />
      </div>

      {/* Edit Profile button */}
      {isOwnProfile && (
        <a
          href="/settings"
          className="block w-full text-center px-4 py-2 bg-[#b8253d] hover:bg-[#8a1c2e] text-white rounded-lg font-medium transition-colors text-sm"
        >
          Edit Profile
        </a>
      )}
    </div>
  );
}
