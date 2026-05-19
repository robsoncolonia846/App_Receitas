const STORAGE_KEY = "receitas-da-casa.v1";
const CLOUD_SAVE_DELAY_MS = 700;

const elements = {
  title: document.querySelector("#singleRecipeTitle"),
  content: document.querySelector("#singleRecipeContent")
};

const params = new URLSearchParams(window.location.search);
const recipeId = cleanText(params.get("id"));

let recipes = loadRecipes();
let cloudReady = false;
let cloudSaveTimer = 0;

setup();
render();
initCloudSync();

function setup() {
  elements.content.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const buttonRecipeId = cleanText(button.dataset.id);
    if (!buttonRecipeId || buttonRecipeId !== recipeId) {
      return;
    }

    if (button.dataset.action === "toggle-ingredient") {
      const itemIndex = Number.parseInt(button.dataset.index || "", 10);
      toggleIngredientCheck(buttonRecipeId, itemIndex);
      return;
    }

    if (button.dataset.action === "toggle-step") {
      const itemIndex = Number.parseInt(button.dataset.index || "", 10);
      toggleStepCheck(buttonRecipeId, itemIndex);
    }
  });
}

function render() {
  if (!recipeId) {
    elements.title.textContent = "Receita não encontrada";
    elements.content.innerHTML = '<p class="empty-state">Não encontramos o identificador da receita no link.</p>';
    return;
  }

  const recipe = recipes.find((item) => item.id === recipeId);
  if (!recipe) {
    elements.title.textContent = "Receita não encontrada";
    elements.content.innerHTML = '<p class="empty-state">Essa receita não existe mais no seu caderno.</p>';
    return;
  }

  document.title = `${recipe.name} | Receitas da Casa`;
  elements.title.textContent = recipe.name;
  elements.content.innerHTML = renderRecipeDetails(recipe);
}

function renderRecipeDetails(recipe) {
  const recipeSteps = getRecipeSteps(recipe);
  const checkedIngredients = Array.isArray(recipe.checkedIngredients) ? recipe.checkedIngredients : [];
  const checkedSteps = Array.isArray(recipe.checkedSteps) ? recipe.checkedSteps : [];

  const ingredientItems = recipe.ingredients.map((item, index) => {
    const isChecked = checkedIngredients.includes(index);
    return `
      <li class="check-item ${isChecked ? "is-checked" : ""}">
        <span>${escapeHtml(item)}</span>
        <button
          class="check-toggle"
          data-action="toggle-ingredient"
          data-id="${recipe.id}"
          data-index="${index}"
          type="button"
          aria-pressed="${isChecked ? "true" : "false"}"
          aria-label="${isChecked ? "Desmarcar ingrediente" : "Marcar ingrediente"}"
        >${isChecked ? "✓" : "○"}</button>
      </li>
    `;
  }).join("");

  const stepItems = recipeSteps.map((step, index) => {
    const isChecked = checkedSteps.includes(index);
    return `
      <li class="check-item ${isChecked ? "is-checked" : ""}">
        <span>${escapeHtml(step)}</span>
        <button
          class="check-toggle"
          data-action="toggle-step"
          data-id="${recipe.id}"
          data-index="${index}"
          type="button"
          aria-pressed="${isChecked ? "true" : "false"}"
          aria-label="${isChecked ? "Desmarcar etapa" : "Marcar etapa"}"
        >${isChecked ? "✓" : "○"}</button>
      </li>
    `;
  }).join("");

  const recipePhoto = cleanText(recipe.photo);
  const recipePhotoContent = recipePhoto
    ? `<img class="recipe-photo-preview" src="${escapeHtml(recipePhoto)}" alt="Foto da receita ${escapeHtml(recipe.name)}">`
    : '<div class="recipe-photo-placeholder">Sem foto</div>';

  const updatedLabel = formatDateTime(recipe.updatedAt || recipe.createdAt);
  const editHref = `index.html?edit=${encodeURIComponent(recipe.id)}`;

  return `
    <article class="recipe-card single-card">
      <div class="recipe-layout">
        <div class="recipe-main">
          <div class="single-title-row">
            <h3 class="recipe-title">${escapeHtml(recipe.name)}</h3>
            <a class="action-btn single-edit-btn" href="${editHref}">Editar</a>
          </div>
          <div class="recipe-meta">
            <span class="tag">${escapeHtml(recipe.category)}</span>
            ${recipe.favorite ? '<span class="tag favorite">Favorita</span>' : ""}
          </div>

          <div class="recipe-content single-recipe-content">
            <div>
              <h4>Ingredientes</h4>
              <ul class="check-list">${ingredientItems}</ul>
            </div>
            <div>
              <h4>Modo de preparo</h4>
              <ul class="check-list">${stepItems}</ul>
            </div>
          </div>

          <p class="recipe-updated">Atualizada em ${updatedLabel}</p>
        </div>

        <aside class="recipe-side">
          <div class="recipe-photo-row">
            <div class="recipe-photo-frame">${recipePhotoContent}</div>
          </div>
        </aside>
      </div>
    </article>
  `;
}

