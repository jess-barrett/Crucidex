-- =============================================================
-- CRUCIDEX SEED DATA
-- 15 fake users + 20 games for recommendation testing
--
-- Run this in the Supabase SQL editor.
-- All fake users have password: password
-- (bcrypt hash: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)
-- =============================================================

-- Game UUIDs:  00000000-0000-0000-0000-0000000000XX  (01-20)
-- User UUIDs:  00000000-0000-0000-0000-0000000001XX  (01-15)


-- ─────────────────────────────────────────────
-- 1. GAMES
-- ─────────────────────────────────────────────
INSERT INTO games (id, igdb_id, title, cover_url, igdb_rating, genres, game_modes)
VALUES
  ('00000000-0000-0000-0000-000000000001', 472,    'The Elder Scrolls V: Skyrim',   '//images.igdb.com/igdb/image/upload/t_cover_big/co1yww.jpg', 90, ARRAY[12,31],    ARRAY[1]),
  ('00000000-0000-0000-0000-000000000002', 11133,  'Dark Souls III',                '//images.igdb.com/igdb/image/upload/t_cover_big/co1vcf.jpg', 90, ARRAY[12,25],    ARRAY[1,2]),
  ('00000000-0000-0000-0000-000000000003', 119171, 'Baldur''s Gate 3',              '//images.igdb.com/igdb/image/upload/t_cover_big/co6li9.jpg', 97, ARRAY[12,31],    ARRAY[1,3]),
  ('00000000-0000-0000-0000-000000000004', 242408, 'Counter-Strike 2',              '//images.igdb.com/igdb/image/upload/t_cover_big/co6nic.jpg', 76, ARRAY[5],        ARRAY[2]),
  ('00000000-0000-0000-0000-000000000005', 114795, 'Apex Legends',                  '//images.igdb.com/igdb/image/upload/t_cover_big/co1wkb.jpg', 83, ARRAY[5],        ARRAY[6]),
  ('00000000-0000-0000-0000-000000000006', 126459, 'Valorant',                      '//images.igdb.com/igdb/image/upload/t_cover_big/co2mvt.jpg', 79, ARRAY[5],        ARRAY[2]),
  ('00000000-0000-0000-0000-000000000007', 1020,   'Grand Theft Auto V',            '//images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg', 92, ARRAY[31,32],    ARRAY[1,2]),
  ('00000000-0000-0000-0000-000000000008', 2963,   'Dota 2',                        '//images.igdb.com/igdb/image/upload/t_cover_big/co20l0.jpg', 82, ARRAY[11],       ARRAY[2]),
  ('00000000-0000-0000-0000-000000000009', 113112, 'Hades',                         '//images.igdb.com/igdb/image/upload/t_cover_big/co20p1.jpg', 94, ARRAY[25,32],    ARRAY[1]),
  ('00000000-0000-0000-0000-000000000010', 14593,  'Hollow Knight',                 '//images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.jpg', 92, ARRAY[25,32,9],  ARRAY[1]),
  ('00000000-0000-0000-0000-000000000011', 26226,  'Celeste',                       '//images.igdb.com/igdb/image/upload/t_cover_big/co6qid.jpg', 93, ARRAY[32,9],     ARRAY[1]),
  ('00000000-0000-0000-0000-000000000012', 17000,  'Stardew Valley',                '//images.igdb.com/igdb/image/upload/t_cover_big/co1sba.jpg', 90, ARRAY[13,32],    ARRAY[1,3]),
  ('00000000-0000-0000-0000-000000000013', 1879,   'Terraria',                      '//images.igdb.com/igdb/image/upload/t_cover_big/co1vyh.jpg', 88, ARRAY[31,32],    ARRAY[1,2,3]),
  ('00000000-0000-0000-0000-000000000014', 72,     'Portal 2',                      '//images.igdb.com/igdb/image/upload/t_cover_big/co1x7d.jpg', 95, ARRAY[9,5],      ARRAY[1,3]),
  ('00000000-0000-0000-0000-000000000015', 135400, 'Minecraft',                     '//images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg', 90, ARRAY[31,32,13], ARRAY[1,2,3]),
  ('00000000-0000-0000-0000-000000000016', 11198,  'Rocket League',                 '//images.igdb.com/igdb/image/upload/t_cover_big/co1tig.jpg', 86, ARRAY[14],       ARRAY[2,4]),
  ('00000000-0000-0000-0000-000000000017', 1942,   'The Witcher 3: Wild Hunt',      '//images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg', 94, ARRAY[12,31],    ARRAY[1]),
  ('00000000-0000-0000-0000-000000000018', 25076,  'Red Dead Redemption 2',         '//images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.jpg', 96, ARRAY[31],       ARRAY[1,2]),
  ('00000000-0000-0000-0000-000000000019', 1877,   'Cyberpunk 2077',                '//images.igdb.com/igdb/image/upload/t_cover_big/co4hna.jpg', 79, ARRAY[12,5,31],  ARRAY[1]),
  ('00000000-0000-0000-0000-000000000020', 119133, 'Elden Ring',                    '//images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg', 96, ARRAY[12,25,31], ARRAY[1,2])
