const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
};
const fmtDay = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
};
const toLocalInput = (iso) => {
  try {
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch { return ""; }
};

function toast(msg, ok = true) {
  const box = $("#toast");
  const el = document.createElement("div");
  el.className = "toast-msg";
  el.innerHTML = `${ok ? ic("check") : ""}<span></span>`;
  el.querySelector("span").textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// ---------- Lucide icons (ISC licence, open source) — эмодзи не используются ----------
const ICONS = {
  table: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  whistle: '<path d="M12 3v3"/><path d="M18.4 5.6 16.3 7.7"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'
};
function ic(n, sw = 2) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ""}</svg>`;
}
// Мяч (SVG, без эмодзи)
function ballSVG(cls = "tl-ball") {
  return `<span class="${cls}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5 15.4 10l-1.3 4h-4.2L8.6 10Z" fill="currentColor" stroke="none" opacity=".85"/><path d="M12 3v4.5M3.5 9.5l4 1M5.6 19.4l2.5-3.4M18.4 19.4 15.9 16M20.5 9.5l-4 1"/></svg></span>`;
}
// Герб лиги — загруженный логотип
function leagueCrestSVG(cls = "") {
  return `<img class="${cls}" src="/images/apl-logo.png" alt="Adilet Pro Liga" loading="lazy">`;
}
function leagueHead(title, sub) {
  return `<div class="comp-head"><span class="league-crest">${leagueCrestSVG()}</span><div><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ""}</div></div>`;
}
// Скелетоны загрузки (shimmer): плавная прогрузка вместо резкого текста
function skelLines(widths) {
  return widths.map(w => `<div class="skl-line" style="width:${w}%"></div>`).join("");
}
function skelTable() {
  return `<div class="skl-top"><span class="spin"></span></div><div class="card"><div class="pad">${skelLines([40])}</div><div class="pad">`
    + [62, 58, 65, 52].map(w => `<div class="skl-row"><span class="skl-crest"></span><div class="skl-line" style="width:${w}%"></div></div>`).join("")
    + `</div></div>`;
}
function skelCards(n = 3) {
  return `<div class="skl-top"><span class="spin"></span></div><div class="card"><div class="pad">`
    + Array.from({ length: n }, () => `<div class="skl-row"><span class="skl-crest"></span><div style="flex:1">${skelLines([55, 30])}</div><div class="skl-pill"></div></div>`).join("")
    + `</div></div>`;
}
function skelBoard() {
  return `<div class="card"><div class="pad">${skelLines([50, 80, 35])}</div></div>` + skelTable();
}

// ---------- theme (localStorage only for preference) ----------
function paintThemeBtn() {
  const dark = document.documentElement.dataset.theme === "dark";
  $("#themeBtn").innerHTML = ic(dark ? "sun" : "moon");
}
function initTheme() {
  document.documentElement.dataset.theme = localStorage.getItem("apl_theme") || "light";
  paintThemeBtn();
  $("#adminLink").innerHTML = ic("settings");
}
$("#themeBtn").addEventListener("click", () => {
  const cur = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = cur;
  localStorage.setItem("apl_theme", cur);
  paintThemeBtn();
});
initTheme();

const I = { table: ic("table"), teams: ic("shield"), matches: ic("calendar"), stats: ic("chart") };
document.querySelectorAll("#bottomnav a").forEach(a => {
  const t = a.dataset.tab;
  if (I[t]) a.querySelector(".bn-ico").innerHTML = I[t];
});

// ---------- crests: загруженные логотипы, иначе SVG-заглушка ----------
function crestSVG(team, cls = "crest") {
  if (team?.crest) return `<img class="${cls}" src="${esc(team.crest)}" alt="${esc(team.abbr || team.name || "")}" loading="lazy">`;
  const p = esc(team?.colorPrimary || "#1c2a4a");
  const s = esc(team?.colorSecondary || "#9aa4b2");
  const ab = esc((team?.abbr || "FC").slice(0, 4));
  const v = team?.crestVariant || "shield";
  if (v === "shield-split") {
    return `<svg class="${cls}" viewBox="0 0 40 44" aria-hidden="true"><path d="M20 1 37 7v13c0 10-7.5 17.5-17 23C10.5 37.5 3 30 3 20V7Z" fill="${p}" stroke="${s}" stroke-width="2"/><path d="M20 1v42C10.5 37.5 3 30 3 20V7Z" fill="#141414"/><text x="20" y="26" text-anchor="middle" font-size="10" font-weight="800" fill="#fff" font-family="Arial">${ab}</text><circle cx="20" cy="33" r="2.4" fill="${s}"/></svg>`;
  }
  // default shield-stripes (Athletic)
  return `<svg class="${cls}" viewBox="0 0 40 44" aria-hidden="true"><path d="M20 1 37 7v13c0 10-7.5 17.5-17 23C10.5 37.5 3 30 3 20V7Z" fill="${p}" stroke="${s}" stroke-width="2"/><rect x="11" y="8" width="4" height="22" fill="${s}" opacity=".9"/><rect x="18" y="8" width="4" height="22" fill="${s}" opacity=".9"/><text x="20" y="37" text-anchor="middle" font-size="8.5" font-weight="800" fill="#fff" font-family="Arial">${ab}</text></svg>`;
}
function avatarInitials(name) {
  const parts = String(name || "?").trim().split(/\s+/);
  const a = (parts[0]?.[0] || "?").toUpperCase();
  const b = (parts[1]?.[0] || "").toUpperCase();
  return esc(a + b);
}

// ---------- modal bottom-sheet (плавное окно, как у SofaScore; стек для подтверждений) ----------
const modalRoot = document.getElementById("modal-root");
const modalStack = [];
function modalEsc(e) { if (e.key === "Escape") closeModal(null); }
function openModal(title, bodyHTML, footHTML) {
  const layer = modalStack.length;
  const wrap = document.createElement("div");
  wrap.className = "m-overlay";
  wrap.style.zIndex = 100 + layer;
  wrap.innerHTML = `<div class="m-sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="m-grab"></div>
    <div class="m-head"><h3>${esc(title)}</h3><button class="icon-act" data-mx="1" aria-label="Закрыть">${ic("x")}</button></div>
    <div class="m-body">${bodyHTML}</div>
    ${footHTML ? `<div class="m-foot">${footHTML}</div>` : ""}
  </div>`;
  modalRoot.appendChild(wrap);
  const entry = { ov: wrap, onClose: null };
  modalStack.push(entry);
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add("show")));
  wrap.addEventListener("mousedown", (e) => { if (e.target === wrap) closeModal(null); });
  wrap.querySelector("[data-mx]").addEventListener("click", () => closeModal(null));
  document.addEventListener("keydown", modalEsc);
  const first = wrap.querySelector(".m-body input,.m-body select,.m-body textarea");
  if (first) setTimeout(() => { try { first.focus({ preventScroll: true }); } catch {} }, 320);
  return wrap;
}
function closeModal(val, silent, all) {
  document.removeEventListener("keydown", modalEsc);
  if (all) {
    modalStack.length = 0;
    modalRoot.innerHTML = "";
    return;
  }
  const entry = modalStack.pop();
  if (!entry) return;
  const cb = entry.onClose;
  entry.onClose = null;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  entry.ov.classList.remove("show");
  setTimeout(() => { entry.ov.remove(); }, reduced ? 0 : 200);
  if (cb && !silent) cb(val ?? null);
  if (modalStack.length) document.addEventListener("keydown", modalEsc);
}
function confirmModal(text, { title = "Подтверждение", okLabel = "Удалить", danger = true } = {}) {
  return new Promise((resolve) => {
    const ov = openModal(title, `<p class="small" style="margin:0 0 2px">${esc(text)}</p>`,
      `<button class="btn ghost" data-c="no">Отмена</button><button class="btn ${danger ? "danger" : ""}" data-c="yes">${esc(okLabel)}</button>`);
    modalStack[modalStack.length - 1].onClose = (v) => resolve(v === "yes");
    ov.querySelector('[data-c="no"]').addEventListener("click", () => closeModal("no"));
    ov.querySelector('[data-c="yes"]').addEventListener("click", () => closeModal("yes"));
  });
}

// ---------- api (работает и с отдельным бэкендом: window.APL_API_URL) ----------
const API_BASE = (window.APL_API_URL || "").replace(/\/$/, "");
const api = {
  token: localStorage.getItem("apl_token") || "",
  async req(path, opts = {}) {
    const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
    if (this.token) headers["Authorization"] = "Bearer " + this.token;
    const r = await fetch(API_BASE + path, { ...opts, headers });
    let j = null;
    try { j = await r.json(); } catch { throw new Error("Ошибка сети"); }
    if (!r.ok || j.ok === false) throw new Error(j.error || ("HTTP " + r.status));
    return j.data !== undefined ? j.data : j;
  },
  getPublic() { return this.req("/api/public"); },
  login(pw) { return this.req("/api/login", { method: "POST", body: JSON.stringify({ password: pw }) }); },
  logout() { return this.req("/api/logout", { method: "POST", body: "{}" }); },
};

// cached public state
let STATE = null;
let STATE_AT = 0;
async function getState(force = false) {
  if (STATE && !force && Date.now() - STATE_AT < 8000) return STATE;
  STATE = await api.getPublic();
  STATE_AT = Date.now();
  $("#brandName").textContent = STATE.settings.competitionName || "ADILET PRO LIGA";
  return STATE;
}
function teamById(id) { return STATE?.teams.find(t => t.id === id); }
function playerById(id) { return STATE?.players.find(p => p.id === id); }
function matchById(id) { return STATE?.matches.find(m => m.id === id); }

// ---------- router ----------
const view = $("#view");
function navActive(tab) {
  document.querySelectorAll("#bottomnav a").forEach(a => a.classList.toggle("on", a.dataset.tab === tab));
}

async function route() {
  closeModal(null, true, true);
  view.classList.remove("page-in");
  const h = location.hash || "#/table";
  const param = h.split("/")[2] || "";
  paintRouteSkeleton(h);
  await sleep(140); // спиннер успевает крутануться
  window.scrollTo(0, 0);
  try {
    if (h.startsWith("#/table")) { navActive("table"); await vTable(); }
    else if (h.startsWith("#/teams")) { navActive("teams"); param ? await vTeam(param) : await vTeams(); }
    else if (h.startsWith("#/team/")) { navActive("teams"); await vTeam(h.split("/")[2]); }
    else if (h.startsWith("#/matches")) { navActive("matches"); param && param !== "" ? await vMatch(param) : await vMatches(); }
    else if (h.startsWith("#/match/")) { navActive("matches"); await vMatch(h.split("/")[2]); }
    else if (h.startsWith("#/stats")) { navActive("stats"); await vStats(); }
    else if (h.startsWith("#/player/")) { navActive("stats"); await vPlayer(h.split("/")[2]); }
    else if (h.startsWith("#/admin")) { navActive(""); await vAdmin(h.replace("#/admin", "") || "/"); }
    else { navActive("table"); await vTable(); }
    // слайд контента справа после каждой навигации
    void view.offsetWidth;
    view.classList.add("page-in");
  } catch (e) {
    view.innerHTML = `<div class="card"><div class="pad"><div class="err">${esc(e.message)}</div><button class="btn ghost" onclick="location.reload()">Обновить</button></div></div>`;
    void view.offsetWidth;
    view.classList.add("page-in");
  }
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function paintRouteSkeleton(h) {
  let s = skelTable();
  if (h.startsWith("#/teams") || h.startsWith("#/team/")) s = skelCards(2);
  else if (h.startsWith("#/matches")) s = skelCards(4);
  else if (h.startsWith("#/table") || h.startsWith("#/stats")) s = skelTable();
  else s = skelBoard();
  view.innerHTML = s;
}
window.addEventListener("hashchange", route);

// ================= TAB 1: TABLE =================
async function vTable() {
  view.innerHTML = skelTable();
  const st = await getState();
  const rows = st.standings.map((r, i) => {
    const t = teamById(r.teamId);
    if (!t) return "";
    return `<tr class="rowlink ${i === 0 ? "lead" : ""}" data-team="${t.id}">
      <td><span class="pos">${i + 1}</span></td>
      <td class="c-team"><span class="teamcell">${crestSVG(t)}<span>${esc(t.name)}<br><small class="muted">${esc(t.abbr)}</small></span></span></td>
      <td>${r.played}</td><td>${r.won}</td><td>${r.drawn}</td><td>${r.lost}</td>
      <td>${r.goalsFor}</td><td>${r.goalsAgainst}</td><td>${r.goalDiff > 0 ? "+" : ""}${r.goalDiff}</td>
      <td class="c-pts">${r.points}</td></tr>`;
  }).join("");
  view.innerHTML = `
    ${leagueHead(st.settings.competitionName, `Победа ${st.settings.pointsWin} · Ничья ${st.settings.pointsDraw}`)}
    <div class="card">
      <div class="card-h"><span>Турнирная таблица</span><span class="small muted">В — ${st.settings.pointsWin} · Н — ${st.settings.pointsDraw}</span></div>
      <div class="tbl-wrap"><table class="st">
        <thead><tr><th>#</th><th style="text-align:left">Команда</th><th>М</th><th>В</th><th>Н</th><th>П</th><th>ГЗ</th><th>ГП</th><th>РГ</th><th>О</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="10" class="muted" style="padding:18px">Нет данных. Таблица обновится после завершения матчей.</td></tr>`}</tbody>
      </table></div>
    </div>
    <div class="card">${leagueBar(st)}${miniMatches(st)}
    </div>`;
  view.querySelectorAll("[data-team]").forEach(tr => tr.addEventListener("click", () => location.hash = "#/team/" + tr.dataset.team));
}

function miniMatches(st) {
  const up = st.matches.filter(m => m.status === "scheduled").slice(0, 3);
  const done = st.matches.filter(m => m.status === "completed").slice(-2).reverse();
  const list = [...up, ...done].slice(0, 4);
  if (!list.length) return `<div class="empty">Матчи пока не запланированы</div>`;
  return list.map(m => matchRow(m)).join("");
}

function shortTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit" }) + "<br>" + d.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}
function statusRU(s) {
  return s === "completed" ? "Завершён" : s === "cancelled" ? "Отменён" : s === "draft" ? "Черновик" : "Предстоит";
}
function matchRow(m) {
  const h = teamById(m.homeTeamId), a = teamById(m.awayTeamId);
  const done = m.status === "completed";
  const hw = done && m.homeGoals > m.awayGoals, aw = done && m.awayGoals > m.homeGoals;
  const score = done
    ? `<div class="m-score">${m.homeGoals} – ${m.awayGoals}<span class="ft">Завершён</span></div>`
    : m.status === "cancelled"
      ? `<div class="m-score small muted">—<span class="ft">Отменён</span></div>`
      : `<div class="m-score small muted" style="font-weight:600">${esc(fmtDate(m.date))}<span class="ft">${m.status === "draft" ? "Черновик" : "Предстоит"}</span></div>`;
  return `<div class="match-card" data-match="${m.id}">
    <div class="m-time">${shortTime(m.date)}</div>
    <div class="m-teams">
      <div class="m-team ${hw ? "winner" : ""}">${crestSVG(h)}<span class="nm">${esc(h?.name || "—")}</span></div>
      <div class="m-team ${aw ? "winner" : ""}">${crestSVG(a)}<span class="nm">${esc(a?.name || "—")}</span></div>
    </div>
    ${score}
  </div>`;
}
function leagueBar(st) {
  return `<div class="league-bar"><span class="league-crest">${leagueCrestSVG()}</span><span>${esc(st.settings.competitionName)}</span><span class="chev">${ic("chevR")}</span></div>`;
}

// ================= TAB 2: TEAMS =================
async function vTeams() {
  view.innerHTML = skelCards(2);
  const st = await getState();
  view.innerHTML = `
    ${leagueHead("Команды", `${st.teams.length} команды`)}
    <div class="card">${st.teams.map(t => `
      <div class="teamrow" data-team="${t.id}">
        ${crestSVG(t, "crest lg")}
        <div class="meta"><b>${esc(t.name)}</b><span>${esc(t.abbr)} · Игроков: ${t.squadCount} · Матчей: ${t.standings.played}</span>
          <div class="stat-chips"><span class="chip">В <b>${t.standings.won}</b></span><span class="chip">Н <b>${t.standings.drawn}</b></span><span class="chip">П <b>${t.standings.lost}</b></span><span class="chip">ГЗ <b>${t.standings.goalsFor}</b></span><span class="chip">ГП <b>${t.standings.goalsAgainst}</b></span></div>
        </div>
        <div class="pts-pill">${t.standings.points}<div style="font-size:10px;font-weight:600">очк.</div></div>
      </div>`).join("")}
    </div>`;
  view.querySelectorAll("[data-team]").forEach(el => el.addEventListener("click", () => location.hash = "#/team/" + el.dataset.team));
}

async function vTeam(id) {
  view.innerHTML = skelBoard();
  const st = await getState();
  const t = teamById(id);
  if (!t) { view.innerHTML = `<div class="card"><div class="pad">Команда не найдена</div></div>`; return; }
  const s = t.standings;
  const squad = st.players.filter(p => p.teamId === t.id);
  const cap = st.players.find(p => p.id === t.captainId) || null;
  const myMatches = st.matches.filter(m => (m.homeTeamId === t.id || m.awayTeamId === t.id) && m.status === "completed").slice(-5).reverse();
  const scorers = squad.slice().sort((a, b) => b.stats.goals - a.stats.goals).slice(0, 5);
  view.innerHTML = `
    <a class="backlink" href="#/teams">${ic("back")} Все команды</a>
    <div class="card"><div class="profile-top">${crestSVG(t, "crest lg")}
      <div class="nm"><b>${esc(t.name)}</b><span class="muted small">${esc(t.abbr)}</span>
      <div class="stat-chips"><span class="chip">М <b>${s.played}</b></span><span class="chip">В <b>${s.won}</b></span><span class="chip">Н <b>${s.drawn}</b></span><span class="chip">П <b>${s.lost}</b></span><span class="chip">РГ <b>${s.goalDiff > 0 ? "+" : ""}${s.goalDiff}</b></span><span class="chip">О <b>${s.points}</b></span></div></div>
    </div></div>
    ${cap ? `<div class="card"><div class="captain-plate" data-pl="${cap.id}"><span class="cap-arm">C</span><span class="avatar" style="width:38px;height:38px;flex-basis:38px">${avatarInitials(cap.name)}</span><div class="grow"><b>Капитан · ${esc(cap.name)}</b><div class="small muted">${esc(cap.position)} · М ${cap.stats.apps} · Г ${cap.stats.goals}</div></div><span class="chev">${ic("chevR")}</span></div></div>` : ""}
    <div class="card"><div class="card-h"><span>Состав · ${squad.length}</span></div>
      ${squad.length ? `<div class="tbl-wrap"><table class="st" style="min-width:460px"><thead><tr><th style="text-align:left">Игрок</th><th>Поз</th><th>М</th><th>Г</th><th>А</th></tr></thead><tbody>
      ${squad.map(p => `<tr class="rowlink" data-pl="${p.id}"><td class="c-team"><span class="teamcell"><span class="avatar">${avatarInitials(p.name)}</span><span>${esc(p.name)}${p.id === t.captainId ? ' <span class="captain-badge">C</span>' : ""}</span></span></td><td>${esc(p.position)}</td><td>${p.stats.apps}</td><td><b>${p.stats.goals}</b></td><td><b>${p.stats.assists}</b></td></tr>`).join("")}
      </tbody></table></div>` : `<div class="empty">Состав пока пуст. Администратор добавит игроков.</div>`}
    </div>
    <div class="card"><div class="card-h"><span>Последние матчи</span></div>
      ${myMatches.length ? myMatches.map(m => matchRow(m)).join("") : `<div class="empty">Завершённых матчей пока нет</div>`}
    </div>
    <div class="card"><div class="card-h"><span>Лидеры команды</span></div><div class="pad small">
      ${scorers.filter(p => p.stats.goals > 0).map(p => `<div class="line-row">${ballSVG()}<a href="#/player/${p.id}" style="font-weight:700">${esc(p.name)}</a><span class="muted"> — ${p.stats.goals} гол(а)</span></div>`).join("") || `<span class="muted">Голы пока не записаны</span>`}
    </div></div>`;
  view.querySelectorAll("[data-pl]").forEach(tr => tr.addEventListener("click", () => location.hash = "#/player/" + tr.dataset.pl));
  bindMatchCards();
}

// ================= TAB 3: MATCHES =================
async function vMatches() {
  view.innerHTML = skelCards(4);
  const st = await getState();
  const up = st.matches.filter(m => m.status === "scheduled" || m.status === "draft").sort((a, b) => new Date(a.date) - new Date(b.date));
  const done = st.matches.filter(m => m.status === "completed").sort((a, b) => new Date(b.date) - new Date(a.date));
  const cancelled = st.matches.filter(m => m.status === "cancelled");
  view.innerHTML = `
    ${leagueHead("Матчи", "Предстоящие и завершённые")}
    <div class="group-title">Предстоящие · ${up.length}</div>
    <div class="card">${leagueBar(st)}${up.length ? up.map(m => matchRow(m)).join("") : `<div class="empty">${ic("calendar")}Предстоящих матчей нет</div>`}</div>
    <div class="group-title">Завершённые · ${done.length}</div>
    <div class="card">${leagueBar(st)}${done.length ? done.map(m => matchRow(m)).join("") : `<div class="empty">${ic("whistle")}Завершённых матчей пока нет</div>`}</div>
    ${cancelled.length ? `<div class="group-title">Отменённые</div><div class="card">${cancelled.map(m => matchRow(m)).join("")}</div>` : ""}`;
  bindMatchCards();
}
function bindMatchCards() {
  view.querySelectorAll("[data-match]").forEach(el => el.addEventListener("click", () => location.hash = "#/match/" + el.dataset.match));
}

async function vMatch(id) {
  view.innerHTML = skelBoard();
  const st = await getState(true);
  const m = matchById(id);
  if (!m) { view.innerHTML = `<div class="card"><div class="pad">Матч не найден</div></div>`; return; }
  const h = teamById(m.homeTeamId), a = teamById(m.awayTeamId);
  const evs = (m.events || []).slice().sort((x, y) => x.minute - y.minute);
  const statusBadge = m.status === "completed" ? `<span class="badge green">${ic("whistle")} Завершён</span>` : m.status === "cancelled" ? `<span class="badge">Отменён</span>` : `<span class="badge blue">${ic("clock")} ${statusRU(m.status)}</span>`;
  view.innerHTML = `
    <a class="backlink" href="#/matches">${ic("back")} Все матчи</a>
    <div class="scoreboard">
      <div class="sb-top">${esc(fmtDay(m.date))} · ${statusBadge}</div>
      <div class="sb-main">
        <div class="sb-team" data-team="${h?.id}">${crestSVG(h, "crest lg")}<span>${esc(h?.name)}</span></div>
        <div class="sb-mid">${m.status === "completed" ? `<div class="sb-score">${m.homeGoals}<span class="dash">–</span>${m.awayGoals}</div>` : `<div class="sb-kick">${esc(fmtDate(m.date))}</div>`}</div>
        <div class="sb-team" data-team="${a?.id}">${crestSVG(a, "crest lg")}<span>${esc(a?.name)}</span></div>
      </div>
      ${m.note ? `<div class="sb-note">${esc(m.note)}</div>` : ""}
    </div>
    <div class="card"><div class="card-h"><span>События</span><span class="small muted">${h?.abbr} · ${a?.abbr}</span></div>
      ${splitTimeline(m, evs)}
    </div>
    <div class="card"><div class="card-h"><span>Составы / участия</span></div>
      <div class="pad small muted">${appsForMatch(m)}</div>
    </div>`;
  view.querySelectorAll(".sb-team").forEach(el => el.addEventListener("click", () => location.hash = "#/team/" + el.dataset.team));
}
// Сплит-таймлайн: голы хозяев слева, гостей справа, минута в центре
function splitTimeline(m, evs) {
  if (!evs.length) return `<div class="empty">${ballSVG()}<div>События не записаны</div></div>`;
  const label = (t) => t === "own-goal" ? "Автогол" : t === "penalty" ? "Пенальти" : "Гол";
  return `<div class="tl-split">${evs.map(e => {
    const sc = playerById(e.scorerId), as = e.assisterId ? playerById(e.assisterId) : null;
    const home = e.teamId === m.homeTeamId;
    const inner = `<div class="who"><b><a href="#/player/${sc?.id}">${esc(sc?.name || "—")}</a></b><span>${label(e.type)}${as ? " · Ассист: " + esc(as.name) : ""}</span></div>`;
    return `<div class="tl-ev">
      <div class="tl-side home">${home ? inner + ballSVG() : ""}</div>
      <div class="tl-min">${e.minute}′</div>
      <div class="tl-side away">${!home ? ballSVG() + inner : ""}</div>
    </div>`;
  }).join("")}</div>`;
}
function appsForMatch(m) {
  const ids = (STATE.appearances || []).filter(x => x.matchId === m.id).map(x => x.playerId);
  if (!ids.length) return "Участия игроков не отмечены администратором.";
  const names = ids.map(pid => playerById(pid)?.name).filter(Boolean);
  return `Отмечено участий: <b style="color:var(--text)">${ids.length}</b> — ${esc(names.slice(0, 12).join(", "))}${names.length > 12 ? "…" : ""}`;
}

// ================= TAB 4: STATS =================
async function vStats() {
  view.innerHTML = skelTable();
  const st = await getState();
  const qs = new URLSearchParams((location.hash.split("?")[1] || ""));
  let tab = qs.get("t") === "assists" ? "assists" : "goals";
  const render = () => {
    const list = tab === "goals" ? st.scorers : st.assisters;
    const rows = list.filter(p => tab === "goals" ? true : true).map((p, i) => {
      const t = teamById(p.teamId);
      const val = tab === "goals" ? p.stats.goals : p.stats.assists;
      return `<tr class="rowlink" data-pl="${p.id}"><td class="n"><span class="pos" ${i === 0 && val > 0 ? 'style="background:var(--accent);border-color:var(--accent);color:#fff"' : ""}>${i + 1}</span></td>
        <td><span class="pl-cell"><span class="avatar">${avatarInitials(p.name)}</span><span>${esc(p.name)}<br><small class="muted">${esc(t?.abbr || "")} · ${esc(p.position)}</small></span></span></td>
        <td><span class="teamcell" style="min-width:0">${t ? crestSVG(t) : ""}<small class="muted">${esc(t?.abbr || "—")}</small></span></td>
        <td class="n muted">${p.stats.apps}</td>
        <td class="n"><span class="${val > 0 ? "goals-pill" : "num"}">${val}</span></td></tr>`;
    }).join("");
    view.innerHTML = `
      ${leagueHead("Статистика", "Бомбардиры и ассистенты")}
      <div class="stabs"><button data-s="goals" class="${tab === "goals" ? "on" : ""}">Бомбардиры</button><button data-s="assists" class="${tab === "assists" ? "on" : ""}">Ассистенты</button></div>
      <div class="card"><table class="rank"><thead><tr><th class="n">#</th><th>Игрок</th><th>Ком.</th><th class="n">М</th><th class="n">${tab === "goals" ? "Голы" : "Ассисты"}</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5" class="empty">Данные появятся после первого гола</td></tr>`}</tbody></table></div>
      <div class="hint">Статистика считается автоматически из событий матчей. Ноль — тоже результат, подделок нет.</div>`;
    view.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => { tab = b.dataset.s; render(); }));
    view.querySelectorAll("[data-pl]").forEach(tr => tr.addEventListener("click", () => location.hash = "#/player/" + tr.dataset.pl));
  };
  render();
}

async function vPlayer(id) {
  view.innerHTML = skelBoard();
  const st = await getState(true);
  const p = playerById(id);
  if (!p) { view.innerHTML = `<div class="card"><div class="pad">Игрок не найден</div></div>`; return; }
  const t = teamById(p.teamId);
  const capTeam = st.teams.find(x => x.captainId === p.id);
  const evs = [];
  for (const m of st.matches) {
    for (const e of (m.events || [])) {
      if (e.scorerId === p.id || e.assisterId === p.id) {
        evs.push({ m, e, role: e.scorerId === p.id ? "Гол" : "Ассист" });
      }
    }
  }
  evs.sort((a, b) => new Date(b.m.date) - new Date(a.m.date));
  const playedMatches = st.matches.filter(m => (STATE.appearances || []).some(x => x.matchId === m.id && x.playerId === p.id)).slice(-8).reverse();
  view.innerHTML = `
    <a class="backlink" href="#/stats">${ic("back")} Статистика</a>
    <div class="card"><div class="profile-top"><span class="avatar" style="width:52px;height:52px;font-size:16px;flex-basis:52px">${avatarInitials(p.name)}</span>
      <div class="nm"><b>${esc(p.name)}</b>${capTeam ? `<span class="badge gold">C · Капитан ${esc(capTeam.abbr)}</span>` : ""}<span class="muted small">${esc(p.position)} · ${t ? `<a href="#/team/${t.id}" style="font-weight:700">${esc(t.name)}</a>` : "Без команды"}</span>
      ${p.stats.manualApps !== null && p.stats.manualApps !== undefined ? `<div class="small muted">Матчи скорректированы вручную</div>` : ""}
      <div class="stat-chips"><span class="chip">М <b>${p.stats.apps}</b></span><span class="chip">Г <b>${p.stats.goals}</b></span><span class="chip">А <b>${p.stats.assists}</b></span><span class="chip">Г/М <b>${p.stats.goalsPerMatch}</b></span></div></div>
    </div></div>
    <div class="card"><div class="card-h"><span>События игрока · ${evs.length}</span></div>
      ${evs.length ? evs.map(({ m, e, role }) => {
        const ht = teamById(m.homeTeamId), at = teamById(m.awayTeamId);
        return `<div class="line-row"><span class="tl-min">${e.minute}′</span><div style="flex:1;min-width:0"><b>${role}</b> · <a href="#/match/${m.id}" style="font-weight:700">${esc(ht?.abbr)} ${m.homeGoals}–${m.awayGoals} ${esc(at?.abbr)}</a><div class="small muted">${esc(fmtDate(m.date))}</div></div>${ballSVG()}</div>`;
      }).join("") : `<div class="empty">Голов и ассистов пока нет</div>`}
    </div>
    <div class="card"><div class="card-h"><span>История матчей</span></div>
      ${playedMatches.length ? playedMatches.map(m => matchRow(m)).join("") : `<div class="empty">Участия не отмечены</div>`}
    </div>`;
  bindMatchCards();
}

// ================= ADMIN =================
function isAuthed() { return !!api.token; }

async function vAdmin(sub) {
  if (!isAuthed()) return vAdminLogin();
  const tab = (sub.split("?")[0].replace(/^\//, "") || "dash").split("/")[0];
  const rest = sub;
  if (tab === "match" || rest.startsWith("/match/")) {
    const id = rest.split("/")[2];
    return vAdminMatch(id);
  }
  view.innerHTML = skelBoard();
  let dash = null;
  try { dash = await api.req("/api/dashboard"); } catch (e) {
    if (String(e.message).includes("вход")) { api.token = ""; localStorage.removeItem("apl_token"); return vAdminLogin(); }
    throw e;
  }
  const tabs = [["dash", "Обзор"], ["teams", "Команды"], ["players", "Игроки"], ["matches", "Матчи"], ["settings", "Настройки"]];
  let body = "";
  if (tab === "teams") body = await adminTeamsHTML();
  else if (tab === "players") body = await adminPlayersHTML();
  else if (tab === "matches") body = await adminMatchesHTML();
  else if (tab === "settings") body = await adminSettingsHTML();
  else body = adminDashHTML(dash);
  view.innerHTML = `
    ${leagueHead("Админ-панель", "Управление Adilet Pro Liga")}
    <div style="display:flex;gap:8px;margin-bottom:12px"><button class="btn ghost sm" id="pubView">${ic("back")} На сайт</button><button class="btn ghost sm" id="logoutBtn">${ic("logout")} Выйти</button></div>
    <div class="admin-tabs">${tabs.map(([k, l]) => `<button data-at="${k}" class="${tab === k || (tab === "dash" && k === "dash") ? "on" : ""}">${l}</button>`).join("")}</div>
    <div id="adminBody">${body}</div>`;
  $("#pubView").onclick = () => location.hash = "#/table";
  $("#logoutBtn").onclick = async () => { try { await api.logout(); } catch {} api.token = ""; localStorage.removeItem("apl_token"); toast("Вы вышли"); location.hash = "#/table"; };
  view.querySelectorAll("[data-at]").forEach(b => b.addEventListener("click", () => location.hash = "#/admin/" + b.dataset.at));
  bindAdmin(tab);
}

function vAdminLogin() {
  navActive("");
  view.innerHTML = `
    ${leagueHead("Вход для администратора", "Публичные страницы не содержат кнопок управления")}
    <div class="card"><div class="pad">
      <label class="f">Пароль администратора</label>
      <input id="pw" type="password" placeholder="••••••••" autocomplete="current-password">
      <div style="height:10px"></div>
      <button class="btn" id="loginBtn">Войти</button>
      <div class="hint">По умолчанию: <b>adilet2026</b>. Смените через переменную <b>ADMIN_PASSWORD</b> на сервере.</div>
      <div id="lerr"></div>
    </div></div>`;
  const go = async () => {
    const pw = $("#pw").value;
    try {
      const r = await api.login(pw);
      api.token = r.token;
      localStorage.setItem("apl_token", r.token);
      toast("Добро пожаловать");
      location.hash = "#/admin/dash";
    } catch (e) { $("#lerr").innerHTML = `<div class="err">${esc(e.message)}</div>`; }
  };
  $("#loginBtn").onclick = go;
  $("#pw").addEventListener("keydown", e => { if (e.key === "Enter") go(); });
  setTimeout(() => $("#pw")?.focus(), 50);
}

function adminDashHTML(d) {
  const kpi = (icn, v, l) => `<div class="kpi"><span class="k-ico">${ic(icn)}</span><div><b>${v}</b><span>${l}</span></div></div>`;
  return `<div class="kpis">
    ${kpi("shield", d.totalTeams, "Команды")}
    ${kpi("users", d.totalPlayers, "Игроки")}
    ${kpi("calendar", d.totalMatches, "Матчи")}
    ${kpi("whistle", d.completed, `Завершено · предст. ${d.upcoming}`)}
  </div>
  <div class="card"><div class="card-h"><span>Последние действия</span></div>
  ${(d.audit || []).map(a => `<div class="list-item"><div class="grow"><b class="small">${esc(a.action)}</b><div class="small muted">${esc(a.detail)} · ${esc(fmtDate(a.at))}</div></div></div>`).join("") || `<div class="empty">Пока пусто</div>`}
  </div>
  <div class="card"><div class="pad"><a class="btn ghost" href="#/admin/matches">${ic("plus")} Быстрый матч и голы</a></div></div>`;
}

async function adminTeamsHTML() {
  const st = await getState(true);
  return `<div class="card">
    <div class="card-h"><span>Команды · ${st.teams.length}</span><button class="btn sm" id="nt-open">${ic("plus")} Новая</button></div>
    ${st.teams.map(t => `<div class="list-item">${crestSVG(t)}<div class="grow"><b>${esc(t.name)}</b><div class="small muted">${esc(t.abbr)} · игроков ${t.squadCount}</div></div><button class="icon-act" data-edit-team="${t.id}" aria-label="Редактировать" title="Редактировать">${ic("pencil")}</button></div>`).join("")}
  </div>`;
}

async function adminPlayersHTML() {
  const st = await getState(true);
  return `<div class="card">
    <div class="card-h"><span>Игроки · ${st.players.length}</span><button class="btn sm" id="np-open">${ic("plus")} Новый</button></div>
    ${st.players.map(p => {
      const t = teamById(p.teamId);
      return `<div class="list-item"><span class="avatar">${avatarInitials(p.name)}</span><div class="grow"><b>${esc(p.name)}</b><div class="small muted">${esc(p.position)} · ${esc(t?.name || "без команды")} · М ${p.stats.apps} Г ${p.stats.goals} А ${p.stats.assists}</div></div><button class="icon-act" data-edit-pl="${p.id}" aria-label="Редактировать" title="Редактировать">${ic("pencil")}</button></div>`;
    }).join("") || `<div class="empty">${ic("user")}Игроков пока нет — нажмите «Новый»</div>`}
  </div>`;
}

async function adminMatchesHTML() {
  const st = await getState(true);
  const sorted = st.matches.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  return `<div class="card">
    <div class="card-h"><span>Матчи · ${sorted.length}</span><button class="btn sm" id="nm-open">${ic("plus")} Новый</button></div>
    ${sorted.map(m => {
      const h = teamById(m.homeTeamId), a = teamById(m.awayTeamId);
      return `<div class="list-item"><div class="grow"><b>${esc(h?.name)} ${m.status === "completed" ? m.homeGoals + "–" + m.awayGoals : "–"} ${esc(a?.name)}</b><div class="small muted">${esc(fmtDate(m.date))} · ${statusRU(m.status)} · голов ${m.events?.length || 0}</div></div><a class="icon-act" href="#/admin/match/${m.id}" aria-label="Открыть" title="Открыть">${ic("chevR")}</a></div>`;
    }).join("") || `<div class="empty">${ic("calendar")}Матчей пока нет</div>`}
  </div>`;
}

async function adminSettingsHTML() {
  const s = (await api.req("/api/settings"));
  return `<div class="card"><div class="card-h"><span>Настройки лиги</span></div><div class="pad">
    <label class="f">Название лиги</label><input id="s-name" value="${esc(s.competitionName)}">
    <div class="row2"><div><label class="f">Подзаголовок</label><input id="s-sub" value="${esc(s.subtitle || "")}"></div><div><label class="f">Сезон</label><input id="s-season" value="${esc(s.season || "")}"></div></div>
    <div class="row2"><div><label class="f">Очки за победу</label><input id="s-w" type="number" min="0" max="10" value="${s.pointsWin}"></div><div><label class="f">Очки за ничью</label><input id="s-d" type="number" min="0" max="10" value="${s.pointsDraw}"></div></div>
    <label class="check"><input type="checkbox" id="s-self" ${s.allowSelfAssist ? "checked" : ""}><span>Разрешить «ассист самому себе» (по умолчанию запрещено)</span></label>
    <div style="height:10px"></div><button class="btn" id="s-save">Сохранить</button><div id="s-msg"></div>
    <div class="hint">Порядок сортировки: очки → разница → забитые. После сохранения таблица пересчитается автоматически.</div>
  </div></div>`;
}

function crestOptions(current) {
  const opts = [
    ["", "Авто (SVG)"],
    ["/images/athletic-eight.png", "Athletic Eight"],
    ["/images/laseven-fc.png", "La Seven FC"],
    ["/images/apl-logo.png", "Логотип лиги APL"]
  ];
  if (current && !opts.some(o => o[0] === current)) opts.push([current, "Текущая"]);
  return opts.map(([v, l]) => `<option value="${esc(v)}" ${current === v ? "selected" : ""}>${esc(l)}</option>`).join("");
}
function modalErr(ov, msg) {
  let box = ov.querySelector("[data-merr]");
  if (!box) return;
  box.innerHTML = msg ? `<div class="err form-err">${esc(msg)}</div>` : "";
}
function bindAdmin(tab) {
  if (tab === "teams") {
    $("#nt-open")?.addEventListener("click", () => {
      const ov = openModal("Новая команда",
        `<div class="row2"><div><label class="f">Название</label><input id="m-name" placeholder="Новая школа FC"></div><div><label class="f">Абр.</label><input id="m-abbr" placeholder="NSF" maxlength="6"></div></div>
        <label class="f">Логотип</label><select id="m-crest">${crestOptions("")}</select>
        <div class="row2"><div><label class="f">Цвет 1</label><input id="m-c1" type="color" value="#1c2a4a"></div><div><label class="f">Цвет 2</label><input id="m-c2" type="color" value="#2c3ec4"></div></div>
        <label class="f">Фон SVG (если логотипа нет)</label><select id="m-v"><option value="shield-stripes">Полосы</option><option value="shield-split">Разделённая</option><option value="shield">Щит</option></select>
        <div data-merr></div>`,
        `<button class="btn ghost" data-b="cancel">Отмена</button><button class="btn" data-b="save">${ic("check")} Создать</button>`);
      ov.querySelector('[data-b="cancel"]').addEventListener("click", () => closeModal("cancel"));
      ov.querySelector('[data-b="save"]').addEventListener("click", async () => {
        try {
          await api.req("/api/teams", { method: "POST", body: JSON.stringify({ name: ov.querySelector("#m-name").value, abbr: ov.querySelector("#m-abbr").value || "FC", crest: ov.querySelector("#m-crest").value || null, colorPrimary: ov.querySelector("#m-c1").value, colorSecondary: ov.querySelector("#m-c2").value, crestVariant: ov.querySelector("#m-v").value }) });
          closeModal("saved"); toast("Команда создана"); STATE_AT = 0; vAdmin("/teams");
        } catch (e) { modalErr(ov, e.message); }
      });
    });
    view.querySelectorAll("[data-edit-team]").forEach(b => b.addEventListener("click", async () => {
      const st = await getState(true);
      const t = st.teams.find(x => x.id === b.dataset.editTeam);
      const ov = openModal(`Команда: ${t.name}`,
        `<label class="f">Название</label><input id="m-name" value="${esc(t.name)}">
        <label class="f">Капитан</label><select id="m-cap"><option value="">— без капитана —</option>${st.players.filter(p => p.teamId === t.id).map(p => `<option value="${p.id}" ${t.captainId === p.id ? "selected" : ""}>${esc(p.name)} (${esc(p.position)})</option>`).join("")}</select>
        <label class="f">Логотип</label><select id="m-crest">${crestOptions(t.crest || "")}</select>
        <div class="hint">Файлы лежат в папке <b>images</b> сайта: athletic-eight.png, laseven-fc.png, apl-logo.png.</div>
        <div class="row2"><div><label class="f">Абр.</label><input id="m-abbr" value="${esc(t.abbr)}" maxlength="6"></div><div><label class="f">Фон SVG (если логотипа нет)</label><select id="m-v"><option value="shield-stripes" ${t.crestVariant === "shield-stripes" ? "selected" : ""}>Полосы</option><option value="shield-split" ${t.crestVariant === "shield-split" ? "selected" : ""}>Разделённая</option><option value="shield" ${t.crestVariant === "shield" ? "selected" : ""}>Щит</option></select></div></div>
        <div class="row2"><div><label class="f">Цвет 1</label><input id="m-c1" type="color" value="${esc(t.colorPrimary)}"></div><div><label class="f">Цвет 2</label><input id="m-c2" type="color" value="${esc(t.colorSecondary)}"></div></div>
        <div data-merr></div>`,
        `<button class="btn ghost" data-b="arch">В архив</button><button class="btn" data-b="save">${ic("check")} Сохранить</button>`);
      ov.querySelector('[data-b="save"]').addEventListener("click", async () => {
        try {
          await api.req("/api/teams/" + t.id, { method: "PUT", body: JSON.stringify({ name: ov.querySelector("#m-name").value, abbr: ov.querySelector("#m-abbr").value, captainId: ov.querySelector("#m-cap").value || null, crest: ov.querySelector("#m-crest").value || null, colorPrimary: ov.querySelector("#m-c1").value, colorSecondary: ov.querySelector("#m-c2").value, crestVariant: ov.querySelector("#m-v").value }) });
          closeModal("saved"); toast("Сохранено"); STATE_AT = 0; vAdmin("/teams");
        } catch (e) { modalErr(ov, e.message); }
      });
      ov.querySelector('[data-b="arch"]').addEventListener("click", async () => {
        if (!await confirmModal("Архивировать команду? Она пропадёт из таблицы.", { okLabel: "Архивировать", danger: false })) return;
        try { await api.req("/api/teams/" + t.id, { method: "PUT", body: JSON.stringify({ archived: true }) }); closeModal("saved"); toast("Архивировано"); STATE_AT = 0; vAdmin("/teams"); }
        catch (e) { modalErr(ov, e.message); }
      });
    }));
  }
  if (tab === "players") {
    $("#np-open")?.addEventListener("click", async () => {
      const st = await getState(true);
      const ov = openModal("Новый игрок",
        `<label class="f">ФИО</label><input id="m-name" placeholder="Например: А. Ибраев">
        <div class="row2"><div><label class="f">Позиция</label><select id="m-pos"><option>ВР</option><option>ЗЩ</option><option selected>ПЗ</option><option>НП</option></select></div>
        <div><label class="f">Команда</label><select id="m-team"><option value="">— без команды —</option>${st.teams.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></div></div>
        <div data-merr></div>`,
        `<button class="btn ghost" data-b="cancel">Отмена</button><button class="btn" data-b="save">${ic("check")} Создать</button>`);
      ov.querySelector('[data-b="cancel"]').addEventListener("click", () => closeModal("cancel"));
      ov.querySelector('[data-b="save"]').addEventListener("click", async () => {
        try {
          await api.req("/api/players", { method: "POST", body: JSON.stringify({ name: ov.querySelector("#m-name").value, position: ov.querySelector("#m-pos").value, teamId: ov.querySelector("#m-team").value || null }) });
          closeModal("saved"); toast("Игрок создан"); STATE_AT = 0; vAdmin("/players");
        } catch (e) { modalErr(ov, e.message); }
      });
    });
    view.querySelectorAll("[data-edit-pl]").forEach(b => b.addEventListener("click", async () => {
      const st = await getState(true);
      const p = st.players.find(x => x.id === b.dataset.editPl);
      const ov = openModal(`Игрок: ${p.name}`,
        `<label class="f">ФИО</label><input id="m-name" value="${esc(p.name)}">
        <div class="row2"><div><label class="f">Позиция</label><select id="m-pos">${["ВР", "ЗЩ", "ПЗ", "НП"].map(z => `<option ${p.position === z ? "selected" : ""}>${z}</option>`).join("")}</select></div>
        <div><label class="f">Команда</label><select id="m-team"><option value="">— без команды —</option>${st.teams.map(t => `<option value="${t.id}" ${p.teamId === t.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></div></div>
        <label class="f">Матчи вручную (пусто = авто из участий; сейчас ${p.stats.apps})</label><input id="m-m" type="number" min="0" max="500" placeholder="авто" value="${p.manualAppsOverride ?? ""}">
        <div class="hint">Голы и ассисты редактируются только через события матчей — это источник правды.</div>
        <div data-merr></div>`,
        `<button class="btn danger" data-b="del">${ic("trash")} Удалить</button><button class="btn" data-b="save">${ic("check")} Сохранить</button>`);
      ov.querySelector('[data-b="save"]').addEventListener("click", async () => {
        try {
          await api.req("/api/players/" + p.id, { method: "PUT", body: JSON.stringify({ name: ov.querySelector("#m-name").value, position: ov.querySelector("#m-pos").value, teamId: ov.querySelector("#m-team").value || null, manualAppsOverride: ov.querySelector("#m-m").value === "" ? null : Number(ov.querySelector("#m-m").value) }) });
          closeModal("saved"); toast("Сохранено"); STATE_AT = 0; vAdmin("/players");
        } catch (e) { modalErr(ov, e.message); }
      });
      ov.querySelector('[data-b="del"]').addEventListener("click", async () => {
        if (!await confirmModal("Удалить игрока? Если он есть в событиях — удаление запрещено.")) return;
        try { await api.req("/api/players/" + p.id, { method: "DELETE" }); closeModal("saved"); toast("Удалён"); STATE_AT = 0; vAdmin("/players"); }
        catch (e) { modalErr(ov, e.message); }
      });
    }));
  }
  if (tab === "matches") {
    $("#nm-open")?.addEventListener("click", async () => {
      const st = await getState(true);
      const ov = openModal("Новый матч",
        `<div class="row2"><div><label class="f">Хозяева</label><select id="m-h">${st.teams.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></div>
        <div><label class="f">Гости</label><select id="m-a">${st.teams.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></div></div>
        <label class="f">Дата и время</label><input id="m-d" type="datetime-local" value="${toLocalInput(new Date(Date.now() + 86400000).toISOString())}">
        <label class="f">Статус</label><select id="m-s"><option value="scheduled">Предстоит</option><option value="completed">Завершён</option><option value="draft">Черновик</option></select>
        <div data-merr></div>`,
        `<button class="btn ghost" data-b="cancel">Отмена</button><button class="btn" data-b="save">${ic("check")} Создать</button>`);
      ov.querySelector('[data-b="cancel"]').addEventListener("click", () => closeModal("cancel"));
      ov.querySelector('[data-b="save"]').addEventListener("click", async () => {
        if (ov.querySelector("#m-h").value === ov.querySelector("#m-a").value) { modalErr(ov, "Команда не может играть сама с собой"); return; }
        try {
          const m = await api.req("/api/matches", { method: "POST", body: JSON.stringify({ homeTeamId: ov.querySelector("#m-h").value, awayTeamId: ov.querySelector("#m-a").value, date: new Date(ov.querySelector("#m-d").value).toISOString(), status: ov.querySelector("#m-s").value }) });
          closeModal("saved", true); toast("Матч создан"); location.hash = "#/admin/match/" + m.id;
        } catch (e) { modalErr(ov, e.message); }
      });
    });
  }
  if (tab === "settings") {
    $("#s-save")?.addEventListener("click", async () => {
      try {
        await api.req("/api/settings", { method: "PUT", body: JSON.stringify({ competitionName: $("#s-name").value, subtitle: $("#s-sub").value, season: $("#s-season").value, pointsWin: Number($("#s-w").value), pointsDraw: Number($("#s-d").value), allowSelfAssist: $("#s-self").checked }) });
        toast("Настройки сохранены"); STATE_AT = 0;
      } catch (e) { $("#s-msg").innerHTML = `<div class="err">${esc(e.message)}</div>`; }
    });
  }
}

