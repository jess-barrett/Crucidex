let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" },
  );

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000 - 60000;

  if (!accessToken) {
    throw new Error("Failed to get access token");
  }

  return accessToken;
}

export async function searchGames(query: string) {
  const token = await getAccessToken();

  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: `
      search "${query}";
      fields name, summary, cover.url, first_release_date, category, total_rating, total_rating_count, follows, external_games.category, external_games.uid, genres, game_modes;
      limit 10;
    `,
  });

  return response.json();
}

export async function getGameById(igdbId: number) {
  const token = await getAccessToken();

  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: `
      where id = ${igdbId};
      fields name, summary, cover.url, first_release_date, external_games.category, external_games.uid, total_rating, genres, game_modes;
    `,
  });

  return response.json();
}

export async function getGameDetails(igdbId: number) {
  const token = await getAccessToken();

  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: `
      where id = ${igdbId};
      fields name, summary, storyline, cover.url, first_release_date,
             total_rating, total_rating_count, aggregated_rating, aggregated_rating_count,
             genres, game_modes,
             involved_companies.company.name, involved_companies.developer, involved_companies.publisher,
             platforms.name, platforms.abbreviation,
             screenshots.url;
      limit 1;
    `,
  });

  const data = await response.json();
  return data && Array.isArray(data) && data.length > 0 ? data[0] : null;
}

