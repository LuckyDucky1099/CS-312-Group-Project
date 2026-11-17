// Brenden Cabrera - Phase 1: keyword search route (stored recipe titles)
// plus cuisine / meal-type filtering and a basic ingredient match.
const express = require('express');
const pool = require('../db');

const router = express.Router();
const MAX_TERM_LENGTH = 100;
const MAX_RESULTS = 50;

// Trim, cap the length, and treat empty / non-string values as "not provided".
function clean(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, MAX_TERM_LENGTH);
  return trimmed || null;
}

// Escape LIKE wildcards so a user typing "50%" or "_" searches for those characters.
const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&');
const contains = (s) => (s ? `%${escapeLike(s)}%` : null);

// GET /api/search?q=&ingredient=&cuisine=&mealType=
// Every parameter is optional; omitted ones are ignored.
router.get('/', async (req, res, next) => {
  try {
    const q = clean(req.query.q);
    const ingredient = clean(req.query.ingredient);
    const cuisine = clean(req.query.cuisine);
    const mealType = clean(req.query.mealType);

    const { rows } = await pool.query(
      `SELECT r.id, r.title, r.description, r.cuisine, r.meal_type,
              r.cook_time_minutes, r.difficulty, r.dietary_tags, r.image_url
         FROM recipes r
        WHERE ($1::text IS NULL OR r.title ILIKE $1)
          AND ($2::text IS NULL OR EXISTS (
                SELECT 1 FROM recipe_ingredients i
                 WHERE i.recipe_id = r.id AND i.name ILIKE $2))
          AND ($3::text IS NULL OR LOWER(r.cuisine)   = LOWER($3))
          AND ($4::text IS NULL OR LOWER(r.meal_type) = LOWER($4))
        ORDER BY r.created_at DESC, r.id DESC
        LIMIT ${MAX_RESULTS}`,
      [contains(q), contains(ingredient), cuisine, mealType]
    );

    res.json({ count: rows.length, results: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/search/filters -> options for the cuisine dropdown and meal-type chips
router.get('/filters', async (req, res, next) => {
  try {
    const [cuisines, mealTypes] = await Promise.all([
      pool.query('SELECT DISTINCT cuisine AS value FROM recipes ORDER BY cuisine'),
      pool.query('SELECT DISTINCT meal_type AS value FROM recipes ORDER BY meal_type'),
    ]);
    res.json({
      cuisines: cuisines.rows.map((r) => r.value),
      mealTypes: mealTypes.rows.map((r) => r.value),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
