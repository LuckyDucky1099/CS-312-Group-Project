// Brenden Cabrera & Jasper Careless - Phase 1: recipe list, create, and details routes.
const express = require('express');
const pool = require('../db');

const router = express.Router();
const MAX_INT4 = 2147483647;

// GET /api/recipes -> fetch all recipes for home page cards
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.title, r.description, r.cuisine, r.meal_type,
              r.cook_time_minutes, r.difficulty, r.dietary_tags, r.image_url,
              r.created_at, u.username AS author
         FROM recipes r
         JOIN users u ON u.id = r.user_id
        ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/recipes -> create a new recipe with required-field validation
router.post('/', async (req, res, next) => {
  try {
    const {
      title,
      description,
      instructions,
      cuisine,
      meal_type,
      cook_time_minutes,
      difficulty,
      servings,
      dietary_tags,
      image_url,
      ingredients,
    } = req.body;

    // Required-field validation
    if (
      !title ||
      !instructions ||
      !cuisine ||
      !meal_type ||
      !cook_time_minutes ||
      !difficulty ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0
    ) {
      return res.status(400).json({ error: 'All required fields must be filled out.' });
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Difficulty must be Easy, Medium, or Hard.' });
    }

    const cookTime = Number(cook_time_minutes);
    if (!Number.isInteger(cookTime) || cookTime <= 0) {
      return res.status(400).json({ error: 'Cook time must be a positive number.' });
    }

    // Use logged-in user, or default to seed_chef during Phase 1 testing
    let userId = req.session && req.session.userId;
    if (!userId) {
      const fallback = await pool.query('SELECT id FROM users LIMIT 1');
      if (fallback.rows.length === 0) {
        return res.status(400).json({ error: 'No user found. Please sign up or run npm run seed.' });
      }
      userId = fallback.rows[0].id;
    }

    const formattedInstructions = Array.isArray(instructions)
      ? instructions.join('\n')
      : String(instructions);

    const recipeResult = await pool.query(
      `INSERT INTO recipes
         (user_id, title, description, instructions, cuisine, meal_type,
          cook_time_minutes, difficulty, servings, dietary_tags, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        userId,
        title.trim(),
        description ? description.trim() : '',
        formattedInstructions,
        cuisine.trim(),
        meal_type.trim(),
        cookTime,
        difficulty,
        Number(servings) || 1,
        Array.isArray(dietary_tags) ? dietary_tags : [],
        image_url || null,
      ]
    );

    const newRecipe = recipeResult.rows[0];

    for (let i = 0; i < ingredients.length; i++) {
      const item = ingredients[i];
      if (!item.name) continue;
      await pool.query(
        'INSERT INTO recipe_ingredients (recipe_id, name, quantity, position) VALUES ($1, $2, $3, $4)',
        [newRecipe.id, item.name.trim(), item.quantity ? item.quantity.trim() : '', i]
      );
    }

    res.status(201).json(newRecipe);
  } catch (err) {
    next(err);
  }
});

// GET /api/recipes/:id -> recipe, ordered ingredients, and instructions split into steps
router.get('/:id', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid recipe id' });
    }
    const id = Number(req.params.id);
    if (id < 1 || id > MAX_INT4) return res.status(404).json({ error: 'Recipe not found' });

    const recipe = await pool.query(
      `SELECT r.id, r.title, r.description, r.instructions, r.cuisine, r.meal_type,
              r.cook_time_minutes, r.difficulty, r.dietary_tags, r.image_url,
              r.created_at, u.username AS author
         FROM recipes r JOIN users u ON u.id = r.user_id
        WHERE r.id = $1`,
      [id]
    );
    if (recipe.rows.length === 0) return res.status(404).json({ error: 'Recipe not found' });

    const ingredients = await pool.query(
      `SELECT name, quantity FROM recipe_ingredients
        WHERE recipe_id = $1 ORDER BY position, id`,
      [id]
    );

    const { instructions, ...rest } = recipe.rows[0];
    res.json({
      ...rest,
      ingredients: ingredients.rows,
      steps: instructions.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
