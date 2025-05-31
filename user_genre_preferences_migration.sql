-- Add userGenrePreferences table to store user favorite genres
CREATE TABLE user_genre_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  genre_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, genre_id)
);

-- Create an index for faster lookups
CREATE INDEX idx_user_genre_preferences_user_id ON user_genre_preferences(user_id);