ON CONFLICT (igdb_id) DO NOTHING;


-- ─────────────────────────────────────────────
-- 2. FAKE AUTH USERS
-- ─────────────────────────────────────────────
-- The handle_new_user() trigger auto-creates profiles from raw_user_meta_data.
-- We embed username and display_name there so the trigger has what it needs.
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change
)
VALUES
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000101','authenticated','authenticated','alex_seed@crucidex.test',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',now(),now(),now(),'{"provider":"email","providers":["email"]}','{"username":"alexgamer","display_name":"Alex"}',          false,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000102','authenticated','authenticated','blake_seed@crucidex.test',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',now(),now(),now(),'{"provider":"email","providers":["email"]}','{"username":"blake_plays","display_name":"Blake"}',       false,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000103','authenticated','authenticated','casey_seed@crucidex.test',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',now(),now(),now(),'{"provider":"email","providers":["email"]}','{"username":"casey_ctrl","display_name":"Casey"}',        false,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000104','authenticated','authenticated','dana_seed@crucidex.test',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',now(),now(),now(),'{"provider":"email","providers":["email"]}','{"username":"dana_quests","display_name":"Dana"}',        false,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000105','authenticated','authenticated','eli_seed@crucidex.test',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',now(),now(),now(),'{"provider":"email","providers":["email"]}','{"username":"eli_arcade","display_name":"Eli"}',          false,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000106','authenticated','authenticated','fiona_seed@crucidex.test',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',now(),now(),now(),'{"provider":"email","providers":["email"]}','{"username":"fiona_rpg","display_name":"Fiona"}',         false,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000107','authenticated','authenticated','gray_seed@crucidex.test',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',now(),now(),now(),'{"provider":"email","providers":["email"]}','{"username":"gray_fps","display_name":"Gray"}',           false,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000108','authenticated','authenticated','harper_seed@crucidex.test', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',now(),now(),now(),'{"provider":"email","providers":["email"]}','{"username":"harper_craft","display_name":"Harper"}',     false,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000109','authenticated','authenticated','iris_seed@crucidex.test',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',now(),now(),now(),'{"provider":"email","providers":["email"]}','{"username":"iris_indie","display_name":"Iris"}',         false,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000110','authenticated','authenticated','jordan_seed@crucidex.test', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',now(),now(),now(),'{"provider":"email","providers":["email"]}','{"username":"jordan_open","display_name":"Jordan"}',      false,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000111','authenticated','authenticated','kai_seed@crucidex.test',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',now(),now(),now(),'{"provider":"email","providers":["email"]}','{"username":"kai_moba","display_name":"Kai"}',            false,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000112','authenticated','authenticated','luna_seed@crucidex.test',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',now(),now(),now(),'{"provider":"email","providers":["email"]}','{"username":"luna_chill","display_name":"Luna"}',         false,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000113','authenticated','authenticated','morgan_seed@crucidex.test', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',now(),now(),now(),'{"provider":"email","providers":["email"]}','{"username":"morgan_multi","display_name":"Morgan"}',     false,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000114','authenticated','authenticated','noel_seed@crucidex.test',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',now(),now(),now(),'{"provider":"email","providers":["email"]}','{"username":"noel_rpg","display_name":"Noel"}',           false,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000115','authenticated','authenticated','olive_seed@crucidex.test',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',now(),now(),now(),'{"provider":"email","providers":["email"]}','{"username":"olive_souls","display_name":"Olive"}',       false,'','','','')
ON CONFLICT (id) DO NOTHING;

