"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Toast from "../components/Toast";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  steam_id: string | null;
}

interface ImportResult {
  success: boolean;
  totalSteamGames: number;
  eligibleGames: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
}

function SettingsContent() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Steam integration
  const [steamId, setSteamId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    loadProfile();

    // Check for Steam link result in URL
    const steamParam = searchParams.get("steam");
    const errorParam = searchParams.get("error");

    if (steamParam === "linked") {
      setToast({
        message: "Steam account linked successfully!",
        type: "success",
      });
      // Clean up URL
      router.replace("/settings");
    } else if (errorParam) {
      const errorMessages: { [key: string]: string } = {
        steam_auth_failed: "Steam authentication failed",
        invalid_steam_id: "Invalid Steam ID received",
        steam_verification_failed: "Steam verification failed",
        steam_verification_error: "Error verifying Steam account",
        save_failed: "Failed to save Steam ID",
        not_authenticated: "Please log in first",
      };
      setToast({
        message: errorMessages[errorParam] || "An error occurred",
        type: "error",
      });
      router.replace("/settings");
    }
  }, [searchParams]);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setEmail(user.email || "");

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error loading profile:", error);
      setToast({ message: "Failed to load profile", type: "error" });
      setLoading(false);
      return;
    }

    setProfile(profileData);
    setDisplayName(profileData.display_name);
    setUsername(profileData.username);
    setBio(profileData.bio || "");
    setAvatarUrl(profileData.avatar_url);
    setIsPublic(profileData.is_public);
    setSteamId(profileData.steam_id);
    setLoading(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setToast({ message: "Please upload an image file", type: "error" });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: "Image must be less than 2MB", type: "error" });
      return;
    }

    setUploadingAvatar(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      setToast({
        message: "Avatar uploaded! Don't forget to save.",
        type: "success",
      });
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      const errorMessage = err?.message || "Failed to upload avatar";
      setToast({ message: `Upload failed: ${errorMessage}`, type: "error" });
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);

    try {
      // Check if username is taken (if changed)
      if (username !== profile.username) {
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .single();

        if (existingUser) {
          setToast({ message: "Username already taken", type: "error" });
          setSaving(false);
          return;
        }

        // Validate username format
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
          setToast({
            message:
              "Username can only contain letters, numbers, hyphens, and underscores",
            type: "error",
          });
          setSaving(false);
          return;
        }

        if (username.length < 3 || username.length > 20) {
          setToast({
            message: "Username must be between 3 and 20 characters",
            type: "error",
          });
          setSaving(false);
          return;
        }
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          username: username,
          bio: bio || null,
          avatar_url: avatarUrl,
          is_public: isPublic,
        })
        .eq("id", profile.id);

      if (error) throw error;

      setToast({ message: "Profile updated successfully!", type: "success" });

      // If username changed, redirect to new URL
      if (username !== profile.username) {
        setTimeout(() => {
          router.push(`/u/${username}`);
        }, 1500);
      } else {
        await loadProfile();
      }
    } catch (err) {
      console.error("Save error:", err);
      setToast({ message: "Failed to save profile", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlinkSteam() {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ steam_id: null })
        .eq("id", profile.id);

      if (error) throw error;

      setSteamId(null);
      setImportResult(null);
      setToast({ message: "Steam account unlinked", type: "success" });
    } catch (err) {
      console.error("Unlink error:", err);
      setToast({ message: "Failed to unlink Steam account", type: "error" });
    }
  }

  async function handleImportSteam() {
    setImporting(true);
    setImportResult(null);

    try {
      const response = await fetch("/api/steam/import", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      setImportResult(data);
      setToast({
        message: `Imported ${data.imported} games, updated ${data.updated}`,
        type: "success",
      });
    } catch (err: any) {
      console.error("Import error:", err);
      setToast({
        message: err.message || "Failed to import Steam library",
        type: "error",
      });
    } finally {
      setImporting(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setToast({ message: "Passwords don't match", type: "error" });
      return;
    }

    if (newPassword.length < 6) {
      setToast({
        message: "Password must be at least 6 characters",
        type: "error",
      });
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setToast({ message: "Password updated successfully!", type: "success" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Password change error:", err);
      setToast({ message: "Failed to change password", type: "error" });
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Profile not found</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-500">
          Manage your profile and account settings
        </p>
      </div>

      {/* Profile Information */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white rounded-lg border p-6 mb-6"
      >
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

        {/* Avatar Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Profile Picture
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-2xl overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max 2MB. JPG, PNG, or GIF.
              </p>
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border rounded p-2 text-gray-900"
            required
          />
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="w-full border rounded p-2 text-gray-900"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Your profile URL: /u/{username}
          </p>
        </div>

        {/* Bio */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full border rounded p-2 text-gray-900"
            rows={3}
            maxLength={160}
            placeholder="Tell us about yourself..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {bio.length}/160 characters
          </p>
        </div>

        {/* Privacy Toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-900">
              Public Profile
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            {isPublic
              ? "Your profile is visible to everyone"
              : "Only you can see your profile"}
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || uploadingAvatar}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {/* Account Settings */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>

        {/* Email (read-only for now) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full border rounded p-2 text-gray-500 bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Contact support to change your email
          </p>
        </div>

        {/* Change Password */}
        <form onSubmit={handleChangePassword}>
          <h3 className="font-medium text-gray-900 mb-3">Change Password</h3>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-900 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded p-2 text-gray-900"
              minLength={6}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded p-2 text-gray-900"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword || !newPassword || !confirmPassword}
            className="w-full bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {changingPassword ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Steam Integration */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Steam Integration</h2>

        {steamId ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387l3.063-4.41c-.104-.01-.207-.023-.312-.039l-2.182-3.146a2.794 2.794 0 01-.312-2.12 2.794 2.794 0 011.293-1.74 2.794 2.794 0 012.12-.312c.74.18 1.373.66 1.74 1.293l3.146 2.182c.016.105.029.208.039.312l4.41-3.063C23.197 5.438 18.699 2 12 0zm0 4.5a7.5 7.5 0 110 15 7.5 7.5 0 010-15z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Steam Connected</p>
                <p className="text-sm text-gray-500">Steam ID: {steamId}</p>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={handleImportSteam}
                disabled={importing}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {importing ? "Importing..." : "Import Steam Library"}
              </button>
              <button
                onClick={handleUnlinkSteam}
                className="px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
              >
                Unlink
              </button>
            </div>

            {importResult && (
              <div className="bg-gray-50 rounded p-4 text-sm">
                <p className="font-medium mb-2">Import Results</p>
                <ul className="space-y-1 text-gray-600">
                  <li>Total Steam games: {importResult.totalSteamGames}</li>
                  <li>
                    Games with 30+ min played: {importResult.eligibleGames}
                  </li>
                  <li className="text-green-600">
                    Imported: {importResult.imported}
                  </li>
                  <li className="text-blue-600">
                    Updated: {importResult.updated}
                  </li>
                  <li className="text-gray-500">
                    Skipped (no changes): {importResult.skipped}
                  </li>
                  {importResult.failed > 0 && (
                    <li className="text-red-600">
                      Failed: {importResult.failed}
                    </li>
                  )}
                </ul>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-4">
              Games with at least 30 minutes played will be imported. Your Steam
              profile must be public.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">
              Link your Steam account to automatically import your game library
              and playtime.
            </p>
            <a
              href="/api/steam/login"
              className="inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Link Steam Account
            </a>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <a
          href={`/u/${profile.username}`}
          className="text-blue-500 hover:underline"
        >
          ← Back to profile
        </a>
        <a href="/" className="text-blue-500 hover:underline">
          Home
        </a>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </main>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
