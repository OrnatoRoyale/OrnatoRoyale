(() => {
  const $ = (selector) => document.querySelector(selector);
  const state = { knowledge:null,catalog:{categorias:[],produtos:[]},history:[],busy:false,category:"todas",search:"",size:"todos",favoritesOnly:false,favorites:readFavorites() };
  function readFavorites(){try{return JSON.parse(localStorage.getItem("ornato-favoritos")||"[]").map(String);}catch{return [];}}
  function saveFavorites(){localStorage.setItem("ornato-favoritos",JSON.stringify(state.favorites));}
  function isFavorite(id){return state.favorites.includes(String(id));}
  function toggleFavorite(id){const k=String(id);state.favorites=isFavorite(k)?state.favorites.filter(x=>x!==k):[...state.favorites,k];saveFavorites();renderProducts();renderHomeSections();const b=$("#detail-favorite");if(b){b.classList.toggle("is-favorite",isFavorite(k));b.innerHTML=isFavorite(k)?'<i class="fa-solid fa-heart"></i> Salvo nos favoritos':'<i class="fa-regular fa-heart"></i> Adicionar aos favoritos';}}

  async function loadJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Não foi possível carregar ${path} (${response.status}).`);
    return response.json();
  }

  function renderCategories(){const box=$("#categorias-container");if(!box)return;const cats=[{id:"todas",nome:"Todas as peças"},...(state.catalog.categorias||[])];box.replaceChildren();cats.forEach(c=>{const b=document.createElement("button");b.type="button";b.className="category-pill"+(state.category===c.id?" active":"");b.textContent=c.nome;b.addEventListener("click",()=>{state.category=c.id;renderCategories();renderProducts();});box.append(b);});}
  function makeProductCard(p){const card=document.createElement("article");card.className="product-card";const link=document.createElement("a");link.className="product-card-link";link.href=`produto.html?id=${encodeURIComponent(p.id)}`;const gallery=document.createElement("div");gallery.className="product-gallery";const imgs=p.imagens||[];if(imgs.length){const im=document.createElement("img");im.className="product-image";im.src=imgs[0];im.alt=p.nome+" — foto 1";im.loading="lazy";gallery.append(im);}if(p.lancamento){const badge=document.createElement("span");badge.className="product-launch-badge";badge.textContent="NOVO LANÇAMENTO";gallery.append(badge);}const info=document.createElement("div");info.className="product-info";const cat=document.createElement("div");cat.className="product-category";cat.textContent=state.catalog.categorias.find(c=>c.id===p.categoria)?.nome||"Coleção Ornato";const name=document.createElement("h3");name.textContent=p.nome;const desc=document.createElement("p");desc.textContent=p.descricao||"";const price=document.createElement("div");price.className="product-price";price.textContent=p.preco||"Consulte informações";info.append(cat,name,desc,price);link.append(gallery,info);const fav=document.createElement("button");fav.type="button";fav.className="favorite-button"+(isFavorite(p.id)?" is-favorite":"");fav.setAttribute("aria-label",isFavorite(p.id)?"Remover dos favoritos":"Adicionar aos favoritos");fav.innerHTML=isFavorite(p.id)?'<i class="fa-solid fa-heart"></i>':'<i class="fa-regular fa-heart"></i>';fav.addEventListener("click",()=>toggleFavorite(p.id));card.append(link,fav);return card;}
  function renderProducts(){const box=$("#produtos-container");if(!box)return;box.replaceChildren();const list=(state.catalog.produtos||[]).filter(p=>(state.category==="todas"||p.categoria===state.category)&&(!state.favoritesOnly||isFavorite(p.id))&&(!state.search||[p.nome,p.descricao,p.categoria].join(" ").toLocaleLowerCase("pt-BR").includes(state.search))&&(state.size==="todos"||(p.tamanhos||[]).includes(state.size)));if(!list.length){const e=document.createElement("p");e.className="empty-products";e.textContent=state.favoritesOnly?"Você ainda não salvou favoritos. Toque no coração de uma peça para guardá-la aqui.":"Nenhum produto encontrado com esses filtros.";box.append(e);return;}list.forEach(p=>box.append(makeProductCard(p)));}
  function setupCatalogControls(){const s=$("#catalog-search");if(s)s.addEventListener("input",()=>{state.search=s.value.trim().toLocaleLowerCase("pt-BR");renderProducts();});const z=$("#catalog-size");if(z)z.addEventListener("change",()=>{state.size=z.value;renderProducts();});const b=$("#favorites-filter");if(b)b.addEventListener("click",()=>{state.favoritesOnly=!state.favoritesOnly;b.classList.toggle("active",state.favoritesOnly);b.innerHTML=state.favoritesOnly?'<i class="fa-solid fa-heart"></i> Exibindo favoritos':'<i class="fa-regular fa-heart"></i> Meus favoritos';renderProducts();});if(location.hash==="#favoritos"){state.favoritesOnly=true;if(b){b.classList.add("active");b.innerHTML='<i class="fa-solid fa-heart"></i> Exibindo favoritos';}}}
  function renderHomeSections(){const n=$("#home-novidades");if(n){n.replaceChildren();(state.catalog.produtos||[]).filter(p=>p.lancamento).slice(0,4).forEach(p=>n.append(makeProductCard(p)));}const r=$("#home-recomendados");if(r){r.replaceChildren();(state.catalog.produtos||[]).filter(p=>!p.lancamento).slice(0,4).forEach(p=>r.append(makeProductCard(p)));}}

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

  function renderProductDetail(){const box=$("#produto-detalhe");if(!box)return;const id=new URLSearchParams(location.search).get("id");const p=(state.catalog.produtos||[]).find(x=>String(x.id)===String(id));if(!p){box.innerHTML='<div class="product-not-found"><h1>Produto não encontrado.</h1><a class="button button-dark" href="produtos.html">Voltar aos produtos</a></div>';return;}document.title=p.nome+" | Ornato — O luxo de ser você";
    const layout=document.createElement("div");layout.className="product-detail-layout";const gallery=document.createElement("div");gallery.className="product-detail-gallery";const stage=document.createElement("div");stage.className="product-image-stage";const main=document.createElement("img");main.className="product-main-image";main.alt=p.nome;const controls=document.createElement("div");controls.className="product-image-controls";const prev=document.createElement("button");prev.type="button";prev.className="gallery-arrow gallery-previous";prev.setAttribute("aria-label","Foto anterior");prev.innerHTML='<i class="fa-solid fa-chevron-left"></i>';const next=document.createElement("button");next.type="button";next.className="gallery-arrow gallery-next";next.setAttribute("aria-label","Próxima foto");next.innerHTML='<i class="fa-solid fa-chevron-right"></i>';const count=document.createElement("span");count.className="gallery-counter";controls.append(prev,count,next);stage.append(main,controls);const thumbs=document.createElement("div");thumbs.className="product-thumbnails";const imgs=p.imagens||[];let active=0;function show(i){if(!imgs.length){main.hidden=true;controls.hidden=true;thumbs.hidden=true;return;}active=(i+imgs.length)%imgs.length;main.src=imgs[active];main.alt=p.nome+" — foto "+(active+1);count.textContent=(active+1)+" / "+imgs.length;controls.hidden=imgs.length<2;thumbs.hidden=imgs.length<2;Array.from(thumbs.children).forEach((b,n)=>{b.classList.toggle("active",n===active);b.setAttribute("aria-pressed",String(n===active));});}imgs.forEach((src,i)=>{const b=document.createElement("button");b.type="button";b.className="product-thumbnail";b.setAttribute("aria-label","Selecionar foto "+(i+1));b.setAttribute("aria-pressed","false");const im=document.createElement("img");im.src=src;im.alt="";im.loading="lazy";b.append(im);b.addEventListener("click",()=>show(i));thumbs.append(b);});prev.addEventListener("click",()=>show(active-1));next.addEventListener("click",()=>show(active+1));show(0);gallery.append(stage,thumbs);
    const info=document.createElement("div");info.className="product-detail-info";const crumb=document.createElement("div");crumb.className="product-detail-breadcrumb";crumb.textContent="ORNATO / "+(state.catalog.categorias.find(c=>c.id===p.categoria)?.nome||"Coleção");const title=document.createElement("h1");title.textContent=p.nome;const price=document.createElement("div");price.className="product-detail-price";price.textContent=p.preco;const tag=document.createElement("span");tag.className="demo-tag";tag.textContent="Disponibilidade demonstrativa";const h=document.createElement("h2");h.textContent="Sobre a peça";const desc=document.createElement("p");desc.className="product-detail-description";desc.textContent=p.descricao;const st=document.createElement("h3");st.className="size-selector-title";st.textContent="Selecione o tamanho";const sizes=document.createElement("div");sizes.className="size-options";let selected="";(p.tamanhos||["P","M","G","GG"]).forEach(s=>{const b=document.createElement("button");b.type="button";b.className="size-option";b.textContent=s;b.addEventListener("click",()=>{selected=s;Array.from(sizes.children).forEach(x=>x.classList.toggle("active",x===b));});sizes.append(b);});const note=document.createElement("p");note.className="product-detail-note";note.textContent="Tamanhos e disponibilidade são fictícios, apenas para demonstração.";const stock=document.createElement("p");stock.className="stock-demo";stock.textContent="Disponibilidade fictícia: "+(p.disponibilidade_demo||"Consulte a loja");const fav=document.createElement("button");fav.type="button";fav.id="detail-favorite";fav.className="favorite-detail-button"+(isFavorite(p.id)?" is-favorite":"");fav.innerHTML=isFavorite(p.id)?'<i class="fa-solid fa-heart"></i> Salvo nos favoritos':'<i class="fa-regular fa-heart"></i> Adicionar aos favoritos';fav.addEventListener("click",()=>toggleFavorite(p.id));
    const form=document.createElement("form");form.className="order-request-form";const fh=document.createElement("h2");fh.textContent="Solicite seu pedido";const lab=t=>{const l=document.createElement("label");l.textContent=t;return l;};const name=document.createElement("input");name.required=true;name.placeholder="Seu nome";const phone=document.createElement("input");phone.required=true;phone.inputMode="tel";phone.placeholder="Seu telefone";const qty=document.createElement("input");qty.type="number";qty.min="1";qty.max="10";qty.value="1";qty.required=true;const delivery=document.createElement("select");delivery.innerHTML='<option value="Entrega — Brasil">Entrega — Brasil</option><option value="Retirada na loja principal — Rio de Janeiro">Retirada na loja principal — Rio de Janeiro</option>';const address=document.createElement("input");address.placeholder="Cidade, bairro e endereço";const payment=document.createElement("select");payment.innerHTML='<option>PIX</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Dinheiro na retirada</option>';const disclaimer=document.createElement("p");disclaimer.className="order-disclaimer";disclaimer.textContent="Formas de pagamento e disponibilidade são ilustrativas. O pedido será encaminhado pelo WhatsApp para confirmação; nenhum pagamento será cobrado neste site.";const submit=document.createElement("button");submit.type="submit";submit.className="product-buy-button";submit.innerHTML='Solicitar pedido <i class="fa-brands fa-whatsapp"></i>';form.append(fh,lab("Seu nome"),name,lab("Telefone para contato"),phone,lab("Quantidade"),qty,lab("Recebimento"),delivery,lab("Endereço para entrega (se aplicável)"),address,lab("Pagamento pretendido — demonstrativo"),payment,disclaimer,submit);form.addEventListener("submit",e=>{e.preventDefault();if(!selected){alert("Selecione um tamanho antes de continuar.");return;}if(delivery.value.startsWith("Entrega")&&!address.value.trim()){alert("Informe a cidade e o endereço para entrega.");address.focus();return;}const msg=["Olá! Gostaria de solicitar um pedido pela loja Ornato.","","Produto: "+p.nome,"Preço exibido: "+p.preco,"Tamanho: "+selected,"Quantidade: "+qty.value,"Nome: "+name.value,"Telefone: "+phone.value,"Recebimento: "+delivery.value,"Endereço: "+(address.value||"A combinar"),"Pagamento pretendido: "+payment.value,"","Estou ciente de que estoque e pagamentos são demonstrativos e desejo confirmar os detalhes com a loja."].join("\n");window.open("https://wa.me/5522998300865?text="+encodeURIComponent(msg),"_blank","noopener");});
    const back=document.createElement("a");back.className="product-back-link";back.href="produtos.html";back.textContent="← Voltar para a coleção";info.append(crumb,title,price,tag,h,desc,st,sizes,note,stock,fav,form,back);layout.append(gallery,info);
    const reviews=document.createElement("section");reviews.className="product-reviews";const rh=document.createElement("div");rh.className="reviews-heading";rh.innerHTML='<div><span class="section-kicker">VOZES ORNATO</span><h2>O que dizem sobre <em>esta peça</em></h2></div><span class="demo-tag">Comentários fictícios para demonstração</span>';const grid=document.createElement("div");grid.className="reviews-grid";[`O caimento de ${p.nome} é elegante e deixa a produção muito especial.`,`A proposta de ${p.nome} é sofisticada e os detalhes fazem a diferença.`,`Gostei da versatilidade desta peça para criar diferentes combinações.`,`A seleção de cor e modelagem de ${p.nome} transmite muita personalidade.`,`Uma escolha elegante para quem gosta de peças marcantes sem exageros.`].forEach((txt,i)=>{const card=document.createElement("article");card.className="review-card";const stars=document.createElement("div");stars.className="review-stars";stars.textContent="★★★★★";const who=document.createElement("span");who.className="review-demo-label";who.textContent="AVALIAÇÃO ILUSTRATIVA "+(i+1);const body=document.createElement("p");body.textContent=txt;card.append(stars,who,body);grid.append(card);});reviews.append(rh,grid);
    const related=document.createElement("section");related.className="related-products";const rt=document.createElement("div");rt.className="section-kicker";rt.textContent="VOCÊ TAMBÉM PODE GOSTAR";const rg=document.createElement("div");rg.className="products-grid";(state.catalog.produtos||[]).filter(x=>x.id!==p.id&&x.categoria===p.categoria).slice(0,3).forEach(x=>rg.append(makeProductCard(x)));related.append(rt,rg);box.replaceChildren(layout,reviews,related);
  }

  function appendMessage(text, role) {
    if(role==="bot-message") text=String(text).replace(/^#{1,6}\s*/gm,"").replace(/^\s*[-*]\s+/gm,"• ");
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

  function localAssistantReply(question) {
    const q=question.toLocaleLowerCase("pt-BR");const contact=state.knowledge?.atendimento||{};const products=state.catalog.produtos||[];
    if(/produto|coleção|vestido|conjunto|peça/.test(q))return "A coleção atual reúne "+products.length+" peças entre vestidos e conjuntos. Explore os produtos e abra cada peça para ver fotos e detalhes.";
    if(/preço|preco|valor|custa/.test(q))return products.map(p=>p.nome+": "+p.preco).join("\n");
    if(/tamanho|numeração|numeracao/.test(q))return "Os tamanhos exibidos são PP, P, M, G, GG e XG. A disponibilidade mostrada é demonstrativa e precisa ser confirmada com a equipe.";
    if(/entrega|frete|envio|retirada/.test(q))return "A Ornato informa envio para todo o Brasil e retirada na loja principal no Rio de Janeiro. Endereço, prazo e frete são confirmados no atendimento.";
    if(/pagamento|pix|cartão|cartao/.test(q))return "As opções exibidas são PIX, cartão de crédito, cartão de débito e dinheiro na retirada. São demonstrativas e devem ser confirmadas com a loja.";
    if(/troca|devolução|devolucao/.test(q))return state.knowledge?.politica_troca||"Entre em contato com a equipe para orientações sobre trocas e devoluções.";
    if(/contato|whatsapp|telefone|email|e-mail/.test(q))return "WhatsApp: "+(contact.whatsapp||"")+". E-mail: "+(contact.email||"")+". Atendimento: "+(contact.horario||"consulte a loja")+".";
    if(/história|historia|marca|ornato|slogan/.test(q))return state.knowledge?.sobre||"ORNATO — O luxo de ser você.";
    return "Posso ajudar com coleção, preços, tamanhos, entregas, pagamentos e contato. O atendimento automatizado está em modo informativo no momento.";
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
      appendMessage(localAssistantReply(text), "bot-message");
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
      const footerContact = $("#footer-contact"); if (footerContact) { footerContact.replaceChildren(); const wa=document.createElement("a"); wa.href="https://wa.me/"+(contact.whatsapp||""); wa.target="_blank"; wa.rel="noopener"; wa.textContent="WhatsApp: "+(contact.whatsapp||"Consulte"); const mail=document.createElement("a"); mail.href="mailto:"+(contact.email||""); mail.textContent=contact.email||"E-mail"; const hours=document.createElement("p"); hours.textContent=contact.horario||"Consulte o atendimento"; const shipping=document.createElement("p"); shipping.textContent="Envio para todo o Brasil · Retirada no Rio de Janeiro"; footerContact.append(wa,mail,hours,shipping); }
      renderCategories();
      setupCatalogControls();
      renderProducts();
      renderHomeSections();
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