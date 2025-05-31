-- Create movie_tickets table
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