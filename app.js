(function(){
  "use strict";

  const STORAGE_KEY = "spriteVault.v1";
  const IMG_BASE = "sprites/";

  let state = {
    owned: new Set(),
    mastered: new Set(),
  };

  const params = new URLSearchParams(location.search);
  const shareParam = params.get("share");
  const isSharedView = !!shareParam;

  function loadLocalState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        state.owned = new Set(parsed.owned || []);
        state.mastered = new Set(parsed.mastered || []);
      }
    }catch(e){ console.warn("Could not load saved progress", e); }
  }

  function saveLocalState(){
    if(isSharedView) return;
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        owned: Array.from(state.owned),
        mastered: Array.from(state.mastered),
      }));
    }catch(e){ console.warn("Could not save progress", e); }
  }

  function decodeShare(str){
    try{
      const json = decodeURIComponent(escape(atob(str.replace(/-/g,"+").replace(/_/g,"/"))));
      const parsed = JSON.parse(json);
      return {
        owned: new Set(parsed.o || []),
        mastered: new Set(parsed.m || []),
      };
    }catch(e){
      console.warn("Invalid share link", e);
      return { owned:new Set(), mastered:new Set() };
    }
  }

  function encodeShare(){
    const payload = JSON.stringify({ o: Array.from(state.owned), m: Array.from(state.mastered) });
    return btoa(unescape(encodeURIComponent(payload))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  }

  if(isSharedView){
    const shared = decodeShare(shareParam);
    state.owned = shared.owned;
    state.mastered = shared.mastered;
  } else {
    loadLocalState();
  }

  let filters = {
    search: "",
    theme: "all",
    rarity: "all",
    status: "all",
    hideMastered: false,
    groupByTheme: false,
    lowFidelity: false,
  };

  const THEME_ORDER = ["Basic","Gold","Gummy","Galaxy","Holofoil","Cube"];

  const grid = document.getElementById("spriteGrid");
  const emptyState = document.getElementById("emptyState");
  const collectStat = document.getElementById("collectStat");
  const masterStat = document.getElementById("masterStat");
  const collectFill = document.getElementById("collectFill");
  const masterFill = document.getElementById("masterFill");
  const toastEl = document.getElementById("toast");
  const shareBanner = document.getElementById("shareBanner");
  const actionbar = document.getElementById("actionbar");

  if(isSharedView){
    shareBanner.classList.remove("hidden");
    filters.status = "owned";
    document.getElementById("goToMyVault").href = location.pathname;
    document.querySelectorAll('[data-status]').forEach(b=>b.disabled=true);
    document.getElementById("shareBtn").classList.add("hidden");
  }

  function matchesFilters(item){
    const owned = state.owned.has(item.id);
    const mastered = state.mastered.has(item.id);
    if(filters.search && !item.name.toLowerCase().includes(filters.search)) return false;
    if(filters.theme !== "all" && item.theme !== filters.theme) return false;
    if(filters.rarity !== "all" && item.rarity !== filters.rarity) return false;
    if(filters.status === "owned" && !owned) return false;
    if(filters.status === "unowned" && owned) return false;
    if(filters.hideMastered && mastered) return false;
    return true;
  }

  function cardHTML(item){
    const owned = state.owned.has(item.id);
    const mastered = state.mastered.has(item.id);
    const classes = ["sprite-card", `rarity-${item.rarity}`, `theme-${item.theme}`];
    if(owned) classes.push("owned");
    if(mastered) classes.push("mastered");
    if(filters.lowFidelity) classes.push("low-fi");

    let statusBadge = "";
    if(mastered){
      statusBadge = `<span class="badge badge-status status-mastered">👑 Mastered</span>`;
    } else if(owned){
      statusBadge = `<span class="badge badge-status status-collected">Collected</span>`;
    } else {
      statusBadge = `<span class="badge badge-status">Unowned</span>`;
    }

    return `
      <div class="${classes.join(' ')}" data-id="${item.id}" role="button" tabindex="0" aria-label="${item.name}, ${owned ? 'owned' : 'not owned'}${mastered ? ', mastered' : ''}">
        <div class="badge-row">
          <span class="badge badge-rarity ${item.rarity}">${item.rarity}</span>
          ${statusBadge}
        </div>
        <div class="sprite-media">
          <img src="${IMG_BASE}${encodeURIComponent(item.file)}" alt="${item.name}" loading="lazy" onerror="this.style.opacity=0.15">
        </div>
        <div class="sprite-footer">
          ${item.name}
          <span class="sprite-theme-tag">${item.theme}</span>
        </div>
      </div>`;
  }

  function render(){
    const visible = SPRITE_DATA.filter(matchesFilters);
    grid.innerHTML = "";

    if(visible.length === 0){
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
      if(filters.groupByTheme){
        THEME_ORDER.forEach(theme=>{
          const group = visible.filter(i=>i.theme===theme);
          if(!group.length) return;
          const header = document.createElement("div");
          header.className = "theme-group-header";
          header.textContent = theme;
          grid.appendChild(header);
          group.forEach(item=>grid.insertAdjacentHTML("beforeend", cardHTML(item)));
        });
      } else {
        visible.forEach(item=>grid.insertAdjacentHTML("beforeend", cardHTML(item)));
      }
    }

    updateStats();
  }

  function updateStats(){
    const total = SPRITE_DATA.length;
    const owned = state.owned.size;
    const mastered = state.mastered.size;
    collectStat.textContent = `${owned} / ${total}`;
    masterStat.textContent = `${mastered} / ${total}`;
    collectFill.style.width = total ? `${(owned/total)*100}%` : "0%";
    masterFill.style.width = total ? `${(mastered/total)*100}%` : "0%";
  }

  grid.addEventListener("click", (e)=>{
    if(isSharedView) return;
    const card = e.target.closest(".sprite-card");
    if(!card) return;
    const id = card.dataset.id;
    toggleOwned(id);
  });

  grid.addEventListener("keydown", (e)=>{
    if(isSharedView) return;
    if(e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".sprite-card");
    if(!card) return;
    e.preventDefault();
    toggleOwned(card.dataset.id);
  });

  grid.addEventListener("contextmenu", (e)=>{
    if(isSharedView) return;
    const card = e.target.closest(".sprite-card");
    if(!card) return;
    e.preventDefault();
    toggleMastered(card.dataset.id);
  });

  let lastTap = { id:null, time:0 };
  grid.addEventListener("dblclick", (e)=>{
    if(isSharedView) return;
    const card = e.target.closest(".sprite-card");
    if(!card) return;
    toggleMastered(card.dataset.id);
  });

  function toggleOwned(id){
    if(state.owned.has(id)){
      state.owned.delete(id);
      state.mastered.delete(id);
    } else {
      state.owned.add(id);
    }
    saveLocalState();
    render();
  }

  function toggleMastered(id){
    if(!state.owned.has(id)){
      showToast("Collect this sprite before marking it mastered.");
      return;
    }
    if(state.mastered.has(id)) state.mastered.delete(id);
    else state.mastered.add(id);
    saveLocalState();
    render();
  }

  document.getElementById("searchBox").addEventListener("input", (e)=>{
    filters.search = e.target.value.trim().toLowerCase();
    render();
  });

  document.getElementById("themeFilter").addEventListener("change", (e)=>{
    filters.theme = e.target.value;
    render();
  });

  document.getElementById("rarityFilter").addEventListener("change", (e)=>{
    filters.rarity = e.target.value;
    render();
  });

  document.getElementById("statusFilter").addEventListener("click", (e)=>{
    const btn = e.target.closest(".seg-btn");
    if(!btn || isSharedView) return;
    document.querySelectorAll("#statusFilter .seg-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    filters.status = btn.dataset.status;
    render();
  });

  document.getElementById("hideMastered").addEventListener("change", (e)=>{
    filters.hideMastered = e.target.checked;
    render();
  });
  document.getElementById("groupByTheme").addEventListener("change", (e)=>{
    filters.groupByTheme = e.target.checked;
    render();
  });
  document.getElementById("lowFidelity").addEventListener("change", (e)=>{
    filters.lowFidelity = e.target.checked;
    render();
  });

  let toastTimer = null;
  function showToast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>toastEl.classList.remove("show"), 2600);
  }

  // ---------- Share ----------
  const shareBtn = document.getElementById("shareBtn");
  if(shareBtn){
    shareBtn.addEventListener("click", async ()=>{
      const code = encodeShare();
      const url = `${location.origin}${location.pathname}?share=${code}`;
      try{
        await navigator.clipboard.writeText(url);
        showToast("Share link copied to clipboard!");
      }catch(e){
        prompt("Copy your share link:", url);
      }
    });
  }

  actionbar.addEventListener("click", async (e)=>{
    const btn = e.target.closest(".action-btn[data-action]");
    if(!btn) return;
    const mode = btn.dataset.action;
    await generateImage(mode);
  });

  function itemsForMode(mode){
    switch(mode){
      case "missing": return SPRITE_DATA.filter(i=>!state.owned.has(i.id));
      case "collection": return SPRITE_DATA.filter(i=>state.owned.has(i.id));
      case "unmastered": return SPRITE_DATA.filter(i=>state.owned.has(i.id) && !state.mastered.has(i.id));
      case "mastered": return SPRITE_DATA.filter(i=>state.mastered.has(i.id));
      default: return [];
    }
  }

  const MODE_LABELS = {
    missing: "Missing Sprites",
    collection: "My Collection",
    unmastered: "Unmastered Sprites",
    mastered: "Mastered Sprites",
  };

  async function generateImage(mode){
    const items = itemsForMode(mode);
    if(items.length === 0){
      showToast("Nothing to show for that yet!");
      return;
    }
    showToast("Generating image...");

    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-99999px";
    wrapper.style.top = "0";
    wrapper.style.width = "1100px";
    wrapper.style.padding = "28px";
    wrapper.style.background = "#0A0B10";
    wrapper.style.fontFamily = "Inter, sans-serif";
    wrapper.style.color = "#E9EBF3";

    const title = document.createElement("div");
    title.style.fontFamily = "Rajdhani, sans-serif";
    title.style.fontWeight = "700";
    title.style.fontSize = "28px";
    title.style.marginBottom = "18px";
    title.style.letterSpacing = "0.03em";
    title.textContent = `SPRITE VAULT — ${MODE_LABELS[mode]} (${items.length})`;
    wrapper.appendChild(title);

    const gridEl = document.createElement("div");
    gridEl.style.display = "grid";
    gridEl.style.gridTemplateColumns = "repeat(8, 1fr)";
    gridEl.style.gap = "12px";
    wrapper.appendChild(gridEl);

    items.forEach(item=>{
      const mastered = state.mastered.has(item.id);
      const cell = document.createElement("div");
      cell.style.background = "#12141D";
      cell.style.border = `1px solid ${mastered ? "#FFB23F" : "#262A3B"}`;
      cell.style.borderRadius = "10px";
      cell.style.overflow = "hidden";
      cell.style.textAlign = "center";

      const imgBox = document.createElement("div");
      imgBox.style.aspectRatio = "1/1";
      imgBox.style.display = "flex";
      imgBox.style.alignItems = "center";
      imgBox.style.justifyContent = "center";
      imgBox.style.padding = "8px";

      const img = document.createElement("img");
      img.src = IMG_BASE + encodeURIComponent(item.file);
      img.crossOrigin = "anonymous";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      imgBox.appendChild(img);
      cell.appendChild(imgBox);

      const label = document.createElement("div");
      label.style.fontSize = "12px";
      label.style.fontWeight = "600";
      label.style.padding = "6px 4px 8px";
      label.style.borderTop = "1px solid #262A3B";
      label.textContent = item.name + (mastered ? " 👑" : "");
      cell.appendChild(label);

      gridEl.appendChild(cell);
    });

    document.body.appendChild(wrapper);

    try{
      await new Promise(res=>setTimeout(res, 150));
      const canvas = await html2canvas(wrapper, { backgroundColor: "#0A0B10", scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `sprite-vault-${mode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      showToast("Image downloaded!");
    }catch(err){
      console.error(err);
      showToast("Couldn't generate the image — check console.");
    }finally{
      document.body.removeChild(wrapper);
    }
  }

  render();
})();
