"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";

interface Friend {
  friendshipId: string;
  friend: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  since: string;
}

export default function FriendsPage() {
  const params = useParams();
  const username = params.username as string;
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (profile && user?.id === profile.id) {
        setIsOwnProfile(true);
      }

      // Fetch friends list
      if (user) {
        const res = await fetch("/api/friends?type=list");
        const data = await res.json();
        if (Array.isArray(data)) {
          setFriends(data);
        }
      }

      setLoading(false);
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-white mb-6">Friends</h1>

        {friends.length === 0 ? (
          <div className="bg-gray-800/50 rounded-xl p-12 text-center">
            <i className="fa-solid fa-user-group text-4xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">No friends yet. Visit other profiles to send friend requests!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {friends.map((f) => (
              <a
                key={f.friendshipId}
                href={`/u/${f.friend.username}`}
                className="flex items-center gap-4 bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800 transition-colors border border-gray-700/50"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#b8253d] to-[#8a1c2e] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {f.friend.avatar_url ? (
                    <img
                      src={f.friend.avatar_url}
                      alt={f.friend.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold">
                      {f.friend.display_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{f.friend.display_name}</p>
                  <p className="text-sm text-gray-400">@{f.friend.username}</p>
                </div>
                <p className="text-xs text-gray-500">
                  Friends since {new Date(f.since).toLocaleDateString()}
                </p>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
