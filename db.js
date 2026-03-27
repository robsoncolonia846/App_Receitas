(function () {
  const STORAGE_KEY = "recipe_book_db_v1";
  const LEGACY_KEYS = ["shopping_price_db_v3", "shopping_price_db_v2", "shopping_open_list_v1", "compras_v1", "tasks_v1"];

  let db = loadDatabase();

  function nowIso() {
    return new Date().toISOString();
  }

  function safeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function hasOwn(value, key) {
    return Boolean(value) && Object.prototype.hasOwnProperty.call(value, key);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeText(value) {
    return String(value ?? "").trim();
  }

  function normalizeKey(value) {
    return normalizeText(value).toLocaleLowerCase("pt-BR");
  }

  function normalizeIsoDate(value) {
    const text = normalizeText(value);
    if (!text) return null;

    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return null;

    return parsed.toISOString();
  }

  function parsePositiveInt(value) {
    const text = normalizeText(value).replace(",", ".");
    if (!text) return null;

    const parsed = Number(text);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;

    return Math.round(parsed);
  }

  function uniqueByKey(items) {
    const seen = new Set();
    const output = [];

    for (const item of items) {
      const clean = normalizeText(item);
      const key = normalizeKey(clean);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      output.push(clean);
    }

    return output;
  }

  function normalizeLineList(value) {
    if (Array.isArray(value)) {
      return uniqueByKey(value);
    }

    const text = normalizeText(value);
    if (!text) return [];

    return uniqueByKey(text.split(/\r?\n/));
  }

  function normalizeTagList(value) {
    if (Array.isArray(value)) {
      return uniqueByKey(value);
    }

    const text = normalizeText(value);
    if (!text) return [];

    return uniqueByKey(text.split(/[\n,;]+/));
  }

  function createEmptyDb() {
    return {
      recipes: [],
    };
  }

  function buildRecipe(payload, existing = null) {
    const source = payload && typeof payload === "object" ? payload : {};
    const title = normalizeText(
      source.title
      || source.nome
      || source.name
      || source.productName
      || source.product
      || source.receita,
    );

    if (!title) {
      throw new Error("Titulo obrigatorio.");
    }

    const prepCandidate = parsePositiveInt(
      source.prepMinutes
      ?? source.tempoMin
      ?? source.timeMinutes
      ?? source.time,
    );
    const servingsCandidate = parsePositiveInt(source.servings ?? source.porcoes);

    let ingredients = normalizeLineList(source.ingredients ?? source.ingredientes);
    if (!ingredients.length && existing && Array.isArray(existing.ingredients)) {
      ingredients = [...existing.ingredients];
    }

    let steps = normalizeLineList(
      source.steps
      ?? source.instructions
      ?? source.modoPreparo
      ?? source.preparo,
    );
    if (!steps.length && existing && Array.isArray(existing.steps)) {
      steps = [...existing.steps];
    }

    let tags = normalizeTagList(source.tags ?? source.etiquetas);
    if (!tags.length && existing && Array.isArray(existing.tags)) {
      tags = [...existing.tags];
    }

    const difficultyCandidate = normalizeText(source.difficulty ?? source.dificuldade);
    const categoryCandidate = normalizeText(source.category ?? source.categoria);
    const notesCandidate = normalizeText(source.notes ?? source.notas ?? source.obs);

    const hasFavoriteFlag = hasOwn(source, "favorite") || hasOwn(source, "favorita");
    const favoriteCandidate = hasOwn(source, "favorite")
      ? Boolean(source.favorite)
      : (hasOwn(source, "favorita") ? Boolean(source.favorita) : false);

    const hasLastCookedFlag = hasOwn(source, "lastCookedAt")
      || hasOwn(source, "lastMadeAt")
      || hasOwn(source, "ultimaPreparacao");
    const lastCookedCandidate = normalizeIsoDate(
      source.lastCookedAt
      ?? source.lastMadeAt
      ?? source.ultimaPreparacao,
    );

    const createdAt = existing
      ? existing.createdAt
      : (normalizeIsoDate(source.createdAt) || nowIso());

    const updatedAt = normalizeIsoDate(source.updatedAt) || nowIso();

    return {
      id: existing ? existing.id : (normalizeText(source.id) || safeId()),
      title,
      category: categoryCandidate || (existing ? existing.category : ""),
      prepMinutes: prepCandidate ?? (existing ? existing.prepMinutes : null),
      servings: servingsCandidate ?? (existing ? existing.servings : null),
      difficulty: difficultyCandidate || (existing ? existing.difficulty : ""),
      ingredients,
      steps,
      notes: notesCandidate || (existing ? existing.notes : ""),
      tags,
      favorite: hasFavoriteFlag
        ? favoriteCandidate
        : (existing ? existing.favorite : false),
      createdAt,
      updatedAt,
      lastCookedAt: hasLastCookedFlag
        ? (lastCookedCandidate || null)
        : (existing ? existing.lastCookedAt : null),
    };
  }

  function ensureUniqueRecipeTitle(title, currentId = "") {
    const titleKey = normalizeKey(title);
    const duplicated = db.recipes.find((recipe) => {
      return normalizeKey(recipe.title) === titleKey && recipe.id !== currentId;
    });

    if (duplicated) {
      throw new Error("Ja existe uma receita com esse titulo.");
    }
  }

  function getRecipeIndexById(recipeId) {
    return db.recipes.findIndex((recipe) => recipe.id === recipeId);
  }

  function saveDatabase() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (error) {
      console.warn("Nao foi possivel salvar no localStorage.", error);
    }
  }

  function readStorageValue(storageKey) {
    try {
      return window.localStorage.getItem(storageKey);
    } catch (error) {
      console.warn("Nao foi possivel ler o localStorage.", error);
      return null;
    }
  }

  function parseStorageEntry(rawText) {
    if (!rawText) return null;

    try {
      return JSON.parse(rawText);
    } catch (error) {
      console.warn("JSON invalido no localStorage.", error);
      return null;
    }
  }

  function normalizeDatabase(raw) {
    const next = createEmptyDb();

    function pushIfUnique(recipeLike) {
      if (!recipeLike) return;

      let normalizedRecipe;
      try {
        normalizedRecipe = buildRecipe(recipeLike);
      } catch (error) {
        return;
      }

      const titleKey = normalizeKey(normalizedRecipe.title);
      const hasSameTitle = next.recipes.some((recipe) => normalizeKey(recipe.title) === titleKey);
      if (hasSameTitle) return;

      const hasSameId = next.recipes.some((recipe) => recipe.id === normalizedRecipe.id);
      if (hasSameId) {
        normalizedRecipe.id = safeId();
      }

      next.recipes.push(normalizedRecipe);
    }

    if (Array.isArray(raw)) {
      for (const entry of raw) {
        pushIfUnique(entry);
      }
      return next;
    }

    if (!raw || typeof raw !== "object") {
      return next;
    }

    if (Array.isArray(raw.recipes)) {
      for (const recipe of raw.recipes) {
        pushIfUnique(recipe);
      }
      return next;
    }

    if (Array.isArray(raw.data)) {
      for (const recipe of raw.data) {
        pushIfUnique(recipe);
      }
      return next;
    }

    const sourceProducts = Array.isArray(raw.products) ? raw.products : [];
    const sourceListItems = Array.isArray(raw.listItems) ? raw.listItems : [];

    if (!sourceProducts.length && !sourceListItems.length) {
      return next;
    }

    const productNameById = new Map();

    for (const product of sourceProducts) {
      const name = normalizeText(product && (product.name || product.title || product.product));
      if (!name) continue;

      const mappedId = normalizeText(product && product.id);
      if (mappedId) {
        productNameById.set(mappedId, name);
      }

      pushIfUnique({
        title: name,
        category: "Migrada",
        notes: "Importada de uma base antiga de compras.",
      });
    }

    for (const item of sourceListItems) {
      const fromMap = productNameById.get(normalizeText(item && item.productId)) || "";
      const title = normalizeText(item && (item.productName || item.product || fromMap));
      if (!title) continue;

      const ingredients = [];
      const brand = normalizeText(item && item.brand);
      const market = normalizeText(item && item.market);
      const quantity = normalizeText(item && item.quantity);

      if (quantity) ingredients.push(`Quantidade de referencia: ${quantity}`);
      if (brand) ingredients.push(`Marca usada: ${brand}`);
      if (market) ingredients.push(`Mercado de referencia: ${market}`);

      pushIfUnique({
        title,
        category: "Migrada",
        ingredients,
        notes: "Receita criada automaticamente a partir do cadastro antigo.",
      });
    }

    return next;
  }

  function loadDatabase() {
    const currentRaw = parseStorageEntry(readStorageValue(STORAGE_KEY));
    if (currentRaw) {
      const currentNormalized = normalizeDatabase(currentRaw);
      if (currentNormalized.recipes.length || (currentRaw && Array.isArray(currentRaw.recipes))) {
        return currentNormalized;
      }
    }

    for (const legacyKey of LEGACY_KEYS) {
      const legacyRaw = parseStorageEntry(readStorageValue(legacyKey));
      if (!legacyRaw) continue;

      const migrated = normalizeDatabase(legacyRaw);
      if (!migrated.recipes.length) continue;

      db = migrated;
      saveDatabase();
      return migrated;
    }

    const empty = createEmptyDb();
    db = empty;
    saveDatabase();
    return empty;
  }

  function getRecipes() {
    return clone(db.recipes);
  }

  function getRecipeById(recipeId) {
    const id = normalizeText(recipeId);
    if (!id) return null;

    const found = db.recipes.find((recipe) => recipe.id === id);
    return found ? clone(found) : null;
  }

  function getCategoryOptions() {
    const categories = db.recipes
      .map((recipe) => normalizeText(recipe.category))
      .filter(Boolean);

    const unique = uniqueByKey(categories);
    unique.sort((a, b) => a.localeCompare(b, "pt-BR"));
    return unique;
  }

  function upsertRecipe(payload) {
    const source = payload && typeof payload === "object" ? payload : {};
    const recipeId = normalizeText(source.id);

    const recipeIndex = recipeId ? getRecipeIndexById(recipeId) : -1;
    const existingRecipe = recipeIndex >= 0 ? db.recipes[recipeIndex] : null;

    const nextRecipe = buildRecipe(source, existingRecipe);

    ensureUniqueRecipeTitle(nextRecipe.title, existingRecipe ? existingRecipe.id : "");

    if (recipeIndex >= 0) {
      db.recipes[recipeIndex] = nextRecipe;
    } else {
      db.recipes.push(nextRecipe);
    }

    saveDatabase();
    return clone(nextRecipe);
  }

  function deleteRecipe(recipeId) {
    const id = normalizeText(recipeId);
    if (!id) return false;

    const recipeIndex = getRecipeIndexById(id);
    if (recipeIndex < 0) return false;

    db.recipes.splice(recipeIndex, 1);
    saveDatabase();
    return true;
  }

  function toggleFavorite(recipeId, forceValue = null) {
    const id = normalizeText(recipeId);
    if (!id) throw new Error("Receita nao encontrada.");

    const recipeIndex = getRecipeIndexById(id);
    if (recipeIndex < 0) throw new Error("Receita nao encontrada.");

    const nextFavorite = typeof forceValue === "boolean"
      ? forceValue
      : !db.recipes[recipeIndex].favorite;

    db.recipes[recipeIndex].favorite = nextFavorite;
    db.recipes[recipeIndex].updatedAt = nowIso();

    saveDatabase();
    return clone(db.recipes[recipeIndex]);
  }

  function markCookedNow(recipeId, whenIso = null) {
    const id = normalizeText(recipeId);
    if (!id) throw new Error("Receita nao encontrada.");

    const recipeIndex = getRecipeIndexById(id);
    if (recipeIndex < 0) throw new Error("Receita nao encontrada.");

    db.recipes[recipeIndex].lastCookedAt = normalizeIsoDate(whenIso) || nowIso();
    db.recipes[recipeIndex].updatedAt = nowIso();

    saveDatabase();
    return clone(db.recipes[recipeIndex]);
  }

  function clearLastCooked(recipeId) {
    const id = normalizeText(recipeId);
    if (!id) throw new Error("Receita nao encontrada.");

    const recipeIndex = getRecipeIndexById(id);
    if (recipeIndex < 0) throw new Error("Receita nao encontrada.");

    db.recipes[recipeIndex].lastCookedAt = null;
    db.recipes[recipeIndex].updatedAt = nowIso();

    saveDatabase();
    return clone(db.recipes[recipeIndex]);
  }

  function mergeRecipesByTitle(baseRecipes, incomingRecipes) {
    const merged = baseRecipes.map((recipe) => clone(recipe));

    function pickLatestDate(isoA, isoB) {
      const a = normalizeIsoDate(isoA);
      const b = normalizeIsoDate(isoB);
      if (!a && !b) return null;
      if (!a) return b;
      if (!b) return a;
      return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
    }

    for (const incoming of incomingRecipes) {
      const incomingTitleKey = normalizeKey(incoming.title);
      const matchIndex = merged.findIndex((item) => normalizeKey(item.title) === incomingTitleKey);

      if (matchIndex < 0) {
        const clonedIncoming = clone(incoming);
        if (merged.some((item) => item.id === clonedIncoming.id)) {
          clonedIncoming.id = safeId();
        }
        merged.push(clonedIncoming);
        continue;
      }

      const current = merged[matchIndex];

      merged[matchIndex] = {
        ...current,
        title: incoming.title || current.title,
        category: incoming.category || current.category,
        difficulty: incoming.difficulty || current.difficulty,
        prepMinutes: incoming.prepMinutes || current.prepMinutes,
        servings: incoming.servings || current.servings,
        ingredients: incoming.ingredients.length ? incoming.ingredients : current.ingredients,
        steps: incoming.steps.length ? incoming.steps : current.steps,
        tags: uniqueByKey([...(current.tags || []), ...(incoming.tags || [])]),
        notes: incoming.notes || current.notes,
        favorite: Boolean(current.favorite || incoming.favorite),
        createdAt: pickLatestDate(current.createdAt, incoming.createdAt) || nowIso(),
        updatedAt: pickLatestDate(current.updatedAt, incoming.updatedAt) || nowIso(),
        lastCookedAt: pickLatestDate(current.lastCookedAt, incoming.lastCookedAt),
      };
    }

    return merged;
  }

  function importDatabase(input, options = {}) {
    const mode = options.mode === "merge" ? "merge" : "replace";
    const normalized = normalizeDatabase(input);

    if (!normalized.recipes.length) {
      throw new Error("Nao encontrei receitas validas no arquivo JSON.");
    }

    if (mode === "replace") {
      db = normalized;
    } else {
      db = {
        recipes: mergeRecipesByTitle(db.recipes, normalized.recipes),
      };
    }

    saveDatabase();

    return {
      mode,
      importedCount: normalized.recipes.length,
      totalCount: db.recipes.length,
    };
  }

  function importDatabaseFromText(rawText, options = {}) {
    const text = normalizeText(rawText);
    if (!text) {
      throw new Error("Arquivo vazio.");
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new Error("JSON invalido.");
    }

    return importDatabase(parsed, options);
  }

  function exportDatabase() {
    return {
      app: "App Receitas",
      version: 1,
      exportedAt: nowIso(),
      recipes: clone(db.recipes),
    };
  }

  function splitMultiline(value) {
    return normalizeLineList(value);
  }

  function joinMultiline(list) {
    if (!Array.isArray(list)) return "";
    return list.join("\n");
  }

  function formatDate(isoValue) {
    const iso = normalizeIsoDate(isoValue);
    if (!iso) return "Sem data";

    return new Date(iso).toLocaleDateString("pt-BR");
  }

  function formatDateTime(isoValue) {
    const iso = normalizeIsoDate(isoValue);
    if (!iso) return "Sem data";

    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatPrepMinutes(minutes) {
    const numeric = Number(minutes);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return "Tempo nao informado";
    }

    if (numeric < 60) {
      return `${Math.round(numeric)} min`;
    }

    const hours = Math.floor(numeric / 60);
    const remainder = Math.round(numeric % 60);
    if (!remainder) {
      return `${hours}h`;
    }

    return `${hours}h ${remainder}min`;
  }

  window.RecipeDb = {
    getRecipes,
    getRecipeById,
    getCategoryOptions,
    upsertRecipe,
    deleteRecipe,
    toggleFavorite,
    markCookedNow,
    clearLastCooked,
    importDatabase,
    importDatabaseFromText,
    exportDatabase,
    splitMultiline,
    joinMultiline,
    formatDate,
    formatDateTime,
    formatPrepMinutes,
    normalizeText,
    normalizeKey,
  };
})();