-- Profiles are auto-created by the handle_new_user() trigger above.
-- Update bio separately since the trigger doesn't set it.
UPDATE profiles SET bio = 'RPG addict, Souls enjoyer.'      WHERE id = '00000000-0000-0000-0000-000000000101';
UPDATE profiles SET bio = 'Indie and roguelite fanatic.'    WHERE id = '00000000-0000-0000-0000-000000000102';
UPDATE profiles SET bio = 'Competitive FPS main.'           WHERE id = '00000000-0000-0000-0000-000000000103';
UPDATE profiles SET bio = 'Story-driven games only.'        WHERE id = '00000000-0000-0000-0000-000000000104';
UPDATE profiles SET bio = 'Platformers and puzzles.'        WHERE id = '00000000-0000-0000-0000-000000000105';
UPDATE profiles SET bio = 'Fantasy RPG enthusiast.'         WHERE id = '00000000-0000-0000-0000-000000000106';
UPDATE profiles SET bio = 'FPS and battle royale.'          WHERE id = '00000000-0000-0000-0000-000000000107';
UPDATE profiles SET bio = 'Builder and survival games.'     WHERE id = '00000000-0000-0000-0000-000000000108';
UPDATE profiles SET bio = 'Indie games connoisseur.'        WHERE id = '00000000-0000-0000-0000-000000000109';
UPDATE profiles SET bio = 'Open world completionist.'       WHERE id = '00000000-0000-0000-0000-000000000110';
UPDATE profiles SET bio = 'MOBA player, 5000+ hours Dota.' WHERE id = '00000000-0000-0000-0000-000000000111';
UPDATE profiles SET bio = 'Cozy and farming games.'         WHERE id = '00000000-0000-0000-0000-000000000112';
UPDATE profiles SET bio = 'Multiplayer everything.'         WHERE id = '00000000-0000-0000-0000-000000000113';
UPDATE profiles SET bio = 'JRPG and western RPG lover.'     WHERE id = '00000000-0000-0000-0000-000000000114';
UPDATE profiles SET bio = 'Soulslike and action games.'     WHERE id = '00000000-0000-0000-0000-000000000115';


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. USER GAMES
-- Uses INSERT...SELECT to look up real game UUIDs by igdb_id.
-- This works regardless of whether games were pre-existing or just inserted above.
-- Ratings use 0.5–5 scale.
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: inserts one user_game row by looking up game_id from igdb_id
-- Usage: INSERT INTO user_games ... SELECT user_id, g.id, hours, rating, status FROM games g WHERE g.igdb_id = X

-- alex: RPG/Souls
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000101', id, 250, 4.5, 'completed' FROM games WHERE igdb_id = 472    ON CONFLICT (user_id, game_id) DO NOTHING; -- Skyrim
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000101', id, 180, 4.5, 'completed' FROM games WHERE igdb_id = 11133  ON CONFLICT (user_id, game_id) DO NOTHING; -- DS3
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000101', id, 200, 5.0, 'completed' FROM games WHERE igdb_id = 119171 ON CONFLICT (user_id, game_id) DO NOTHING; -- BG3
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000101', id, 320, 5.0, 'completed' FROM games WHERE igdb_id = 1942   ON CONFLICT (user_id, game_id) DO NOTHING; -- Witcher 3
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000101', id, 130, 4.5, 'playing'   FROM games WHERE igdb_id = 119133 ON CONFLICT (user_id, game_id) DO NOTHING; -- Elden Ring
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000101', id,  80, 3.5, 'played'    FROM games WHERE igdb_id = 1877   ON CONFLICT (user_id, game_id) DO NOTHING; -- Cyberpunk
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000101', id,  60, 4.0, 'completed' FROM games WHERE igdb_id = 113112 ON CONFLICT (user_id, game_id) DO NOTHING; -- Hades

