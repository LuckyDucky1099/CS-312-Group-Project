// Brenden Cabrera - Phase 1: recipe details view.
import { el, formatTime, mealClass, getJson } from './common.js';

const root = document.getElementById('recipe');

function showMessage(text) {
  root.replaceChildren(el('p', { class: 'status', role: 'alert' }, text));
}

function render(r) {
  document.title = `${r.title} | Recipe Share`;
  root.replaceChildren(
    el('section', { class: 'recipe-head' },
      el('div', { class: `thumb ${mealClass(r.meal_type)}`, 'aria-hidden': 'true' }, `${r.cuisine} · ${r.meal_type}`),
      el('div', { class: 'recipe-head-body' },
        el('h1', {}, r.title),
        r.description ? el('p', { class: 'lede' }, r.description) : null,
        el('ul', { class: 'tags', 'aria-label': 'Recipe details' },
          el('li', { class: 'tag' }, r.cuisine),
          el('li', { class: 'tag' }, r.meal_type),
          el('li', { class: 'tag' }, `Cook time: ${formatTime(r.cook_time_minutes)}`),
          el('li', { class: 'tag' }, `Difficulty: ${r.difficulty}`),
          (r.dietary_tags || []).map((t) => el('li', { class: 'tag diet' }, t))),
        el('p', { class: 'meta', style: 'margin-top:.9rem' }, `Shared by ${r.author}`))),
    el('div', { class: 'recipe-body' },
      el('section', { class: 'panel' },
        el('h2', {}, 'Ingredients'),
        el('ul', { class: 'ingredients' },
          r.ingredients.map((i) => el('li', {}, el('span', {}, i.name), el('span', { class: 'qty' }, i.quantity))))),
      el('section', { class: 'panel' },
        el('h2', {}, 'Instructions'),
        el('ol', { class: 'steps' }, r.steps.map((s) => el('li', {}, s))))));
}

async function init() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id || !/^\d+$/.test(id)) return showMessage('No recipe was selected. Go back to search and pick one.');
  showMessage('Loading recipe…');
  try {
    render(await getJson(`/api/recipes/${id}`));
  } catch (err) {
    showMessage(err.status === 404 ? 'Sorry, that recipe could not be found.'
                                    : 'Could not load this recipe. Please try again.');
  }
}

init();
