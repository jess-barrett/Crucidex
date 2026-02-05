import { NextResponse } from "next/server";

export async function GET() {
  const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/steam/callback`;
  const realm = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnUrl,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  const steamLoginUrl = `https://steamcommunity.com/openid/login?${params.toString()}`;

  return NextResponse.redirect(steamLoginUrl);
}
