-- Friendships table for Crucidex
-- Tracks friend requests and accepted friendships between users

CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate requests in either direction
  CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id),
  -- Prevent self-friending
  CONSTRAINT no_self_friend CHECK (requester_id <> addressee_id)
);

-- Index for fast lookups by either user
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Enable Row Level Security
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see friendships they are part of
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Policy: Logged-in users can send friend requests
CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

-- Policy: Addressee can update (accept/decline), requester can update (cancel)
CREATE POLICY "Users can update own friendships"
  ON friendships FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Policy: Either party can delete (unfriend / cancel request)
CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
