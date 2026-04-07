"use client";

import { useState, useEffect, useRef } from "react";

interface FriendRequest {
  id: string;
  created_at: string;
  requester: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export default function FriendRequestsDropdown() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function fetchRequests() {
    try {
      const res = await fetch("/api/friends?type=pending");
      const data = await res.json();
      if (Array.isArray(data)) {
        setRequests(data);
      }
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    fetchRequests();
    // Poll every 30 seconds for new requests
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleAction(friendshipId: string, action: "accept" | "decline") {
    setLoading(true);
    try {
      await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action }),
      });
      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
    } catch {
      // silently fail
    }
    setLoading(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative text-gray-300 hover:text-white transition-colors"
        title="Friend Requests"
      >
        <i className="fa-solid fa-user-group text-lg"></i>
        {requests.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#b8253d] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {requests.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700">
            <h3 className="font-semibold text-white text-sm">Friend Requests</h3>
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {requests.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">
                No pending requests
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="px-4 py-3 border-b border-gray-700/50 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-[#b8253d] to-[#8a1c2e] rounded-full flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
                      {req.requester.avatar_url ? (
                        <img
                          src={req.requester.avatar_url}
                          alt={req.requester.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold">
                          {req.requester.display_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <a
                        href={`/u/${req.requester.username}`}
                        className="font-medium text-white text-sm hover:text-[#b8253d] transition-colors"
                      >
                        {req.requester.display_name}
                      </a>
                      <p className="text-xs text-gray-400">
                        @{req.requester.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleAction(req.id, "accept")}
                      disabled={loading}
                      className="flex-1 px-3 py-1.5 bg-[#b8253d] hover:bg-[#8a1c2e] text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "decline")}
                      disabled={loading}
                      className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
