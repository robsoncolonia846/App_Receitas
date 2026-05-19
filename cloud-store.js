(function () {
  const PLACEHOLDER_VALUES = new Set(["", "COLE_A_URL_DO_SUPABASE", "COLE_A_CHAVE_ANON_PUBLIC"]);

  let client = null;

  function getConfig() {
    return window.RECEITAS_CLOUD_CONFIG || {};
  }

  function isConfigured() {
    const config = getConfig();
    return !PLACEHOLDER_VALUES.has(String(config.supabaseUrl || "").trim())
      && !PLACEHOLDER_VALUES.has(String(config.supabaseAnonKey || "").trim())
      && Boolean(window.supabase?.createClient);
  }

  function getClient() {
    if (client) {
      return client;
    }

    const config = getConfig();
    client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    return client;
  }

  async function loadRecipes() {
    if (!isConfigured()) {
      return [];
    }

    const config = getConfig();
    const { data, error } = await getClient()
      .from(config.tableName || "recipe_cloud_documents")
      .select("payload")
      .eq("id", config.documentId || "receitas-da-casa")
      .maybeSingle();

    if (error) {
      throw error;
    }

    return Array.isArray(data?.payload?.recipes) ? data.payload.recipes : [];
  }

  async function saveRecipes(recipes) {
    if (!isConfigured()) {
      return;
    }

    const config = getConfig();
    const payload = {
      id: config.documentId || "receitas-da-casa",
      payload: {
        app: "Receitas da Casa",
        version: 1,
        savedAt: new Date().toISOString(),
        recipes
      },
      updated_at: new Date().toISOString()
    };

    const { error } = await getClient()
      .from(config.tableName || "recipe_cloud_documents")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      throw error;
    }
  }

  window.RecipeCloudStore = {
    isConfigured,
    loadRecipes,
    saveRecipes
  };
})();
