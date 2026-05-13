"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import Skeleton from "@/app/components/Skeleton";
import { useProfileLayout } from "@/lib/profile-layout-context";

interface Friend {
  friendshipId: string;
  friend: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  since: string;
  stats: {
    games: number;
    hours: number;
    friends: number;
  };
}

interface SearchResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

type Tab = "friends" | "requests" | "add";

export default function FriendsPage() {
  const params = useParams();
  const username = params.username as string;
  const { profile, isOwnProfile, refresh: refreshLayout } = useProfileLayout();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingReceived, setPendingReceived] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("friends");

  // Add friend search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  const supabase = createClient();

  async function loadData() {
    if (!profile) return;

    const [friendsRes, pendingRes] = await Promise.all([
      fetch(
        `/api/friends?type=list&username=${encodeURIComponent(username)}`
      ).then((r) => r.json()),

      isOwnProfile
        ? fetch("/api/friends?type=pending").then((r) => r.json())
        : Promise.resolve([]),
    ]);

    if (Array.isArray(friendsRes)) {
      setFriends(friendsRes);
    }

    if (Array.isArray(pendingRes)) {
      setPendingReceived(pendingRes);
    }

    setDataLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, isOwnProfile]);

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .neq("username", username)
      .limit(10);

    setSearchResults(data || []);
    setSearching(false);
  }

  async function handleSendRequest(targetUsername: string) {
    setSendingTo(targetUsername);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: targetUsername }),
    });
    if (res.ok) {
      setSentTo((prev) => new Set(prev).add(targetUsername));
    }
    setSendingTo(null);
  }

  async function handleUnfriend(friendshipId: string) {
    setActionLoading(friendshipId);
    await fetch("/api/friends", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId }),
    });
    setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
    setActionLoading(null);
    refreshLayout();
  }

  async function handleAccept(friendshipId: string) {
    setActionLoading(friendshipId);
    await fetch("/api/friends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId, action: "accept" }),
    });
    setActionLoading(null);
    loadData();
    refreshLayout();
  }

  async function handleDecline(friendshipId: string) {
    setActionLoading(friendshipId);
    await fetch("/api/friends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId, action: "decline" }),
    });
    setPendingReceived((prev) => prev.filter((r) => r.id !== friendshipId));
    setActionLoading(null);
  }

  function isFriend(userId: string) {
    return friends.some((f) => f.friend.id === userId);
  }

  if (!profile) return null;

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "friends", label: "Friends", count: friends.length },
    ...(isOwnProfile
      ? [
          {
            key: "requests" as Tab,
            label: "Requests",
            count: pendingReceived.length,
          },
          { key: "add" as Tab, label: "Add a Friend" },
        ]
      : []),
  ];

  return (
    <>
      {/* ── Tab Bar ── */}
      <div className="flex gap-6 border-b border-gray-700">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              tab === t.key
                ? "text-[#b8253d]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key
                    ? "bg-[#b8253d]/20 text-[#b8253d]"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                {t.count}
              </span>
            )}
            {tab === t.key && (
              <span className="absolute bottom-0 left-[12.5%] right-[12.5%] h-[2px] bg-[#b8253d]" />
            )}
          </button>
        ))}
      </div>

      {dataLoading && (
        <div className="divide-y divide-gray-700/50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center py-3 px-1 gap-3">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Friends ── */}
      {!dataLoading && tab === "friends" && (
        <section>
          {friends.length === 0 ? (
            <div className="py-12 text-center">
              <i className="fa-solid fa-user-group text-4xl text-gray-600 mb-4"></i>
              <p className="text-gray-400">
                No friends yet.{" "}
                {isOwnProfile && (
                  <button
                    onClick={() => setTab("add")}
                    className="text-[#b8253d] hover:underline"
                  >
                    Add some friends!
                  </button>
                )}
              </p>
            </div>
          ) : (
            <>
              {/* Column headers — hidden on mobile */}
              <div className="hidden md:flex items-center px-1 pb-2 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-700/50">
                <span className="flex-1">Name</span>
                <span className="w-20 text-center">Games</span>
                <span className="w-20 text-center">Hours</span>
                <span className="w-20 text-center">Friends</span>
                {isOwnProfile && <span className="w-24"></span>}
              </div>

              <div className="divide-y divide-gray-700/50">
                {friends.map((f) => (
                  <div
                    key={f.friendshipId}
                    className="flex items-center py-3 px-1 hover:bg-gray-800/30 transition-colors"
                  >
                    <a
                      href={`/u/${f.friend.username}`}
                      className="w-10 h-10 bg-gradient-to-br from-[#b8253d] to-[#8a1c2e] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                    >
                      {f.friend.avatar_url ? (
                        <img
                          src={f.friend.avatar_url}
                          alt={f.friend.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {f.friend.display_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </a>

                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <a
                          href={`/u/${f.friend.username}`}
                          className="text-white font-medium text-sm hover:text-[#b8253d] transition-colors"
                        >
                          {f.friend.username}
                        </a>
                        <span className="text-gray-500 text-xs truncate">
                          {f.friend.display_name}
                        </span>
                      </div>

                      {/* Mobile-only inline stats summary */}
                      <p className="text-sm text-gray-500 mt-0.5 md:hidden">
                        {f.stats?.games || 0} games &middot; {f.stats?.hours || 0} hrs &middot; {f.stats?.friends || 0} friends
                      </p>

                      {/* Desktop-only "X friends" subtitle */}
                      <p className="hidden md:block text-xs text-gray-500">
                        {f.stats?.friends || 0} friends
                      </p>
                    </div>

                    {/* Desktop-only stat columns */}
                    <span className="hidden md:inline-block w-20 text-center text-sm text-gray-300">
                      {f.stats?.games || 0}
                    </span>
                    <span className="hidden md:inline-block w-20 text-center text-sm text-gray-300">
                      {f.stats?.hours || 0}
                    </span>
                    <span className="hidden md:inline-block w-20 text-center text-sm text-gray-300">
                      {f.stats?.friends || 0}
                    </span>

                    {isOwnProfile && (
                      <div className="md:w-24 flex justify-end ml-2 md:ml-0">
                        <button
                          onClick={() => handleUnfriend(f.friendshipId)}
                          disabled={actionLoading === f.friendshipId}
                          className="px-3 py-1.5 bg-gray-700 hover:bg-red-900/50 hover:text-red-400 text-gray-400 rounded text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Unfriend
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* ── Tab: Requests ── */}
      {!dataLoading && tab === "requests" && isOwnProfile && (
        <section>
          {pendingReceived.length === 0 ? (
            <div className="py-12 text-center">
              <i className="fa-solid fa-envelope text-4xl text-gray-600 mb-4"></i>
              <p className="text-gray-400">No pending friend requests</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {pendingReceived.map((req: any) => (
                <div
                  key={req.id}
                  className="flex items-center py-3 px-1 hover:bg-gray-800/30 transition-colors"
                >
                  <a
                    href={`/u/${req.requester.username}`}
                    className="w-10 h-10 bg-gradient-to-br from-[#b8253d] to-[#8a1c2e] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                  >
                    {req.requester.avatar_url ? (
                      <img
                        src={req.requester.avatar_url}
                        alt={req.requester.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {req.requester.display_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </a>

                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <a
                        href={`/u/${req.requester.username}`}
                        className="text-white font-medium text-sm hover:text-[#b8253d] transition-colors"
                      >
                        {req.requester.username}
                      </a>
                      <span className="text-gray-500 text-xs truncate">
                        {req.requester.display_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleAccept(req.id)}
                      disabled={actionLoading === req.id}
                      className="px-3 py-1.5 bg-[#b8253d] hover:bg-[#8a1c2e] text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(req.id)}
                      disabled={actionLoading === req.id}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Tab: Add a Friend ── */}
      {!dataLoading && tab === "add" && isOwnProfile && (
        <section>
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by username or display name..."
              className="w-full bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#b8253d] transition-colors"
            />
            <i className="fa-solid fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>

          {searching && (
            <p className="text-gray-400 text-sm text-center py-4">
              Searching...
            </p>
          )}

          {!searching && searchQuery && searchResults.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">
              No users found
            </p>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="divide-y divide-gray-700/50">
              {searchResults.map((user) => {
                const alreadyFriend = isFriend(user.id);
                const alreadySent = sentTo.has(user.username);
                const isSending = sendingTo === user.username;

                return (
                  <div
                    key={user.id}
                    className="flex items-center py-3 px-1 hover:bg-gray-800/30 transition-colors"
                  >
                    <a
                      href={`/u/${user.username}`}
                      className="w-10 h-10 bg-gradient-to-br from-[#b8253d] to-[#8a1c2e] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {user.display_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </a>

                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <a
                          href={`/u/${user.username}`}
                          className="text-white font-medium text-sm hover:text-[#b8253d] transition-colors"
                        >
                          {user.username}
                        </a>
                        <span className="text-gray-500 text-xs truncate">
                          {user.display_name}
                        </span>
                      </div>
                    </div>

                    <div className="ml-4">
                      {alreadyFriend ? (
                        <span className="text-xs text-gray-500 px-3 py-1.5">
                          <i className="fa-solid fa-check mr-1"></i>
                          Friends
                        </span>
                      ) : alreadySent ? (
                        <span className="text-xs text-gray-500 px-3 py-1.5">
                          <i className="fa-solid fa-clock mr-1"></i>
                          Request Sent
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.username)}
                          disabled={isSending}
                          className="px-3 py-1.5 bg-[#b8253d] hover:bg-[#8a1c2e] text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {isSending ? "Sending..." : "Add Friend"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!searchQuery && (
            <div className="py-12 text-center">
              <i className="fa-solid fa-user-plus text-4xl text-gray-600 mb-4"></i>
              <p className="text-gray-400">
                Search for users by username or display name
              </p>
            </div>
          )}
        </section>
      )}
    </>
  );
}
