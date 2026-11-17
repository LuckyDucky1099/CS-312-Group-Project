-- Jasper Careless - Phase 1: Database schema for Recipe Sharing Platform
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cuisine_tags (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS ingredients (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  id                SERIAL PRIMARY KEY,
  user_id           INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             VARCHAR(150) NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  instructions      TEXT NOT NULL,
  cuisine           VARCHAR(50)  NOT NULL,
  meal_type         VARCHAR(30)  NOT NULL,
  cook_time_minutes INT NOT NULL CHECK (cook_time_minutes > 0),
  difficulty        VARCHAR(10)  NOT NULL CHECK (difficulty IN ('Easy','Medium','Hard')),
  servings          INT NOT NULL DEFAULT 1,
  dietary_tags      TEXT[] NOT NULL DEFAULT '{}',
  image_url         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id        SERIAL PRIMARY KEY,
  recipe_id INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name      VARCHAR(100) NOT NULL,
  quantity  VARCHAR(50)  NOT NULL DEFAULT '',
  position  INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_recipes_title_lower ON recipes (LOWER(title));
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine     ON recipes (LOWER(cuisine));
CREATE INDEX IF NOT EXISTS idx_recipes_meal_type   ON recipes (LOWER(meal_type));
CREATE INDEX IF NOT EXISTS idx_ingredients_recipe  ON recipe_ingredients (recipe_id);