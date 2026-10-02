CREATE TABLE IF NOT EXISTS sports (id text PRIMARY KEY, name text NOT NULL, description text NOT NULL, category text NOT NULL, image_url text NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS events (id text PRIMARY KEY, name text NOT NULL, sport text NOT NULL, description text NOT NULL, date timestamptz NOT NULL, location text NOT NULL, city text NOT NULL, state char(2) NOT NULL, category text NOT NULL, image_url text NOT NULL DEFAULT '', registration_url text NOT NULL DEFAULT '', is_demo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS athlete_stories (id text PRIMARY KEY, name text NOT NULL, sport text NOT NULL, title text NOT NULL, description text NOT NULL, image_url text NOT NULL DEFAULT '', is_demo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS participation_requests (id uuid PRIMARY KEY, name text NOT NULL, email text NOT NULL, type text NOT NULL, city text NOT NULL, message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());

ALTER TABLE athlete_stories ADD COLUMN IF NOT EXISTS source_name text NOT NULL DEFAULT '';
ALTER TABLE athlete_stories ADD COLUMN IF NOT EXISTS source_url text NOT NULL DEFAULT '';
ALTER TABLE athlete_stories ADD COLUMN IF NOT EXISTS source_checked_at text NOT NULL DEFAULT '';
