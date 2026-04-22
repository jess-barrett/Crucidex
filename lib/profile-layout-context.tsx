"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase-client";

export interface ProfileLayoutData {
  profile: any | null;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
  steamConnected: boolean;
  gameCount: number;
  totalHours: number;
  friendsCount: number;
  loading: boolean;
  notFound: boolean;
  /** Manually re-fetch the shared layout data (useful after mutations) */
  refresh: () => Promise<void>;
}

const defaults: ProfileLayoutData = {
  profile: null,
  isOwnProfile: false,
  isLoggedIn: false,
  steamConnected: false,
  gameCount: 0,
  totalHours: 0,
  friendsCount: 0,
  loading: true,
  notFound: false,
  refresh: async () => {},
};

const ProfileLayoutContext = createContext<ProfileLayoutData>(defaults);

export function useProfileLayout() {
  return useContext(ProfileLayoutContext);
}

export function ProfileLayoutProvider({
  children,
  username,
}: {
  children: ReactNode;
  username: string;
}) {
  const [data, setData] = useState<ProfileLayoutData>(defaults);
  const supabase = createClient();

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (!profileData) {
      setData({ ...defaults, loading: false, notFound: true, refresh: load });
      return;
    }

    const [libraryRes, friendsRes] = await Promise.all([
      supabase
        .from("user_games")
        .select("playtime_hours, play_status")
        .eq("user_id", profileData.id),
      supabase
        .from("friendships")
        .select("id", { count: "exact" })
        .or(
          `requester_id.eq.${profileData.id},addressee_id.eq.${profileData.id}`
        )
        .eq("status", "accepted"),
    ]);

    const nonWishlist = (libraryRes.data || []).filter(
      (g: any) => g.play_status !== "wishlist"
    );
    const gameCount = nonWishlist.length;
    const totalHours = Math.round(
      nonWishlist.reduce(
        (s: number, g: any) => s + (g.playtime_hours || 0),
        0
      )
    );

    setData({
      profile: profileData,
      isOwnProfile: user?.id === profileData.id,
      isLoggedIn: !!user,
      steamConnected: !!profileData.steam_id,
      gameCount,
      totalHours,
      friendsCount: friendsRes.count || 0,
      loading: false,
      notFound: false,
      refresh: load,
    });
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProfileLayoutContext.Provider value={data}>
      {children}
    </ProfileLayoutContext.Provider>
  );
}
