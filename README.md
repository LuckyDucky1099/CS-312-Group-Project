# Recipe Sharing Platform (CS 312)

Community recipe site built with Node.js, Express, and PostgreSQL.

## Phase 1 status
| Area | Owner | Files |
|---|---|---|
| Search page, keyword search, cuisine / meal-type filters, seed data, recipe details view | Brenden Cabrera | `public/search.html`, `public/recipe.html`, `public/js/*`, `server/routes/search.js`, `server/routes/recipes.js`, `db/seed.js`, `db/seed-data.js` |
| Home page, recipe cards, submission form | Luey Diaz | `public/index.html` is a placeholder until merged |
| Database design, Express config, auth, recipe APIs | Jasper Careless | `db/schema.sql`, `server/db.js`, `server/index.js` are stand-ins until merged |

## Run locally
1. Install Node 18+ and PostgreSQL 14+.
2. Create the database:
   ```sql
   CREATE USER recipe_user WITH PASSWORD 'recipe_pass';
   CREATE DATABASE recipe_share OWNER recipe_user;
   ```
3. `cp .env.example .env` and adjust `DATABASE_URL` if needed.
4. `npm install`
5. `npm run seed` (creates tables and loads 10 example recipes; safe to re-run)
6. `npm start`, then open http://localhost:3000/search.html

## API (Brenden's routes)
- `GET /api/search?q=&ingredient=&cuisine=&mealType=` : all params optional, returns `{ count, results }`
- `GET /api/search/filters` : cuisines and meal types that exist in the database
- `GET /api/recipes/:id` : one recipe with ingredients and instruction steps (400 invalid id, 404 not found)
