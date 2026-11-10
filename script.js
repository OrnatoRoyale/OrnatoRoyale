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
      const card = document.createElement("a");
      card.className = "product-card";
      card.href = `produto.html?id=${encodeURIComponent(product.id)}`;
      card.setAttribute("aria-label", `Ver detalhes de ${product.nome || "produto"}`);
      const gallery = document.createElement("div");
      gallery.className = "product-gallery";
      const images = Array.isArray(product.imagens) && product.imagens.length
        ? product.imagens
        : (product.imagem ? [product.imagem] : []);
      if (images.length) {
        images.forEach((src, index) => {
          const image = document.createElement("img");
          image.className = "product-image";
          image.src = src;
          image.alt = `${product.nome || "Produto Ornato"} — foto ${index + 1}`;
          image.loading = "lazy";
          image.onerror = () => { image.style.visibility = "hidden"; };
          gallery.append(image);
        });
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "product-image";
        placeholder.setAttribute("aria-hidden", "true");
        gallery.append(placeholder);
      }
      card.append(gallery);
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

  function renderProductDetail() {
    const container = $("#produto-detalhe");
    if (!container) return;
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");
    const product = (state.catalog.produtos || []).find((item) => String(item.id) === String(productId));
    if (!product) {
      container.innerHTML = '<div class="product-not-found"><span class="section-kicker">SELEÇÃO ORNATO</span><h1>Produto não encontrado.</h1><p>Este item pode não estar mais disponível no catálogo.</p><a class="button button-dark" href="produtos.html">Voltar aos produtos <i class="fa-solid fa-arrow-right"></i></a></div>';
      document.title = "Produto não encontrado | Ornato";
      return;
    }

    document.title = `${product.nome} | Ornato — Moda feminina`;
    const categoryName = state.catalog.categorias.find((item) => item.id === product.categoria)?.nome || "Coleção Ornato";
    const images = Array.isArray(product.imagens) && product.imagens.length
      ? product.imagens
      : (product.imagem ? [product.imagem] : []);

    const layout = document.createElement("div");
    layout.className = "product-detail-layout";
    const gallery = document.createElement("div");
    gallery.className = "product-detail-gallery";
    images.forEach((src, index) => {
      const image = document.createElement("img");
      image.src = src;
      image.alt = `${product.nome} — foto ${index + 1}`;
      image.loading = index > 0 ? "lazy" : "eager";
      image.onerror = () => { image.hidden = true; };
      gallery.append(image);
    });

    const info = document.createElement("div");
    info.className = "product-detail-info";
    const breadcrumb = document.createElement("div");
    breadcrumb.className = "product-detail-breadcrumb";
    breadcrumb.textContent = `Produtos / ${categoryName}`;
    const title = document.createElement("h1");
    title.textContent = product.nome || "Produto Ornato";
    const price = document.createElement("div");
    price.className = "product-detail-price";
    price.textContent = product.preco || "Consulte informações";
    const descriptionTitle = document.createElement("h2");
    descriptionTitle.textContent = "Sobre a peça";
    const description = document.createElement("p");
    description.className = "product-detail-description";
    description.textContent = product.descricao || "Uma escolha especial da seleção Ornato.";
    const note = document.createElement("p");
    note.className = "product-detail-note";
    note.textContent = "Entre em contato com a Ornato para consultar disponibilidade e detalhes desta peça.";
    const buy = document.createElement("button");
    buy.type = "button";
    buy.className = "product-buy-button";
    buy.textContent = "Comprar";
    buy.setAttribute("aria-label", "Comprar — botão demonstrativo, sem funcionalidade");
    const back = document.createElement("a");
    back.className = "product-back-link";
    back.href = "produtos.html";
    back.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Voltar para a coleção';
    info.append(breadcrumb, title, price, descriptionTitle, description, note, buy, back);
    layout.append(gallery, info);
    container.replaceChildren(layout);
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
    if (status === 401) return "A chave da Groq é inválida ou foi revogada. Confira GROQ_API_KEY no arquivo config.js.";
    if (status === 403) return "A Groq recusou o acesso. Confira as permissões e os limites da sua conta.";
    if (status === 429) return "O limite de consultas da Groq foi atingido. Aguarde um pouco e tente novamente.";
    if (status === 400) return message ? `A Groq recusou a solicitação: ${message}` : "A Groq não aceitou os parâmetros enviados. Confira o modelo configurado.";
    if (status === 404) return "O modelo configurado não foi encontrado. Confira GROQ_MODEL no arquivo config.js.";
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
    const apiKey = typeof config.GROQ_API_KEY === "string" ? config.GROQ_API_KEY.trim() : "";
    const missingApiKey = !apiKey || ["cole_sua_chave_aqui", "gsk_sua_chave_aqui", "api_aqui"].includes(apiKey.toLowerCase());
    if (missingApiKey) {
      appendMessage("O chatbot ainda não foi conectado à Groq. Adicione sua chave no campo GROQ_API_KEY do arquivo config.js.", "bot-message");
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

    const messages = [
      { role: "system", content: systemInstruction },
      ...state.history,
      { role: "user", content: text }
    ];

    try {
      const model = config.GROQ_MODEL || "openai/gpt-oss-120b";
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          max_completion_tokens: 1200,
          reasoning_effort: "low",
          include_reasoning: false
        })
      });
      const data = await response.json().catch(() => ({}));
      loading.remove();
      if (!response.ok) {
        appendMessage(getApiError(data, response.status), "bot-message");
        return;
      }
      const answer = data.choices?.[0]?.message?.content?.trim() || "";
      if (!answer) {
        appendMessage("A Groq respondeu, mas não retornou um texto visível. Tente novamente.", "bot-message");
        console.warn("Resposta sem conteúdo textual da Groq:", data);
        return;
      }
      appendMessage(answer, "bot-message");
      state.history.push({ role: "user", content: text }, { role: "assistant", content: answer });
      // Keep the request context bounded during a long demonstration.
      if (state.history.length > 12) state.history = state.history.slice(-12);
    } catch (error) {
      loading.remove();
      console.error("Erro ao consultar a Groq:", error);
      appendMessage("Não consegui conectar à Groq agora. Verifique a conexão e tente novamente.", "bot-message");
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
    const year = $("#year"); if (year) year.textContent = new Date().getFullYear();
    const menuToggle = $("#menu-toggle"); if (menuToggle) menuToggle.addEventListener("click", () => $("#main-nav")?.classList.toggle("open"));
    document.querySelectorAll("#main-nav a").forEach((link) => link.addEventListener("click", () => $("#main-nav")?.classList.remove("open")));
    setupChat();
    try {
      const [knowledge, catalog] = await Promise.all([
        loadJson("data/conhecimento.json"),
        loadJson("data/produtos.json")
      ]);
      state.knowledge = knowledge;
      state.catalog = catalog;
      const aboutText = $("#sobre-texto"); if (aboutText) aboutText.textContent = knowledge.sobre || "Conheça a essência da Ornato.";
      const contact = knowledge.atendimento || {};
      const details = [contact.whatsapp, contact.email, contact.horario].filter(Boolean);
      const footerContact = $("#footer-contact"); if (footerContact) footerContact.textContent = details.length ? details.join(" • ") : "Entre em contato para saber mais sobre a Ornato.";
      renderCategories();
      renderProducts();
      renderProductDetail();
    } catch (error) {
      console.error("Erro ao carregar os dados do site:", error);
      if ($("#sobre-texto")) $("#sobre-texto").textContent = "As informações da marca estarão disponíveis em breve.";
      if ($("#categorias-container")) $("#categorias-container").textContent = "Não foi possível carregar as categorias.";
      if ($("#produtos-container")) $("#produtos-container").textContent = "Não foi possível carregar o catálogo. Confira os arquivos JSON.";
      appendMessage("Não consegui carregar as informações da loja. O catálogo e as respostas personalizadas podem ficar limitados.", "bot-message");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();