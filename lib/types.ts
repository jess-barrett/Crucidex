// Centralized type definitions for Crucidex

export type PlayStatus =
  | "playing"
  | "played"
  | "completed"
  | "retired"
  | "shelved"
  | "abandoned"
  | "backlog"
  | "wishlist";

export interface UserGame {
  id: string;
  playtime_hours: number;
  rating: number | null;
  top_four_position: number | null;
  play_status: PlayStatus | null;
  added_at?: string;
  last_played_at?: string;
  games: {
    id: string;
    igdb_id: number;
    title: string;
    cover_url: string | null;
    igdb_rating: number | null;
    genres: number[] | null;
    game_modes: number[] | null;
  };
}

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Genre {
  id: number;
  name: string;
}
