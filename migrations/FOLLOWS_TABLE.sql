-- Follows table for Crucidex
-- One-way follow system (like Letterboxd)
-- User A can follow User B without B needing to accept

CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate follows
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
  -- Prevent self-follow
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Anyone can see follows
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT USING (true);

-- Users can follow others
CREATE POLICY "Users can follow"
  ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE USING (auth.uid() = follower_id);