-- blake: indie/roguelite
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000102', id, 120, 5.0, 'completed' FROM games WHERE igdb_id = 113112 ON CONFLICT (user_id, game_id) DO NOTHING; -- Hades
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000102', id,  90, 5.0, 'completed' FROM games WHERE igdb_id = 14593  ON CONFLICT (user_id, game_id) DO NOTHING; -- Hollow Knight
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000102', id,  50, 5.0, 'completed' FROM games WHERE igdb_id = 26226  ON CONFLICT (user_id, game_id) DO NOTHING; -- Celeste
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000102', id, 200, 4.5, 'completed' FROM games WHERE igdb_id = 17000  ON CONFLICT (user_id, game_id) DO NOTHING; -- Stardew Valley
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000102', id, 300, 4.5, 'playing'   FROM games WHERE igdb_id = 1879   ON CONFLICT (user_id, game_id) DO NOTHING; -- Terraria
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000102', id, 400, 4.0, 'played'    FROM games WHERE igdb_id = 135400 ON CONFLICT (user_id, game_id) DO NOTHING; -- Minecraft
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000102', id,  30, 5.0, 'completed' FROM games WHERE igdb_id = 72     ON CONFLICT (user_id, game_id) DO NOTHING; -- Portal 2

-- casey: competitive FPS
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000103', id, 800, 4.0, 'playing'   FROM games WHERE igdb_id = 242408 ON CONFLICT (user_id, game_id) DO NOTHING; -- CS2
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000103', id, 400, 4.0, 'playing'   FROM games WHERE igdb_id = 114795 ON CONFLICT (user_id, game_id) DO NOTHING; -- Apex
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000103', id, 600, 4.5, 'playing'   FROM games WHERE igdb_id = 126459 ON CONFLICT (user_id, game_id) DO NOTHING; -- Valorant
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000103', id, 150, 3.5, 'played'    FROM games WHERE igdb_id = 11198  ON CONFLICT (user_id, game_id) DO NOTHING; -- Rocket League
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000103', id, 100, 3.5, 'played'    FROM games WHERE igdb_id = 1020   ON CONFLICT (user_id, game_id) DO NOTHING; -- GTA V
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000103', id, 200, 3.0, 'shelved'   FROM games WHERE igdb_id = 2963   ON CONFLICT (user_id, game_id) DO NOTHING; -- Dota 2

-- dana: story/open world
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000104', id, 120, 5.0, 'completed' FROM games WHERE igdb_id = 25076  ON CONFLICT (user_id, game_id) DO NOTHING; -- RDR2
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000104', id, 280, 5.0, 'completed' FROM games WHERE igdb_id = 1942   ON CONFLICT (user_id, game_id) DO NOTHING; -- Witcher 3
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000104', id, 180, 5.0, 'completed' FROM games WHERE igdb_id = 119171 ON CONFLICT (user_id, game_id) DO NOTHING; -- BG3
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000104', id, 140, 4.0, 'completed' FROM games WHERE igdb_id = 1877   ON CONFLICT (user_id, game_id) DO NOTHING; -- Cyberpunk
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000104', id,  80, 3.5, 'played'    FROM games WHERE igdb_id = 1020   ON CONFLICT (user_id, game_id) DO NOTHING; -- GTA V
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000104', id, 160, 4.5, 'completed' FROM games WHERE igdb_id = 472    ON CONFLICT (user_id, game_id) DO NOTHING; -- Skyrim

