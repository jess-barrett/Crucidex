"use client";

import { createClient } from "@/lib/supabase-client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProfileView from "../../components/ProfileView";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  is_public: boolean;
}

interface UserGame {
  id: string;
  playtime_hours: number;
  rating: number | null;
  top_four_position: number | null;
  play_status: string | null;
  added_at?: string;
  last_played_at?: string;
  games: {
    id: string;
    igdb_id: number;
    title: string;
    cover_url: string | null;
    igdb_rating: number | null;
    genres: number[] | null;
    game_modes: number[] | null;
  };
}

interface Genre {
  id: number;
  name: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [library, setLibrary] = useState<UserGame[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const supabase = createClient();

  async function loadProfile() {
    // Get current user (may be null if not logged in)
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch profile by username
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (profileError || !profileData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProfile(profileData);
    const isOwner = user?.id === profileData.id;
    setIsOwnProfile(isOwner);

    // Check privacy: if profile is private and viewer is not the owner, don't show library
    if (!profileData.is_public && !isOwner) {
      setLoading(false);
      return;
    }

    // Fetch library for this profile
    const { data: libraryData, error: libraryError } = await supabase
      .from("user_games")
      .select(
        `
          id,
          playtime_hours,
          rating,
          top_four_position,
          play_status,
          added_at,
          last_played_at,
          games (
            id,
            igdb_id,
            title,
            cover_url,
            igdb_rating,
            genres,
            game_modes
          )
        `,
      )
      .eq("user_id", profileData.id)
      .order("added_at", { ascending: false });

    if (libraryError) {
      console.error("Error loading library:", libraryError);
    } else {
      setLibrary((libraryData as unknown as UserGame[]) || []);
    }

    // Fetch genres lookup table
    const { data: genresData } = await supabase
      .from("genres")
      .select("id, name")
      .order("name");

    if (genresData) {
      setGenres(genresData);
    }

    setLoading(false);
  }

  async function handleSelectTopFour(gameId: string, position: number) {
    try {
      const { data, error } = await supabase
        .from('user_games')
        .update({ top_four_position: position })
        .eq('id', gameId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Update failed - no rows affected');
      }

      await loadProfile();
    } catch (err) {
      throw err;
    }
  }

  async function handleRemoveTopFour(gameId: string) {
    try {
      const { data, error } = await supabase
        .from('user_games')
        .update({ top_four_position: null })
        .eq('id', gameId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Update failed - no rows affected');
      }

      await loadProfile();
    } catch (err) {
      throw err;
    }
  }

  async function handleEditGame(gameId: string, hours: number, rating: number | null, playStatus: string) {
    try {
      const { data, error } = await supabase
        .from('user_games')
        .update({
          playtime_hours: hours,
          rating: rating,
          play_status: playStatus,
        })
        .eq('id', gameId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Update failed - no rows affected');
      }

      fetch("/api/recommendations", { method: "DELETE" }).catch(() => {});
      await loadProfile();
    } catch (err) {
      throw err;
    }
  }

  async function handleDeleteGame(gameId: string) {
    try {
      const { error } = await supabase
        .from('user_games')
        .delete()
        .eq('id', gameId);

      if (error) throw error;

      fetch("/api/recommendations", { method: "DELETE" }).catch(() => {});
      await loadProfile();
    } catch (err) {
      throw err;
    }
  }

  useEffect(() => {
    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
          <p className="text-gray-500 mb-4">The user @{username} does not exist.</p>
          <a href="/" className="text-blue-500 hover:underline">
            ← Back home
          </a>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Profile not found</p>
      </main>
    );
  }

  // Check if profile is private and user is not the owner
  if (!profile.is_public && !isOwnProfile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">This Profile is Private</h1>
          <p className="text-gray-500 mb-4">@{username} has chosen to keep their profile private.</p>
          <a href="/" className="text-blue-500 hover:underline">
            ← Back home
          </a>
        </div>
      </main>
    );
  }

  return (
    <ProfileView
      profile={profile}
      library={library}
      isOwnProfile={isOwnProfile}
      availableGenres={genres}
      onSelectTopFour={handleSelectTopFour}
      onRemoveTopFour={handleRemoveTopFour}
      onEditGame={(gameId, hours, rating, playStatus) => handleEditGame(gameId, hours, rating, playStatus)}
      onDeleteGame={handleDeleteGame}
    />
  );
}