export async function getGameBySteamAppId(
  steamAppId: number,
  gameName?: string,
  releaseYear?: number,
) {
  const token = await getAccessToken();

  console.log(
    `\n=== IGDB LOOKUP: "${gameName}" (Steam ID: ${steamAppId}, Year: ${releaseYear}) ===`,
  );

  // Helper to check if names reasonably match
  const namesMatch = (igdbName: string, steamName: string): boolean => {
    const normalizedIgdb = igdbName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
    const normalizedSteam = steamName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim();

    // Exact match
    if (normalizedIgdb === normalizedSteam) return true;

    // One starts with the other
    if (
      normalizedIgdb.startsWith(normalizedSteam) ||
      normalizedSteam.startsWith(normalizedIgdb)
    )
      return true;

    // Check length ratio - if IGDB name is much longer, it's probably wrong
    const lengthRatio = normalizedIgdb.length / normalizedSteam.length;
    if (lengthRatio > 1.8 || lengthRatio < 0.5) return false;

    return true;
  };

  // First try: Search external_games where category = 1 (Steam) and uid = steamAppId
  const response = await fetch("https://api.igdb.com/v4/external_games", {
    method: "POST",
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: `
      where category = 1 & uid = "${steamAppId}";
      fields game.id, game.name, game.cover.url, game;
      limit 1;
    `,
  });

  const externalGames = await response.json();
  console.log(`  Steam ID lookup result:`, JSON.stringify(externalGames));

  // Check if we got a valid result from external_games
  if (
    externalGames &&
    Array.isArray(externalGames) &&
    externalGames.length > 0
  ) {
    const firstResult = externalGames[0];
    if (firstResult && firstResult.game) {
      const gameId = firstResult.game;
      if (typeof gameId === "object" && gameId.name) {
        // Check if this is a bundle/edition OR if name doesn't match
        if (isNonBaseGame(gameId.name)) {
          console.log(
            `  -> Steam ID returned non-base game: "${gameId.name}", trying name search...`,
          );
        } else if (gameName && !namesMatch(gameId.name, gameName)) {
          console.log(
            `  -> Steam ID returned mismatched name: "${gameId.name}" vs "${gameName}", trying name search...`,
          );
        } else {
          console.log(`  -> Found via Steam ID: "${gameId.name}"`);
          return gameId;
        }
      } else if (typeof gameId === "number") {
        // If we only got the ID, fetch the full game
        const gameResponse = await fetch("https://api.igdb.com/v4/games", {
          method: "POST",
          headers: {
            "Client-ID": process.env.TWITCH_CLIENT_ID!,
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/plain",
          },
          body: `
            where id = ${gameId};
            fields id, name, cover.url, summary, first_release_date, total_rating, genres, game_modes;
            limit 1;
          `,
        });

        const games = await gameResponse.json();
        if (games && Array.isArray(games) && games.length > 0) {
          const fetchedGame = games[0];
          // Check if this is a bundle/edition OR if name doesn't match
          if (isNonBaseGame(fetchedGame.name)) {
            console.log(
              `  -> Steam ID returned non-base game: "${fetchedGame.name}", trying name search...`,
            );
          } else if (gameName && !namesMatch(fetchedGame.name, gameName)) {
            console.log(
              `  -> Steam ID returned mismatched name: "${fetchedGame.name}" vs "${gameName}", trying name search...`,
            );
          } else {
            console.log(
              `  -> Found via Steam ID (fetched): "${fetchedGame.name}"`,
            );
            return fetchedGame;
          }
        }
      }
    }
  }

  console.log(`  Steam ID lookup failed, trying name search...`);

  // Fallback: Search by game name if Steam ID lookup failed
  if (gameName) {
    // Clean up the game name - remove trademark symbols but keep colons and basic punctuation
    let cleanName = gameName
      .replace(/[®™©]/g, "")
      .replace(/[^\w\s:'-]/g, "") // Keep colons for titles like "Hollow Knight: Silksong"
      .trim();

    // Remove trailing year if present (e.g., "Game Name 2023" -> "Game Name")
    const nameWithoutYear = cleanName.replace(/\s+\d{4}$/, "").trim();

    console.log(
      `  Clean name: "${cleanName}", Without year: "${nameWithoutYear}"`,
    );

    // PRIORITY 1: Try year-filtered search first if we have release year
    if (releaseYear) {
      const startOfYear = Math.floor(new Date(`${releaseYear - 1}-01-01`).getTime() / 1000);
      const endOfYear = Math.floor(new Date(`${releaseYear + 1}-12-31`).getTime() / 1000);
      const dateFilter = `& first_release_date >= ${startOfYear} & first_release_date <= ${endOfYear}`;

      const query = `
          search "${nameWithoutYear}";
          fields id, name, cover.url, category, first_release_date, summary, total_rating_count, follows, total_rating, genres, game_modes;
          where category = (0,8,9,10,11) ${dateFilter};
          limit 10;
        `;
      console.log(`  Year-filtered query:`, query.replace(/\s+/g, " ").trim());

      const nameResponse = await fetch("https://api.igdb.com/v4/games", {
        method: "POST",
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID!,
          Authorization: `Bearer ${token}`,
          "Content-Type": "text/plain",
        },
        body: query,
      });

      const nameResults = await nameResponse.json();
      console.log(
        `  Year-filtered results (${Array.isArray(nameResults) ? nameResults.length : 0}):`,
        Array.isArray(nameResults)
          ? nameResults.map((g: any) => g.name)
          : nameResults,
      );

      if (nameResults && Array.isArray(nameResults) && nameResults.length > 0) {
        const match = findBestMatch(nameResults, nameWithoutYear, cleanName, releaseYear);
        if (match) {
          console.log(`  -> Selected (year-filtered): "${match.name}"`);
          return match;
        }
      }
    }

    // PRIORITY 2: Search API (works well for most games)
    const query = `
        search "${cleanName}";
        fields id, name, cover.url, category, first_release_date, summary, total_rating_count, follows, total_rating, genres, game_modes;
        limit 10;
      `;
    console.log(`  Search query:`, query.replace(/\s+/g, " ").trim());

    const nameResponse = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: query,
    });

    const nameResults = await nameResponse.json();
    console.log(
      `  Search results (${Array.isArray(nameResults) ? nameResults.length : 0}):`,
      Array.isArray(nameResults)
        ? nameResults.map((g: any) => `${g.name} (cat:${g.category})`)
        : nameResults,
    );

    if (nameResults && Array.isArray(nameResults) && nameResults.length > 0) {
      // Filter out bundles, packs, editions, DLC, etc. using keyword filtering
      const filtered = nameResults.filter((g: any) => !isNonBaseGame(g.name));
      console.log(
        `  After keyword filter (${filtered.length}):`,
        filtered.map((g: any) => g.name),
      );

      if (filtered.length > 0) {
        const match = findBestMatch(filtered, nameWithoutYear, cleanName, releaseYear);
        if (match) {
          console.log(`  -> Selected (search): "${match.name}"`);
          return match;
        }
      }
    }

    // PRIORITY 3: Exact name match (case-insensitive) - backup for games like "THE FINALS"
    const exactQuery = `
        fields id, name, cover.url, category, first_release_date, summary, total_rating_count, follows, total_rating, genres, game_modes;
        where name ~ *"${cleanName}"*;
        limit 10;
      `;
    console.log(`  Exact name query:`, exactQuery.replace(/\s+/g, " ").trim());

    const exactResponse = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: exactQuery,
    });

    const exactResults = await exactResponse.json();
    console.log(
      `  Exact name results (${Array.isArray(exactResults) ? exactResults.length : 0}):`,
      Array.isArray(exactResults)
        ? exactResults.map((g: any) => g.name)
        : exactResults,
    );

    if (exactResults && Array.isArray(exactResults) && exactResults.length > 0) {
      const filtered = exactResults.filter((g: any) => !isNonBaseGame(g.name));
      if (filtered.length > 0) {
        const match = findBestMatch(filtered, nameWithoutYear, cleanName, releaseYear);
        if (match) {
          console.log(`  -> Selected (exact match): "${match.name}"`);
          return match;
        }
      }
    }

    // Fallback: Try stripping common suffixes (e.g., "Grand Theft Auto V Legacy" -> "Grand Theft Auto V")
    for (const suffix of STRIP_SUFFIXES) {
      if (cleanName.toLowerCase().endsWith(suffix)) {
        const strippedName = cleanName.slice(0, -suffix.length).trim();
        console.log(`  Trying stripped name: "${strippedName}"`);

        const strippedQuery = `
          search "${strippedName}";
          fields id, name, cover.url, first_release_date, summary, total_rating_count, follows, total_rating, genres, game_modes;
          limit 10;
        `;

        const strippedResponse = await fetch("https://api.igdb.com/v4/games", {
          method: "POST",
          headers: {
            "Client-ID": process.env.TWITCH_CLIENT_ID!,
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/plain",
          },
          body: strippedQuery,
        });

        const strippedResults = await strippedResponse.json();
        console.log(
          `  Stripped results (${Array.isArray(strippedResults) ? strippedResults.length : 0}):`,
          Array.isArray(strippedResults)
            ? strippedResults.map((g: any) => g.name)
            : strippedResults,
        );

        if (
          strippedResults &&
          Array.isArray(strippedResults) &&
          strippedResults.length > 0
        ) {
          // Filter out bundles/packs/editions
          const filteredStripped = strippedResults.filter(
            (g: any) => !isNonBaseGame(g.name),
          );
          if (filteredStripped.length > 0) {
            const match = findBestMatch(
              filteredStripped,
              strippedName,
              strippedName,
              releaseYear,
            );
            if (match) {
              console.log(`  -> Selected (from stripped): "${match.name}"`);
              return match;
            }
          }
        }
        break; // Only try one suffix strip
      }
    }

    // Fallback: Try stripping trailing sequel numbers (e.g., "Overwatch 2" -> "Overwatch")
    // This helps when IGDB uses year suffixes like "Overwatch (2023)" instead of "Overwatch 2"
    const sequelMatch = cleanName.match(/^(.+?)\s+(\d+|II|III|IV|V|VI|VII|VIII|IX|X)$/i);
    if (sequelMatch) {
      const baseName = sequelMatch[1].trim();
      console.log(`  Trying without sequel number: "${baseName}"`);

      const baseQuery = `
        search "${baseName}";
        fields id, name, cover.url, first_release_date, summary, total_rating_count, follows, total_rating, genres, game_modes;
        limit 10;
      `;

      const baseResponse = await fetch("https://api.igdb.com/v4/games", {
        method: "POST",
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID!,
          Authorization: `Bearer ${token}`,
          "Content-Type": "text/plain",
        },
        body: baseQuery,
      });

      const baseResults = await baseResponse.json();
      console.log(
        `  Base name results (${Array.isArray(baseResults) ? baseResults.length : 0}):`,
        Array.isArray(baseResults)
          ? baseResults.map((g: any) => {
              const year = g.first_release_date
                ? new Date(g.first_release_date * 1000).getFullYear()
                : "?";
              return `${g.name} (${year})`;
            })
          : baseResults,
      );

      if (baseResults && Array.isArray(baseResults) && baseResults.length > 0) {
        // Filter out bundles/packs/editions
        const filteredBase = baseResults.filter(
          (g: any) => !isNonBaseGame(g.name),
        );
        if (filteredBase.length > 0) {
          // Use findBestMatch which will use release year to pick the right version
          const match = findBestMatch(
            filteredBase,
            baseName,
            baseName,
            releaseYear,
          );
          if (match) {
            console.log(`  -> Selected (from base name): "${match.name}"`);
            return match;
          }
        }
      }
    }
  }

  console.log(`  -> NO MATCH FOUND`);
  return null;
}

