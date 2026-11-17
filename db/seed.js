// Brenden Cabrera - Phase 1: seed example recipes.
// Usage: npm run seed   (safe to re-run; only replaces the "seed_chef" user's recipes)
const fs = require('fs');
const path = require('path');
const pool = require('../server/db');
const recipes = require('./seed-data');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    await client.query('BEGIN');

    // Removing the seed user cascades to its recipes and ingredients.
    await client.query("DELETE FROM users WHERE username = 'seed_chef'");
    const { rows } = await client.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ('seed_chef', 'seed_chef@example.com', 'not-a-real-hash-login-disabled')
       RETURNING id`
    );
    const userId = rows[0].id;

    for (const r of recipes) {
      const inserted = await client.query(
        `INSERT INTO recipes (user_id, title, description, instructions, cuisine, meal_type,
                              cook_time_minutes, difficulty, dietary_tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [userId, r.title, r.description, r.steps.join('\n'), r.cuisine, r.meal_type,
         r.cook_time_minutes, r.difficulty, r.dietary_tags]
      );
      for (const [i, [name, quantity]] of r.ingredients.entries()) {
        await client.query(
          'INSERT INTO recipe_ingredients (recipe_id, name, quantity, position) VALUES ($1,$2,$3,$4)',
          [inserted.rows[0].id, name, quantity, i]
        );
      }
    }
    await client.query('COMMIT');
    console.log(`Seeded ${recipes.length} recipes.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
