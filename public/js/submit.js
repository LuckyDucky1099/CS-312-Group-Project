
const form = document.getElementById('recipe-form');
const statusMessage = document.getElementById('form-status');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');

  const ingredients = document.getElementById('ingredients').value
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);

  const instructions = document.getElementById('instructions').value
    .split(/\r?\n/)
    .map(step => step.trim())
    .filter(Boolean);

  const dietaryTags = Array.from(
    document.querySelectorAll('input[name="dietaryTags"]:checked')
  ).map(input => input.value);

  if (ingredients.length === 0 || instructions.length === 0) {
    statusMessage.textContent = 'Please enter ingredients and cooking instructions.';
    statusMessage.className = 'status error';
    return;
  }

  const photo = document.getElementById('photo').files[0];

  if (photo && !photo.type.startsWith('image/')) {
    statusMessage.textContent = 'Please select a valid image file.';
    statusMessage.className = 'status error';
    return;
  }

  const recipe = {
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    cuisine: document.getElementById('cuisine').value,
    meal_type: document.getElementById('mealType').value,
    ingredients,
    instructions: instructions.join('\n'),
    cook_time_minutes: Number(document.getElementById('cookTime').value),
    difficulty: document.getElementById('difficulty').value,
    servings: Number(document.getElementById('servings').value),
    dietary_tags: dietaryTags
  };

  submitButton.disabled = true;
  statusMessage.textContent = 'Submitting recipe...';
  statusMessage.className = 'status';

  try {
    const response = await fetch('/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(recipe)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.error || `Recipe submission failed (${response.status}).`
      );
    }

    statusMessage.textContent = 'Your recipe was submitted successfully!';
    statusMessage.className = 'status';
    form.reset();

  } catch (error) {
    statusMessage.textContent = error.message;
    statusMessage.className = 'status error';
  } finally {
    submitButton.disabled = false;
  }
});
