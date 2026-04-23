-- Backfill activity_log from existing data
-- Safe to run multiple times (uses WHERE NOT EXISTS)

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
  '{}'::jsonb,
  r.created_at
FROM reviews r
WHERE NOT EXISTS (
  SELECT 1 FROM activity_log al
  WHERE al.review_id = r.id AND al.event_type = 'review_created'
);
