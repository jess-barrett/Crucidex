-- Reviews table for Crucidex (matches existing schema)
-- NOTE: This table already exists in the database. This file is for reference only.
-- Rating comes from user_games.rating, not from the review itself.

CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  contains_spoilers BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One review per user per game
  CONSTRAINT unique_user_game_review UNIQUE (user_id, game_id)
);
