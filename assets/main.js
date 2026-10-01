const header = document.querySelector("[data-header]");
const meter = document.querySelector(".scroll-meter");
const navLinks = [...document.querySelectorAll(".nav a")];
const LANG_KEY = "hrjp-language";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const UI_TEXT = {
  ja: {
    description: "Shunya Hara portfolio",
    nav: ["Creation", "Biography", "Publication", "Media", "Contact"],
    viewCreation: "ものづくり",
    publicationsButton: "研究発表",
    educationTitle: "学歴",
    jobTitle: "職歴・インターン",
    education: [
      "神戸市立工業高等専門学校 機械工学科",
      "神戸市立工業高等専門学校専攻科 機械システム工学専攻",
      "大阪大学大学院工学研究科 機械工学専攻"
    ],
    jobs: [
      { company: "Integral Geometry Science", body: "高分解能磁気映像化技術を用いた自動運転車の開発" },
      { company: "Studio Escape", body: "リアル脱出ゲームの電子回路設計制作" },
      { company: "TIER IV", body: "自動運転ソフトウェアAutowareのシミュレータ開発" },
      { company: "Panasonic Advanced Technology Development Co.,Ltd.", body: "自律移動ロボットの開発" }
    ],
    publicationHeading: "研究発表・受賞",
    filters: ["すべて", "査読あり", "査読無し", "受賞"],
    pubKinds: {
      peer: "査読あり",
      nonpeer: "査読無し",
      award: "受賞"
    },
    mediaHeading: "メディア",
    mediaEmpty: "テレビ・書籍などの掲載歴を追加できます。",
    mediaKinds: {
      tv: "テレビ",
      book: "書籍",
      web: "Web",
      magazine: "雑誌",
      event: "イベント",
      other: "その他"
    },
    backTop: "上へ戻る",
    project: {
      back: "Creation",
      resources: "関連リンク",
      noLinks: "公開リンクはまだありません。",
      media: "動画",
      noVideo: "動画は未掲載です。",
      next: "次に見る",
      nextHeading: "他のCreation"
    }
  },
  en: {
    description: "Shunya Hara portfolio",
    nav: ["Creation", "Biography", "Publication", "Media", "Contact"],
    viewCreation: "View Creation",
    publicationsButton: "Publication",
    educationTitle: "Education",
    jobTitle: "Work & Internships",
    education: [
      "Kobe City College of Technology, Department of Mechanical Engineering",
      "Kobe City College of Technology, Advanced Course in Mechanical System Engineering",
      "Osaka University, Graduate School of Engineering, Mechanical Engineering"
    ],
    jobs: [
      { company: "Integral Geometry Science", body: "Development of autonomous vehicles using high-resolution magnetic imaging technology" },
      { company: "Studio Escape", body: "Electronic circuit design and fabrication for real-life escape games" },
      { company: "TIER IV", body: "Simulator development for Autoware autonomous driving software" },
      { company: "Panasonic Advanced Technology Development Co.,Ltd.", body: "Development of autonomous mobile robots" }
    ],
    publicationHeading: "Research outputs and awards",
    filters: ["All", "Peer reviewed", "Non-peer reviewed", "Awards"],
    pubKinds: {
      peer: "Peer reviewed",
      nonpeer: "Non-peer reviewed",
      award: "Awards"
    },
    mediaHeading: "Media appearances",
    mediaEmpty: "TV, book, and other media appearances can be added here.",
    mediaKinds: {
      tv: "TV",
      book: "Book",
      web: "Web",
      magazine: "Magazine",
      event: "Event",
      other: "Other"
    },
    backTop: "Back to top",
    project: {
      back: "Creation",
      resources: "Resources",
      noLinks: "No public links yet.",
      media: "Media",
      noVideo: "No video is listed yet.",
      next: "Next",
      nextHeading: "More Creation projects"
    }
  }
};

function getStoredLanguage() {
  let stored;
  try { stored = localStorage.getItem(LANG_KEY); } catch {}
  return stored === "en" ? "en" : "ja";
}

function getProjectText(project, lang) {
  const localized = lang === "en" ? project.en || {} : {};

  return {
    title: localized.title || project.title,
    tag: localized.tag || project.tag,
    summary: localized.summary || project.summary,
    videos: localized.videos || project.videos
  };
}

function renderProjectImage(project, alt, attributes = "") {
  const image = `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(alt)}" ${attributes}>`;
  return project.webpImage
    ? `<picture class="project-picture"><source srcset="${escapeHtml(project.webpImage)}" type="image/webp">${image}</picture>`
    : image;
}

