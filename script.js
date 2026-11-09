(() => {
  const $ = (selector) => document.querySelector(selector);
  const state = { knowledge: null, catalog: { categorias: [], produtos: [] }, history: [], busy: false, category: "todas" };

  async function loadJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Não foi possível carregar ${path} (${response.status}).`);
    return response.json();
  }

  function renderCategories() {
    const container = $("#categorias-container");
    if (!container) return;
    const categories = [{ id: "todas", nome: "Todos" }, ...(state.catalog.categorias || [])];
    container.replaceChildren();
    categories.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `category-pill${state.category === category.id ? " active" : ""}`;
      button.textContent = category.nome;
      button.addEventListener("click", () => {
        state.category = category.id;
        renderCategories();
        renderProducts();
      });
      container.append(button);
    });
  }

  function renderProducts() {
    const container = $("#produtos-container");
    if (!container) return;
    container.replaceChildren();
    const products = (state.catalog.produtos || []).filter((product) =>
      state.category === "todas" || product.categoria === state.category
    );
    if (!products.length) {
      const empty = document.createElement("p");
      empty.className = "empty-products";
      empty.textContent = "Nenhum produto cadastrado nesta categoria ainda.";
      container.append(empty);
      return;
    }
    products.forEach((product) => {
      const card = document.createElement("article");
      card.className = "product-card";
      if (product.imagem) {
        const image = document.createElement("img");
        image.className = "product-image";
        image.src = product.imagem;
        image.alt = product.nome || "Produto Ornato";
        image.loading = "lazy";
        image.onerror = () => { image.style.visibility = "hidden"; };
        card.append(image);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "product-image";
        placeholder.setAttribute("aria-hidden", "true");
        card.append(placeholder);
      }
      const info = document.createElement("div");
      info.className = "product-info";
      const category = document.createElement("div");
      category.className = "product-category";
      category.textContent = (state.catalog.categorias.find((item) => item.id === product.categoria)?.nome || product.categoria || "Ornato");
      const name = document.createElement("h3");
      name.textContent = product.nome || "Produto";
      const description = document.createElement("p");
      description.textContent = product.descricao || "";
      const price = document.createElement("div");
      price.className = "product-price";
      price.textContent = product.preco || "Consulte informações";
      info.append(category, name, description, price);
      card.append(info);
      container.append(card);
    });
  }

  function appendMessage(text, role) {
    const messages = $("#chat-messages");
    const bubble = document.createElement("div");
    bubble.className = `message ${role}`;
    // textContent prevents HTML supplied by a user or by the model from being executed.
    bubble.textContent = text;
    messages.append(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }

  function getApiError(data, status) {
    const message = data?.error?.message || "";
    if (status === 429) return "O limite gratuito de consultas foi atingido por enquanto. Tente novamente mais tarde.";
    if (status === 400 || status === 403) return "A API recusou a solicitação. Confira a chave, o modelo e as permissões no arquivo config.js.";
    if (status === 404) return "O modelo configurado não foi encontrado. Confira GEMINI_MODEL no arquivo config.js.";
    return message ? `Não consegui responder: ${message}` : "Não consegui obter uma resposta agora. Tente novamente em instantes.";
  }

  async function sendMessage(rawText) {
    const text = rawText.trim();
    if (!text || state.busy) return;
    appendMessage(text, "user-message");
    const input = $("#chat-input");
    const send = $("#chat-send");
    input.value = "";
    const config = window.CONFIG || {};
    if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === "SUA_CHAVE_DA_API_AQUI") {
      appendMessage("O chatbot ainda não foi conectado à API. Adicione sua chave no arquivo config.js para ativar as respostas.", "bot-message");
      return;
    }

    state.busy = true;
    send.disabled = true;
    const loading = appendMessage("Estou preparando uma resposta…", "bot-message");
    const systemInstruction = [
      config.SYSTEM_INSTRUCTIONS || "",
      "Informações oficiais da loja (JSON):",
      JSON.stringify(state.knowledge || {}),
      "Catálogo de produtos (JSON):",
      JSON.stringify(state.catalog || {})
    ].join("\n\n");

    const contents = [...state.history, { role: "user", parts: [{ text }] }];
    try {
      const model = config.GEMINI_MODEL || "gemini-2.5-flash";
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.GEMINI_API_KEY)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 700 }
        })
      });
      const data = await response.json().catch(() => ({}));
      loading.remove();
      if (!response.ok) {
        appendMessage(getApiError(data, response.status), "bot-message");
        return;
      }
      const answer = (data.candidates?.[0]?.content?.parts || []).map((part) => part.text || "").join("\n").trim();
      if (!answer) {
        appendMessage("Não consegui formular uma resposta para essa pergunta. Pode tentar de outra maneira?", "bot-message");
        return;
      }
      appendMessage(answer, "bot-message");
      state.history.push({ role: "user", parts: [{ text }] }, { role: "model", parts: [{ text: answer }] });
      // Keep the request context bounded during a long demonstration.
      if (state.history.length > 12) state.history = state.history.slice(-12);
    } catch (error) {
      loading.remove();
      console.error("Erro ao consultar o Gemini:", error);
      appendMessage("Não consegui conectar ao serviço agora. Verifique a conexão e tente novamente.", "bot-message");
    } finally {
      state.busy = false;
      send.disabled = false;
      input.focus();
    }
  }

  function setupChat() {
    const body = $("#chat-body");
    const toggle = $("#chat-toggle");
    const icon = $("#chat-minimize-icon");
    toggle.addEventListener("click", () => {
      const hidden = body.classList.toggle("is-hidden");
      toggle.setAttribute("aria-expanded", String(!hidden));
      icon.className = hidden ? "fa-solid fa-plus chat-chevron" : "fa-solid fa-minus chat-chevron";
    });
    $("#chat-form").addEventListener("submit", (event) => {
      event.preventDefault();
      sendMessage($("#chat-input").value);
    });
    document.querySelectorAll(".suggestion-chip").forEach((button) => {
      button.addEventListener("click", () => sendMessage(button.textContent));
    });
  }

  async function init() {
    $("#year").textContent = new Date().getFullYear();
    $("#menu-toggle").addEventListener("click", () => $("#main-nav").classList.toggle("open"));
    document.querySelectorAll("#main-nav a").forEach((link) => link.addEventListener("click", () => $("#main-nav").classList.remove("open")));
    setupChat();
    try {
      const [knowledge, catalog] = await Promise.all([
        loadJson("data/conhecimento.json"),
        loadJson("data/produtos.json")
      ]);
      state.knowledge = knowledge;
      state.catalog = catalog;
      $("#sobre-texto").textContent = knowledge.sobre || "Conheça a essência da Ornato.";
      const contact = knowledge.atendimento || {};
      const details = [contact.whatsapp, contact.email, contact.horario].filter(Boolean);
      $("#footer-contact").textContent = details.length ? details.join(" • ") : "Entre em contato para saber mais sobre a Ornato.";
      renderCategories();
      renderProducts();
    } catch (error) {
      console.error("Erro ao carregar os dados do site:", error);
      $("#sobre-texto").textContent = "As informações da marca estarão disponíveis em breve.";
      $("#categorias-container").textContent = "Não foi possível carregar as categorias.";
      $("#produtos-container").textContent = "Não foi possível carregar o catálogo. Confira os arquivos JSON.";
      appendMessage("Não consegui carregar as informações da loja. O catálogo e as respostas personalizadas podem ficar limitados.", "bot-message");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();