// ------- admin: single match editor (events + appearances + status) -------
async function vAdminMatch(id) {
  view.innerHTML = skelBoard();
  const st = await getState(true);
  const m = matchById(id);
  if (!m) { view.innerHTML = `<div class="card"><div class="pad">Матч не найден</div></div>`; return; }
  const h = teamById(m.homeTeamId), a = teamById(m.awayTeamId);
  const evs = (m.events || []).slice().sort((x, y) => x.minute - y.minute);
  const squadH = st.players.filter(p => p.teamId === m.homeTeamId);
  const squadA = st.players.filter(p => p.teamId === m.awayTeamId);
  const allSquad = [...squadH, ...squadA];
  const apps = new Set((st.appearances || []).filter(x => x.matchId === m.id).map(x => x.playerId));

  const evRows = evs.length ? `<div class="tl-split">${evs.map(e => {
    const sc = playerById(e.scorerId), as = e.assisterId ? playerById(e.assisterId) : null;
    const home = e.teamId === m.homeTeamId;
    const inner = `<div class="who"><b>${esc(sc?.name || "—")}</b><span>${esc(teamById(e.teamId)?.abbr || "")}${e.type !== "goal" ? " · " + esc(e.type) : ""}${as ? " · Ассист: " + esc(as.name) : ""}</span></div>
      <span style="display:flex;gap:4px;justify-content:${home ? "flex-end" : "flex-start"}"><button class="icon-act" data-ev-edit="${e.id}" aria-label="Редактировать" title="Редактировать">${ic("pencil")}</button><button class="icon-act danger" data-ev-del="${e.id}" aria-label="Удалить" title="Удалить">${ic("trash")}</button></span>`;
    return `<div class="tl-ev">
      <div class="tl-side home">${home ? ballSVG() + inner : ""}</div>
      <div class="tl-min">${e.minute}′</div>
      <div class="tl-side away">${!home ? inner + ballSVG() : ""}</div>
    </div>`;
  }).join("")}</div>` : `<div class="empty">${ballSVG()}<div>Голов пока нет — добавьте первый ниже</div></div>`;

  view.innerHTML = `
    <a class="backlink" href="#/admin/matches">${ic("back")} Все матчи</a>
    <a class="backlink" href="#/match/${m.id}" style="margin-left:12px">Публичная страница ${ic("chevR")}</a>
    <div class="card"><div class="card-h"><span>Матч · счёт считается из событий</span><span class="badge ${m.status === "completed" ? "green" : ""}">${esc(m.status)} · ${m.homeGoals}–${m.awayGoals}</span></div>
    <div class="pad">
      <div class="row2"><div><label class="f">Хозяева</label><select id="am-h">${st.teams.map(t => `<option value="${t.id}" ${m.homeTeamId === t.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></div>
      <div><label class="f">Гости</label><select id="am-a">${st.teams.map(t => `<option value="${t.id}" ${m.awayTeamId === t.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></div></div>
      <div class="row2"><div><label class="f">Дата</label><input id="am-d" type="datetime-local" value="${toLocalInput(m.date)}"></div>
      <div><label class="f">Статус</label><select id="am-s"><option value="scheduled" ${m.status === "scheduled" ? "selected" : ""}>Предстоит</option><option value="completed" ${m.status === "completed" ? "selected" : ""}>Завершён (публикуется)</option><option value="draft" ${m.status === "draft" ? "selected" : ""}>Черновик</option><option value="cancelled" ${m.status === "cancelled" ? "selected" : ""}>Отменён</option></select></div></div>
      <div style="display:flex;gap:8px;margin-top:10px"><button class="btn" id="am-save">Сохранить матч</button><button class="btn danger" id="am-del">Удалить</button></div><div id="am-msg"></div>
      <div class="hint">Счёт <b>${m.homeGoals}–${m.awayGoals}</b> посчитан из ${evs.length} событий. Только «Завершён» попадает в таблицу.</div>
    </div></div>

    <div class="card"><div class="card-h"><span>Голы · ${evs.length}</span><span class="small muted">${esc(h?.abbr || "")} · ${esc(a?.abbr || "")}</span></div>
      ${evRows}
      <div class="pad"><div class="ev-form">
        <b class="small">Новый гол</b>
        <div class="row2"><div><label class="f">Минута</label><input id="ev-min" type="number" min="1" max="130" placeholder="12" inputmode="numeric"></div>
        <div><label class="f">Команда гола</label><select id="ev-team"><option value="${m.homeTeamId}">${esc(h?.name)}</option><option value="${m.awayTeamId}">${esc(a?.name)}</option></select></div></div>
        <label class="f">Автор гола</label><select id="ev-sc"></select>
        <label class="f">Ассистент (необязательно)</label><select id="ev-as"><option value="">— без ассиста —</option></select>
        <div style="display:flex;gap:10px;margin-top:12px;align-items:flex-end"><div style="flex:1"><label class="f" style="margin-top:0">Тип</label><select id="ev-type"><option value="goal">Гол</option><option value="penalty">Пенальти</option><option value="own-goal">Автогол</option></select></div>
        <div style="flex:1.2"><button class="btn" id="ev-add">Сохранить гол</button></div></div>
        <label class="check"><input type="checkbox" id="ev-mis"><span>Исключение: разрешить игрока не из команды гола</span></label>
        <div id="ev-msg"></div>
      </div></div>
    </div>

    <div class="card"><div class="card-h"><span>Участия игроков (матчи)</span><button class="btn sm" id="apps-save">Сохранить участия</button></div>
      <div class="pad">
        <div class="hint">Отметьте, кто играл. Неотмеченные <b>не получат</b> матч в статистику. Вручную можно поправить в карточке игрока.</div>
        <div class="row2" style="margin-top:8px">
          <div><b class="small">${esc(h?.name)}</b>${squadH.map(p => `<label class="check"><input type="checkbox" data-app="${p.id}" ${apps.has(p.id) ? "checked" : ""}><span>${esc(p.name)} <small class="muted">${esc(p.position)}</small></span></label>`).join("") || `<div class="small muted">Нет игроков</div>`}</div>
          <div><b class="small">${esc(a?.name)}</b>${squadA.map(p => `<label class="check"><input type="checkbox" data-app="${p.id}" ${apps.has(p.id) ? "checked" : ""}><span>${esc(p.name)} <small class="muted">${esc(p.position)}</small></span></label>`).join("") || `<div class="small muted">Нет игроков</div>`}</div>
        </div><div id="apps-msg"></div>
      </div>
    </div>`;

  // scorer/assister options depend on chosen team
  const fillScorers = () => {
    const tid = $("#ev-team").value;
    const sq = st.players.filter(p => p.teamId === tid);
    const others = st.players.filter(p => p.teamId !== tid);
    $("#ev-sc").innerHTML = sq.map(p => `<option value="${p.id}">${esc(p.name)} (${esc(p.position)})</option>`).join("") + (others.length ? `<optgroup label="Другие команды">${others.map(p => `<option value="${p.id}">${esc(p.name)} — ${esc(teamById(p.teamId)?.abbr || "")}</option>`).join("")}</optgroup>` : "");
    $("#ev-as").innerHTML = `<option value="">— без ассиста —</option>` + sq.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("") + (others.length ? `<optgroup label="Другие">${others.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</optgroup>` : "");
  };
  fillScorers();
  $("#ev-team").addEventListener("change", fillScorers);

  $("#am-save").onclick = async () => {
    try {
      await api.req("/api/matches/" + m.id, { method: "PUT", body: JSON.stringify({ homeTeamId: $("#am-h").value, awayTeamId: $("#am-a").value, date: new Date($("#am-d").value).toISOString(), status: $("#am-s").value }) });
      toast("Матч сохранён"); STATE_AT = 0; vAdminMatch(m.id);
    } catch (e) { $("#am-msg").innerHTML = `<div class="err">${esc(e.message)}</div>`; }
  };
  $("#am-del").onclick = async () => {
    if (!await confirmModal("Удалить матч вместе с событиями? Статистика пересчитается.")) return;
    try { await api.req("/api/matches/" + m.id, { method: "DELETE" }); toast("Матч удалён"); location.hash = "#/admin/matches"; }
    catch (e) { $("#am-msg").innerHTML = `<div class="err">${esc(e.message)}</div>`; }
  };
  $("#ev-add").onclick = async () => {
    try {
      await api.req(`/api/matches/${m.id}/events`, { method: "POST", body: JSON.stringify({ minute: Number($("#ev-min").value), teamId: $("#ev-team").value, scorerId: $("#ev-sc").value, assisterId: $("#ev-as").value || null, type: $("#ev-type").value, allowMismatch: $("#ev-mis").checked }) });
      toast("Гол записан"); STATE_AT = 0; vAdminMatch(m.id);
    } catch (e) { $("#ev-msg").innerHTML = `<div class="err">${esc(e.message)}</div>`; }
  };
  view.querySelectorAll("[data-ev-del]").forEach(b => b.addEventListener("click", async () => {
    if (!await confirmModal("Удалить событие? Голы и ассисты пересчитаются.")) return;
    try { await api.req("/api/events/" + b.dataset.evDel, { method: "DELETE" }); toast("Событие удалено"); STATE_AT = 0; vAdminMatch(m.id); }
    catch (e) { toast(e.message); }
  }));
  view.querySelectorAll("[data-ev-edit]").forEach(b => b.addEventListener("click", async () => {
    const ev = evs.find(x => x.id === b.dataset.evEdit);
    const ov = openModal(`Гол ${ev.minute}′ — редактирование`,
      `<div class="row2"><div><label class="f">Минута</label><input id="m-min" type="number" min="1" max="130" value="${ev.minute}"></div>
      <div><label class="f">Команда</label><select id="m-team"><option value="${m.homeTeamId}" ${ev.teamId === m.homeTeamId ? "selected" : ""}>${esc(h?.name)}</option><option value="${m.awayTeamId}" ${ev.teamId === m.awayTeamId ? "selected" : ""}>${esc(a?.name)}</option></select></div></div>
      <label class="f">Автор</label><select id="m-sc">${allSquad.map(p => `<option value="${p.id}" ${ev.scorerId === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
      <label class="f">Ассистент</label><select id="m-as"><option value="">— без ассиста —</option>${allSquad.map(p => `<option value="${p.id}" ${ev.assisterId === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
      <label class="check"><input type="checkbox" id="m-mis"><span>Исключение по команде</span></label>
      <div data-merr></div>`,
      `<button class="btn ghost" data-b="cancel">Отмена</button><button class="btn" data-b="save">${ic("check")} Сохранить</button>`);
    ov.querySelector('[data-b="cancel"]').addEventListener("click", () => closeModal("cancel"));
    ov.querySelector('[data-b="save"]').addEventListener("click", async () => {
      try {
        await api.req("/api/events/" + ev.id, { method: "PUT", body: JSON.stringify({ minute: Number(ov.querySelector("#m-min").value), teamId: ov.querySelector("#m-team").value, scorerId: ov.querySelector("#m-sc").value, assisterId: ov.querySelector("#m-as").value || null, allowMismatch: ov.querySelector("#m-mis").checked }) });
        closeModal("saved"); toast("Событие обновлено"); STATE_AT = 0; vAdminMatch(m.id);
      } catch (e) { modalErr(ov, e.message); }
    });
  }));
  $("#apps-save").onclick = async () => {
    const ids = [...view.querySelectorAll("[data-app]:checked")].map(x => x.dataset.app);
    try {
      await api.req(`/api/matches/${m.id}/appearances`, { method: "PUT", body: JSON.stringify({ playerIds: ids }) });
      toast(`Участия сохранены: ${ids.length}`); STATE_AT = 0;
    } catch (e) { $("#apps-msg").innerHTML = `<div class="err">${esc(e.message)}</div>`; }
  };
}

// ---------- PWA: установка как приложение ----------
let deferredPrompt = null;
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true
    || new URLSearchParams(location.search).get("source") === "pwa";
}
function showInstallBar(main, btnLabel, onBtn, hint) {
  const bar = document.getElementById("installBar");
  if (!bar || isStandalone() || localStorage.getItem("apl_install_hide")) return false;
  bar.innerHTML = `<div class="inst-card"><span class="inst-ico">${leagueCrestSVG()}</span>`
    + `<div class="inst-tx"><b>${main}</b>${hint ? `<span>${hint}</span>` : ""}</div>`
    + (btnLabel ? `<button class="btn sm" id="instGo">${btnLabel}</button>` : "")
    + `<button class="icon-act" id="instX" aria-label="Скрыть">${ic("x")}</button></div>`;
  bar.hidden = false;
  bar.querySelector("#instX").addEventListener("click", () => {
    localStorage.setItem("apl_install_hide", "1");
    bar.hidden = true;
  });
  if (btnLabel) bar.querySelector("#instGo").addEventListener("click", onBtn);
  return true;
}
function initInstall() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBar("Установить APL как приложение", "Установить", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(() => {});
      deferredPrompt = null;
      document.getElementById("installBar").hidden = true;
    }, "Быстрый доступ с экрана телефона");
  });
  // iPhone: авто-установки нет — подсказываем ручной путь
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone) {
    setTimeout(() => showInstallBar("Приложение APL на iPhone", "",
      null, "«Поделиться» → «На экран „Домой“»"), 1500);
  }
}

// boot
initInstall();
route();