function getMediaText(item, lang) {
  const localized = lang === "en" ? item.en || {} : {};

  return {
    kind: localized.kind || UI_TEXT[lang].mediaKinds[item.kind] || item.kind,
    title: localized.title || item.title,
    outlet: localized.outlet || item.outlet,
    description: localized.description || item.description
  };
}

function setText(selector, value, root = document) {
  const element = root.querySelector(selector);
  if (element) element.textContent = value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderAuthors(authors) {
  return authors.map((author) => {
    const name = escapeHtml(author.name);
    return author.highlight ? `<strong>${name}</strong>` : name;
  }).join(", ");
}

function getActivePublicationFilter() {
  return document.querySelector(".filter.is-active")?.dataset.filter || "all";
}

function getPublicationCounts() {
  const counts = { all: 0, peer: 0, nonpeer: 0, award: 0 };
  (window.HRJP_PUBLICATIONS || []).forEach((publication) => {
    counts.all += 1;
    if (publication.kind in counts) counts[publication.kind] += 1;
  });
  return counts;
}

function getPublicationFilterLabel(lang, filter, index) {
  const baseLabel = UI_TEXT[lang].filters[index] || filter;
  if (!["peer", "nonpeer", "award"].includes(filter)) return baseLabel;
  return `${baseLabel} (${getPublicationCounts()[filter] || 0})`;
}

function getPublicationYear(publication) {
  const year = Number(publication.year);
  if (Number.isFinite(year) && year > 0) return year;
  const source = `${publication.venue || ""} ${publication.id || ""} ${publication.title || ""}`;
  return Number(source.match(/(?:19|20)\d{2}/)?.[0] || 0);
}

function renderPublicationList(lang) {
  const list = document.querySelector("[data-publication-list]");
  const publications = [...(window.HRJP_PUBLICATIONS || [])]
    .sort((a, b) => getPublicationYear(b) - getPublicationYear(a));
  if (!list) return;

  const text = UI_TEXT[lang];
  const activeFilter = getActivePublicationFilter();

  list.innerHTML = publications.map((publication) => {
    const label = text.pubKinds[publication.kind] || publication.kind;
    const authors = renderAuthors(publication.authors || []);
    const citation = [authors, escapeHtml(publication.venue)].filter(Boolean).join(". ");
    const isVisible = activeFilter === "all" || publication.kind === activeFilter;

    return `
      <article class="pub-item reveal is-visible${isVisible ? "" : " is-hidden"}" data-kind="${publication.kind}">
        <span class="pub-kind">${label}</span>
        <h3><a href="${escapeHtml(publication.url)}">${escapeHtml(publication.title)}</a></h3>
        ${citation ? `<p>${citation}</p>` : ""}
      </article>
    `;
  }).join("");
}

function renderMediaList(lang) {
  const list = document.querySelector("[data-media-list]");
  const mediaItems = window.HRJP_MEDIA || [];
  if (!list) return;

  const text = UI_TEXT[lang];

  if (!mediaItems.length) {
    list.innerHTML = `
      <article class="pub-item media-item media-empty reveal is-visible">
        <span class="pub-kind">${escapeHtml(text.mediaKinds.other)}</span>
        <h3>${escapeHtml(text.mediaEmpty)}</h3>
      </article>
    `;
    return;
  }

  list.innerHTML = mediaItems.map((item) => {
    const itemText = getMediaText(item, lang);
    const title = item.url
      ? `<a href="${escapeHtml(item.url)}">${escapeHtml(itemText.title)}</a>`
      : escapeHtml(itemText.title);
    const meta = [escapeHtml(item.date), escapeHtml(itemText.outlet)].filter(Boolean).join(" / ");

    return `
      <article class="pub-item media-item reveal is-visible" data-kind="${escapeHtml(item.kind)}">
        <span class="pub-kind">${escapeHtml(itemText.kind)}</span>
        <h3>${title}</h3>
        ${meta ? `<p class="media-meta">${meta}</p>` : ""}
        ${itemText.description ? `<p>${escapeHtml(itemText.description)}</p>` : ""}
      </article>
    `;
  }).join("");
}

function renderProjectCards(lang) {
  const grid = document.querySelector("[data-project-grid]");
  const projects = window.HRJP_PROJECTS || [];
  if (!grid) return;
  grid.innerHTML = projects.map((project, index) => {
    const localized = getProjectText(project, lang);
    return `<a class="project-card reveal" data-id="${escapeHtml(project.id)}" href="${escapeHtml(project.path)}">
      <div class="project-image">${renderProjectImage(project, localized.title, 'loading="lazy" decoding="async"')}<span class="project-view">${lang === "en" ? "View project" : "詳しく見る"}</span></div>
      <div class="project-card-top"><span>${escapeHtml(localized.tag)}</span><span>${escapeHtml(project.year)}</span></div>
      <h3>${escapeHtml(localized.title)}</h3><p class="project-card-summary">${escapeHtml(localized.summary)}</p>
    </a>`;
  }).join("");
}

function installLanguageToggle() {
  if (!header || header.querySelector(".lang-toggle")) return;

  const toggle = document.createElement("div");
  toggle.className = "lang-toggle";
  toggle.setAttribute("aria-label", "Language");
  toggle.innerHTML = `
    <button type="button" data-lang-option="ja">JA</button>
    <button type="button" data-lang-option="en">EN</button>
  `;

  toggle.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      try { localStorage.setItem(LANG_KEY, button.dataset.langOption); } catch {}
      applyLanguage(button.dataset.langOption);
    });
  });

  header.append(toggle);
}

