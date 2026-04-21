"use client";

import { createClient } from "@/lib/supabase-client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!token_hash || !type) {
      setError("Missing confirmation token");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    router.push(next);
  }

  const title =
    type === "signup" || type === "email"
      ? "Confirm Your Email"
      : type === "recovery"
      ? "Reset Your Password"
      : type === "email_change"
      ? "Confirm Email Change"
      : "Confirm";

  const description =
    type === "signup" || type === "email"
      ? "Click the button below to finish verifying your email and activate your account."
      : type === "recovery"
      ? "Click below to continue resetting your password."
      : type === "email_change"
      ? "Click below to confirm your new email address."
      : "Click below to continue.";

  return (
    <div className="max-w-md text-center">
      <i className="fa-solid fa-envelope-circle-check text-5xl text-[#b8253d] mb-4"></i>
      <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
      <p className="text-gray-400 mb-6">{description}</p>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={loading || !token_hash}
        className="px-6 py-3 bg-[#b8253d] hover:bg-[#8a1c2e] text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? "Confirming..." : "Confirm"}
      </button>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Suspense fallback={<p className="text-gray-400">Loading...</p>}>
        <ConfirmContent />
      </Suspense>
    </main>
  );
}