-- eli: platformers/puzzles
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000105', id,  45, 5.0, 'completed' FROM games WHERE igdb_id = 26226  ON CONFLICT (user_id, game_id) DO NOTHING; -- Celeste
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000105', id,  80, 5.0, 'completed' FROM games WHERE igdb_id = 14593  ON CONFLICT (user_id, game_id) DO NOTHING; -- Hollow Knight
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000105', id,  25, 5.0, 'completed' FROM games WHERE igdb_id = 72     ON CONFLICT (user_id, game_id) DO NOTHING; -- Portal 2
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000105', id,  70, 4.5, 'completed' FROM games WHERE igdb_id = 113112 ON CONFLICT (user_id, game_id) DO NOTHING; -- Hades
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000105', id, 100, 4.0, 'played'    FROM games WHERE igdb_id = 17000  ON CONFLICT (user_id, game_id) DO NOTHING; -- Stardew Valley
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000105', id, 200, 4.0, 'playing'   FROM games WHERE igdb_id = 135400 ON CONFLICT (user_id, game_id) DO NOTHING; -- Minecraft

-- fiona: fantasy RPG
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000106', id, 350, 5.0, 'playing'   FROM games WHERE igdb_id = 119171 ON CONFLICT (user_id, game_id) DO NOTHING; -- BG3
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000106', id, 400, 5.0, 'completed' FROM games WHERE igdb_id = 1942   ON CONFLICT (user_id, game_id) DO NOTHING; -- Witcher 3
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000106', id, 300, 4.5, 'completed' FROM games WHERE igdb_id = 472    ON CONFLICT (user_id, game_id) DO NOTHING; -- Skyrim
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000106', id, 200, 4.5, 'playing'   FROM games WHERE igdb_id = 119133 ON CONFLICT (user_id, game_id) DO NOTHING; -- Elden Ring
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000106', id, 150, 4.0, 'completed' FROM games WHERE igdb_id = 11133  ON CONFLICT (user_id, game_id) DO NOTHING; -- DS3
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000106', id,  90, 3.5, 'played'    FROM games WHERE igdb_id = 1877   ON CONFLICT (user_id, game_id) DO NOTHING; -- Cyberpunk

-- gray: FPS/battle royale
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000107', id, 700, 4.5, 'playing'   FROM games WHERE igdb_id = 114795 ON CONFLICT (user_id, game_id) DO NOTHING; -- Apex
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000107', id, 500, 4.5, 'playing'   FROM games WHERE igdb_id = 126459 ON CONFLICT (user_id, game_id) DO NOTHING; -- Valorant
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000107', id, 600, 4.0, 'playing'   FROM games WHERE igdb_id = 242408 ON CONFLICT (user_id, game_id) DO NOTHING; -- CS2
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000107', id, 250, 4.0, 'played'    FROM games WHERE igdb_id = 11198  ON CONFLICT (user_id, game_id) DO NOTHING; -- Rocket League
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000107', id, 120, 3.5, 'played'    FROM games WHERE igdb_id = 1020   ON CONFLICT (user_id, game_id) DO NOTHING; -- GTA V
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000107', id,  60, 4.0, 'played'    FROM games WHERE igdb_id = 25076  ON CONFLICT (user_id, game_id) DO NOTHING; -- RDR2

-- harper: builder/survival
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000108', id, 2000, 5.0, 'playing'  FROM games WHERE igdb_id = 135400 ON CONFLICT (user_id, game_id) DO NOTHING; -- Minecraft
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000108', id,  800, 5.0, 'playing'  FROM games WHERE igdb_id = 1879   ON CONFLICT (user_id, game_id) DO NOTHING; -- Terraria
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000108', id,  600, 4.5, 'playing'  FROM games WHERE igdb_id = 17000  ON CONFLICT (user_id, game_id) DO NOTHING; -- Stardew Valley
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000108', id,  200, 4.0, 'played'   FROM games WHERE igdb_id = 11198  ON CONFLICT (user_id, game_id) DO NOTHING; -- Rocket League
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000108', id,  150, 3.5, 'played'   FROM games WHERE igdb_id = 1020   ON CONFLICT (user_id, game_id) DO NOTHING; -- GTA V
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000108', id,   20, 5.0, 'completed' FROM games WHERE igdb_id = 72    ON CONFLICT (user_id, game_id) DO NOTHING; -- Portal 2