function updateLanguageToggle(lang) {
  document.querySelectorAll("[data-lang-option]").forEach((button) => {
    const isActive = button.dataset.langOption === lang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateHomePage(lang) {
  const text = UI_TEXT[lang];

  document.title = "Shunya Hara — Robotics & Creation";
  document.querySelector('meta[name="description"]')?.setAttribute("content", text.description);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", text.description);

  navLinks.forEach((link, index) => {
    if (text.nav[index]) link.textContent = text.nav[index];
  });

  setText(".hero-actions .primary", text.viewCreation);
  setText(".hero-actions .ghost", text.publicationsButton);

  setText(".timeline-wrap .timeline:nth-child(1) h3", text.educationTitle);
  setText(".timeline-wrap .timeline:nth-child(2) h3", text.jobTitle);


  setText(".footer .back-top", text.backTop);
  const en = lang === "en";
  const intro = document.querySelector("[data-hero-intro]");
  if (intro) intro.textContent = en ? "I research and develop field robots." : "フィールドロボットの研究開発をしています。";
  setText('[data-section-title="creation"]', en ? "Creation" : "制作実績");
  setText('[data-section-title="biography"]', en ? "Biography" : "経歴");
  setText("#publication .section-heading h2", text.publicationHeading);
  setText("#media .section-heading h2", text.mediaHeading);

  document.querySelectorAll(".timeline-wrap .timeline:nth-child(1) li a").forEach((item, index) => {
    if (text.education[index]) item.textContent = text.education[index];
  });

  document.querySelectorAll(".timeline-wrap .timeline:nth-child(2) li").forEach((item, index) => {
    const job = text.jobs[index];
    if (!job) return;
    const link = item.querySelector("a");
    const body = item.querySelector("p");
    if (link) link.textContent = job.company;
    if (body) body.textContent = job.body;
  });

  document.querySelectorAll(".filter").forEach((button, index) => {
    button.textContent = getPublicationFilterLabel(lang, button.dataset.filter, index);
  });

  renderProjectCards(lang);
  renderPublicationList(lang);
  renderMediaList(lang);
}

function renderProjectPage(lang) {
  const root = document.querySelector("[data-project-root]");
  const projectId = document.body.dataset.project;
  const projects = window.HRJP_PROJECTS || [];
  const project = projects.find((item) => item.id === projectId);

  if (!root || !project) return;

  const text = UI_TEXT[lang].project;
  const projectText = getProjectText(project, lang);

  const linkMarkup = project.links.length
    ? project.links.map((link) => `
        <a class="resource-link" href="${link.url}" target="_blank" rel="noopener noreferrer">
          <span>${link.meta}</span>
          <strong>${link.label}</strong>
        </a>
      `).join("")
    : `<p class="muted">${text.noLinks}</p>`;

  const videoMarkup = projectText.videos.length
    ? projectText.videos.map((video) => `
        <article class="video-panel reveal is-visible">
          <h3>${video.label}</h3>
          <div class="video-frame">
            <iframe src="${video.url}" title="${video.label}" loading="lazy" allowfullscreen></iframe>
          </div>
        </article>
      `).join("")
    : `<article class="video-panel empty reveal is-visible"><h3>Video</h3><p class="muted">${text.noVideo}</p></article>`;

  const related = projects
    .filter((item) => item.id !== project.id)
    .slice(0, 3)
    .map((item) => {
      const itemText = getProjectText(item, lang);
      return `
        <a class="mini-project" href="${item.path}">
          ${renderProjectImage(item, itemText.title, 'loading="lazy"')}
          <span>${itemText.tag}</span>
          <strong>${itemText.title}</strong>
        </a>
      `;
    }).join("");

  root.innerHTML = `
    <div class="project-hero">
      <div class="project-copy reveal is-visible">
        <a class="back-link" href="/#creation">${text.back}</a>
        <p class="eyebrow">${projectText.tag} / ${project.year}</p>
        <h1>${projectText.title}</h1>
        <p class="lead">${projectText.summary}</p>
      </div>
      <figure class="project-cover reveal is-visible">
        ${renderProjectImage(project, projectText.title)}
      </figure>
    </div>

    <div class="project-body" ${project.links.length ? "" : "hidden"}>
      <section class="detail-panel reveal is-visible">
        <p class="eyebrow">${text.resources}</p>
        <div class="resource-grid">${linkMarkup}</div>
      </section>
    </div>

    <section class="project-media" ${projectText.videos.length ? "" : "hidden"}>
      <div class="section-heading reveal is-visible">
        <p class="eyebrow">${text.media}</p>
      </div>
      <div class="video-grid">${videoMarkup}</div>
    </section>

    <section class="related-projects">
      <div class="section-heading reveal is-visible">
        <p class="eyebrow">${text.next}</p>
        <h2>${text.nextHeading}</h2>
      </div>
      <div class="mini-grid">${related}</div>
    </section>
  `;

  document.title = `${projectText.title} | Shunya Hara`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", projectText.summary);
}

function applyLanguage(lang) {
  const safeLang = lang === "en" ? "en" : "ja";

  document.documentElement.lang = safeLang;
  document.body.dataset.lang = safeLang;
  document.querySelectorAll("[data-lang-option]").forEach(b => b.setAttribute("aria-label", b.dataset.langOption === "ja" ? "日本語" : "English"));
  updateLanguageToggle(safeLang);

  if (document.querySelector("[data-project-root]")) {
    renderProjectPage(safeLang);
  } else {
    updateHomePage(safeLang);
  }
  observeReveals();
}

let ticking = false;
function updateScrollState() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
  if (meter) meter.style.width = `${progress * 100}%`;
  if (header) header.classList.toggle("is-scrolled", window.scrollY > 100);
  ticking = false;
}
const revealObserver = "IntersectionObserver" in window && !reducedMotion.matches
  ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px 40px 0px" }) : null;
if (revealObserver) document.body.classList.add("motion-ready");
function observeReveals() {
  document.querySelectorAll(".reveal:not(.is-visible)").forEach(element => {
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add("is-visible");
  });
}
installLanguageToggle();
applyLanguage(getStoredLanguage());
const sections = [...document.querySelectorAll("main section[id], footer[id]")];
if ("IntersectionObserver" in window && sections.length) {
  const sectionObserver = new IntersectionObserver(entries => {
    const active = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!active) return;
    navLinks.forEach(link => {
      const selected = link.hash === `#${active.target.id}`;
      link.classList.toggle("is-active", selected);
      if (selected) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-15% 0px -55% 0px", threshold: [0, 0.1, 0.4] });
  sections.forEach(section => sectionObserver.observe(section));
}
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(item => {
      item.classList.toggle("is-active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    renderPublicationList(document.documentElement.lang);
  });
});
const menuButton = document.querySelector(".menu-toggle");
function closeMenu() {
  header?.classList.remove("menu-open");
  menuButton?.setAttribute("aria-expanded", "false");
  menuButton?.setAttribute("aria-label", document.documentElement.lang === "en" ? "Open menu" : "メニューを開く");
}
menuButton?.addEventListener("click", () => {
  const open = header.classList.toggle("menu-open");
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", document.documentElement.lang === "en" ? (open ? "Close menu" : "Open menu") : (open ? "メニューを閉じる" : "メニューを開く"));
});
navLinks.forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", event => { if (event.key === "Escape") { closeMenu(); menuButton?.focus(); } });
window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(updateScrollState); } }, { passive: true });
window.addEventListener("resize", () => { updateScrollState(); if (window.innerWidth > 760) closeMenu(); });
updateScrollState();
