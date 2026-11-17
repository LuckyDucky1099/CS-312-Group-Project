# RecipeShare combined integration copy

Built from GitHub main ZIP plus the magazine-style frontend ZIP. This is a separate review/test copy, not a push to GitHub.

- Main supplies Express, authentication, database schema, recipe creation, search routes, and recipe details.
- Magazine supplies homepage, submission, search layout, stylesheet, and frontend search filters.
- Fixed submission JavaScript location: public/js/submit.js (matching submit.html script tag).
- Converted submission ingredients into backend-compatible `{name, quantity}` objects; quantities are currently empty strings because the form accepts one ingredient per line.
- Added a consistent navigation bar to login, signup, and recipe details.
- Did not include .env, passwords, or node_modules.

## Local setup
1. Open this directory in a terminal and run `npm install`.
2. Configure PostgreSQL and copy `.env.example` to `.env`, setting correct DATABASE_URL and SESSION_SECRET.
3. Apply `db/schema.sql` to your database, then run `npm run seed` if available.
4. Run `npm start` and open http://localhost:3000.
5. Test signup/login, recipe submission, search, recipe details, and logout.

## Known limits
- Not verified end-to-end against a live PostgreSQL database in this environment.
- Photo selection validates file type but does not upload an image.
- Homepage example recipe cards are static and link to search, not individual recipe records.
- Recipe submission uses the first database user as fallback when not logged in, per Jasper's current backend.
- Confirm that cuisine/meal-type labels match the values in seeded or newly submitted recipes.