-- iris: all-around indie
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000109', id, 100, 5.0, 'completed' FROM games WHERE igdb_id = 113112 ON CONFLICT (user_id, game_id) DO NOTHING; -- Hades
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000109', id,  70, 5.0, 'completed' FROM games WHERE igdb_id = 14593  ON CONFLICT (user_id, game_id) DO NOTHING; -- Hollow Knight
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000109', id,  40, 5.0, 'completed' FROM games WHERE igdb_id = 26226  ON CONFLICT (user_id, game_id) DO NOTHING; -- Celeste
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000109', id, 180, 4.5, 'played'    FROM games WHERE igdb_id = 17000  ON CONFLICT (user_id, game_id) DO NOTHING; -- Stardew Valley
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000109', id, 250, 4.5, 'playing'   FROM games WHERE igdb_id = 1879   ON CONFLICT (user_id, game_id) DO NOTHING; -- Terraria
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000109', id,  25, 5.0, 'completed' FROM games WHERE igdb_id = 72     ON CONFLICT (user_id, game_id) DO NOTHING; -- Portal 2
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000109', id, 300, 4.0, 'played'    FROM games WHERE igdb_id = 135400 ON CONFLICT (user_id, game_id) DO NOTHING; -- Minecraft

-- jordan: open world completionist
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000110', id, 200, 5.0, 'completed' FROM games WHERE igdb_id = 25076  ON CONFLICT (user_id, game_id) DO NOTHING; -- RDR2
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000110', id, 500, 4.5, 'completed' FROM games WHERE igdb_id = 1020   ON CONFLICT (user_id, game_id) DO NOTHING; -- GTA V
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000110', id, 250, 5.0, 'completed' FROM games WHERE igdb_id = 1942   ON CONFLICT (user_id, game_id) DO NOTHING; -- Witcher 3
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000110', id, 160, 4.0, 'completed' FROM games WHERE igdb_id = 1877   ON CONFLICT (user_id, game_id) DO NOTHING; -- Cyberpunk
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000110', id, 200, 4.5, 'completed' FROM games WHERE igdb_id = 472    ON CONFLICT (user_id, game_id) DO NOTHING; -- Skyrim
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000110', id,  80, 4.0, 'playing'   FROM games WHERE igdb_id = 119133 ON CONFLICT (user_id, game_id) DO NOTHING; -- Elden Ring
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000110', id, 120, 4.5, 'playing'   FROM games WHERE igdb_id = 119171 ON CONFLICT (user_id, game_id) DO NOTHING; -- BG3

-- kai: MOBA/competitive
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000111', id, 5000, 5.0, 'playing'  FROM games WHERE igdb_id = 2963   ON CONFLICT (user_id, game_id) DO NOTHING; -- Dota 2
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000111', id,  300, 4.0, 'playing'  FROM games WHERE igdb_id = 126459 ON CONFLICT (user_id, game_id) DO NOTHING; -- Valorant
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000111', id,  400, 3.5, 'played'   FROM games WHERE igdb_id = 242408 ON CONFLICT (user_id, game_id) DO NOTHING; -- CS2
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000111', id,  200, 3.5, 'played'   FROM games WHERE igdb_id = 114795 ON CONFLICT (user_id, game_id) DO NOTHING; -- Apex
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000111', id,  100, 4.0, 'played'   FROM games WHERE igdb_id = 11198  ON CONFLICT (user_id, game_id) DO NOTHING; -- Rocket League

-- luna: cozy/farming
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000112', id, 900, 5.0, 'playing'   FROM games WHERE igdb_id = 17000  ON CONFLICT (user_id, game_id) DO NOTHING; -- Stardew Valley
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000112', id, 400, 4.5, 'played'    FROM games WHERE igdb_id = 1879   ON CONFLICT (user_id, game_id) DO NOTHING; -- Terraria
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000112', id, 600, 4.5, 'playing'   FROM games WHERE igdb_id = 135400 ON CONFLICT (user_id, game_id) DO NOTHING; -- Minecraft
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000112', id,  35, 4.5, 'completed' FROM games WHERE igdb_id = 26226  ON CONFLICT (user_id, game_id) DO NOTHING; -- Celeste
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000112', id,  50, 4.0, 'played'    FROM games WHERE igdb_id = 113112 ON CONFLICT (user_id, game_id) DO NOTHING; -- Hades

