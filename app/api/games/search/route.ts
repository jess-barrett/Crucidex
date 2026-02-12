import { searchGames, isNonBaseGame } from "@/lib/igdb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const games = await searchGames(query);

    // Sort games using scoring system
    // Prioritize: 1) Category 0 (main games), 2) No DLC/bundle keywords, 3) Popularity, 4) Search relevance
    const sorted = games.sort((a: any, b: any) => {
      // Calculate scores (higher = better)
      let scoreA = 0;
      let scoreB = 0;

      // Category 0 (main game) gets highest priority
      if (a.category === 0) scoreA += 100;
      if (b.category === 0) scoreB += 100;

      // Penalize DLC/bundle/edition keywords heavily
      if (a.name && isNonBaseGame(a.name)) scoreA -= 50;
      if (b.name && isNonBaseGame(b.name)) scoreB -= 50;

      // Penalize other non-main categories
      if (a.category && a.category !== 0) scoreA -= 30;
      if (b.category && b.category !== 0) scoreB -= 30;

      // Popularity bonus (follows + rating count)
      const popularityA = (a.total_rating_count || 0) + (a.follows || 0);
      const popularityB = (b.total_rating_count || 0) + (b.follows || 0);

      if (popularityA > 1000) scoreA += 40;
      else if (popularityA > 100) scoreA += 25;
      else if (popularityA > 10) scoreA += 10;

      if (popularityB > 1000) scoreB += 40;
      else if (popularityB > 100) scoreB += 25;
      else if (popularityB > 10) scoreB += 10;

      // Sort by score (descending - higher scores first)
      return scoreB - scoreA;
    });

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("IGDB search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
