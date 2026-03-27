(() => {
  const dbApi = window.RecipeDb;
  if (!dbApi) {
    console.error("RecipeDb nao carregado.");
    return;
  }

  const page = document.body.dataset.page || "home";

  const common = {
    syncStatus: document.getElementById("sync-status"),
    importBtn: document.getElementById("import-json-btn"),
    exportBtn: document.getElementById("export-json-btn"),
    jsonInput: document.getElementById("json-file-input"),
  };

  const home = {
    quickForm: document.getElementById("quick-recipe-form"),
    quickTitle: document.getElementById("quick-title"),
    quickCategory: document.getElementById("quick-category"),
    quickPrepMinutes: document.getElementById("quick-prep-minutes"),
    quickIngredients: document.getElementById("quick-ingredients"),
    quickSteps: document.getElementById("quick-steps"),
    quickClearBtn: document.getElementById("quick-clear-btn"),
    stats: document.getElementById("home-stats"),
    filtersForm: document.getElementById("home-filters-form"),
    searchInput: document.getElementById("home-search"),
    categoryFilter: document.getElementById("home-category-filter"),
    sortSelect: document.getElementById("home-sort"),
    favoriteOnly: document.getElementById("home-favorite-only"),
    clearFiltersBtn: document.getElementById("clear-filters-btn"),
    recipesList: document.getElementById("home-recipes-list"),
    quickFilters: document.getElementById("home-quick-filters"),
    metricFilters: document.getElementById("home-metric-filters"),
    metricTotal: document.getElementById("metric-total"),
    metricFavorites: document.getElementById("metric-favorites"),
    metricCafes: document.getElementById("metric-cafes"),
    metricLanches: document.getElementById("metric-lanches"),
    metricTortas: document.getElementById("metric-tortas"),
    metricJantares: document.getElementById("metric-jantares"),
    metricDoces: document.getElementById("metric-doces"),
    metricRecent: document.getElementById("metric-recent"),
    ownerSignatureTrigger: document.getElementById("owner-signature-trigger"),
    ownerSignatureName: document.getElementById("owner-signature-name"),
    ownerSignatureEditor: document.getElementById("owner-signature-editor"),
    ownerSignatureInput: document.getElementById("owner-signature-input"),
    ownerSignatureSize: document.getElementById("owner-signature-size"),
    ownerSignatureSizeLabel: document.getElementById("owner-signature-size-label"),
    ownerSignatureFont: document.getElementById("owner-signature-font"),
    ownerSignatureSaveBtn: document.getElementById("owner-signature-save-btn"),
    ownerSignatureCancelBtn: document.getElementById("owner-signature-cancel-btn"),
  };

  const homeState = {
    quickFilter: "all",
  };

  const OWNER_SIGNATURE_STORAGE_KEY = "app_receitas_owner_signature_v1";

  const OWNER_SIGNATURE_FONT_MAP = {
    caveat: "\"Caveat\", \"Segoe Script\", \"Brush Script MT\", cursive",
    fraunces: "\"Fraunces\", Georgia, serif",
    manrope: "\"Manrope\", \"Segoe UI\", sans-serif",
    georgia: "Georgia, serif",
    segoe: "\"Segoe UI\", Tahoma, Geneva, sans-serif",
  };

  const DEFAULT_OWNER_SIGNATURE = {
    name: "Tamara Blatz",
    size: 22,
    font: "caveat",
  };

  const STARTER_RECIPES_SEED_KEY = "app_receitas_starter_seed_version";
  const STARTER_RECIPES_SEED_VERSION = 1;

  const STARTER_RECIPES = [
    {
      title: "Pao de queijo mineiro caseiro",
      category: "Cafes",
      prepMinutes: 40,
      servings: 8,
      difficulty: "Facil",
      ingredients: [
        "500 g de polvilho azedo",
        "200 ml de leite",
        "200 ml de agua",
        "100 ml de oleo",
        "4 ovos",
        "250 g de queijo meia-cura ralado",
      ],
      steps: [
        "Ferva leite, agua, oleo e sal.",
        "Escalde o polvilho e deixe amornar.",
        "Misture ovos e queijo ate dar ponto de enrolar.",
        "Asse em forno preaquecido ate dourar.",
      ],
      tags: ["famosa", "mineiro", "forno"],
      favorite: true,
      notes: "Fonte TudoGostoso: https://www.tudogostoso.com.br/receita/2341-pao-de-queijo.html",
    },
    {
      title: "Bolo de cenoura com calda de chocolate",
      category: "Doces",
      prepMinutes: 50,
      servings: 12,
      difficulty: "Facil",
      ingredients: [
        "3 cenouras medias",
        "3 ovos",
        "1/2 xicara de oleo",
        "2 xicaras de farinha de trigo",
        "1 e 1/2 xicara de acucar",
        "Calda de chocolate a gosto",
      ],
      steps: [
        "Bata cenoura, ovos e oleo no liquidificador.",
        "Misture com farinha e acucar.",
        "Asse e finalize com calda de chocolate.",
      ],
      tags: ["famosa", "bolo", "familia"],
      favorite: true,
      notes: "Fonte TudoGostoso: https://www.tudogostoso.com.br/receita/6389-bolo-de-cenoura.html",
    },
    {
      title: "Brigadeiro tradicional",
      category: "Doces",
      prepMinutes: 20,
      servings: 20,
      difficulty: "Facil",
      ingredients: [
        "1 lata de leite condensado",
        "1 colher (sopa) de manteiga",
        "4 colheres (sopa) de chocolate em po",
        "Chocolate granulado para enrolar",
      ],
      steps: [
        "Misture leite condensado, manteiga e chocolate em po.",
        "Cozinhe mexendo ate desgrudar do fundo da panela.",
        "Espere esfriar, enrole e passe no granulado.",
      ],
      tags: ["famosa", "festa", "chocolate"],
      notes: "Fonte TudoGostoso: https://www.tudogostoso.com.br/receita/9453-brigadeiro-tradicional.html",
    },
    {
      title: "Mousse simples de maracuja",
      category: "Doces",
      prepMinutes: 15,
      servings: 8,
      difficulty: "Facil",
      ingredients: [
        "1 lata de leite condensado",
        "1 lata de creme de leite",
        "1 medida de suco concentrado de maracuja",
      ],
      steps: [
        "Bata os ingredientes no liquidificador por 3 minutos.",
        "Leve para gelar por no minimo 2 horas.",
      ],
      tags: ["famosa", "gelada", "rapida"],
      notes: "Fonte TudoGostoso: https://www.tudogostoso.com.br/receita/10995-mousse-simples-de-maracuja.html",
    },
    {
      title: "Estrogonofe de frango cremoso",
      category: "Jantares",
      prepMinutes: 35,
      servings: 6,
      difficulty: "Facil",
      ingredients: [
        "700 g de peito de frango em cubos",
        "1 cebola picada",
        "100 g de champignon",
        "40 g de ketchup",
        "15 g de mostarda",
        "1 caixa de creme de leite",
      ],
      steps: [
        "Doure o frango e reserve.",
        "Refogue cebola e champignon.",
        "Adicione ketchup, mostarda e frango.",
        "Finalize com creme de leite.",
      ],
      tags: ["famosa", "frango", "classico"],
      favorite: true,
      notes: "Fonte TudoGostoso: https://www.tudogostoso.com.br/receita/317872-estrogonofe-de-frango.html",
    },
    {
      title: "Lasanha de frango gratinada",
      category: "Jantares",
      prepMinutes: 65,
      servings: 8,
      difficulty: "Media",
      ingredients: [
        "500 g de frango desfiado",
        "500 g de massa para lasanha",
        "400 g de mussarela",
        "Molho de tomate caseiro",
        "Requeijao cremoso",
        "Queijo ralado para gratinar",
      ],
      steps: [
        "Monte camadas de molho, massa, frango, requeijao e queijo.",
        "Repita ate finalizar os ingredientes.",
        "Asse ate borbulhar e gratinar.",
      ],
      tags: ["famosa", "forno", "domingo"],
      notes: "Fonte TudoGostoso: https://www.tudogostoso.com.br/receita/55380-lasanha-de-frango-gostosa.html",
    },
    {
      title: "Torta de frango de forno",
      category: "Tortas",
      prepMinutes: 60,
      servings: 8,
      difficulty: "Media",
      ingredients: [
        "2 xicaras de farinha de trigo",
        "3 ovos",
        "2 xicaras de leite",
        "1/2 xicara de oleo",
        "1 peito de frango desfiado",
        "1 colher (sopa) de fermento",
      ],
      steps: [
        "Bata ovos, leite, oleo e farinha no liquidificador.",
        "Despeje metade da massa, adicione recheio de frango e cubra.",
        "Asse em forno medio ate dourar.",
      ],
      tags: ["famosa", "frango", "forno"],
      notes: "Fonte TudoGostoso: https://www.tudogostoso.com.br/receita/177817-torta-de-frango.html",
    },
    {
      title: "Sanduiche natural de frango",
      category: "Lanches",
      prepMinutes: 20,
      servings: 4,
      difficulty: "Facil",
      ingredients: [
        "2 xicaras de frango cozido e desfiado",
        "4 colheres (sopa) de maionese",
        "1 cenoura ralada",
        "Suco de 1/2 limao",
        "8 fatias de pao integral",
        "Folhas de alface",
      ],
      steps: [
        "Misture frango, maionese, cenoura e limao.",
        "Acerte sal e pimenta.",
        "Monte no pao integral com alface.",
      ],
      tags: ["famosa", "lanche", "pratico"],
      notes: "Fonte TudoGostoso: https://www.tudogostoso.com.br/receita/135915-sanduiche-natural-de-frango.html",
    },
  ];
  const catalog = {
    formTitle: document.getElementById("catalog-form-title"),
    form: document.getElementById("recipe-form"),
    recipeId: document.getElementById("recipe-id"),
    title: document.getElementById("recipe-title"),
    category: document.getElementById("recipe-category"),
    prepMinutes: document.getElementById("recipe-prep-minutes"),
    servings: document.getElementById("recipe-servings"),
    difficulty: document.getElementById("recipe-difficulty"),
    tags: document.getElementById("recipe-tags"),
    ingredients: document.getElementById("recipe-ingredients"),
    steps: document.getElementById("recipe-steps"),
    notes: document.getElementById("recipe-notes"),
    favorite: document.getElementById("recipe-favorite"),
    saveBtn: document.getElementById("recipe-save-btn"),
    resetBtn: document.getElementById("recipe-form-reset-btn"),
    searchInput: document.getElementById("catalog-search"),
    stats: document.getElementById("catalog-stats"),
    recipesList: document.getElementById("catalog-recipes-list"),
  };

  const historyPage = {
    stats: document.getElementById("history-stats"),
    filtersForm: document.getElementById("history-filter-form"),
    searchInput: document.getElementById("history-search"),
    categoryFilter: document.getElementById("history-category-filter"),
    periodFilter: document.getElementById("history-period-filter"),
    clearBtn: document.getElementById("history-clear-filters-btn"),
    cookedList: document.getElementById("history-cooked-list"),
    pendingList: document.getElementById("history-pending-list"),
  };

  bindCommonActions();
  ensureStarterRecipesSeeded();

  if (page === "home") {
    initHomePage();
  }

  if (page === "catalog") {
    initCatalogPage();
  }

  if (page === "history") {
    initHistoryPage();
  }

  refreshSyncStatus();

  function setSyncStatus(text) {
    if (!common.syncStatus) return;
    common.syncStatus.textContent = text;
  }

  function refreshSyncStatus(optionalText = "") {
    const total = dbApi.getRecipes().length;
    if (optionalText) {
      setSyncStatus(`${optionalText} (${total} receitas no total)`);
      return;
    }
    setSyncStatus(`${total} receitas salvas no navegador.`);
  }

  function ensureStarterRecipesSeeded() {
    let appliedVersion = 0;

    try {
      const rawVersion = window.localStorage.getItem(STARTER_RECIPES_SEED_KEY);
      const parsedVersion = Number.parseInt(String(rawVersion ?? ""), 10);
      appliedVersion = Number.isFinite(parsedVersion) ? parsedVersion : 0;
    } catch {
      appliedVersion = 0;
    }

    if (appliedVersion >= STARTER_RECIPES_SEED_VERSION) {
      return;
    }

    try {
      const existingTitles = new Set(
        dbApi.getRecipes().map((recipe) => dbApi.normalizeKey(recipe.title)),
      );

      const missingRecipes = STARTER_RECIPES.filter((recipe) => {
        const titleKey = dbApi.normalizeKey(recipe.title);
        return titleKey && !existingTitles.has(titleKey);
      });

      if (missingRecipes.length) {
        dbApi.importDatabase(
          {
            app: "App Receitas",
            version: STARTER_RECIPES_SEED_VERSION,
            recipes: missingRecipes,
          },
          { mode: "merge" },
        );
      }

      window.localStorage.setItem(
        STARTER_RECIPES_SEED_KEY,
        String(STARTER_RECIPES_SEED_VERSION),
      );
    } catch (error) {
      console.warn("Falha ao aplicar receitas iniciais.", error);
    }
  }

  function buildBackupFileName() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");

    return `Backup_Receitas_${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}_${pad(now.getHours())}.${pad(now.getMinutes())}h.json`;
  }

  function downloadTextFile(content, fileName) {
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function bindCommonActions() {
    if (common.importBtn && common.jsonInput) {
      common.importBtn.addEventListener("click", () => {
        common.jsonInput.value = "";
        common.jsonInput.click();
      });
    }

    if (common.exportBtn) {
      common.exportBtn.addEventListener("click", () => {
        try {
          const payload = dbApi.exportDatabase();
          const text = JSON.stringify(payload, null, 2);
          downloadTextFile(text, buildBackupFileName());
          refreshSyncStatus("Backup exportado com sucesso.");
        } catch (error) {
          window.alert(`Falha ao exportar: ${error.message}`);
        }
      });
    }

    if (common.jsonInput) {
      common.jsonInput.addEventListener("change", async (event) => {
        const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
        if (!file) return;

        try {
          const text = await file.text();
          const result = dbApi.importDatabaseFromText(text, { mode: "replace" });
          refreshSyncStatus(`${result.importedCount} receitas importadas.`);
          rerenderCurrentPage();
        } catch (error) {
          window.alert(`Falha ao importar JSON: ${error.message}`);
        }
      });
    }
  }

  function rerenderCurrentPage() {
    if (page === "home") {
      renderHomePage();
    }

    if (page === "catalog") {
      renderCatalogList();
    }

    if (page === "history") {
      renderHistoryPage();
    }
  }

  function refreshCategorySelect(selectEl, allOptionLabel) {
    if (!selectEl) return;

    const previousValue = selectEl.value;
    const categories = dbApi.getCategoryOptions();

    selectEl.innerHTML = "";

    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = allOptionLabel;
    selectEl.appendChild(firstOption);

    for (const category of categories) {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      selectEl.appendChild(option);
    }

    if (previousValue && categories.includes(previousValue)) {
      selectEl.value = previousValue;
    }
  }

  function filterRecipesByTextAndCategory(recipes, searchValue, categoryValue) {
    const searchKey = dbApi.normalizeKey(searchValue);
    const categoryKey = dbApi.normalizeKey(categoryValue);

    return recipes.filter((recipe) => {
      if (categoryKey && dbApi.normalizeKey(recipe.category) !== categoryKey) {
        return false;
      }

      if (!searchKey) {
        return true;
      }

      const searchArea = [
        recipe.title,
        recipe.category,
        recipe.notes,
        ...(Array.isArray(recipe.tags) ? recipe.tags : []),
        ...(Array.isArray(recipe.ingredients) ? recipe.ingredients : []),
      ].join(" ");

      return dbApi.normalizeKey(searchArea).includes(searchKey);
    });
  }

  function sortRecipes(recipes, sortMode) {
    const cloned = [...recipes];

    cloned.sort((a, b) => {
      if (sortMode === "name") {
        return a.title.localeCompare(b.title, "pt-BR");
      }

      if (sortMode === "prep") {
        const aTime = Number.isFinite(Number(a.prepMinutes)) ? Number(a.prepMinutes) : Number.POSITIVE_INFINITY;
        const bTime = Number.isFinite(Number(b.prepMinutes)) ? Number(b.prepMinutes) : Number.POSITIVE_INFINITY;
        if (aTime !== bTime) return aTime - bTime;
        return a.title.localeCompare(b.title, "pt-BR");
      }

      if (sortMode === "cooked") {
        const aCooked = a.lastCookedAt ? new Date(a.lastCookedAt).getTime() : 0;
        const bCooked = b.lastCookedAt ? new Date(b.lastCookedAt).getTime() : 0;
        if (aCooked !== bCooked) return bCooked - aCooked;
        return a.title.localeCompare(b.title, "pt-BR");
      }

      if (sortMode === "favorites") {
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        return a.title.localeCompare(b.title, "pt-BR");
      }

      const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      if (aUpdated !== bUpdated) return bUpdated - aUpdated;
      return a.title.localeCompare(b.title, "pt-BR");
    });

    return cloned;
  }

  function isWithinLastDays(isoValue, days) {
    const parsedDays = Number(days);
    if (!Number.isFinite(parsedDays) || parsedDays <= 0) return true;

    const time = new Date(isoValue).getTime();
    if (!Number.isFinite(time)) return false;

    const cutoff = Date.now() - (parsedDays * 24 * 60 * 60 * 1000);
    return time >= cutoff;
  }

  function createMetaLine(recipe) {
    const parts = [];

    if (recipe.category) parts.push(recipe.category);
    parts.push(dbApi.formatPrepMinutes(recipe.prepMinutes));

    if (Number.isFinite(Number(recipe.servings)) && Number(recipe.servings) > 0) {
      parts.push(`${Math.round(Number(recipe.servings))} porcoes`);
    }

    if (recipe.difficulty) parts.push(recipe.difficulty);

    return parts.join(" | ");
  }

  function createListFromValues(values, ordered = false) {
    const listEl = document.createElement(ordered ? "ol" : "ul");
    listEl.className = "details-list";

    for (const value of values) {
      const itemEl = document.createElement("li");
      itemEl.textContent = value;
      listEl.appendChild(itemEl);
    }

    return listEl;
  }

  function createRecipeListItem(recipe, options = {}) {
    const itemOptions = {
      editMode: options.editMode || "link",
      showDelete: options.showDelete !== false,
      showCooked: options.showCooked !== false,
      showClearCooked: options.showClearCooked !== false,
    };

    const li = document.createElement("li");
    li.className = "recipe-item";
    li.dataset.recipeId = recipe.id;

    const article = document.createElement("article");
    article.className = "recipe-card";

    const head = document.createElement("div");
    head.className = "recipe-head";

    const title = document.createElement("h3");
    title.className = "recipe-title";
    title.textContent = recipe.title;

    const favoriteBtn = document.createElement("button");
    favoriteBtn.type = "button";
    favoriteBtn.dataset.action = "favorite";
    favoriteBtn.className = recipe.favorite ? "tag-btn is-favorite" : "tag-btn";
    favoriteBtn.textContent = recipe.favorite ? "Favorita" : "Favoritar";

    head.append(title, favoriteBtn);

    const metaLine = document.createElement("p");
    metaLine.className = "meta-line";
    metaLine.textContent = createMetaLine(recipe);

    article.append(head, metaLine);

    if (Array.isArray(recipe.tags) && recipe.tags.length) {
      const tagsLine = document.createElement("p");
      tagsLine.className = "tag-line";
      tagsLine.textContent = recipe.tags.map((tag) => `#${tag}`).join(" ");
      article.appendChild(tagsLine);
    }

    if (recipe.lastCookedAt) {
      const cookedLine = document.createElement("p");
      cookedLine.className = "meta-sub";
      cookedLine.textContent = `Ultima vez preparada: ${dbApi.formatDateTime(recipe.lastCookedAt)}`;
      article.appendChild(cookedLine);
    }

    const details = document.createElement("details");
    details.className = "details-block";

    const summary = document.createElement("summary");
    summary.textContent = "Ingredientes e modo de preparo";
    details.appendChild(summary);

    const detailsGrid = document.createElement("div");
    detailsGrid.className = "details-grid";

    const ingredientsBox = document.createElement("div");
    const ingredientsTitle = document.createElement("strong");
    ingredientsTitle.className = "details-title";
    ingredientsTitle.textContent = "Ingredientes";
    ingredientsBox.appendChild(ingredientsTitle);

    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length) {
      ingredientsBox.appendChild(createListFromValues(recipe.ingredients, false));
    } else {
      const emptyIngredients = document.createElement("p");
      emptyIngredients.className = "small-muted";
      emptyIngredients.textContent = "Sem ingredientes cadastrados.";
      ingredientsBox.appendChild(emptyIngredients);
    }

    const stepsBox = document.createElement("div");
    const stepsTitle = document.createElement("strong");
    stepsTitle.className = "details-title";
    stepsTitle.textContent = "Preparo";
    stepsBox.appendChild(stepsTitle);

    if (Array.isArray(recipe.steps) && recipe.steps.length) {
      stepsBox.appendChild(createListFromValues(recipe.steps, true));
    } else {
      const emptySteps = document.createElement("p");
      emptySteps.className = "small-muted";
      emptySteps.textContent = "Sem passos cadastrados.";
      stepsBox.appendChild(emptySteps);
    }

    detailsGrid.append(ingredientsBox, stepsBox);
    details.appendChild(detailsGrid);

    if (recipe.notes) {
      const notes = document.createElement("p");
      notes.className = "notes-box";
      notes.textContent = `Observacoes: ${recipe.notes}`;
      details.appendChild(notes);
    }

    article.appendChild(details);

    const actions = document.createElement("div");
    actions.className = "recipe-actions";

    if (itemOptions.showCooked) {
      const cookedBtn = document.createElement("button");
      cookedBtn.type = "button";
      cookedBtn.dataset.action = "cooked";
      cookedBtn.className = "action-btn btn-success";
      cookedBtn.textContent = "Marcar feita hoje";
      actions.appendChild(cookedBtn);
    }

    if (itemOptions.showClearCooked && recipe.lastCookedAt) {
      const clearCookedBtn = document.createElement("button");
      clearCookedBtn.type = "button";
      clearCookedBtn.dataset.action = "clear-cooked";
      clearCookedBtn.className = "action-btn btn-muted";
      clearCookedBtn.textContent = "Limpar historico";
      actions.appendChild(clearCookedBtn);
    }

    if (itemOptions.editMode === "button") {
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.dataset.action = "edit";
      editBtn.className = "action-btn btn-info";
      editBtn.textContent = "Editar";
      actions.appendChild(editBtn);
    }

    if (itemOptions.editMode === "link") {
      const editLink = document.createElement("a");
      editLink.className = "action-btn btn-info";
      editLink.href = `products.html?edit=${encodeURIComponent(recipe.id)}`;
      editLink.textContent = "Editar";
      actions.appendChild(editLink);
    }

    if (itemOptions.showDelete) {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.dataset.action = "delete";
      deleteBtn.className = "action-btn btn-danger";
      deleteBtn.textContent = "Excluir";
      actions.appendChild(deleteBtn);
    }

    article.appendChild(actions);
    li.appendChild(article);

    return li;
  }

  function renderEmptyState(listEl, message) {
    listEl.innerHTML = "";

    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = message;

    listEl.appendChild(li);
  }

  function renderRecipeList(listEl, recipes, options = {}, emptyMessage = "Nenhuma receita encontrada.") {
    if (!listEl) return;

    listEl.innerHTML = "";

    if (!recipes.length) {
      renderEmptyState(listEl, emptyMessage);
      return;
    }

    for (const recipe of recipes) {
      listEl.appendChild(createRecipeListItem(recipe, options));
    }
  }

  function resolveRecipeAction(event, listEl) {
    if (!listEl) return null;

    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget || !listEl.contains(actionTarget)) return null;

    const recipeItem = actionTarget.closest("[data-recipe-id]");
    if (!recipeItem) return null;

    const action = actionTarget.dataset.action;
    const recipeId = recipeItem.dataset.recipeId;

    if (!action || !recipeId) return null;

    return {
      action,
      recipeId,
    };
  }

  function executeSharedRecipeAction(action, recipeId) {
    if (action === "favorite") {
      const updated = dbApi.toggleFavorite(recipeId);
      return `Favorito atualizado: ${updated.title}.`;
    }

    if (action === "cooked") {
      const updated = dbApi.markCookedNow(recipeId);
      return `Receita marcada como feita hoje: ${updated.title}.`;
    }

    if (action === "clear-cooked") {
      const updated = dbApi.clearLastCooked(recipeId);
      return `Historico de preparo limpo: ${updated.title}.`;
    }

    if (action === "delete") {
      const recipe = dbApi.getRecipeById(recipeId);
      if (!recipe) {
        throw new Error("Receita nao encontrada.");
      }

      const confirmed = window.confirm(`Excluir a receita "${recipe.title}"?`);
      if (!confirmed) return "";

      dbApi.deleteRecipe(recipeId);
      return `Receita excluida: ${recipe.title}.`;
    }

    return "";
  }

  function sanitizeOwnerSignatureConfig(config) {
    const normalizedName = dbApi.normalizeText(config?.name);
    const parsedSize = Number(config?.size);
    const normalizedSize = Number.isFinite(parsedSize)
      ? Math.min(46, Math.max(16, Math.round(parsedSize)))
      : DEFAULT_OWNER_SIGNATURE.size;
    const normalizedFont = OWNER_SIGNATURE_FONT_MAP[config?.font]
      ? config.font
      : DEFAULT_OWNER_SIGNATURE.font;

    return {
      name: normalizedName || DEFAULT_OWNER_SIGNATURE.name,
      size: normalizedSize,
      font: normalizedFont,
    };
  }

  function loadOwnerSignatureConfig() {
    try {
      const raw = window.localStorage.getItem(OWNER_SIGNATURE_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_OWNER_SIGNATURE };

      const parsed = JSON.parse(raw);
      return sanitizeOwnerSignatureConfig(parsed);
    } catch {
      return { ...DEFAULT_OWNER_SIGNATURE };
    }
  }

  function saveOwnerSignatureConfig(config) {
    try {
      window.localStorage.setItem(OWNER_SIGNATURE_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignora erro de armazenamento no navegador.
    }
  }

  function applyOwnerSignatureConfig(config, syncInputs = true) {
    if (!home.ownerSignatureName) return;

    const safeConfig = sanitizeOwnerSignatureConfig(config);
    const selectedFont = OWNER_SIGNATURE_FONT_MAP[safeConfig.font];

    home.ownerSignatureName.textContent = safeConfig.name;
    home.ownerSignatureName.style.fontFamily = selectedFont;
    home.ownerSignatureName.style.fontSize = `${safeConfig.size}px`;

    if (syncInputs) {
      if (home.ownerSignatureInput) home.ownerSignatureInput.value = safeConfig.name;
      if (home.ownerSignatureSize) home.ownerSignatureSize.value = String(safeConfig.size);
      if (home.ownerSignatureFont) home.ownerSignatureFont.value = safeConfig.font;
    }

    if (home.ownerSignatureSizeLabel) home.ownerSignatureSizeLabel.textContent = `${safeConfig.size}px`;
  }

  function readOwnerSignatureInputs() {
    return sanitizeOwnerSignatureConfig({
      name: home.ownerSignatureInput?.value || "",
      size: home.ownerSignatureSize?.value || DEFAULT_OWNER_SIGNATURE.size,
      font: home.ownerSignatureFont?.value || DEFAULT_OWNER_SIGNATURE.font,
    });
  }

  function setOwnerSignatureEditorOpen(isOpen) {
    if (!home.ownerSignatureEditor || !home.ownerSignatureTrigger) return;

    const shouldOpen = Boolean(isOpen);
    home.ownerSignatureEditor.hidden = !shouldOpen;
    home.ownerSignatureTrigger.setAttribute("aria-expanded", shouldOpen ? "true" : "false");

    if (shouldOpen) {
      home.ownerSignatureInput?.focus();
      home.ownerSignatureInput?.select();
    }
  }

  function initOwnerSignatureEditor() {
    if (
      !home.ownerSignatureTrigger ||
      !home.ownerSignatureEditor ||
      !home.ownerSignatureName ||
      !home.ownerSignatureInput ||
      !home.ownerSignatureSize ||
      !home.ownerSignatureFont
    ) {
      return;
    }

    let savedConfig = loadOwnerSignatureConfig();
    let draftConfig = { ...savedConfig };
    applyOwnerSignatureConfig(savedConfig, true);

    const openEditor = () => {
      draftConfig = { ...savedConfig };
      applyOwnerSignatureConfig(draftConfig, true);
      setOwnerSignatureEditorOpen(true);
    };

    const closeEditor = (restoreSavedConfig = true) => {
      if (restoreSavedConfig) {
        applyOwnerSignatureConfig(savedConfig, true);
      }
      setOwnerSignatureEditorOpen(false);
    };

    const previewDraftFromInputs = () => {
      draftConfig = readOwnerSignatureInputs();
      applyOwnerSignatureConfig(draftConfig, false);
    };

    const saveDraftAndClose = () => {
      draftConfig = readOwnerSignatureInputs();
      savedConfig = { ...draftConfig };
      applyOwnerSignatureConfig(savedConfig, true);
      saveOwnerSignatureConfig(savedConfig);
      setOwnerSignatureEditorOpen(false);
    };

    home.ownerSignatureTrigger.addEventListener("click", () => {
      const isClosed = home.ownerSignatureEditor?.hidden !== false;
      if (isClosed) {
        openEditor();
        return;
      }
      closeEditor(true);
    });

    home.ownerSignatureInput.addEventListener("input", previewDraftFromInputs);
    home.ownerSignatureSize.addEventListener("input", previewDraftFromInputs);
    home.ownerSignatureFont.addEventListener("change", previewDraftFromInputs);
    home.ownerSignatureSaveBtn?.addEventListener("click", saveDraftAndClose);
    home.ownerSignatureCancelBtn?.addEventListener("click", () => closeEditor(true));

    document.addEventListener("click", (event) => {
      if (home.ownerSignatureEditor?.hidden !== false) return;

      const target = event.target;
      if (!(target instanceof Node)) return;

      if (home.ownerSignatureEditor.contains(target)) return;
      if (home.ownerSignatureTrigger?.contains(target)) return;

      closeEditor(true);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (home.ownerSignatureEditor?.hidden !== false) return;
      closeEditor(true);
    });
  }

  function setActiveHomeQuickFilter(filterKey) {
    const allowed = ["all", "favorites", "cafes", "lanches", "tortas", "jantares", "doces", "recent"];
    const nextFilter = allowed.includes(filterKey) ? filterKey : "all";
    homeState.quickFilter = nextFilter;

    const containers = [home.quickFilters, home.metricFilters];
    for (const container of containers) {
      if (!container) continue;
      const controls = Array.from(container.querySelectorAll("[data-home-filter]"));
      for (const control of controls) {
        const isActive = control.dataset.homeFilter === nextFilter;
        control.classList.toggle("is-active", isActive);
        if (control.tagName === "BUTTON") {
          control.setAttribute("aria-pressed", isActive ? "true" : "false");
        }
      }
    }
  }

  function applyHomeQuickFilter(recipes) {
    if (homeState.quickFilter === "favorites") {
      return recipes.filter((recipe) => recipe.favorite);
    }

    function normalizeCategory(value) {
      return dbApi.normalizeText(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR");
    }

    function matchesCategory(recipe, expectedCategory) {
      return normalizeCategory(recipe.category) === normalizeCategory(expectedCategory);
    }

    if (homeState.quickFilter === "cafes") {
      return recipes.filter((recipe) => matchesCategory(recipe, "cafes"));
    }

    if (homeState.quickFilter === "lanches") {
      return recipes.filter((recipe) => matchesCategory(recipe, "lanches"));
    }

    if (homeState.quickFilter === "tortas") {
      return recipes.filter((recipe) => matchesCategory(recipe, "tortas"));
    }

    if (homeState.quickFilter === "jantares") {
      return recipes.filter((recipe) => matchesCategory(recipe, "jantares"));
    }

    if (homeState.quickFilter === "doces") {
      return recipes.filter((recipe) => matchesCategory(recipe, "doces"));
    }

    if (homeState.quickFilter === "recent") {
      return recipes.filter((recipe) => isWithinLastDays(recipe.updatedAt, 14));
    }

    return recipes;
  }

  function initHomePage() {
    if (!home.recipesList) return;

    initOwnerSignatureEditor();

    home.quickForm?.addEventListener("submit", (event) => {
      event.preventDefault();

      try {
        const saved = dbApi.upsertRecipe({
          title: home.quickTitle?.value || "",
          category: home.quickCategory?.value || "",
          prepMinutes: home.quickPrepMinutes?.value || "",
          ingredients: dbApi.splitMultiline(home.quickIngredients?.value || ""),
          steps: dbApi.splitMultiline(home.quickSteps?.value || ""),
        });

        home.quickForm.reset();
        renderHomePage();
        refreshSyncStatus(`Receita salva: ${saved.title}.`);
      } catch (error) {
        window.alert(`Nao foi possivel salvar: ${error.message}`);
      }
    });

    home.quickClearBtn?.addEventListener("click", () => {
      home.quickForm?.reset();
    });

    home.quickFilters?.addEventListener("click", (event) => {
      const filterButton = event.target.closest("[data-home-filter]");
      if (!filterButton || !home.quickFilters.contains(filterButton)) return;

      setActiveHomeQuickFilter(filterButton.dataset.homeFilter || "all");
      renderHomePage();
    });

    home.metricFilters?.addEventListener("click", (event) => {
      const filterButton = event.target.closest("[data-home-filter]");
      if (!filterButton || !home.metricFilters.contains(filterButton)) return;

      setActiveHomeQuickFilter(filterButton.dataset.homeFilter || "all");
      renderHomePage();
    });

    home.filtersForm?.addEventListener("input", () => {
      renderHomePage();
    });

    home.clearFiltersBtn?.addEventListener("click", () => {
      if (home.searchInput) home.searchInput.value = "";
      if (home.categoryFilter) home.categoryFilter.value = "";
      if (home.sortSelect) home.sortSelect.value = "updated";
      if (home.favoriteOnly) home.favoriteOnly.checked = false;
      setActiveHomeQuickFilter("all");
      renderHomePage();
    });

    home.recipesList.addEventListener("click", (event) => {
      const actionInfo = resolveRecipeAction(event, home.recipesList);
      if (!actionInfo) return;

      try {
        const message = executeSharedRecipeAction(actionInfo.action, actionInfo.recipeId);
        renderHomePage();
        refreshSyncStatus(message);
      } catch (error) {
        window.alert(`Falha na acao: ${error.message}`);
      }
    });

    setActiveHomeQuickFilter(homeState.quickFilter);
    renderHomePage();
  }

  function renderHomePage() {
    refreshCategorySelect(home.categoryFilter, "Todas as categorias");

    const allRecipes = dbApi.getRecipes();
    const filtered = filterRecipesByTextAndCategory(
      allRecipes,
      home.searchInput?.value || "",
      home.categoryFilter?.value || "",
    );

    const quickFiltered = applyHomeQuickFilter(filtered);
    const favoriteOnly = Boolean(home.favoriteOnly?.checked);
    const visible = favoriteOnly
      ? quickFiltered.filter((recipe) => recipe.favorite)
      : quickFiltered;

    const sorted = sortRecipes(visible, home.sortSelect?.value || "updated");

    renderRecipeList(
      home.recipesList,
      sorted,
      {
        editMode: "link",
        showDelete: true,
        showCooked: true,
        showClearCooked: true,
      },
      "Nenhuma receita encontrada com esse filtro.",
    );

    if (home.stats) {
      const total = allRecipes.length;
      const favorites = allRecipes.filter((recipe) => recipe.favorite).length;

      function normalizeCategory(value) {
        return dbApi.normalizeText(value)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLocaleLowerCase("pt-BR");
      }

      function countByCategory(categoryName) {
        return allRecipes.filter((recipe) => normalizeCategory(recipe.category) === normalizeCategory(categoryName)).length;
      }

      const cafesCount = countByCategory("cafes");
      const lanchesCount = countByCategory("lanches");
      const tortasCount = countByCategory("tortas");
      const jantaresCount = countByCategory("jantares");
      const docesCount = countByCategory("doces");
      const recentCount = allRecipes.filter((recipe) => isWithinLastDays(recipe.updatedAt, 14)).length;

      if (home.metricTotal) home.metricTotal.textContent = String(total);
      if (home.metricFavorites) home.metricFavorites.textContent = String(favorites);
      if (home.metricCafes) home.metricCafes.textContent = String(cafesCount);
      if (home.metricLanches) home.metricLanches.textContent = String(lanchesCount);
      if (home.metricTortas) home.metricTortas.textContent = String(tortasCount);
      if (home.metricJantares) home.metricJantares.textContent = String(jantaresCount);
      if (home.metricDoces) home.metricDoces.textContent = String(docesCount);
      if (home.metricRecent) home.metricRecent.textContent = String(recentCount);

      let filterLabel = "Todas";
      if (homeState.quickFilter === "favorites") filterLabel = "Favoritas";
      if (homeState.quickFilter === "cafes") filterLabel = "Cafés";
      if (homeState.quickFilter === "lanches") filterLabel = "Lanches";
      if (homeState.quickFilter === "tortas") filterLabel = "Tortas";
      if (homeState.quickFilter === "jantares") filterLabel = "Jantares";
      if (homeState.quickFilter === "doces") filterLabel = "Doces";
      if (homeState.quickFilter === "recent") filterLabel = "Últimas atualizações";

      home.stats.textContent = `${sorted.length} visiveis | Filtro rapido: ${filterLabel}`;
    }
  }

  function initCatalogPage() {
    if (!catalog.form || !catalog.recipesList) return;

    catalog.form.addEventListener("submit", (event) => {
      event.preventDefault();

      try {
        const isEditing = Boolean(dbApi.normalizeText(catalog.recipeId?.value));

        const saved = dbApi.upsertRecipe({
          id: catalog.recipeId?.value || "",
          title: catalog.title?.value || "",
          category: catalog.category?.value || "",
          prepMinutes: catalog.prepMinutes?.value || "",
          servings: catalog.servings?.value || "",
          difficulty: catalog.difficulty?.value || "",
          tags: catalog.tags?.value || "",
          ingredients: dbApi.splitMultiline(catalog.ingredients?.value || ""),
          steps: dbApi.splitMultiline(catalog.steps?.value || ""),
          notes: catalog.notes?.value || "",
          favorite: Boolean(catalog.favorite?.checked),
        });

        if (isEditing) {
          loadRecipeIntoForm(saved.id, false);
        } else {
          resetCatalogForm();
        }

        renderCatalogList();
        refreshSyncStatus(`Receita salva: ${saved.title}.`);
      } catch (error) {
        window.alert(`Nao foi possivel salvar: ${error.message}`);
      }
    });

    catalog.resetBtn?.addEventListener("click", () => {
      resetCatalogForm();
      clearCatalogEditQuery();
    });

    catalog.searchInput?.addEventListener("input", () => {
      renderCatalogList();
    });

    catalog.recipesList.addEventListener("click", (event) => {
      const actionInfo = resolveRecipeAction(event, catalog.recipesList);
      if (!actionInfo) return;

      if (actionInfo.action === "edit") {
        const loaded = loadRecipeIntoForm(actionInfo.recipeId, true);
        if (!loaded) {
          window.alert("Receita nao encontrada para edicao.");
        }
        return;
      }

      try {
        const editedId = dbApi.normalizeText(catalog.recipeId?.value);
        const message = executeSharedRecipeAction(actionInfo.action, actionInfo.recipeId);

        if (editedId && editedId === actionInfo.recipeId) {
          if (actionInfo.action === "delete") {
            resetCatalogForm();
            clearCatalogEditQuery();
          } else {
            loadRecipeIntoForm(editedId, false);
          }
        }

        renderCatalogList();
        refreshSyncStatus(message);
      } catch (error) {
        window.alert(`Falha na acao: ${error.message}`);
      }
    });

    const params = new URLSearchParams(window.location.search);
    const editId = dbApi.normalizeText(params.get("edit"));
    if (editId) {
      loadRecipeIntoForm(editId, false);
    } else {
      resetCatalogForm();
    }

    renderCatalogList();
  }

  function setCatalogFormMode(isEditing, title = "") {
    if (!catalog.formTitle || !catalog.saveBtn) return;

    if (isEditing) {
      catalog.formTitle.textContent = `Editando receita: ${title}`;
      catalog.saveBtn.textContent = "Salvar alteracoes";
      return;
    }

    catalog.formTitle.textContent = "Cadastro completo";
    catalog.saveBtn.textContent = "Salvar receita";
  }

  function clearCatalogEditQuery() {
    if (window.location.pathname.endsWith("products.html")) {
      window.history.replaceState(null, "", "products.html");
    }
  }

  function applyCatalogEditQuery(recipeId) {
    const id = dbApi.normalizeText(recipeId);
    if (!id) {
      clearCatalogEditQuery();
      return;
    }

    window.history.replaceState(null, "", `products.html?edit=${encodeURIComponent(id)}`);
  }

  function resetCatalogForm() {
    catalog.form?.reset();
    if (catalog.recipeId) catalog.recipeId.value = "";
    setCatalogFormMode(false);
  }

  function loadRecipeIntoForm(recipeId, smoothScroll) {
    const recipe = dbApi.getRecipeById(recipeId);
    if (!recipe) return false;

    if (catalog.recipeId) catalog.recipeId.value = recipe.id;
    if (catalog.title) catalog.title.value = recipe.title || "";
    if (catalog.category) catalog.category.value = recipe.category || "";
    if (catalog.prepMinutes) catalog.prepMinutes.value = recipe.prepMinutes || "";
    if (catalog.servings) catalog.servings.value = recipe.servings || "";
    if (catalog.difficulty) catalog.difficulty.value = recipe.difficulty || "";
    if (catalog.tags) catalog.tags.value = Array.isArray(recipe.tags) ? recipe.tags.join(", ") : "";
    if (catalog.ingredients) catalog.ingredients.value = dbApi.joinMultiline(recipe.ingredients || []);
    if (catalog.steps) catalog.steps.value = dbApi.joinMultiline(recipe.steps || []);
    if (catalog.notes) catalog.notes.value = recipe.notes || "";
    if (catalog.favorite) catalog.favorite.checked = Boolean(recipe.favorite);

    setCatalogFormMode(true, recipe.title);
    applyCatalogEditQuery(recipe.id);

    if (smoothScroll) {
      catalog.form?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return true;
  }

  function renderCatalogList() {
    const allRecipes = dbApi.getRecipes();
    const filtered = filterRecipesByTextAndCategory(
      allRecipes,
      catalog.searchInput?.value || "",
      "",
    );

    const sorted = sortRecipes(filtered, "updated");

    renderRecipeList(
      catalog.recipesList,
      sorted,
      {
        editMode: "button",
        showDelete: true,
        showCooked: true,
        showClearCooked: true,
      },
      "Nenhuma receita encontrada nessa busca.",
    );

    if (catalog.stats) {
      catalog.stats.textContent = `${sorted.length} receitas exibidas`;
    }
  }

  function initHistoryPage() {
    if (!historyPage.cookedList || !historyPage.pendingList) return;

    historyPage.filtersForm?.addEventListener("input", () => {
      renderHistoryPage();
    });

    historyPage.clearBtn?.addEventListener("click", () => {
      if (historyPage.searchInput) historyPage.searchInput.value = "";
      if (historyPage.categoryFilter) historyPage.categoryFilter.value = "";
      if (historyPage.periodFilter) historyPage.periodFilter.value = "all";
      renderHistoryPage();
    });

    historyPage.cookedList.addEventListener("click", (event) => {
      const actionInfo = resolveRecipeAction(event, historyPage.cookedList);
      if (!actionInfo) return;

      try {
        const message = executeSharedRecipeAction(actionInfo.action, actionInfo.recipeId);
        renderHistoryPage();
        refreshSyncStatus(message);
      } catch (error) {
        window.alert(`Falha na acao: ${error.message}`);
      }
    });

    historyPage.pendingList.addEventListener("click", (event) => {
      const actionInfo = resolveRecipeAction(event, historyPage.pendingList);
      if (!actionInfo) return;

      try {
        const message = executeSharedRecipeAction(actionInfo.action, actionInfo.recipeId);
        renderHistoryPage();
        refreshSyncStatus(message);
      } catch (error) {
        window.alert(`Falha na acao: ${error.message}`);
      }
    });

    renderHistoryPage();
  }

  function renderHistoryPage() {
    refreshCategorySelect(historyPage.categoryFilter, "Todas as categorias");

    const allRecipes = dbApi.getRecipes();
    const filtered = filterRecipesByTextAndCategory(
      allRecipes,
      historyPage.searchInput?.value || "",
      historyPage.categoryFilter?.value || "",
    );

    const periodValue = historyPage.periodFilter?.value || "all";

    let cookedRecipes = filtered.filter((recipe) => Boolean(recipe.lastCookedAt));
    if (periodValue !== "all") {
      cookedRecipes = cookedRecipes.filter((recipe) => isWithinLastDays(recipe.lastCookedAt, Number(periodValue)));
    }

    cookedRecipes.sort((a, b) => {
      const aTime = a.lastCookedAt ? new Date(a.lastCookedAt).getTime() : 0;
      const bTime = b.lastCookedAt ? new Date(b.lastCookedAt).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.title.localeCompare(b.title, "pt-BR");
    });

    const pendingRecipes = filtered
      .filter((recipe) => !recipe.lastCookedAt)
      .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

    renderRecipeList(
      historyPage.cookedList,
      cookedRecipes,
      {
        editMode: "link",
        showDelete: false,
        showCooked: true,
        showClearCooked: true,
      },
      "Nenhuma receita preparada nesse filtro.",
    );

    renderRecipeList(
      historyPage.pendingList,
      pendingRecipes,
      {
        editMode: "link",
        showDelete: false,
        showCooked: true,
        showClearCooked: false,
      },
      "Parabens, todas as receitas filtradas ja foram preparadas.",
    );

    if (historyPage.stats) {
      historyPage.stats.textContent = `${cookedRecipes.length} preparadas | ${pendingRecipes.length} pendentes`;
    }
  }
})();

