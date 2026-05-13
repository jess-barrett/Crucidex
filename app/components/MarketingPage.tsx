"use client";

import Link from "next/link";

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Custom Homepage Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-end gap-6">
          <Link href="/login" className="text-white hover:text-gray-300">
            Log In
          </Link>
          <Link href="/signup" className="text-white hover:text-gray-300">
            Register
          </Link>
          <Link href="/games" className="text-white hover:text-gray-300">
            Games
          </Link>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 px-4 py-2 rounded-lg border border-white/20 focus:outline-none focus:border-white/40 w-48"
            />
          </div>
        </div>
      </nav>

      {/* Hero Section with Fade */}
      <section className="relative h-[250px] sm:h-[400px] bg-gradient-to-b from-gray-800 to-background overflow-hidden">
        <img
          src="/images/homepage/Crucidex-Hero.PNG"
          alt="Crucidex Hero"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay to dim the image */}
        <div className="absolute inset-0 bg-gray-900/40"></div>
        {/* Fade to background */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background"></div>
      </section>

      {/* Main Content Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-24 relative z-10">
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold text-white mb-4">Crucidex</h1>
        <p className="text-lg sm:text-2xl text-gray-300 mb-8">
          Explore, share, and index your games
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Link
            href="/signup"
            className="bg-[#b8253d] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#8a1c2e] transition-colors"
          >
            Create a free account
          </Link>
          <span className="text-gray-400">or</span>
          <Link href="/login" className="text-gray-400 hover:text-gray-300">
            log in with an existing account
          </Link>
        </div>
      </section>

      {/* What is Crucidex Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          What is Crucidex?
        </h2>
        <p className="text-xl text-gray-300 leading-relaxed">
          Crucidex is your ultimate gaming companion. Track your game library,
          rate and review your experiences, connect with friends, and discover
          new games tailored to your preferences. Whether you're a casual player
          or hardcore enthusiast, Crucidex helps you organize and share your
          gaming journey.
        </p>
      </section>

      {/* Feature Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 sm:space-y-24">
        {/* Feature 1: Index Your Collection - Image Left */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
          <img
            src="/images/homepage/Crucidex-Library.PNG"
            alt="Index Your Collection"
            className="rounded-2xl w-full shadow-2xl"
          />
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Index Your Personal Game Collection
            </h3>
            <p className="text-lg text-gray-300 leading-relaxed">
              Seamlessly import your Steam library and organize all your games
              in one place. Track your playtime, add ratings, and keep your
              collection updated automatically. Never lose track of what you've
              played or what's next on your list.
            </p>
          </div>
        </div>

        {/* Feature 2: Share Reviews - Text Left, Image Right */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
          <div className="order-2 md:order-1">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Share Your Experience With Reviews
            </h3>
            <p className="text-lg text-gray-300 leading-relaxed">
              Express your thoughts with detailed reviews and ratings. Help
              others discover great games and avoid disappointments. Build your
              gaming profile and become a trusted voice in the community.
            </p>
          </div>
          <img
            src="/images/homepage/Crucidex-Reviews.PNG"
            alt="Share Reviews"
            className="rounded-2xl w-full shadow-2xl order-1 md:order-2"
          />
        </div>

        {/* Feature 3: Stay Connected - Image Left */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
          <img
            src="/images/homepage/Crucidex-Friends.PNG"
            alt="Stay Connected with Friends"
            className="rounded-2xl w-full shadow-2xl"
          />
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Stay Caught Up With Your Friends
            </h3>
            <p className="text-lg text-gray-300 leading-relaxed">
              Follow your friends to see what they're playing, their latest
              reviews, and favorite games. Get inspired by their collections and
              share recommendations. Gaming is better together.
            </p>
          </div>
        </div>

        {/* Feature 4: Recommendations - Text Left, Image Right */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
          <div className="order-2 md:order-1">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Receive Recommendations Based On Your Taste
            </h3>
            <p className="text-lg text-gray-300 leading-relaxed">
              Discover new games perfectly suited to your preferences. Our
              intelligent recommendation system learns from your library and
              ratings to suggest games you'll love. Expand your gaming horizons
              with personalized picks.
            </p>
          </div>
          <img
            src="/images/homepage/Crucidex-Recommendations.PNG"
            alt="Personalized Recommendations"
            className="rounded-2xl w-full shadow-2xl order-1 md:order-2"
          />
        </div>
      </div>

      {/* Bottom CTA Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Ready to start your gaming journey?
        </h2>
        <Link
          href="/signup"
          className="inline-block bg-[#b8253d] text-white px-10 py-4 rounded-lg font-semibold text-lg hover:bg-[#8a1c2e] transition-colors"
        >
          Join Crucidex Today
        </Link>
      </section>

      {/* Footer Spacing */}
      <div className="h-16"></div>
    </main>
  );
}
