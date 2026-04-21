"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <div className="max-w-md text-center">
      <i className="fa-solid fa-circle-exclamation text-5xl text-[#b8253d] mb-4"></i>
      <h1 className="text-2xl font-bold text-white mb-3">
        Authentication Error
      </h1>
      <p className="text-gray-400 mb-4">
        Something went wrong verifying your email.
      </p>
      {reason && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">
            Reason
          </p>
          <p className="text-sm text-gray-300 break-words">{reason}</p>
        </div>
      )}
      <p className="text-sm text-gray-400 mb-6">
        The link may have already been used, expired, or been pre-fetched by an
        email scanner. Try requesting a new one.
      </p>
      <div className="flex gap-3 justify-center">
        <a
          href="/login"
          className="px-4 py-2 bg-[#b8253d] hover:bg-[#8a1c2e] text-white rounded-lg transition-colors text-sm font-medium"
        >
          Go to Login
        </a>
        <a
          href="/signup"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm font-medium"
        >
          Sign Up Again
        </a>
      </div>
    </div>
  );
}

export default function AuthCodeErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Suspense fallback={<p className="text-gray-400">Loading...</p>}>
        <ErrorContent />
      </Suspense>
    </main>
  );
}
