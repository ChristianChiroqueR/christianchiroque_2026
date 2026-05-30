/* =========================================================
   script.js — theme, lang, smooth scroll, reveal,
   animated bg grid, counters, projects render, tweaks.
   ========================================================= */

(() => {
  const root = document.documentElement;
  const LS = {
    theme: "ccr.theme",
    lang:  "ccr.lang",
    accent:"ccr.accent",
    density:"ccr.density",
    card:  "ccr.card",
    bg:    "ccr.bg"
  };

  /* ---------- Theme ---------- */
  const themeBtn = document.getElementById("theme-toggle");
  const setTheme = (t) => {
    root.setAttribute("data-theme", t);
    localStorage.setItem(LS.theme, t);
    document.querySelector('meta[name="theme-color"]').setAttribute(
      "content",
      t === "dark" ? "#0a0a0f" : "#f5f5f7"
    );
    themeBtn.innerHTML = t === "dark"
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  };
  setTheme(localStorage.getItem(LS.theme) || "dark");
  themeBtn.addEventListener("click", () => {
    setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });

  /* ---------- Language ---------- */
  const langBtn = document.getElementById("lang-toggle");
  const langCur = document.getElementById("lang-current");
  const langOth = document.getElementById("lang-other");

  function applyLang(lang) {
    const dict = window.I18N[lang];
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.getAttribute("data-i18n");
      if (dict[k] != null) el.textContent = dict[k];
    });
    // update post links to match language
    document.querySelectorAll("a[data-post]").forEach(a => {
      a.setAttribute("href", `posts/${a.dataset.post}.${lang}.html`);
    });
    document.documentElement.lang = lang;
    langCur.textContent = lang.toUpperCase();
    langOth.textContent = lang === "es" ? "EN" : "ES";
    localStorage.setItem(LS.lang, lang);
  }
  applyLang(localStorage.getItem(LS.lang) || "es");
  langBtn.addEventListener("click", () => {
    const cur = document.documentElement.lang || "es";
    applyLang(cur === "es" ? "en" : "es");
  });

  /* ---------- Nav scroll state + active link ---------- */
  const nav = document.getElementById("nav");
  const links = document.querySelectorAll(".nav__link");
  const sections = [...document.querySelectorAll("main section[id]")];

  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
    const y = window.scrollY + 120;
    let active = sections[0]?.id;
    for (const s of sections) if (s.offsetTop <= y) active = s.id;
    links.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === "#" + active));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu (hamburger) ---------- */
  const burger = document.getElementById("nav-burger");
  const scrim = document.getElementById("nav-scrim");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    if (burger) {
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    }
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger?.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  scrim?.addEventListener("click", () => setMenu(false));
  // close when a section link is tapped
  document.querySelectorAll(".nav__links .nav__link").forEach(a =>
    a.addEventListener("click", () => setMenu(false))
  );
  // close on Escape, and reset if resized to desktop
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 760) setMenu(false); });

  /* ---------- Mobile menu (hamburger) end ---------- */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  /* ---------- Counters ---------- */
  const counterIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      const to = +el.dataset.to;
      const dur = 1400;
      const start = performance.now();
      const fmt = (n) => to >= 1000 ? Math.round(n).toLocaleString("en") : Math.round(n);
      const tick = (t) => {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(eased * to);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterIO.unobserve(el);
    }
  }, { threshold: 0.4 });
  document.querySelectorAll(".counter").forEach(el => counterIO.observe(el));

  /* ---------- Card hover gradient (mouse pos) ---------- */
  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
    });
  });

  /* ---------- Animated hero AI graph (canvas) ---------- */
  const canvas = document.getElementById("hero-graph");
  let graphRAF;
  function startGraph() {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let nodes = [], edges = [], W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);

    function resize() {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      const N = Math.min(64, Math.max(30, Math.round((W * H) / 15000)));
      nodes = [];
      for (let i = 0; i < N; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.34,
          vy: (Math.random() - 0.5) * 0.34,
          r: 1.4 + Math.random() * 2.6,
          phase: Math.random() * Math.PI * 2,
          // some nodes pulse brighter (active layer feel)
          hot: Math.random() < 0.32
        });
      }
      // signals travel along nearest edges
      edges = [];
    }

    function readAccent() {
      const cs = getComputedStyle(document.documentElement);
      const a1 = cs.getPropertyValue("--accent-1").trim() || "oklch(78% 0.16 200)";
      const a2 = cs.getPropertyValue("--accent-2").trim() || "oklch(68% 0.20 300)";
      const fg3 = cs.getPropertyValue("--fg-3").trim() || "rgba(150,150,160,0.5)";
      return { a1, a2, fg3 };
    }

    let signals = [];
    function tick(t) {
      const { a1, a2, fg3 } = readAccent();
      ctx.clearRect(0, 0, W, H);

      // move nodes
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
      }

      // edges by proximity
      const MAX_D = Math.min(W, H) * 0.26;
      const links = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < MAX_D) {
            const op = (1 - d / MAX_D) * 0.85;
            links.push([i, j, op]);
          }
        }
      }

      // draw edges
      for (const [i, j, op] of links) {
        const a = nodes[i], b = nodes[j];
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, a1);
        grad.addColorStop(1, a2);
        ctx.strokeStyle = grad;
        ctx.globalAlpha = op * 0.72;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // signals: occasionally fire a pulse along a random link
      if (Math.random() < 0.11 && links.length) {
        const [i, j] = links[Math.floor(Math.random() * links.length)];
        signals.push({ a: i, b: j, t: 0 });
      }
      signals = signals.filter(s => s.t < 1);
      for (const s of signals) {
        s.t += 0.024;
        const a = nodes[s.a], b = nodes[s.b];
        const x = a.x + (b.x - a.x) * s.t;
        const y = a.y + (b.y - a.y) * s.t;
        ctx.fillStyle = a1;
        ctx.globalAlpha = 1 - s.t;
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fill();
        // glow
        ctx.globalAlpha = (1 - s.t) * 0.45;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // draw nodes
      for (const n of nodes) {
        n.phase += 0.025;
        const pulse = 0.5 + 0.5 * Math.sin(n.phase);
        const r = n.r * (n.hot ? (0.9 + pulse * 0.7) : 1);
        if (n.hot) {
          ctx.fillStyle = a1;
          ctx.globalAlpha = 0.22 + pulse * 0.3;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = n.hot ? (0.8 + pulse * 0.2) : 0.78;
        ctx.fillStyle = n.hot ? a1 : fg3;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      graphRAF = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", () => {
      cancelAnimationFrame(graphRAF);
      resize();
      graphRAF = requestAnimationFrame(tick);
    });
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // single static frame
      tick(0);
      cancelAnimationFrame(graphRAF);
    } else {
      graphRAF = requestAnimationFrame(tick);
    }
  }
  function stopGraph() {
    cancelAnimationFrame(graphRAF);
    if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }
  startGraph();

  /* ---------- Projects render ---------- */
  const PROJECTS = [
    { k: "proj1", tags: ["R", "Python", "SHAP", "XGBoost"], hue: 200, url: "#", img: "" },
    { k: "proj2", tags: ["NLP", "spaCy", "BERT"],          hue: 300, url: "#", img: "" },
    { k: "proj3", tags: ["R", "Shiny", "D3"],              hue: 180, url: "#", img: "" },
    { k: "proj4", tags: ["PyTorch", "BETO", "HuggingFace"], hue: 280, url: "#", img: "" },
    { k: "proj5", tags: ["GANs", "Privacy", "Synthetic"],  hue: 160, url: "#", img: "" },
    { k: "proj6", tags: ["R", "PCA", "Index"],             hue: 220, url: "#", img: "" }
  ];
  const grid = document.getElementById("projects-grid");
  if (grid) {
    grid.innerHTML = PROJECTS.map((p, i) => {
      // generate a small abstract chart svg for the thumb
      const points = [];
      const W = 320, H = 120;
      let last = H/2;
      for (let x = 0; x <= W; x += 16) {
        last = Math.max(20, Math.min(H-20, last + (Math.random() - 0.5) * 28));
        points.push(`${x},${last.toFixed(1)}`);
      }
      const bars = Array.from({length: 9}).map((_, b) => {
        const bh = 20 + Math.random() * 70;
        return `<rect x="${b * 36 + 6}" y="${H - bh}" width="20" height="${bh}" fill="url(#g${i})" opacity="0.7"/>`;
      }).join("");
      const variant = i % 3;
      const thumb = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g${i}" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="var(--accent-1)" stop-opacity="0.9"/>
            <stop offset="1" stop-color="var(--accent-2)" stop-opacity="0.4"/>
          </linearGradient>
        </defs>
        ${variant === 0 ? `<polyline points="${points.join(' ')}" fill="none" stroke="var(--accent-1)" stroke-width="1.6"/>
          <polyline points="${points.join(' ')}" fill="none" stroke="var(--accent-1)" stroke-width="1.6" opacity="0.3" transform="translate(0,8)"/>` : ""}
        ${variant === 1 ? bars : ""}
        ${variant === 2 ? Array.from({length: 22}).map(() => {
          const cx = Math.random() * W, cy = Math.random() * H, r = 1 + Math.random() * 4;
          return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--accent-1)" opacity="${0.3 + Math.random() * 0.5}"/>`;
        }).join("") : ""}
      </svg>`;
      return `
      <article class="card reveal" style="--reveal-delay:${i * 60}ms">
        <div class="proj-thumb">${p.img ? `<img src="${p.img}" alt="">` : thumb}</div>
        <h3 class="card__title" data-i18n="projects.${p.k}.title"></h3>
        <p class="card__excerpt" data-i18n="projects.${p.k}.desc"></p>
        <div class="tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
        <div class="card__foot">
          <a class="card__more card__link" href="${p.url || '#'}" target="_blank" rel="noopener" data-i18n="projects.viewCode">Ver repositorio</a>
          <span>↗</span>
        </div>
      </article>`;
    }).join("");
    // re-apply current language to new nodes + hover gradient + reveal
    applyLang(document.documentElement.lang || "es");
    document.querySelectorAll("#projects-grid .card").forEach(card => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
      });
      io.observe(card);
    });
  }

  /* ---------- Blog thumbnails (image or generated fallback) ---------- */
  function blogThumbSVG(i) {
    const W = 320, H = 150;
    const variant = i % 3;
    let inner = "";
    if (variant === 0) {
      // soft wave area
      const pts = [];
      let last = H * 0.55;
      for (let x = 0; x <= W; x += 18) {
        last = Math.max(30, Math.min(H - 25, last + (Math.random() - 0.5) * 30));
        pts.push(`${x},${last.toFixed(1)}`);
      }
      inner = `<polyline points="0,${H} ${pts.join(' ')} ${W},${H}" fill="url(#bg${i})" opacity="0.5"/>
        <polyline points="${pts.join(' ')}" fill="none" stroke="var(--accent-1)" stroke-width="1.6"/>`;
    } else if (variant === 1) {
      // grid of dots
      let dots = "";
      for (let gx = 0; gx < 10; gx++) for (let gy = 0; gy < 5; gy++) {
        const on = Math.random() < 0.4;
        dots += `<circle cx="${gx * 34 + 18}" cy="${gy * 30 + 16}" r="${on ? 3 : 1.4}" fill="var(--accent-1)" opacity="${on ? 0.8 : 0.25}"/>`;
      }
      inner = dots;
    } else {
      // concentric arcs
      inner = Array.from({ length: 5 }).map((_, r) =>
        `<circle cx="${W * 0.7}" cy="${H * 0.6}" r="${22 + r * 20}" fill="none" stroke="var(--accent-${r % 2 ? 2 : 1})" stroke-width="1.2" opacity="${0.5 - r * 0.07}"/>`
      ).join("");
    }
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="bg${i}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="var(--accent-1)" stop-opacity="0.6"/>
        <stop offset="1" stop-color="var(--accent-2)" stop-opacity="0.05"/>
      </linearGradient></defs>${inner}</svg>`;
  }
  document.querySelectorAll(".blog-grid [data-thumb]").forEach((slot, i) => {
    const card = slot.closest(".card");
    const img = card && card.getAttribute("data-img");
    slot.innerHTML = img ? `<img src="${img}" alt="">` : blogThumbSVG(i);
  });

  /* ---------- Guard: placeholder links (#) must not navigate ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href");
    // links that point nowhere yet: "#" or empty, or explicitly marked placeholder
    if (a.hasAttribute("data-placeholder") || href === "#" || href === "" || href == null) {
      // allow same-page section anchors like "#about", block only bare "#"
      if (href === "#" || href === "" || href == null || a.hasAttribute("data-placeholder")) {
        e.preventDefault();
      }
    }
  });

  /* ---------- Material covers (optional real image) ---------- */
  document.querySelectorAll(".material__cover[data-img]").forEach(cover => {
    const src = cover.getAttribute("data-img");
    if (src && src.trim()) {
      const img = document.createElement("img");
      img.className = "material__cover-img";
      img.src = src.trim();
      img.alt = "";
      cover.appendChild(img);
      cover.classList.add("has-img");
    }
  });

  /* ---------- Email copy ---------- */
  const emailBtn = document.getElementById("email-copy");
  const emailLink = document.getElementById("email-link");
  emailBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(emailLink.textContent.trim());
      const dict = window.I18N[document.documentElement.lang || "es"];
      emailBtn.textContent = dict["contact.copied"] || "Copied";
      emailBtn.classList.add("copied");
      setTimeout(() => {
        emailBtn.classList.remove("copied");
        emailBtn.textContent = dict["contact.copy"] || "Copy";
      }, 1600);
    } catch (e) {}
  });

  /* ---------- Tweaks ---------- */
  const tweaks = document.getElementById("tweaks");
  const tweaksClose = document.getElementById("tweaks-close");

  const ACCENTS = {
    cyan:  { a1: "oklch(78% 0.16 200)", a2: "oklch(68% 0.20 300)" },
    amber: { a1: "oklch(82% 0.15 80)",  a2: "oklch(70% 0.18 40)"  },
    green: { a1: "oklch(78% 0.16 160)", a2: "oklch(72% 0.16 200)" },
    pink:  { a1: "oklch(75% 0.18 350)", a2: "oklch(68% 0.20 300)" },
    mono:  { a1: "oklch(78% 0.01 260)", a2: "oklch(60% 0.01 260)" }
  };
  function setAccent(name) {
    const a = ACCENTS[name] || ACCENTS.cyan;
    root.style.setProperty("--accent-1", a.a1);
    root.style.setProperty("--accent-2", a.a2);
    document.querySelectorAll("[data-accent]").forEach(b =>
      b.classList.toggle("is-active", b.dataset.accent === name)
    );
    state.accent = name;
    persist();
  }
  function setDensity(name) {
    root.setAttribute("data-density", name);
    document.querySelectorAll("[data-density]").forEach(b => {
      if (b.tagName === "BUTTON")
        b.classList.toggle("is-active", b.dataset.density === name);
    });
    state.density = name;
    persist();
  }
  function setCard(name) {
    root.setAttribute("data-card", name);
    document.querySelectorAll("[data-card]").forEach(b => {
      if (b.tagName === "BUTTON")
        b.classList.toggle("is-active", b.dataset.card === name);
    });
    state.card = name;
    persist();
  }
  function setBg(on) {
    state.animatedBg = on;
    const dot = document.getElementById("bg-dot");
    dot.classList.toggle("is-on", on);
    const bg = document.querySelector(".hero__grid-bg");
    if (bg) bg.style.display = on ? "" : "none";
    persist();
  }

  // state + persistence
  const defaults = window.TWEAK_DEFAULTS || { accent: "cyan", density: "cozy", card: "glass", animatedBg: true };
  const state = { ...defaults };
  // restore from localStorage (per-user); EDITMODE defaults persist file changes
  try {
    const saved = JSON.parse(localStorage.getItem("ccr.tweaks") || "{}");
    Object.assign(state, saved);
  } catch (e) {}
  function persist() {
    localStorage.setItem("ccr.tweaks", JSON.stringify(state));
    if (window.parent !== window) {
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits: state }, "*");
    }
  }

  // apply initial state
  setAccent(state.accent);
  setDensity(state.density);
  setCard(state.card);
  setBg(state.animatedBg);

  // bindings
  document.querySelectorAll("[data-accent]").forEach(b => b.addEventListener("click", () => setAccent(b.dataset.accent)));
  document.querySelectorAll("#density-chips [data-density]").forEach(b => b.addEventListener("click", () => setDensity(b.dataset.density)));
  document.querySelectorAll("#card-chips [data-card]").forEach(b => b.addEventListener("click", () => setCard(b.dataset.card)));
  document.getElementById("bg-toggle").addEventListener("click", () => setBg(!state.animatedBg));

  /* ---------- Lightbox (event images) ---------- */
  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    const lbImg = lightbox.querySelector(".lightbox__img");
    const lbCap = lightbox.querySelector(".lightbox__caption");
    const lbClose = lightbox.querySelector(".lightbox__close");
    const openLightbox = (src, caption) => {
      lbImg.src = src;
      lbImg.alt = caption || "";
      lbCap.textContent = caption || "";
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    const closeLightbox = () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      // clear src after transition so image doesn't flash next open
      setTimeout(() => { if (!lightbox.classList.contains("is-open")) lbImg.src = ""; }, 300);
    };
    document.querySelectorAll(".event-card__img").forEach(img => {
      img.addEventListener("click", () => {
        const card = img.closest(".event-card");
        const title = card?.querySelector(".event-card__title")?.textContent?.trim() || "";
        openLightbox(img.currentSrc || img.src, title);
      });
    });
    lbClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
    });
  }

  // edit-mode protocol (must register listener BEFORE announcing)
  window.addEventListener("message", (e) => {
    const t = e.data && e.data.type;
    if (t === "__activate_edit_mode") tweaks.classList.add("is-open");
    else if (t === "__deactivate_edit_mode") tweaks.classList.remove("is-open");
  });
  if (window.parent !== window) {
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
  }
  tweaksClose.addEventListener("click", () => {
    tweaks.classList.remove("is-open");
    if (window.parent !== window) {
      window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*");
    }
  });

})();
