"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UserRootPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  useEffect(() => {
    router.replace(`/u/${username}/profile`);
  }, [username, router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </main>
  );
}
