-- Activity log for Crucidex
-- Records all user activity events via triggers — single source of truth for activity feeds

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,

  -- Event types:
  --   game_added, game_wishlisted, game_removed,
  --   rating_set, rating_changed, rating_cleared,
  --   status_changed,
  --   hours_updated,
  --   review_created, review_updated
  event_type TEXT NOT NULL,

  -- Flexible metadata for rendering the activity
  -- e.g. { "rating": 4, "old_rating": null, "status": "completed", "old_status": "playing", "hours": 120, "old_hours": 80 }
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_game ON activity_log(game_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(event_type);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Anyone can view activity (public feeds)
CREATE POLICY "Anyone can view activity"
  ON activity_log FOR SELECT USING (true);

-- Only the system (via triggers) inserts — use SECURITY DEFINER on functions
-- But also allow direct inserts from authenticated users (for edge cases)
CREATE POLICY "Users can insert own activity"
  ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- Trigger: user_games INSERT
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_user_game_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.play_status = 'wishlist' THEN
    INSERT INTO activity_log (user_id, game_id, event_type, metadata)
    VALUES (NEW.user_id, NEW.game_id, 'game_wishlisted', '{}');
  ELSE
    -- Log the game addition
    INSERT INTO activity_log (user_id, game_id, event_type, metadata)
    VALUES (
      NEW.user_id, NEW.game_id, 'game_added',
      jsonb_build_object(
        'hours', COALESCE(NEW.playtime_hours, 0),
        'rating', NEW.rating,
        'status', NEW.play_status
      )
    );

    -- Rating is already captured in the game_added metadata above,
    -- so no separate rating_set event needed on INSERT.
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_user_game_insert
AFTER INSERT ON user_games
FOR EACH ROW EXECUTE FUNCTION log_user_game_insert();

-- ──────────────────────────────────────────────
-- Trigger: user_games UPDATE
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_user_game_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Rating changed
  IF OLD.rating IS DISTINCT FROM NEW.rating THEN
    IF OLD.rating IS NULL AND NEW.rating IS NOT NULL THEN
      INSERT INTO activity_log (user_id, game_id, event_type, metadata)
      VALUES (
        NEW.user_id, NEW.game_id, 'rating_set',
        jsonb_build_object('rating', NEW.rating)
      );
    ELSIF NEW.rating IS NULL THEN
      INSERT INTO activity_log (user_id, game_id, event_type, metadata)
      VALUES (
        NEW.user_id, NEW.game_id, 'rating_cleared',
        jsonb_build_object('old_rating', OLD.rating)
      );
    ELSE
      INSERT INTO activity_log (user_id, game_id, event_type, metadata)
      VALUES (
        NEW.user_id, NEW.game_id, 'rating_changed',
        jsonb_build_object('rating', NEW.rating, 'old_rating', OLD.rating)
      );
    END IF;
  END IF;

  -- Status changed
  IF OLD.play_status IS DISTINCT FROM NEW.play_status THEN
    INSERT INTO activity_log (user_id, game_id, event_type, metadata)
    VALUES (
      NEW.user_id, NEW.game_id, 'status_changed',
      jsonb_build_object('status', NEW.play_status, 'old_status', OLD.play_status)
    );
  END IF;

  -- Hours updated (only if meaningfully different — at least 1 hour change)
  IF NEW.playtime_hours IS DISTINCT FROM OLD.playtime_hours
     AND ABS(COALESCE(NEW.playtime_hours, 0) - COALESCE(OLD.playtime_hours, 0)) >= 1 THEN
    INSERT INTO activity_log (user_id, game_id, event_type, metadata)
    VALUES (
      NEW.user_id, NEW.game_id, 'hours_updated',
      jsonb_build_object('hours', NEW.playtime_hours, 'old_hours', OLD.playtime_hours)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_user_game_update
AFTER UPDATE ON user_games
FOR EACH ROW EXECUTE FUNCTION log_user_game_update();

-- ──────────────────────────────────────────────
-- Trigger: user_games DELETE
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_user_game_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_log (user_id, game_id, event_type, metadata)
  VALUES (
    OLD.user_id, OLD.game_id, 'game_removed',
    jsonb_build_object('status', OLD.play_status)
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_user_game_delete
AFTER DELETE ON user_games
FOR EACH ROW EXECUTE FUNCTION log_user_game_delete();

-- ──────────────────────────────────────────────
-- Trigger: reviews INSERT
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_review_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_log (user_id, game_id, review_id, event_type, metadata)
  VALUES (
    NEW.user_id, NEW.game_id, NEW.id, 'review_created',
    '{}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_review_insert
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION log_review_insert();

-- ──────────────────────────────────────────────
-- Trigger: reviews UPDATE
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_review_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_log (user_id, game_id, review_id, event_type, metadata)
  VALUES (
    NEW.user_id, NEW.game_id, NEW.id, 'review_updated',
    '{}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_review_update
AFTER UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION log_review_update();

-- ──────────────────────────────────────────────
-- Backfill: seed activity_log from existing data
-- Run once after creating the table and triggers
-- ──────────────────────────────────────────────

-- Backfill game additions
INSERT INTO activity_log (user_id, game_id, event_type, metadata, created_at)
SELECT
  ug.user_id,
  ug.game_id,
  CASE WHEN ug.play_status = 'wishlist' THEN 'game_wishlisted' ELSE 'game_added' END,
  CASE WHEN ug.play_status = 'wishlist' THEN '{}'::jsonb
  ELSE jsonb_build_object(
    'hours', COALESCE(ug.playtime_hours, 0),
    'rating', ug.rating,
    'status', ug.play_status
  ) END,
  ug.added_at
FROM user_games ug
WHERE NOT EXISTS (
  SELECT 1 FROM activity_log al
  WHERE al.user_id = ug.user_id AND al.game_id = ug.game_id
    AND al.event_type IN ('game_added', 'game_wishlisted')
);

-- Backfill reviews
INSERT INTO activity_log (user_id, game_id, review_id, event_type, metadata, created_at)
SELECT
  r.user_id,
  r.game_id,
  r.id,
  'review_created',
  jsonb_build_object('rating', r.rating),
  r.created_at
FROM reviews r
WHERE NOT EXISTS (
  SELECT 1 FROM activity_log al
  WHERE al.review_id = r.id AND al.event_type = 'review_created'
);
