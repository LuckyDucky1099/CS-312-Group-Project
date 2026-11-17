
import { el, formatTime, mealClass, getJson } from './common.js';

const form = document.getElementById('search-form');
const cuisineSelect = document.getElementById('cuisine');
const mealTypeBox = document.getElementById('meal-types');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');

const defaultCuisines = [
  'American',
  'Italian',
  'Mexican',
  'Asian',
  'Mediterranean',
  'Indian',
  'Other'
];

const defaultMealTypes = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Dessert',
  'Snack'
];

let requestCounter = 0;

function selectedMealType() {
  const checked = form.querySelector('input[name="mealType"]:checked');
  return checked ? checked.value : '';
}

function currentParams() {
  const params = new URLSearchParams();

  const values = {
    q: form.elements.namedItem('q').value.trim(),
    ingredient: form.elements.namedItem('ingredient').value.trim(),
    cuisine: cuisineSelect.value,
    mealType: selectedMealType()
  };

  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }

  return params;
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function renderCard(recipe) {
  const tags = (recipe.dietary_tags || []).join(' · ');

  return el(
    'a',
    {
      class: 'card',
      href: `/recipe.html?id=${encodeURIComponent(recipe.id)}`
    },
    el(
      'div',
      {
        class: `thumb ${mealClass(recipe.meal_type)}`,
        'aria-hidden': 'true'
      },
      recipe.cuisine || ''
    ),
    el(
      'div',
      { class: 'card-body' },
      el('h2', {}, recipe.title),
      el('p', {}, recipe.description || ''),
      el(
        'div',
        { class: 'meta' },
        el('span', {}, recipe.meal_type || ''),
        el('span', {}, formatTime(recipe.cook_time_minutes)),
        el('span', {}, recipe.difficulty || '')
      ),
      tags ? el('div', { class: 'meta' }, tags) : null
    )
  );
}

async function runSearch() {
  const params = currentParams();
  const qs = params.toString();

  history.replaceState(
    null,
    '',
    qs ? `?${qs}` : location.pathname
  );

  const thisRequest = ++requestCounter;

  setStatus('Searching...');

  try {
    const data = await getJson(
      `/api/search${qs ? `?${qs}` : ''}`
    );

    if (thisRequest !== requestCounter) return;

    resultsEl.replaceChildren(
      ...data.results.map(renderCard)
    );

    if (data.count === 0) {
      setStatus(
        'No recipes match your search. Try fewer filters or a different keyword.'
      );
    } else {
      setStatus(
        `${data.count} recipe${data.count === 1 ? '' : 's'} found`
      );
    }
  } catch (error) {
    if (thisRequest !== requestCounter) return;

    resultsEl.replaceChildren();

    setStatus(
      'Could not load recipes. The database may not be connected yet.',
      true
    );
  }
}

function mealChip(value, label, checked = false) {
  return el(
    'label',
    { class: 'chip' },
    el('input', {
      type: 'radio',
      name: 'mealType',
      value,
      checked
    }),
    el('span', {}, label)
  );
}

function uniqueOptions(defaults, databaseOptions) {
  const options = [...defaults];

  for (const option of databaseOptions) {
    if (
      typeof option === 'string' &&
      option.trim() &&
      !options.some(
        existing =>
          existing.toLowerCase() === option.toLowerCase()
      )
    ) {
      options.push(option);
    }
  }

  return options;
}

function populateFilters(cuisines, mealTypes, initial) {
  const selectedCuisine = initial.get('cuisine') || '';
  const selectedMeal = initial.get('mealType') || '';

  const allCuisines = uniqueOptions(
    defaultCuisines,
    cuisines
  );

  const allMealTypes = uniqueOptions(
    defaultMealTypes,
    mealTypes
  );

  cuisineSelect.replaceChildren(
    el('option', { value: '' }, 'Any cuisine'),
    ...allCuisines.map(
      cuisine =>
        el('option', { value: cuisine }, cuisine)
    )
  );

  const matchingCuisine = allCuisines.find(
    cuisine =>
      cuisine.toLowerCase() === selectedCuisine.toLowerCase()
  );

  cuisineSelect.value = matchingCuisine || '';

  const matchingMeal = allMealTypes.find(
    meal =>
      meal.toLowerCase() === selectedMeal.toLowerCase()
  );

  mealTypeBox.replaceChildren(
    mealChip('', 'Any', !matchingMeal),
    ...allMealTypes.map(
      meal => mealChip(
        meal,
        meal,
        meal === matchingMeal
      )
    )
  );
}

async function init() {
  const initial = new URLSearchParams(location.search);

  form.elements.namedItem('q').value =
    initial.get('q') || '';

  form.elements.namedItem('ingredient').value =
    initial.get('ingredient') || '';

  // Show the filters immediately, even without a database.
  populateFilters([], [], initial);

  form.addEventListener('submit', event => {
    event.preventDefault();
    runSearch();
  });

  cuisineSelect.addEventListener('change', runSearch);
  mealTypeBox.addEventListener('change', runSearch);

  form.addEventListener('reset', () => {
    setTimeout(() => {
      const any = mealTypeBox.querySelector(
        'input[name="mealType"][value=""]'
      );

      if (any) any.checked = true;

      runSearch();
    }, 0);
  });

  // If the backend works, include any additional filter options.
  try {
    const filters = await getJson('/api/search/filters');

    populateFilters(
      Array.isArray(filters.cuisines) ? filters.cuisines : [],
      Array.isArray(filters.mealTypes) ? filters.mealTypes : [],
      new URLSearchParams(currentParams())
    );
  } catch (error) {
    // Keep the default filters visible.
    console.warn(
      'Database filters unavailable. Using default filter options.'
    );
  }

  runSearch();
}

init();
