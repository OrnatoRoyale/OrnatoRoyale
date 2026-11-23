(() => {
  const $ = (selector) => document.querySelector(selector);
  const state = { knowledge:null,catalog:{categorias:[],produtos:[]},history:[],busy:false,category:"todas",search:"",size:"todos",favoritesOnly:false,favorites:readFavorites(),cart:readCart() };
  function readCart(){try{return JSON.parse(localStorage.getItem("ornato-carrinho")||"[]");}catch{return [];}}
  function saveCart(){localStorage.setItem("ornato-carrinho",JSON.stringify(state.cart));updateCartBadges();}
  function updateCartBadges(){document.querySelectorAll("[data-cart-count]").forEach(el=>{const n=state.cart.reduce((a,x)=>a+Number(x.quantity||1),0);el.textContent=n;el.hidden=n===0;});}
  function addToCart(id,size="M",quantity=1){const p=state.catalog.produtos.find(x=>String(x.id)===String(id));if(!p)return;const found=state.cart.find(x=>String(x.id)===String(id)&&x.size===size);if(found)found.quantity+=Number(quantity);else state.cart.push({id:p.id,size,quantity:Number(quantity)});saveCart();}
  function readFavorites(){try{return JSON.parse(localStorage.getItem("ornato-favoritos")||"[]").map(String);}catch{return [];}}
  function saveFavorites(){localStorage.setItem("ornato-favoritos",JSON.stringify(state.favorites));}
  function isFavorite(id){return state.favorites.includes(String(id));}
  function toggleFavorite(id){const k=String(id);state.favorites=isFavorite(k)?state.favorites.filter(x=>x!==k):[...state.favorites,k];saveFavorites();renderProducts();renderHomeSections();const b=$("#detail-favorite");if(b){b.classList.toggle("is-favorite",isFavorite(k));b.innerHTML=isFavorite(k)?'<i class="fa-solid fa-heart"></i> Salvo nos favoritos':'<i class="fa-regular fa-heart"></i> Adicionar aos favoritos';}}

  async function loadJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Não foi possível carregar ${path} (${response.status}).`);
    return response.json();
  }

  function normalizeSearch(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");}
  function searchScore(p,q){const terms=normalizeSearch(q).split(/\s+/).filter(Boolean);const text=normalizeSearch([p.nome,p.descricao,p.categoria,(state.catalog.categorias.find(c=>c.id===p.categoria)||{}).nome].join(" "));let score=0;terms.forEach(t=>{if(text.includes(t))score+=4;else if(text.split(/\s+/).some(w=>w.startsWith(t)||t.startsWith(w)))score+=2;});return score;}
  function renderCategories(){const box=$("#categorias-container");if(!box)return;const cats=[{id:"todas",nome:"Todas as peças"},...(state.catalog.categorias||[])];box.replaceChildren();cats.forEach(c=>{const b=document.createElement("button");b.type="button";b.className="category-pill"+(state.category===c.id?" active":"");b.textContent=c.nome;b.addEventListener("click",()=>{state.category=c.id;renderCategories();renderProducts();});box.append(b);});}
  function makeProductCard(p){const card=document.createElement("article");card.className="product-card";const link=document.createElement("a");link.className="product-card-link";link.href=`produto.html?id=${encodeURIComponent(p.id)}`;const gallery=document.createElement("div");gallery.className="product-gallery";const imgs=p.imagens||[];if(imgs.length){const im=document.createElement("img");im.className="product-image";im.src=imgs[0];im.alt=p.nome+" — foto 1";im.loading="lazy";gallery.append(im);}if(p.lancamento){const badge=document.createElement("span");badge.className="product-launch-badge";badge.textContent="NOVO LANÇAMENTO";gallery.append(badge);}const info=document.createElement("div");info.className="product-info";const cat=document.createElement("div");cat.className="product-category";cat.textContent=state.catalog.categorias.find(c=>c.id===p.categoria)?.nome||"Coleção Ornato";const name=document.createElement("h3");name.textContent=p.nome;const desc=document.createElement("p");desc.textContent=p.descricao||"";const price=document.createElement("div");price.className="product-price";price.textContent=p.preco||"Consulte informações";info.append(cat,name,desc,price);link.append(gallery,info);const fav=document.createElement("button");fav.type="button";fav.className="favorite-button"+(isFavorite(p.id)?" is-favorite":"");fav.setAttribute("aria-label",isFavorite(p.id)?"Remover dos favoritos":"Adicionar aos favoritos");fav.innerHTML=isFavorite(p.id)?'<i class="fa-solid fa-heart"></i>':'<i class="fa-regular fa-heart"></i>';fav.addEventListener("click",()=>toggleFavorite(p.id));const cart=document.createElement("button");cart.type="button";cart.className="card-cart-button";cart.title="Adicionar ao carrinho";cart.innerHTML='<i class="fa-solid fa-cart-plus"></i>';cart.addEventListener("click",()=>addToCart(p.id,(p.tamanhos||["PP","P","M"])[2]||"M",1));card.append(link,fav,cart);return card;}
  function renderProducts(){const box=$("#produtos-container");if(!box)return;box.replaceChildren();const list=(state.catalog.produtos||[]).filter(p=>(state.category==="todas"||p.categoria===state.category)&&(!state.favoritesOnly||isFavorite(p.id))&&(!state.search||searchScore(p,state.search)>0)&&(state.size==="todos"||(p.tamanhos||[]).includes(state.size)));if(!list.length){const e=document.createElement("p");e.className="empty-products";e.textContent=state.favoritesOnly?"Você ainda não salvou favoritos. Toque no coração de uma peça para guardá-la aqui.":"Nenhum produto encontrado com esses filtros.";box.append(e);return;}list.forEach(p=>box.append(makeProductCard(p)));}
  function setupCatalogControls(){const s=$("#catalog-search");if(s)s.addEventListener("input",()=>{state.search=s.value.trim().toLocaleLowerCase("pt-BR");renderProducts();});const z=$("#catalog-size");if(z)z.addEventListener("change",()=>{state.size=z.value;renderProducts();});const b=$("#favorites-filter");if(b)b.addEventListener("click",()=>{state.favoritesOnly=!state.favoritesOnly;b.classList.toggle("active",state.favoritesOnly);b.innerHTML=state.favoritesOnly?'<i class="fa-solid fa-heart"></i> Exibindo favoritos':'<i class="fa-regular fa-heart"></i> Meus favoritos';renderProducts();});if(location.hash==="#favoritos"){state.favoritesOnly=true;if(b){b.classList.add("active");b.innerHTML='<i class="fa-solid fa-heart"></i> Exibindo favoritos';}}}
  function renderHomeSections(){const n=$("#home-novidades");if(n){n.replaceChildren();(state.catalog.produtos||[]).filter(p=>p.lancamento).slice(0,4).forEach(p=>n.append(makeProductCard(p)));}const r=$("#home-recomendados");if(r){r.replaceChildren();(state.catalog.produtos||[]).filter(p=>!p.lancamento).slice(0,4).forEach(p=>r.append(makeProductCard(p)));}}

  function renderProductDetail(){
const box=$("#produto-detalhe");if(!box)return;const id=new URLSearchParams(location.search).get("id");const p=state.catalog.produtos.find(x=>String(x.id)===String(id));if(!p){box.innerHTML='<h1>Produto não encontrado.</h1><a href="produtos.html">Voltar aos produtos</a>';return;}document.title=p.nome+" | Ornato — O luxo de ser você";
const layout=document.createElement("div");layout.className="product-detail-layout";const gallery=document.createElement("div");gallery.className="product-detail-gallery";const stage=document.createElement("div");stage.className="product-image-stage";const main=document.createElement("img");main.className="product-main-image";main.alt=p.nome;const controls=document.createElement("div");controls.className="product-image-controls";const prev=document.createElement("button");prev.type="button";prev.className="gallery-arrow";prev.textContent="‹";const next=document.createElement("button");next.type="button";next.className="gallery-arrow";next.textContent="›";const count=document.createElement("span");count.className="gallery-counter";controls.append(prev,count,next);stage.append(main,controls);const thumbs=document.createElement("div");thumbs.className="product-thumbnails";let active=0;const imgs=p.imagens||[];function show(i){if(!imgs.length)return;active=(i+imgs.length)%imgs.length;main.src=imgs[active];count.textContent=(active+1)+" / "+imgs.length;controls.hidden=imgs.length<2;thumbs.hidden=imgs.length<2;Array.from(thumbs.children).forEach((b,n)=>b.classList.toggle("active",n===active));}imgs.forEach((src,i)=>{const b=document.createElement("button");b.type="button";b.className="product-thumbnail";const im=document.createElement("img");im.src=src;im.alt="";b.append(im);b.addEventListener("click",()=>show(i));thumbs.append(b);});prev.addEventListener("click",()=>show(active-1));next.addEventListener("click",()=>show(active+1));show(0);gallery.append(stage,thumbs);
const info=document.createElement("div");info.className="product-detail-info";const crumb=document.createElement("div");crumb.className="product-detail-breadcrumb";crumb.textContent="ORNATO / "+(state.catalog.categorias.find(c=>c.id===p.categoria)?.nome||"Coleção");const title=document.createElement("h1");title.textContent=p.nome;const price=document.createElement("div");price.className="product-detail-price";price.textContent=p.preco;const h=document.createElement("h2");h.textContent="Sobre a peça";const desc=document.createElement("p");desc.className="product-detail-description";desc.textContent=p.descricao;const st=document.createElement("h3");st.className="size-selector-title";st.textContent="Selecione o tamanho";const sizes=document.createElement("div");sizes.className="size-options";let selected="";(p.tamanhos||["PP","P","M","G","GG","XG"]).forEach(s=>{const b=document.createElement("button");b.type="button";b.className="size-option";b.textContent=s;b.addEventListener("click",()=>{selected=s;Array.from(sizes.children).forEach(x=>x.classList.toggle("active",x===b));});sizes.append(b);});
const actions=document.createElement("div");actions.className="product-action-row";const buy=document.createElement("button");buy.type="button";buy.className="product-buy-button";buy.textContent="Comprar";const cart=document.createElement("button");cart.type="button";cart.className="product-add-cart";cart.innerHTML='<i class="fa-solid fa-cart-plus"></i> Adicionar ao carrinho';cart.addEventListener("click",()=>{if(!selected){alert("Selecione um tamanho.");return;}addToCart(p.id,selected,1);cart.innerHTML='<i class="fa-solid fa-check"></i> Adicionado';});actions.append(buy,cart);
const fav=document.createElement("button");fav.type="button";fav.id="detail-favorite";fav.className="favorite-detail-button"+(isFavorite(p.id)?" is-favorite":"");fav.innerHTML=isFavorite(p.id)?'<i class="fa-solid fa-heart"></i> Salvo nos favoritos':'<i class="fa-regular fa-heart"></i> Adicionar aos favoritos';fav.addEventListener("click",()=>toggleFavorite(p.id));const back=document.createElement("a");back.className="product-back-link";back.href="produtos.html";back.textContent="← Voltar para a coleção";info.append(crumb,title,price,h,desc,st,sizes,actions,fav,back);layout.append(gallery,info);
const reviews=document.createElement("section");reviews.className="product-reviews";const rh=document.createElement("div");rh.className="reviews-heading";rh.innerHTML='<div><span class="section-kicker">VOZES ORNATO</span><h2>O que dizem sobre <em>esta peça</em></h2></div>';const grid=document.createElement("div");grid.className="reviews-grid";const comments=["O caimento desta peça é elegante e deixa a produção muito especial.","A proposta é sofisticada e os detalhes fazem a diferença.","Gostei da versatilidade para criar diferentes combinações.","A modelagem transmite muita personalidade.","Uma escolha elegante para quem gosta de peças marcantes sem exageros.","O tecido e o acabamento deixam o visual refinado.","Uma peça que combina beleza e conforto.","Adorei como ela valoriza a produção sem esforço."];comments.forEach((txt,i)=>{const card=document.createElement("article");card.className="review-card";const stars=document.createElement("div");stars.className="review-stars";stars.textContent="★★★★★";const who=document.createElement("span");who.className="review-demo-label";who.textContent=["Mariana","Isabela","Camila","Beatriz","Laura","Helena","Sofia","Alice"][i];const body=document.createElement("p");body.textContent=txt;card.append(stars,who,body);grid.append(card);});reviews.append(rh,grid);
const related=document.createElement("section");related.className="related-products";const rt=document.createElement("div");rt.className="section-kicker";rt.textContent="VOCÊ TAMBÉM PODE GOSTAR";const rg=document.createElement("div");rg.className="products-grid";state.catalog.produtos.filter(x=>x.id!==p.id&&x.categoria===p.categoria).slice(0,3).forEach(x=>rg.append(makeProductCard(x)));related.append(rt,rg);box.replaceChildren(layout,reviews,related);
}

  function renderCart(){const box=$("#cart-items");if(!box)return;box.replaceChildren();if(!state.cart.length){box.innerHTML='<div class="cart-empty"><i class="fa-solid fa-bag-shopping"></i><h2>Seu carrinho está vazio</h2><p>Explore a coleção e escolha suas peças favoritas.</p><a class="button button-dark" href="produtos.html">Ver produtos</a></div>';return;}state.cart.forEach((item,index)=>{const p=state.catalog.produtos.find(x=>String(x.id)===String(item.id));if(!p)return;const row=document.createElement("article");row.className="cart-item";const im=document.createElement("img");im.src=(p.imagens||[])[0]||"";im.alt=p.nome;const info=document.createElement("div");info.className="cart-item-info";const name=document.createElement("h3");name.textContent=p.nome;const meta=document.createElement("p");meta.textContent="Tamanho: "+item.size+" · "+p.preco;const qty=document.createElement("div");qty.className="cart-quantity";const minus=document.createElement("button");minus.textContent="−";minus.type="button";const num=document.createElement("span");num.textContent=item.quantity;const plus=document.createElement("button");plus.textContent="+";plus.type="button";minus.onclick=()=>{item.quantity=Math.max(1,item.quantity-1);saveCart();renderCart();};plus.onclick=()=>{item.quantity++;saveCart();renderCart();};qty.append(minus,num,plus);info.append(name,meta,qty);const del=document.createElement("button");del.type="button";del.className="cart-remove";del.innerHTML='<i class="fa-regular fa-trash-can"></i>';del.onclick=()=>{state.cart.splice(index,1);saveCart();renderCart();};row.append(im,info,del);box.append(row);});}
  function renderInspirations(){const box=$("#inspiration-grid");if(!box)return;box.replaceChildren();const intros=["Uma peça que transforma a ocasião em um momento especial, com caimento fluido e presença elegante.","Tons sofisticados e texturas que traduzem uma elegância contemporânea e feminina.","A delicadeza dos detalhes encontra uma presença marcante em uma composição refinada.","Uma proposta atemporal para mulheres que expressam sua própria essência.","Linhas elegantes e acabamento cuidadoso em uma curadoria especial.","O equilíbrio entre personalidade, refinamento e versatilidade.","A elegância aparece na escolha de cada detalhe."];state.catalog.produtos.forEach((p,i)=>{const card=document.createElement("article");card.className="inspiration-card";const a=document.createElement("a");a.href="produto.html?id="+encodeURIComponent(p.id);const im=document.createElement("img");im.src=(p.imagens||[])[0]||"";im.alt=p.nome;a.append(im);const body=document.createElement("div");const tag=document.createElement("span");tag.textContent=String(i+1).padStart(2,"0")+" · "+(p.categoria==="vestidos"?"ALTA-COSTURA FEMININA":"ELEGÂNCIA CONTEMPORÂNEA");const h=document.createElement("h2");h.textContent=p.nome;const desc=document.createElement("p");desc.textContent=intros[i%intros.length];const link=document.createElement("a");link.className="text-link";link.href=a.href;link.textContent="Conheça a peça →";body.append(tag,h,desc,link);card.append(a,body);box.append(card);});}
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
    const q=question.toLocaleLowerCase("pt-BR");const k=state.knowledge||{};const contact=k.atendimento||{};const products=state.catalog.produtos||[];
    if(/preço|preco|valor|custa/.test(q)){const hits=products.filter(p=>searchScore(p,q)>0);return (hits.length?hits:products).map(p=>p.nome+": "+p.preco).join("\n");}
    if(/tamanho|numeração|numeracao/.test(q))return "Trabalhamos com os tamanhos PP, P, M, G, GG e XG. Para confirmar a disponibilidade de uma peça, fale com nossa equipe.";
    if(/entrega|frete|envio|retirada/.test(q))return "Enviamos para todo o Brasil. Também é possível retirar o pedido na loja principal no Rio de Janeiro. Prazo, frete e endereço são informados no atendimento.";
    if(/pagamento|pix|cartão|cartao/.test(q))return "As opções de pagamento são PIX, cartão de crédito, cartão de débito e dinheiro na retirada. Nossa equipe confirma as condições no atendimento.";
    if(/troca|devolução|devolucao/.test(q))return k.politica_troca||"Entre em contato com a equipe para receber orientações sobre trocas e devoluções.";
    if(/contato|whatsapp|telefone|email|e-mail/.test(q))return "Número de contato: "+(contact.telefone_formatado||"+55 22 8883-0065")+". Email de contato: "+(contact.email||"ornato.oficial@gmail.com")+". Atendimento: "+(contact.horario||"consulte a loja")+".";
    if(/horário|horario|aberto|atendimento/.test(q))return "Nosso horário de atendimento é "+(contact.horario||"consulte a loja")+".";
    if(/história|historia|marca|ornato|slogan|propósito|proposito|alta.costura|elegância|elegancia/.test(q))return k.sobre||"ORNATO — O luxo de ser você.";
    if(/look|combina|indicação|indicacao|recomenda/.test(q)){const picks=products.filter(p=>p.categoria==="vestidos").slice(0,2);return "Para uma proposta elegante, confira estas peças da nossa curadoria: "+picks.map(p=>p.nome+" ("+p.preco+")").join(" e ")+". A escolha ideal depende da ocasião e do seu estilo.";}
    if(/produto|coleção|vestido|conjunto|peça/.test(q)){const hits=products.filter(p=>searchScore(p,q)>0);return (hits.length?hits:products).slice(0,5).map(p=>p.nome+" — "+p.preco+". "+p.descricao).join("\n");}
    if(Array.isArray(k.faq)){const match=k.faq.find(x=>normalizeSearch(x.pergunta).split(/\s+/).some(t=>t.length>4&&normalizeSearch(q).includes(t)));if(match)return match.resposta;}
    return "Posso ajudar com nossa história, coleção, preços, tamanhos, entregas, retirada, pagamentos, trocas e formas de contato. O que gostaria de saber?";
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
    body.classList.add("is-hidden");
    $("#chat-toggle").setAttribute("aria-expanded","false");
    const initialIcon=$("#chat-minimize-icon");if(initialIcon)initialIcon.className="fa-solid fa-plus chat-chevron";
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
      const footerContact = $("#footer-contact"); if (footerContact) { footerContact.replaceChildren(); const phoneLabel=document.createElement("strong");phoneLabel.textContent="Número de contato:";const wa=document.createElement("a");wa.href="https://wa.me/552288830065";wa.target="_blank";wa.rel="noopener";wa.textContent="+55 22 8883-0065";const emailLabel=document.createElement("strong");emailLabel.textContent="Email de contato:";const mail=document.createElement("a");mail.href="mailto:ornato.oficial@gmail.com";mail.textContent="ornato.oficial@gmail.com";const hours=document.createElement("p");hours.textContent=contact.horario||"Consulte o atendimento";const shipping=document.createElement("p");shipping.textContent="Envio para todo o Brasil · Também disponível para retirada na loja principal no Rio de Janeiro";footerContact.append(phoneLabel,wa,emailLabel,mail,hours,shipping); }
      renderCategories();
      setupCatalogControls();
      renderProducts();
      renderHomeSections();
      renderProductDetail();renderCart();renderInspirations();updateCartBadges();
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