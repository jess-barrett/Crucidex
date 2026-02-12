"use client";

export default function TrendingGamesSection() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">Trending Games</h2>
      <div className="bg-gray-800/50 rounded-xl p-12 text-center">
        <i className="fa-solid fa-fire text-gray-600 text-5xl mb-4"></i>
        <p className="text-xl text-gray-400 mb-2">Coming Soon</p>
        <p className="text-gray-500">
          We're working on an algorithm to show you what's trending in the
          Crucidex community
        </p>
      </div>
    </div>
  );
}