function toggleIngredientCheck(targetRecipeId, itemIndex) {
  if (!Number.isInteger(itemIndex) || itemIndex < 0) {
    return;
  }

  recipes = recipes.map((recipe) => {
    if (recipe.id !== targetRecipeId) {
      return recipe;
    }

    const source = Array.isArray(recipe.checkedIngredients) ? recipe.checkedIngredients : [];
    const hasIndex = source.includes(itemIndex);
    const nextChecked = hasIndex
      ? source.filter((index) => index !== itemIndex)
      : [...source, itemIndex].sort((a, b) => a - b);

    return {
      ...recipe,
      checkedIngredients: nextChecked,
      updatedAt: new Date().toISOString()
    };
  });

  saveRecipes();
  render();
}

function toggleStepCheck(targetRecipeId, itemIndex) {
  if (!Number.isInteger(itemIndex) || itemIndex < 0) {
    return;
  }

  recipes = recipes.map((recipe) => {
    if (recipe.id !== targetRecipeId) {
      return recipe;
    }

    const source = Array.isArray(recipe.checkedSteps) ? recipe.checkedSteps : [];
    const hasIndex = source.includes(itemIndex);
    const nextChecked = hasIndex
      ? source.filter((index) => index !== itemIndex)
      : [...source, itemIndex].sort((a, b) => a - b);

    return {
      ...recipe,
      checkedSteps: nextChecked,
      updatedAt: new Date().toISOString()
    };
  });

  saveRecipes();
  render();
}

function loadRecipes() {
  try {
    const serialized = window.localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return [];
    }

    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeRecipeList(parsed);
  } catch (error) {
    console.error("Não foi possível carregar as receitas:", error);
    return [];
  }
}

function saveRecipes() {
  saveRecipesLocal();
  queueCloudSave();
}

function saveRecipesLocal() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

async function initCloudSync() {
  if (!window.RecipeCloudStore?.isConfigured()) {
    return;
  }

  try {
    const cloudRecipes = normalizeRecipeList(await window.RecipeCloudStore.loadRecipes());
    if (cloudRecipes.length > 0) {
      recipes = cloudRecipes;
      saveRecipesLocal();
      render();
    } else if (recipes.length > 0) {
      await window.RecipeCloudStore.saveRecipes(recipes);
    }

    cloudReady = true;
    window.addEventListener("focus", refreshRecipesFromCloud);
  } catch (error) {
    console.error("Não foi possível conectar na nuvem:", error);
  }
}

async function refreshRecipesFromCloud() {
  if (!cloudReady || !window.RecipeCloudStore?.isConfigured()) {
    return;
  }

  try {
    const cloudRecipes = normalizeRecipeList(await window.RecipeCloudStore.loadRecipes());
    if (JSON.stringify(cloudRecipes) === JSON.stringify(recipes)) {
      return;
    }

    recipes = cloudRecipes;
    saveRecipesLocal();
    render();
  } catch (error) {
    console.error("Não foi possível atualizar da nuvem:", error);
  }
}

function queueCloudSave() {
  if (!cloudReady || !window.RecipeCloudStore?.isConfigured()) {
    return;
  }

  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(saveRecipesToCloud, CLOUD_SAVE_DELAY_MS);
}

async function saveRecipesToCloud() {
  try {
    await window.RecipeCloudStore.saveRecipes(recipes);
  } catch (error) {
    console.error("Não foi possível salvar na nuvem:", error);
  }
}

function normalizeRecipeList(recipeList) {
  if (!Array.isArray(recipeList)) {
    return [];
  }

  return recipeList
    .map((recipe) => sanitizeRecipe(recipe))
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt));
}

function sanitizeRecipe(recipe) {
  if (!recipe || typeof recipe !== "object") {
    return null;
  }

  const name = cleanText(recipe.name);
  const category = normalizeCategory(cleanText(recipe.category));
  const steps = getRecipeSteps(recipe);
  const photo = typeof recipe.photo === "string" && recipe.photo.startsWith("data:image/") ? recipe.photo : "";
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map((item) => cleanText(item)).filter(Boolean)
    : [];

  if (!name || !category || steps.length === 0 || ingredients.length === 0) {
    return null;
  }

  const checkedIngredients = normalizeCheckedIndexes(recipe.checkedIngredients, ingredients.length);
  const checkedSteps = normalizeCheckedIndexes(recipe.checkedSteps, steps.length);

  return {
    id: typeof recipe.id === "string" ? recipe.id : createId(),
    name,
    category,
    ingredients,
    steps,
    checkedIngredients,
    checkedSteps,
    favorite: Boolean(recipe.favorite),
    photo,
    createdAt: typeof recipe.createdAt === "string" ? recipe.createdAt : new Date().toISOString(),
    updatedAt: typeof recipe.updatedAt === "string" ? recipe.updatedAt : new Date().toISOString()
  };
}

function getRecipeSteps(recipe) {
  if (Array.isArray(recipe?.steps)) {
    return recipe.steps.map((item) => cleanText(item)).filter(Boolean);
  }

  return splitLines(recipe?.steps);
}

function splitLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter(Boolean);
}

function normalizeCheckedIndexes(values, maxLength) {
  if (!Array.isArray(values) || maxLength <= 0) {
    return [];
  }

  const uniqueIndexes = new Set();

  for (const value of values) {
    const numeric = Number.parseInt(String(value), 10);
    if (!Number.isInteger(numeric) || numeric < 0 || numeric >= maxLength) {
      continue;
    }
    uniqueIndexes.add(numeric);
  }

  return Array.from(uniqueIndexes).sort((a, b) => a - b);
}

function normalizeCategory(value) {
  if (!value) {
    return "Outras";
  }

  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
