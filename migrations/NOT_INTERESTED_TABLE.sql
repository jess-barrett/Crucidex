-- Not interested table for Crucidex
-- Tracks which recommended games a user has dismissed so they never show up again

CREATE TABLE IF NOT EXISTS recommendation_dismissals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  igdb_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_igdb_dismissal UNIQUE (user_id, igdb_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_dismissals_user
  ON recommendation_dismissals(user_id);

ALTER TABLE recommendation_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dismissals"
  ON recommendation_dismissals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can dismiss recommendations"
  ON recommendation_dismissals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can undo dismissals"
  ON recommendation_dismissals FOR DELETE
  USING (auth.uid() = user_id);
