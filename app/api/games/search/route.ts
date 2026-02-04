import { searchGames } from "@/lib/igdb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const games = await searchGames(query);
    return NextResponse.json(games);
  } catch (error) {
    console.error("IGDB search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
