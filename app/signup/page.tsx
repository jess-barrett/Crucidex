"use client";

import { createClient } from "@/lib/supabase-client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [verifiedInOtherTab, setVerifiedInOtherTab] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Listen for email verification from the confirm tab
  useEffect(() => {
    if (!success) return;

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("crucidex-auth");
      channel.onmessage = (e) => {
        if (e.data?.event === "email_verified") {
          setVerifiedInOtherTab(true);
          setTimeout(() => router.push(e.data.next || "/"), 1500);
        }
      };
    } catch {
      // BroadcastChannel not supported
    }

    return () => {
      channel?.close();
    };
  }, [success, router]);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          display_name: displayName,
        },
      },
    });

    // Debug logs (visible in browser console)
    console.log("Signup response:", { data, error: signUpError });

    if (signUpError) {
      const msg = signUpError.message.toLowerCase();
      if (msg.includes("user already registered") || msg.includes("already been registered")) {
        setError("An account with this email already exists. Try logging in instead.");
      } else if (msg.includes("duplicate key") && msg.includes("username")) {
        setError("That username is already taken. Please choose another.");
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    // Supabase silently succeeds when the email is already taken but returns
    // an empty identities array. Detect that case.
    if (data?.user?.identities && data.user.identities.length === 0) {
      setError("An account with this email already exists. Try logging in instead.");
      setLoading(false);
      return;
    }

    // If we got this far, signup succeeded — show the verify-email screen.
    if (data?.user) {
      setSubmittedEmail(email);
      setSuccess(true);
      setLoading(false);
      return;
    }

    // Defensive fallback — shouldn't normally hit this
    setError("Something unexpected happened. Please try again.");
    setLoading(false);
  }

  // ── Success screen ──
  if (success) {
    // Post-verification state — triggered by BroadcastChannel from confirm tab
    if (verifiedInOtherTab) {
      return (
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <i className="fa-solid fa-circle-check text-5xl text-green-500 mb-4"></i>
            <h1 className="text-2xl font-bold text-white mb-3">
              Email Verified!
            </h1>
            <p className="text-gray-300">
              Welcome to Crucidex. Redirecting you in...
            </p>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <i className="fa-solid fa-envelope-circle-check text-5xl text-[#b8253d] mb-4"></i>
          <h1 className="text-2xl font-bold text-white mb-3">
            Check Your Email
          </h1>
          <p className="text-gray-300 mb-2">
            We sent a verification link to
          </p>
          <p className="text-white font-semibold mb-6 break-all">
            {submittedEmail}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Click the link in that email to finish creating your account. If
            you don&apos;t see it, check your spam folder. This tab will
            automatically continue once you verify.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/login"
              className="px-4 py-2 bg-[#b8253d] hover:bg-[#8a1c2e] text-white rounded-lg transition-colors text-sm font-medium"
            >
              Go to Login
            </a>
            <button
              onClick={() => {
                setSuccess(false);
                setSubmittedEmail("");
                setEmail("");
                setPassword("");
                setUsername("");
                setDisplayName("");
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm font-medium"
            >
              Use Different Email
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Form ──
  return (
    <main className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSignUp} className="flex flex-col gap-4 w-full max-w-sm px-4">
        <h1 className="text-2xl font-bold text-center">Sign Up for Crucidex</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border border-gray-600 bg-gray-800 text-white placeholder-gray-400 px-3 py-2.5 rounded focus:outline-none focus:border-[#b8253d]"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="border border-gray-600 bg-gray-800 text-white placeholder-gray-400 px-3 py-2.5 rounded focus:outline-none focus:border-[#b8253d]"
        />

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          pattern="^[a-z0-9_-]+$"
          title="Lowercase letters, numbers, underscores, and hyphens only"
          className="border border-gray-600 bg-gray-800 text-white placeholder-gray-400 px-3 py-2.5 rounded focus:outline-none focus:border-[#b8253d]"
        />

        <input
          type="text"
          placeholder="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="border border-gray-600 bg-gray-800 text-white placeholder-gray-400 px-3 py-2.5 rounded focus:outline-none focus:border-[#b8253d]"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-[#b8253d] text-white p-2 rounded hover:bg-[#8a1c2e] disabled:opacity-50"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <p className="text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-[#b8253d] hover:underline">
            Log in
          </a>
        </p>
      </form>
    </main>
  );
}
