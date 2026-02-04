"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [library, setLibrary] = useState<UserGame[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
      } else {
        setProfile(profileData);
      }

      const { data: libraryData, error: libraryError } = await supabase
        .from("user_games")
        .select(
          `
            id,
            playtime_hours,
            rating,
            top_four_position,
            games (
              id,
              title,
              cover_url
            )
          `,
        )
        .eq("user_id", user.id)
        .order("added_at", { ascending: false });

      if (libraryError) {
        console.error("Error loading library:", libraryError);
      } else {
        setLibrary((libraryData as unknown as UserGame[]) || []);
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
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

  const topFour = library
    .filter((g) => g.top_four_position !== null)
    .sort((a, b) => (a.top_four_position || 0) - (b.top_four_position || 0));

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            profile.display_name.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.display_name}</h1>
          <p className="text-gray-500">@{profile.username}</p>
        </div>
      </div>

      {profile.bio && <p className="mb-6">{profile.bio}</p>}

      <p className="text-sm text-gray-400 mb-8">
        Joined {new Date(profile.created_at).toLocaleDateString()}
      </p>

      <div className="mb-8">
        <h2 className="font-semibold mb-4">Top 4 Games</h2>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((position) => {
            const game = topFour.find((g) => g.top_four_position === position);
            return (
              <div
                key={position}
                className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50"
              >
                {game ? (
                  <img
                    src={game.games?.cover_url || ""}
                    alt={game.games?.title || "Game"}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <span className="text-3xl text-gray-300">+</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Library ({library.length})</h2>
          <a href="/add-game" className="text-blue-500 hover:underline text-sm">
            + Add games
          </a>
        </div>

        {library.length === 0 ? (
          <p className="text-gray-500 text-sm">Your library is empty.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {library.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg overflow-hidden bg-gray-900"
              >
                <div className="aspect-[3/4]">
                  {item.games?.cover_url ? (
                    <img
                      src={item.games.cover_url}
                      alt={item.games?.title || "Game"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center p-2 text-sm text-center text-white">
                      {item.games?.title || "Unknown"}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-white truncate">
                    {item.games?.title || "Unknown"}
                  </h3>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-white">
                      {item.playtime_hours} hrs
                    </span>
                    {item.rating ? (
                      <span className="bg-[#0047AB] text-white px-2 py-0.5 rounded font-medium">
                        {item.rating}/10
                      </span>
                    ) : (
                      <span className="text-gray-400">No rating</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <a href="/" className="inline-block mt-8 text-blue-500 hover:underline">
        ← Back home
      </a>
    </main>
  );
}
