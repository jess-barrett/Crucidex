"use client";

import { useParams } from "next/navigation";

export default function ReviewsPage() {
  const params = useParams();
  const username = params.username as string;

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-white mb-2">Reviews</h1>
        <p className="text-gray-400">@{username}&apos;s reviews are coming soon.</p>
      </div>
    </main>
  );
}
