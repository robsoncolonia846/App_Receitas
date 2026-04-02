const STORAGE_KEY = "receitas-da-casa.v1";
const RECENT_WINDOW_DAYS = 7;

const elements = {
  form: document.querySelector("#recipeForm"),
  jumpToForm: document.querySelector("#jumpToForm"),
  submitRecipeBtn: document.querySelector("#submitRecipeBtn"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  exportJsonBtn: document.querySelector("#exportJsonBtn"),
  importJsonBtn: document.querySelector("#importJsonBtn"),
  importJsonInput: document.querySelector("#importJsonInput"),
  shareStatus: document.querySelector("#shareStatus"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  listCount: document.querySelector("#listCount"),
  recipeList: document.querySelector("#recipeList"),
  emptyState: document.querySelector("#emptyState"),
  stats: {
    all: document.querySelector("#statAll"),
    favorites: document.querySelector("#statFavorites"),
    recent: document.querySelector("#statRecent"),
    cafe: document.querySelector("#statCafe"),
    lanches: document.querySelector("#statLanches"),
    tortas: document.querySelector("#statTortas"),
    doces: document.querySelector("#statDoces"),
    jantar: document.querySelector("#statJantar")
  }
};

let recipes = loadRecipes();
let editingRecipeId = null;

setup();
render();

function setup() {
  elements.form.addEventListener("submit", onCreateRecipe);
  elements.cancelEditBtn.addEventListener("click", cancelEditing);
  elements.exportJsonBtn.addEventListener("click", exportRecipesAsJson);
  elements.importJsonBtn.addEventListener("click", () => elements.importJsonInput.click());
  elements.importJsonInput.addEventListener("change", importRecipesFromJson);
  elements.searchInput.addEventListener("input", render);
  elements.categoryFilter.addEventListener("change", render);
  elements.jumpToForm.addEventListener("click", () => {
    document.querySelector("#cadastro").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  elements.recipeList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const recipeId = button.dataset.id;
    if (!recipeId) {
      return;
    }

    if (button.dataset.action === "favorite") {
      toggleFavorite(recipeId);
      return;
    }

    if (button.dataset.action === "delete") {
      removeRecipe(recipeId);
      return;
    }

    if (button.dataset.action === "edit") {
      startEditing(recipeId);
    }
  });
}

function onCreateRecipe(event) {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const now = new Date().toISOString();

  const recipePayload = {
    name: cleanText(formData.get("name")),
    category: normalizeCategory(cleanText(formData.get("category"))),
    time: Number(formData.get("time")),
    servings: Number(formData.get("servings")),
    ingredients: splitLines(formData.get("ingredients")),
    steps: cleanText(formData.get("steps"))
  };

  if (!recipePayload.name || !recipePayload.category || !recipePayload.steps || recipePayload.ingredients.length === 0) {
    return;
  }

  if (editingRecipeId) {
    const targetRecipe = recipes.find((item) => item.id === editingRecipeId);
    if (!targetRecipe) {
      cancelEditing();
      setShareStatus("A receita que você estava editando não existe mais.", true);
      return;
    }

    recipes = recipes.map((recipe) => {
      if (recipe.id !== editingRecipeId) {
        return recipe;
      }

      return {
        ...recipe,
        ...recipePayload,
        updatedAt: now
      };
    });

    cancelEditing({ keepStatus: true });
    setShareStatus(`Receita "${recipePayload.name}" atualizada.`);
  } else {
    const recipe = {
      id: createId(),
      ...recipePayload,
      favorite: false,
      createdAt: now,
      updatedAt: now
    };

    recipes.unshift(recipe);
    elements.form.reset();
    setShareStatus(`Receita "${recipePayload.name}" salva.`);
  }

  saveRecipes();
  elements.searchInput.value = "";
  render();
}

function toggleFavorite(recipeId) {
  recipes = recipes.map((recipe) => {
    if (recipe.id !== recipeId) {
      return recipe;
    }

    return {
      ...recipe,
      favorite: !recipe.favorite,
      updatedAt: new Date().toISOString()
    };
  });

  saveRecipes();
  render();
}

function removeRecipe(recipeId) {
  const recipe = recipes.find((item) => item.id === recipeId);
  if (!recipe) {
    return;
  }

  const confirmed = window.confirm(`Remover a receita "${recipe.name}"?`);
  if (!confirmed) {
    return;
  }

  recipes = recipes.filter((item) => item.id !== recipeId);

  if (editingRecipeId === recipeId) {
    cancelEditing({ keepStatus: true });
  }

  saveRecipes();
  render();
}

function startEditing(recipeId) {
  const recipe = recipes.find((item) => item.id === recipeId);
  if (!recipe) {
    return;
  }

  editingRecipeId = recipeId;

  elements.form.elements.name.value = recipe.name;
  elements.form.elements.category.value = recipe.category;
  elements.form.elements.time.value = recipe.time;
  elements.form.elements.servings.value = recipe.servings;
  elements.form.elements.ingredients.value = recipe.ingredients.join("\n");
  elements.form.elements.steps.value = recipe.steps;

  elements.submitRecipeBtn.textContent = "Atualizar receita";
  elements.cancelEditBtn.hidden = false;
  setShareStatus(`Editando "${recipe.name}".`);

  document.querySelector("#cadastro").scrollIntoView({ behavior: "smooth", block: "start" });
  elements.form.elements.name.focus();
}

function cancelEditing(options = {}) {
  const { keepStatus = false } = options;

  editingRecipeId = null;
  elements.form.reset();
  elements.submitRecipeBtn.textContent = "Salvar receita";
  elements.cancelEditBtn.hidden = true;

  if (!keepStatus) {
    setShareStatus("Edição cancelada.");
  }
}

function exportRecipesAsJson() {
  const payload = {
    app: "Receitas da Casa",
    version: 1,
    exportedAt: new Date().toISOString(),
    recipes
  };

  const jsonContent = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const dateLabel = new Date().toISOString().slice(0, 10);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `receitas-da-casa-${dateLabel}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  setShareStatus(`JSON exportado com ${recipes.length} ${recipes.length === 1 ? "receita" : "receitas"}.`);
}

async function importRecipesFromJson(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const fileContent = await file.text();
    const parsed = JSON.parse(fileContent);
    const importedRecipes = extractRecipesFromJson(parsed)
      .map((recipe) => sanitizeRecipe(recipe))
      .filter(Boolean)
      .sort((a, b) => Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt));

    if (importedRecipes.length === 0) {
      setShareStatus("Arquivo JSON sem receitas válidas para importar.", true);
      return;
    }

    const confirmed = window.confirm(
      `Importar ${importedRecipes.length} ${importedRecipes.length === 1 ? "receita" : "receitas"} do arquivo "${file.name}"? Isso substitui a lista atual.`
    );

    if (!confirmed) {
      setShareStatus("Importação cancelada.");
      return;
    }

    cancelEditing({ keepStatus: true });
    recipes = importedRecipes;
    saveRecipes();
    render();
    setShareStatus(`Importação concluída: ${importedRecipes.length} ${importedRecipes.length === 1 ? "receita" : "receitas"} carregadas.`);
  } catch (error) {
    console.error("Falha ao importar JSON:", error);
    setShareStatus("Não foi possível importar esse arquivo JSON.", true);
  } finally {
    event.target.value = "";
  }
}

function render() {
  renderCategoryFilter();
  renderStats();

  const filteredRecipes = getFilteredRecipes();
  elements.listCount.textContent = `${filteredRecipes.length} ${filteredRecipes.length === 1 ? "item" : "itens"}`;

  elements.recipeList.innerHTML = filteredRecipes.map(renderRecipeCard).join("");
  elements.emptyState.style.display = filteredRecipes.length ? "none" : "block";
}

function renderStats() {
  const counters = {
    cafe: 0,
    lanches: 0,
    tortas: 0,
    doces: 0,
    jantar: 0
  };

  for (const recipe of recipes) {
    const categoryKey = mapCategory(recipe.category);
    if (categoryKey) {
      counters[categoryKey] += 1;
    }
  }

  elements.stats.all.textContent = String(recipes.length);
  elements.stats.favorites.textContent = String(recipes.filter((recipe) => recipe.favorite).length);
  elements.stats.recent.textContent = String(countRecentRecipes());
  elements.stats.cafe.textContent = String(counters.cafe);
  elements.stats.lanches.textContent = String(counters.lanches);
  elements.stats.tortas.textContent = String(counters.tortas);
  elements.stats.doces.textContent = String(counters.doces);
  elements.stats.jantar.textContent = String(counters.jantar);
}

function renderCategoryFilter() {
  const previousValue = elements.categoryFilter.value;
  const categories = Array.from(new Set(recipes.map((recipe) => recipe.category))).sort((a, b) =>
    a.localeCompare(b, "pt-BR", { sensitivity: "base" })
  );

  elements.categoryFilter.innerHTML = '<option value="">Todas as categorias</option>';

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.categoryFilter.append(option);
  });

  if (categories.includes(previousValue)) {
    elements.categoryFilter.value = previousValue;
  }
}

function getFilteredRecipes() {
  const searchTerm = simplifyText(elements.searchInput.value);
  const selectedCategory = elements.categoryFilter.value;

  return recipes.filter((recipe) => {
    const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
    const compositeText = simplifyText(`${recipe.name} ${recipe.category} ${recipe.ingredients.join(" ")}`);
    const matchesSearch = !searchTerm || compositeText.includes(searchTerm);

    return matchesCategory && matchesSearch;
  });
}

function renderRecipeCard(recipe) {
  const ingredientItems = recipe.ingredients.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const updatedLabel = formatDateTime(recipe.updatedAt || recipe.createdAt);

  return `
    <article class="recipe-card">
      <div class="recipe-top">
        <div>
          <h4 class="recipe-title">${escapeHtml(recipe.name)}</h4>
          <div class="recipe-meta">
            <span class="tag">${escapeHtml(recipe.category)}</span>
            <span class="tag">${recipe.time} min</span>
            <span class="tag">${recipe.servings} porções</span>
            ${recipe.favorite ? '<span class="tag favorite">Favorita</span>' : ""}
          </div>
        </div>
        <div class="recipe-actions">
          <button class="action-btn ${recipe.favorite ? "active" : ""}" data-action="favorite" data-id="${recipe.id}" type="button">
            ${recipe.favorite ? "★" : "☆"}
          </button>
          <button class="action-btn" data-action="edit" data-id="${recipe.id}" type="button">Editar</button>
          <button class="action-btn danger" data-action="delete" data-id="${recipe.id}" type="button">Excluir</button>
        </div>
      </div>

      <details>
        <summary>Ver detalhes</summary>
        <div class="recipe-content">
          <div>
            <h4>Ingredientes</h4>
            <ul>${ingredientItems}</ul>
          </div>
          <div>
            <h4>Modo de preparo</h4>
            <p>${escapeHtml(recipe.steps)}</p>
          </div>
        </div>
      </details>

      <p class="recipe-updated">Atualizada em ${updatedLabel}</p>
    </article>
  `;
}

function countRecentRecipes() {
  const now = Date.now();
  const windowInMs = RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return recipes.filter((recipe) => {
    const dateValue = Date.parse(recipe.updatedAt || recipe.createdAt);
    if (Number.isNaN(dateValue)) {
      return false;
    }

    return now - dateValue <= windowInMs;
  }).length;
}

function mapCategory(category) {
  const normalized = simplifyText(category);

  if (normalized.includes("cafe")) {
    return "cafe";
  }

  if (normalized.includes("lanche")) {
    return "lanches";
  }

  if (normalized.includes("torta")) {
    return "tortas";
  }

  if (normalized.includes("doce") || normalized.includes("sobremesa")) {
    return "doces";
  }

  if (normalized.includes("jantar") || normalized.includes("almoco")) {
    return "jantar";
  }

  return "";
}

function extractRecipesFromJson(parsed) {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && typeof parsed === "object" && Array.isArray(parsed.recipes)) {
    return parsed.recipes;
  }

  return [];
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

    return parsed
      .map((recipe) => sanitizeRecipe(recipe))
      .filter(Boolean)
      .sort((a, b) => Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt));
  } catch (error) {
    console.error("Não foi possível carregar as receitas:", error);
    return [];
  }
}

function saveRecipes() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

function sanitizeRecipe(recipe) {
  if (!recipe || typeof recipe !== "object") {
    return null;
  }

  const name = cleanText(recipe.name);
  const category = normalizeCategory(cleanText(recipe.category));
  const steps = cleanText(recipe.steps);
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map((item) => cleanText(item)).filter(Boolean)
    : [];

  if (!name || !category || !steps || ingredients.length === 0) {
    return null;
  }

  return {
    id: typeof recipe.id === "string" ? recipe.id : createId(),
    name,
    category,
    time: Number(recipe.time) > 0 ? Number(recipe.time) : 0,
    servings: Number(recipe.servings) > 0 ? Number(recipe.servings) : 1,
    ingredients,
    steps,
    favorite: Boolean(recipe.favorite),
    createdAt: typeof recipe.createdAt === "string" ? recipe.createdAt : new Date().toISOString(),
    updatedAt: typeof recipe.updatedAt === "string" ? recipe.updatedAt : new Date().toISOString()
  };
}

function splitLines(value) {
  return String(value)
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter(Boolean);
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

function simplifyText(value) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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

function setShareStatus(message, isError = false) {
  elements.shareStatus.textContent = message;
  elements.shareStatus.classList.toggle("error", isError);
}
