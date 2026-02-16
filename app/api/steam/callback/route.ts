import { createServerComponentClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Verify the OpenID response
  const claimedId = searchParams.get("openid.claimed_id");

  if (!claimedId) {
    return NextResponse.redirect(`${siteUrl}/settings?error=steam_auth_failed`);
  }

  // Extract Steam ID from claimed_id
  // Format: https://steamcommunity.com/openid/id/76561198012345678
  const steamIdMatch = claimedId.match(/\/id\/(\d+)$/);

  if (!steamIdMatch) {
    return NextResponse.redirect(`${siteUrl}/settings?error=invalid_steam_id`);
  }

  const steamId = steamIdMatch[1];

  // Verify the response with Steam (optional but recommended)
  const verifyParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    verifyParams.append(key, value);
  });
  verifyParams.set("openid.mode", "check_authentication");

  try {
    const verifyResponse = await fetch(
      `https://steamcommunity.com/openid/login?${verifyParams.toString()}`
    );
    const verifyText = await verifyResponse.text();

    if (!verifyText.includes("is_valid:true")) {
      return NextResponse.redirect(`${siteUrl}/settings?error=steam_verification_failed`);
    }
  } catch {
    return NextResponse.redirect(`${siteUrl}/settings?error=steam_verification_error`);
  }

  // Get the current user and save their Steam ID
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${siteUrl}/login?error=not_authenticated`);
  }

  // Update the user's profile with their Steam ID
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ steam_id: steamId })
    .eq("id", user.id);

  if (updateError) {
    console.error("Failed to save Steam ID:", updateError);
    return NextResponse.redirect(`${siteUrl}/settings?error=save_failed`);
  }

  // Redirect to settings with success
  return NextResponse.redirect(`${siteUrl}/settings?steam=linked`);
}