// Keywords that indicate this is NOT a base game
const NON_BASE_GAME_KEYWORDS = [
  "bundle",
  "pack",
  "edition",
  "deluxe",
  "ultimate",
  "gold",
  "goty",
  "game of the year",
  "complete",
  "collection",
  "anthology",
  "trilogy",
  "season pass",
  "expansion",
  "dlc",
  "add-on",
  "addon",
  "upgrade",
  "starter",
  "premium",
  "founder",
  "legendary",
  "digital",
  "enhanced",
  "definitive",
  "remastered",
  "remake",
  "anniversary",
  "special",
  "limited",
  "collector",
  "invasion",
  "battle pass",
  ": season", // Matches "Game: Season 1", "Game: Season 2", etc.
];

// Check if a game name contains non-base-game keywords
export function isNonBaseGame(gameName: string): boolean {
  const lowerName = gameName.toLowerCase();
  return NON_BASE_GAME_KEYWORDS.some((keyword) => lowerName.includes(keyword));
}

// Suffixes to strip for fallback searches (Steam often renames games)
const STRIP_SUFFIXES = [
  " legacy",
  " enhanced",
  " classic",
  " original",
  " standard",
  " - legacy",
  " - enhanced",
  " - classic",
  " (legacy)",
  " (enhanced)",
];

