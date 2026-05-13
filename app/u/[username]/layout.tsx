"use client";

import { useParams } from "next/navigation";
import {
  ProfileLayoutProvider,
  useProfileLayout,
} from "@/lib/profile-layout-context";
import ProfileNavBar from "@/app/components/ProfileNavBar";
import FriendRequestButton from "@/app/components/FriendRequestButton";

function LayoutContent({
  children,
  username,
}: {
  children: React.ReactNode;
  username: string;
}) {
  const {
    profile,
    isOwnProfile,
    isLoggedIn,
    steamConnected,
    gameCount,
    totalHours,
    friendsCount,
    loading,
    notFound,
  } = useProfileLayout();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  if (notFound || !profile) {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              {isOwnProfile ? (
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <a
                    href="/settings"
                    className="text-xs text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded px-3 py-1 transition-colors"
                  >
                    Edit Profile
                  </a>
                  <a
                    href="/settings#steam-integration"
                    title={
                      steamConnected
                        ? "Steam account connected"
                        : "Connect to Steam"
                    }
                    className={`inline-flex items-center gap-1 text-xs rounded px-1.5 py-1 transition-colors ${
                      steamConnected
                        ? "border border-green-600/50 text-green-400 hover:bg-green-900/20"
                        : "bg-[#1b2838] hover:bg-[#2a475e] text-white border border-[#2a475e]"
                    }`}
                  >
                    <i className="fa-brands fa-steam"></i>
                    <i
                      className={`fa-solid ${
                        steamConnected ? "fa-check" : "fa-plus"
                      } text-[10px]`}
                    ></i>
                  </a>
                </div>
              ) : (
                isLoggedIn && (
                  <div className="mt-1.5">
                    <FriendRequestButton
                      targetUsername={username}
                      isLoggedIn={isLoggedIn}
                      isOwnProfile={isOwnProfile}
                    />
                  </div>
                )
              )}
            </div>
          </div>

          <div className="flex items-center justify-around sm:justify-end gap-6 sm:gap-8">
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

        {/* ── Tab content ── */}
        {children}
      </div>
    </main>
  );
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const username = params.username as string;

  return (
    <ProfileLayoutProvider username={username}>
      <LayoutContent username={username}>{children}</LayoutContent>
    </ProfileLayoutProvider>
  );
}