-- morgan: multiplayer everything
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000113', id, 1000, 4.5, 'playing'  FROM games WHERE igdb_id = 242408 ON CONFLICT (user_id, game_id) DO NOTHING; -- CS2
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000113', id,  500, 4.5, 'playing'  FROM games WHERE igdb_id = 114795 ON CONFLICT (user_id, game_id) DO NOTHING; -- Apex
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000113', id,  600, 5.0, 'playing'  FROM games WHERE igdb_id = 11198  ON CONFLICT (user_id, game_id) DO NOTHING; -- Rocket League
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000113', id,  300, 4.0, 'played'   FROM games WHERE igdb_id = 1020   ON CONFLICT (user_id, game_id) DO NOTHING; -- GTA V
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000113', id,  800, 4.5, 'playing'  FROM games WHERE igdb_id = 2963   ON CONFLICT (user_id, game_id) DO NOTHING; -- Dota 2
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000113', id,  500, 4.0, 'playing'  FROM games WHERE igdb_id = 135400 ON CONFLICT (user_id, game_id) DO NOTHING; -- Minecraft
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000113', id,  200, 4.0, 'played'   FROM games WHERE igdb_id = 1879   ON CONFLICT (user_id, game_id) DO NOTHING; -- Terraria

-- noel: RPG lover
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000114', id, 350, 5.0, 'completed' FROM games WHERE igdb_id = 1942   ON CONFLICT (user_id, game_id) DO NOTHING; -- Witcher 3
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000114', id, 250, 5.0, 'playing'   FROM games WHERE igdb_id = 119171 ON CONFLICT (user_id, game_id) DO NOTHING; -- BG3
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000114', id, 220, 4.5, 'completed' FROM games WHERE igdb_id = 472    ON CONFLICT (user_id, game_id) DO NOTHING; -- Skyrim
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000114', id, 100, 4.0, 'played'    FROM games WHERE igdb_id = 1877   ON CONFLICT (user_id, game_id) DO NOTHING; -- Cyberpunk
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000114', id, 150, 5.0, 'completed' FROM games WHERE igdb_id = 25076  ON CONFLICT (user_id, game_id) DO NOTHING; -- RDR2
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000114', id,  90, 4.5, 'playing'   FROM games WHERE igdb_id = 119133 ON CONFLICT (user_id, game_id) DO NOTHING; -- Elden Ring
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000114', id, 130, 4.5, 'completed' FROM games WHERE igdb_id = 11133  ON CONFLICT (user_id, game_id) DO NOTHING; -- DS3

-- olive: soulslike/action
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000115', id, 300, 5.0, 'completed' FROM games WHERE igdb_id = 119133 ON CONFLICT (user_id, game_id) DO NOTHING; -- Elden Ring
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000115', id, 250, 5.0, 'completed' FROM games WHERE igdb_id = 11133  ON CONFLICT (user_id, game_id) DO NOTHING; -- DS3
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000115', id,  90, 4.5, 'completed' FROM games WHERE igdb_id = 113112 ON CONFLICT (user_id, game_id) DO NOTHING; -- Hades
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000115', id, 100, 4.5, 'completed' FROM games WHERE igdb_id = 14593  ON CONFLICT (user_id, game_id) DO NOTHING; -- Hollow Knight
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000115', id, 180, 4.5, 'played'    FROM games WHERE igdb_id = 1942   ON CONFLICT (user_id, game_id) DO NOTHING; -- Witcher 3
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000115', id, 150, 4.0, 'completed' FROM games WHERE igdb_id = 472    ON CONFLICT (user_id, game_id) DO NOTHING; -- Skyrim
INSERT INTO user_games (user_id, game_id, playtime_hours, rating, play_status) SELECT '00000000-0000-0000-0000-000000000115', id, 100, 4.5, 'playing'   FROM games WHERE igdb_id = 119171 ON CONFLICT (user_id, game_id) DO NOTHING; -- BG3