function findBestMatch(
  results: any[],
  nameWithoutYear: string,
  originalName: string,
  releaseYear?: number,
): any | null {
  // Normalize function to handle colon variations (e.g., "Game: Subtitle" vs "Game Subtitle")
  const normalize = (name: string) =>
    name
      .toLowerCase()
      .replace(/:\s*/g, " ") // Replace colon+space with just space
      .replace(/\s+/g, " ") // Collapse multiple spaces
      .trim();

  // Strip "The " prefix for comparison (e.g., "The Planet Crafter" -> "Planet Crafter")
  const stripThe = (name: string) =>
    name.toLowerCase().replace(/^the\s+/i, "").trim();

  const lowerNameWithoutYear = nameWithoutYear.toLowerCase();
  const lowerOriginalName = originalName.toLowerCase();
  const normalizedOriginal = normalize(originalName);
  const normalizedWithoutYear = normalize(nameWithoutYear);
  const strippedOriginal = stripThe(originalName);
  const strippedWithoutYear = stripThe(nameWithoutYear);

  // Check if search term has a subtitle (contains ":" or " - ")
  const searchHasSubtitle = originalName.includes(":") || originalName.includes(" - ");

  // Score each result
  const scored = results.map((g: any) => {
    const gameName = g.name.toLowerCase();
    const normalizedGameName = normalize(g.name);
    const strippedGameName = stripThe(g.name);
    const gameHasSubtitle = g.name.includes(":") || g.name.includes(" - ");
    let score = 0;

    // EXACT match with original name - HIGHEST priority (e.g., "Among Us" === "Among Us")
    if (gameName === lowerOriginalName || normalizedGameName === normalizedOriginal) {
      score += 200;
    }
    // Exact match ignoring "The" prefix (e.g., "The Planet Crafter" matches "Planet Crafter")
    else if (strippedGameName === strippedOriginal || strippedGameName === strippedWithoutYear) {
      score += 190; // Almost as good as exact match
    }
    // Exact match without year (also check normalized)
    else if (gameName === lowerNameWithoutYear || normalizedGameName === normalizedWithoutYear) {
      score += 180;
    }
    // Game name starts with our search term (check both raw and normalized)
    else if (
      gameName.startsWith(lowerNameWithoutYear) ||
      normalizedGameName.startsWith(normalizedWithoutYear)
    ) {
      // Bonus for being close to exact length (base game vs "Game: Subtitle")
      const lengthDiff = normalizedGameName.length - normalizedWithoutYear.length;
      if (lengthDiff === 0) {
        score += 180;
      } else if (lengthDiff <= 3) {
        score += 120; // e.g., "Rust" vs "Rust."
      } else if (lengthDiff <= 10) {
        score += 80; // Short subtitle
      } else {
        score += 50; // Long subtitle - less likely to be base game
      }
    }
    // Game name ENDS with our search term (e.g., "Hollow Knight: Silksong" ends with "Silksong")
    else if (
      gameName.endsWith(lowerNameWithoutYear) ||
      normalizedGameName.endsWith(normalizedWithoutYear)
    ) {
      // This is likely the game but with a prefix like series name
      score += 70;
    }
    // Our search term starts with game name (e.g., searching "Overwatch 2" finds "Overwatch")
    else if (
      lowerNameWithoutYear.startsWith(gameName) ||
      normalizedWithoutYear.startsWith(normalizedGameName)
    ) {
      score += 40;
    }
    // Contains match in the middle (e.g., "The Wolf Among Us" contains "Among Us")
    else if (
      gameName.includes(lowerNameWithoutYear) ||
      normalizedGameName.includes(normalizedWithoutYear)
    ) {
      score += 20;
    }

    // Heavy penalty for non-base-game keywords (bundles, editions, DLC, etc.)
    if (isNonBaseGame(gameName)) {
      score -= 50;
    }

    // STRONG bonus for matching release year (Steam year matches IGDB year)
    if (releaseYear && g.first_release_date) {
      const gameYear = new Date(g.first_release_date * 1000).getFullYear();
      if (gameYear === releaseYear) {
        score += 60; // Strong bonus for exact year match
      } else if (Math.abs(gameYear - releaseYear) === 1) {
        score += 30; // Decent bonus for off-by-one (release date differences)
      } else if (Math.abs(gameYear - releaseYear) > 3) {
        score -= 30; // Penalty for year mismatch > 3 years
      }
    }

    // Penalty for names much longer than search term (likely not the base game)
    const lengthRatio = normalizedGameName.length / normalizedWithoutYear.length;
    if (lengthRatio > 2) {
      score -= 20; // e.g., "The Wolf Among Us" is 2x longer than "Among Us"
    } else if (lengthRatio > 1.5) {
      score -= 10;
    }

    // Penalty for games with subtitles when search doesn't have one
    // This helps "Planet Crafter" beat "The Planet Crafter: Toxicity"
    if (gameHasSubtitle && !searchHasSubtitle) {
      score -= 40;
    }

    // Popularity bonus - base games typically have more ratings/followers than DLC
    const popularity = (g.total_rating_count || 0) + (g.follows || 0);
    if (popularity > 1000) {
      score += 40; // Very popular game
    } else if (popularity > 100) {
      score += 25; // Moderately popular
    } else if (popularity > 10) {
      score += 10; // Some popularity
    }
    // Games with 0 popularity are likely DLC or obscure entries

    return { game: g, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Log top matches for debugging
  console.log(`IGDB matching for "${originalName}":`);
  scored.slice(0, 3).forEach((s, i) => {
    const pop = (s.game.total_rating_count || 0) + (s.game.follows || 0);
    console.log(`  ${i + 1}. "${s.game.name}" (score: ${s.score}, popularity: ${pop})`);
  });

  // Return best match if it has a reasonable score
  if (scored.length > 0 && scored[0].score >= 30) {
    return scored[0].game;
  }

  // Don't return a game that doesn't match well - this prevents importing wrong games
  console.log(`  -> No good match found (best score: ${scored[0]?.score ?? 0})`);
  return null;
}
