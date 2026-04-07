import { createServerComponentClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/friends?type=list|pending|status&username=xxx
export async function GET(req: NextRequest) {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") || "list";
  const username = req.nextUrl.searchParams.get("username");

  // Get friendship status with a specific user
  if (type === "status" && username) {
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ status: "none" });
    }

    const { data: friendship } = await supabase
      .from("friendships")
      .select("*")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${targetProfile.id}),and(requester_id.eq.${targetProfile.id},addressee_id.eq.${user.id})`
      )
      .maybeSingle();

    if (!friendship) {
      return NextResponse.json({ status: "none" });
    }

    return NextResponse.json({
      id: friendship.id,
      status: friendship.status,
      isRequester: friendship.requester_id === user.id,
    });
  }

  // Get pending incoming friend requests
  if (type === "pending") {
    const { data: requests, error } = await supabase
      .from("friendships")
      .select(
        `
        id,
        created_at,
        requester:profiles!friendships_requester_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq("addressee_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(requests || []);
  }

  // Get accepted friends list
  if (type === "list") {
    const { data: friendships, error } = await supabase
      .from("friendships")
      .select(
        `
        id,
        requester_id,
        addressee_id,
        created_at,
        requester:profiles!friendships_requester_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        ),
        addressee:profiles!friendships_addressee_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq("status", "accepted")
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map to return the "other" user as the friend
    const friends = (friendships || []).map((f: any) => ({
      friendshipId: f.id,
      friend: f.requester_id === user.id ? f.addressee : f.requester,
      since: f.created_at,
    }));

    return NextResponse.json(friends);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

// POST /api/friends — send a friend request
// Body: { username: string }
export async function POST(req: NextRequest) {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await req.json();

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  // Look up target user
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (targetProfile.id === user.id) {
    return NextResponse.json(
      { error: "Cannot send friend request to yourself" },
      { status: 400 }
    );
  }

  // Check for existing friendship in either direction
  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${targetProfile.id}),and(requester_id.eq.${targetProfile.id},addressee_id.eq.${user.id})`
    )
    .maybeSingle();

  if (existing) {
    if (existing.status === "accepted") {
      return NextResponse.json(
        { error: "Already friends" },
        { status: 400 }
      );
    }
    if (existing.status === "pending") {
      return NextResponse.json(
        { error: "Friend request already pending" },
        { status: 400 }
      );
    }
    // If declined, allow re-sending by updating
    if (existing.status === "declined") {
      const { error } = await supabase
        .from("friendships")
        .update({
          requester_id: user.id,
          addressee_id: targetProfile.id,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ message: "Friend request sent" });
    }
  }

  // Create new friend request
  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: targetProfile.id,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Friend request sent" });
}

// PATCH /api/friends — accept or decline a request
// Body: { friendshipId: string, action: "accept" | "decline" }
export async function PATCH(req: NextRequest) {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { friendshipId, action } = await req.json();

  if (!friendshipId || !["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Verify the user is the addressee (only addressee can accept/decline)
  const { data: friendship } = await supabase
    .from("friendships")
    .select("*")
    .eq("id", friendshipId)
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .single();

  if (!friendship) {
    return NextResponse.json(
      { error: "Friend request not found" },
      { status: 404 }
    );
  }

  const newStatus = action === "accept" ? "accepted" : "declined";

  const { error } = await supabase
    .from("friendships")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", friendshipId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `Friend request ${newStatus}`,
  });
}

// DELETE /api/friends — unfriend or cancel request
// Body: { friendshipId: string }
export async function DELETE(req: NextRequest) {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { friendshipId } = await req.json();

  if (!friendshipId) {
    return NextResponse.json(
      { error: "friendshipId is required" },
      { status: 400 }
    );
  }

  // Verify user is part of this friendship
  const { data: friendship } = await supabase
    .from("friendships")
    .select("*")
    .eq("id", friendshipId)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .single();

  if (!friendship) {
    return NextResponse.json(
      { error: "Friendship not found" },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Friendship removed" });
}
