"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (data.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", data.user.id)
          .single();

        if (profileData) {
          setUsername(profileData.username);
        }
      } else {
        setUsername(null);
      }
    }

    getUser();

    // Listen for auth state changes (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch username when user logs in
        supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profileData }) => {
            if (profileData) {
              setUsername(profileData.username);
            }
          });
      } else {
        setUsername(null);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b">
      <nav className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="text-xl font-bold">
          Crucidex
        </a>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <a href={username ? `/u/${username}` : "/profile"} className="hover:underline">
                Profile
              </a>
              <button
                onClick={handleLogout}
                className="text-red-500 hover:underline"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="hover:underline">
                Log In
              </a>
              <a
                href="/signup"
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Sign Up
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
