"use client";

import { useState, useEffect } from "react";

interface FriendRequestButtonProps {
  targetUsername: string;
  isLoggedIn: boolean;
  isOwnProfile: boolean;
}

type FriendshipState =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "accepted"
  | "declined";

export default function FriendRequestButton({
  targetUsername,
  isLoggedIn,
  isOwnProfile,
}: FriendRequestButtonProps) {
  const [state, setState] = useState<FriendshipState>("none");
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || isOwnProfile) {
      setLoading(false);
      return;
    }

    async function checkStatus() {
      try {
        const res = await fetch(
          `/api/friends?type=status&username=${encodeURIComponent(targetUsername)}`
        );
        const data = await res.json();

        if (data.status === "none") {
          setState("none");
        } else if (data.status === "accepted") {
          setState("accepted");
          setFriendshipId(data.id);
        } else if (data.status === "pending") {
          setState(data.isRequester ? "pending_sent" : "pending_received");
          setFriendshipId(data.id);
        } else if (data.status === "declined") {
          setState("none");
        }
      } catch {
        // silently fail
      }
      setLoading(false);
    }

    checkStatus();
  }, [targetUsername, isLoggedIn, isOwnProfile]);

  if (!isLoggedIn || isOwnProfile || loading) return null;

  async function sendRequest() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: targetUsername }),
      });
      if (res.ok) {
        setState("pending_sent");
        const statusRes = await fetch(
          `/api/friends?type=status&username=${encodeURIComponent(targetUsername)}`
        );
        const data = await statusRes.json();
        setFriendshipId(data.id);
      }
    } catch {
      // silently fail
    }
    setActionLoading(false);
  }

  async function cancelRequest() {
    if (!friendshipId) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId }),
      });
      if (res.ok) {
        setState("none");
        setFriendshipId(null);
      }
    } catch {
      // silently fail
    }
    setActionLoading(false);
  }

  async function acceptRequest() {
    if (!friendshipId) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action: "accept" }),
      });
      if (res.ok) {
        setState("accepted");
      }
    } catch {
      // silently fail
    }
    setActionLoading(false);
  }

  async function declineRequest() {
    if (!friendshipId) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action: "decline" }),
      });
      if (res.ok) {
        setState("none");
        setFriendshipId(null);
      }
    } catch {
      // silently fail
    }
    setActionLoading(false);
  }

  async function unfriend() {
    if (!friendshipId) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId }),
      });
      if (res.ok) {
        setState("none");
        setFriendshipId(null);
      }
    } catch {
      // silently fail
    }
    setActionLoading(false);
  }

  const disabled = actionLoading;

  // No friendship — show "Add Friend"
  if (state === "none") {
    return (
      <button
        onClick={sendRequest}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
      >
        <i className="fa-solid fa-user-plus"></i>
        Add Friend
      </button>
    );
  }

  // Request sent — show "Request Sent" with cancel
  if (state === "pending_sent") {
    return (
      <button
        onClick={cancelRequest}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
        title="Click to cancel request"
      >
        <i className="fa-solid fa-clock"></i>
        Request Sent
      </button>
    );
  }

  // Request received — show Accept / Decline
  if (state === "pending_received") {
    return (
      <div className="flex gap-2 w-full">
        <button
          onClick={acceptRequest}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#b8253d] hover:bg-[#8a1c2e] text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
        >
          <i className="fa-solid fa-check"></i>
          Accept
        </button>
        <button
          onClick={declineRequest}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
        >
          <i className="fa-solid fa-xmark"></i>
          Decline
        </button>
      </div>
    );
  }

  // Friends — show "Friends" with unfriend on click
  if (state === "accepted") {
    return (
      <button
        onClick={unfriend}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#b8253d]/20 border border-[#b8253d]/40 hover:bg-red-900/40 text-[#b8253d] rounded-lg font-medium transition-colors text-sm group disabled:opacity-50"
        title="Click to unfriend"
      >
        <i className="fa-solid fa-user-check group-hover:hidden"></i>
        <i className="fa-solid fa-user-minus hidden group-hover:inline"></i>
        <span className="group-hover:hidden">Friends</span>
        <span className="hidden group-hover:inline">Unfriend</span>
      </button>
    );
  }

  return null;
}
