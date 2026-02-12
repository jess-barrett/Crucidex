"use client";

import { createClient } from "@/lib/supabase-client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function redirectToUserProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (profileData?.username) {
        router.push(`/u/${profileData.username}`);
      } else {
        router.push("/");
      }
    }

    redirectToUserProfile();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p>Redirecting...</p>
    </main>
  );
}
