-- Create tables based on schema.ts
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  bio TEXT,
  profile_picture TEXT
);

CREATE TABLE IF NOT EXISTS movies (
  id SERIAL PRIMARY KEY,
  tmdb_id INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  release_year INTEGER,
  overview TEXT
);

CREATE TABLE IF NOT EXISTS watched_movies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  movie_id INTEGER NOT NULL,
  rating DOUBLE PRECISION,
  review TEXT,
  first_impressions TEXT,
  favorite BOOLEAN DEFAULT FALSE,
  watched_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  movie_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS followers (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL,
  followed_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movie_tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  movie_id INTEGER,
  movie_title TEXT NOT NULL,
  theater_name TEXT,
  theater_chain TEXT,
  show_time TEXT,
  show_date TEXT,
  price TEXT,
  seat_number TEXT,
  movie_rating TEXT,
  theater_room TEXT,
  ticket_number TEXT,
  raw_ocr_text TEXT,
  ticket_image_path TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create a test user (username: testuser, password: password)
INSERT INTO users (username, password_hash, email, full_name)
VALUES ('testuser', '$2b$10$MQpzlaMQpzla919SALT..hQxps1igPLhUH1uGW1QgAz.K2MxK3S6i', 'test@example.com', 'Test User')
ON CONFLICT (username) DO NOTHING;
