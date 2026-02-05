import { createServerComponentClient } from "@/lib/supabase-server";
import { getGameBySteamAppId } from "@/lib/igdb";
import { NextResponse } from "next/server";

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  rtime_last_played?: number; // Unix timestamp of last play
}

async function getSteamReleaseYear(appId: number): Promise<number | null> {
  try {
    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}`,
    );
    const data = await response.json();

    if (data[appId]?.success && data[appId]?.data?.release_date?.date) {
      const dateStr = data[appId].data.release_date.date;
      // Parse dates like "Oct 4, 2022" or "4 Oct, 2022" or "2022"
      const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        return parseInt(yearMatch[0], 10);
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST() {
  try {
    const supabase = await createServerComponentClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("steam_id")
      .eq("id", user.id)
      .single();

    if (!profile?.steam_id) {
      return NextResponse.json(
        { error: "Steam account not linked" },
        { status: 400 },
      );
    }

    const steamApiKey = process.env.STEAM_API_KEY;
    if (!steamApiKey) {
      return NextResponse.json(
        { error: "Steam API key not configured" },
        { status: 500 },
      );
    }

    const steamResponse = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steamApiKey}&steamid=${profile.steam_id}&include_appinfo=1&include_played_free_games=1`,
    );

    const steamData = await steamResponse.json();

    if (!steamData.response?.games) {
      return NextResponse.json(
        {
          error:
            "Could not fetch Steam library. Make sure your profile and game details are public.",
        },
        { status: 400 },
      );
    }

    const steamGames: SteamGame[] = steamData.response.games;
    const eligibleGames = steamGames.filter(
      (game) => game.playtime_forever >= 30,
    );

    console.log(`\n=== STEAM IMPORT STARTING ===`);
    console.log(`Total Steam games: ${steamGames.length}`);
    console.log(`Eligible (30+ min playtime): ${eligibleGames.length}`);

    const result = {
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      games: [] as { name: string; status: string; error?: string }[],
    };

    for (const steamGame of eligibleGames) {
      try {
        console.log(`\n--- Processing: "${steamGame.name}" (Steam ID: ${steamGame.appid}, ${Math.round(steamGame.playtime_forever / 60)} hrs) ---`);
        const hoursPlayed = Math.round(steamGame.playtime_forever / 60);

        let { data: existingGame } = await supabase
          .from("games")
          .select("id, title")
          .eq("steam_app_id", steamGame.appid)
          .maybeSingle();

        let gameId: string;

        if (existingGame) {
          console.log(`  -> Already in DB by Steam ID: "${existingGame.title}"`);
          gameId = existingGame.id;
        } else {
          const releaseYear = await getSteamReleaseYear(steamGame.appid);
          console.log(`  Steam release year: ${releaseYear ?? "unknown"}`);
          const igdbGame = await getGameBySteamAppId(
            steamGame.appid,
            steamGame.name,
            releaseYear ?? undefined,
          );

          if (igdbGame) {
            console.log(`  -> IGDB match: "${igdbGame.name}" (IGDB ID: ${igdbGame.id})`);
            const { data: existingByIgdb } = await supabase
              .from("games")
              .select("id")
              .eq("igdb_id", igdbGame.id)
              .maybeSingle();

            if (existingByIgdb) {
              console.log(`  -> Already in DB by IGDB ID, linking Steam ID`);
              gameId = existingByIgdb.id;
              // Update Steam ID and fill in missing metadata
              const updateData: Record<string, any> = { steam_app_id: steamGame.appid };
              if (igdbGame.summary) updateData.summary = igdbGame.summary;
              if (igdbGame.first_release_date) {
                updateData.release_date = new Date(igdbGame.first_release_date * 1000).toISOString().split("T")[0];
              }
              if (igdbGame.total_rating) updateData.igdb_rating = igdbGame.total_rating;
              if (igdbGame.genres) updateData.genres = igdbGame.genres;
              if (igdbGame.game_modes) updateData.game_modes = igdbGame.game_modes;
              await supabase
                .from("games")
                .update(updateData)
                .eq("id", gameId);
            } else {
              const coverUrl = igdbGame.cover?.url
                ? `https:${igdbGame.cover.url.replace("t_thumb", "t_cover_big")}`
                : null;

              // Convert IGDB timestamp (seconds) to ISO date string
              const releaseDate = igdbGame.first_release_date
                ? new Date(igdbGame.first_release_date * 1000).toISOString().split("T")[0]
                : null;

              const { data: newGame, error: insertError } = await supabase
                .from("games")
                .insert({
                  igdb_id: igdbGame.id,
                  title: igdbGame.name,
                  cover_url: coverUrl,
                  steam_app_id: steamGame.appid,
                  summary: igdbGame.summary || null,
                  release_date: releaseDate,
                  igdb_rating: igdbGame.total_rating || null,
                  genres: igdbGame.genres || null,
                  game_modes: igdbGame.game_modes || null,
                })
                .select()
                .single();

              if (insertError) {
                console.log(`  -> FAILED to insert game: ${insertError.message}`);
                result.failed++;
                result.games.push({
                  name: steamGame.name,
                  status: "failed",
                  error: insertError.message,
                });
                continue;
              }
              console.log(`  -> NEW game added to DB: "${newGame.title}"`);
              gameId = newGame.id;
            }
          } else {
            console.log(`  -> FAILED: No IGDB match found`);
            result.failed++;
            result.games.push({
              name: steamGame.name,
              status: "failed",
              error: "No IGDB match",
            });
            continue;
          }
        }

        const { data: existingUserGame } = await supabase
          .from("user_games")
          .select("id, playtime_hours")
          .eq("user_id", user.id)
          .eq("game_id", gameId)
          .maybeSingle();

        // Convert Steam's rtime_last_played (Unix timestamp) to ISO string
        const lastPlayedAt = steamGame.rtime_last_played
          ? new Date(steamGame.rtime_last_played * 1000).toISOString()
          : null;

        if (existingUserGame) {
          await supabase
            .from("user_games")
            .update({
              playtime_hours: hoursPlayed,
              last_played_at: lastPlayedAt,
            })
            .eq("id", existingUserGame.id);

          console.log(`  => UPDATED in library (${existingUserGame.playtime_hours} -> ${hoursPlayed} hrs)`);
          result.updated++;
          result.games.push({ name: steamGame.name, status: "updated" });
        } else {
          const { error: addError } = await supabase.from("user_games").insert({
            user_id: user.id,
            game_id: gameId,
            playtime_hours: hoursPlayed,
            last_played_at: lastPlayedAt,
          });

          if (addError) {
            console.log(`  => FAILED to add to library: ${addError.message}`);
            result.failed++;
            result.games.push({
              name: steamGame.name,
              status: "failed",
              error: addError.message,
            });
          } else {
            console.log(`  => IMPORTED to library`);
            result.imported++;
            result.games.push({ name: steamGame.name, status: "imported" });
          }
        }
      } catch (err: any) {
        console.log(`  => ERROR: ${err?.message}`);
        result.failed++;
        result.games.push({
          name: steamGame.name,
          status: "failed",
          error: err?.message,
        });
      }
    }

    console.log(`\n=== IMPORT COMPLETE ===`);
    console.log(`Total Steam games: ${steamGames.length}`);
    console.log(`Eligible (30+ min): ${eligibleGames.length}`);
    console.log(`Imported: ${result.imported}, Updated: ${result.updated}, Skipped: ${result.skipped}, Failed: ${result.failed}`);

    const failedGames = result.games.filter(g => g.status === "failed");
    if (failedGames.length > 0) {
      console.log(`\n=== FAILED GAMES (${failedGames.length}) ===`);
      failedGames.forEach(g => console.log(`  - ${g.name}`));
    }

    return NextResponse.json({
      success: true,
      totalSteamGames: steamGames.length,
      eligibleGames: eligibleGames.length,
      ...result,
    });
  } catch (error) {
    console.error("Steam import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
