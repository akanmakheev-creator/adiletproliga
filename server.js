import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adilet2026";

// ---- sessions (in-memory) ----
const sessions = new Map(); // token -> expiresAt
function createToken() {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + 24 * 3600 * 1000);
  return token;
}
function checkAuth(req) {
  const h = req.headers["authorization"] || "";
  const m = /^Bearer\s+(.+)$/.exec(h);
  if (!m) return false;
  const exp = sessions.get(m[1]);
  if (!exp) return false;
  if (exp < Date.now()) { sessions.delete(m[1]); return false; }
  return true;
}

// ---- db ----
function defaultDb() {
  return {
    settings: {
      competitionName: "Adilet Pro Liga",
      subtitle: "Школьный футбол",
      season: "Сезон 2026",
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
      tiebreakers: ["points", "goalDiff", "goalsFor"],
      allowSelfAssist: false,
      published: true
    },
    teams: [
      {
        id: "team-athletic-eight",
        name: "Athletic Eight C.F",
        abbr: "ATH",
        colorPrimary: "#10254e",
        colorSecondary: "#c9a86a",
        crestVariant: "shield-stripes",
        crest: "/images/athletic-eight.png",
        archived: false,
        createdAt: new Date().toISOString()
      },
      {
        id: "team-la-seven",
        name: "La Seven FC",
        abbr: "LS7",
        colorPrimary: "#b3122e",
        colorSecondary: "#141414",
        crestVariant: "shield-split",
        crest: "/images/laseven-fc.png",
        archived: false,
        createdAt: new Date().toISOString()
      }
    ],
    players: [],
    matches: [],
    events: [],
    appearances: [],
    audit: []
  };
}

function loadDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      const db = defaultDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
      return db;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(raw);
    // migrate defaults
    db.settings = { ...defaultDb().settings, ...(db.settings || {}) };
    for (const k of ["teams", "players", "matches", "events", "appearances", "audit"]) {
      if (!Array.isArray(db[k])) db[k] = [];
    }
    // migrate uploaded crests for seed teams
    for (const t of db.teams) {
      if (!t.crest && t.id === "team-athletic-eight") t.crest = "/images/athletic-eight.png";
      if (!t.crest && t.id === "team-la-seven") t.crest = "/images/laseven-fc.png";
      if (t.captainId === undefined) t.captainId = null;
    }
    return db;
  } catch (e) {
    console.error("DB load error, using defaults:", e.message);
    return defaultDb();
  }
}

function saveDb(db) {
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tmp, DB_FILE);
}

function uid(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function audit(db, action, detail) {
  db.audit.unshift({ at: new Date().toISOString(), action, detail: String(detail || "").slice(0, 500) });
  db.audit = db.audit.slice(0, 200);
}

// ============ STATS ENGINE (single source of truth) ============
export function computeState(db) {
  const settings = db.settings;
  const teamsById = new Map(db.teams.filter(t => !t.archived).map(t => [t.id, t]));
  const playersById = new Map(db.players.map(p => [p.id, p]));

  // score per match from events
  const eventsByMatch = new Map();
  for (const e of db.events) {
    if (!eventsByMatch.has(e.matchId)) eventsByMatch.set(e.matchId, []);
    eventsByMatch.get(e.matchId).push(e);
  }
  for (const arr of eventsByMatch.values()) arr.sort((a, b) => a.minute - b.minute || (a.createdAt < b.createdAt ? -1 : 1));

  const matchesEnriched = db.matches.map(m => {
    const evs = (eventsByMatch.get(m.id) || []).slice().sort((a, b) => a.minute - b.minute);
    let homeGoals = 0, awayGoals = 0;
    for (const e of evs) {
      if (e.teamId === m.homeTeamId) homeGoals++;
      else if (e.teamId === m.awayTeamId) awayGoals++;
    }
    return { ...m, homeGoals, awayGoals, events: evs };
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  // appearances count
  const appsCount = new Map(); // playerId -> count
  for (const a of db.appearances) {
    appsCount.set(a.playerId, (appsCount.get(a.playerId) || 0) + 1);
  }

  // player stats
  const playerStats = new Map();
  for (const p of db.players) {
    playerStats.set(p.id, { goals: 0, assists: 0, apps: 0, manualApps: p.manualAppsOverride ?? null });
  }
  for (const e of db.events) {
    // only count events of completed matches? Spec: stats from match events. If match cancelled -> ignore.
    const match = db.matches.find(m => m.id === e.matchId);
    if (!match || match.status === "cancelled" || match.status === "draft") continue;
    // completed + scheduled both count if event exists? Only completed should count officially, but events imply played.
    // Rule: uncompleted matches NOT in league table, but player stats? Keep consistent: only completed matches count.
    if (match.status !== "completed") continue;
    if (playerStats.has(e.scorerId)) playerStats.get(e.scorerId).goals++;
    if (e.assisterId && playerStats.has(e.assisterId)) playerStats.get(e.assisterId).assists++;
  }
  for (const [pid, st] of playerStats) {
    if (st.manualApps !== null && st.manualApps !== undefined) st.apps = st.manualApps;
    else st.apps = appsCount.get(pid) || 0;
    const p = playersById.get(pid);
    st.goalsPerMatch = st.apps > 0 ? +(st.goals / st.apps).toFixed(2) : 0;
    st.teamId = p ? p.teamId : null;
  }

  // team standings — only completed
  const table = [];
  for (const t of teamsById.values()) {
    table.push({
      teamId: t.id, played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0
    });
  }
  const tableById = new Map(table.map(r => [r.teamId, r]));
  for (const m of matchesEnriched) {
    if (m.status !== "completed") continue;
    if (!tableById.has(m.homeTeamId) || !tableById.has(m.awayTeamId)) continue;
    const h = tableById.get(m.homeTeamId), a = tableById.get(m.awayTeamId);
    h.played++; a.played++;
    h.goalsFor += m.homeGoals; h.goalsAgainst += m.awayGoals;
    a.goalsFor += m.awayGoals; a.goalsAgainst += m.homeGoals;
    if (m.homeGoals > m.awayGoals) {
      h.won++; a.lost++;
      h.points += settings.pointsWin; a.points += settings.pointsLoss;
    } else if (m.homeGoals < m.awayGoals) {
      a.won++; h.lost++;
      a.points += settings.pointsWin; h.points += settings.pointsLoss;
    } else {
      h.drawn++; a.drawn++;
      h.points += settings.pointsDraw; a.points += settings.pointsDraw;
    }
  }
  for (const r of table) r.goalDiff = r.goalsFor - r.goalsAgainst;
  // sort by configurable tiebreakers
  const tb = settings.tiebreakers && settings.tiebreakers.length ? settings.tiebreakers : ["points", "goalDiff", "goalsFor"];
  table.sort((x, y) => {
    for (const k of tb) {
      if (k === "points" && y.points !== x.points) return y.points - x.points;
      if (k === "goalDiff" && y.goalDiff !== x.goalDiff) return y.goalDiff - x.goalDiff;
      if (k === "goalsFor" && y.goalsFor !== x.goalsFor) return y.goalsFor - x.goalsFor;
      if (k === "wins" && y.won !== x.won) return y.won - x.won;
      if (k === "name") {
        const xn = teamsById.get(x.teamId)?.name || "", yn = teamsById.get(y.teamId)?.name || "";
        if (xn !== yn) return xn.localeCompare(yn);
      }
    }
    return 0;
  });

  // enrich players & teams for public
  const playersEnriched = db.players.map(p => ({
    ...p,
    stats: playerStats.get(p.id) || { goals: 0, assists: 0, apps: 0, goalsPerMatch: 0, manualApps: null }
  }));

  const scorers = playersEnriched
    .slice()
    .sort((a, b) => b.stats.goals - a.stats.goals || b.stats.assists - a.stats.assists || a.name.localeCompare(b.name));
  const assisters = playersEnriched
    .slice()
    .sort((a, b) => b.stats.assists - a.stats.assists || b.stats.goals - a.stats.goals || a.name.localeCompare(b.name));

  const teamsEnriched = db.teams.filter(t => !t.archived).map(t => {
    const row = tableById.get(t.id) || { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 };
    const squad = playersEnriched.filter(p => p.teamId === t.id);
    return { ...t, standings: row, squadCount: squad.length };
  });

  return {
    settings,
    teams: teamsEnriched,
    players: playersEnriched,
    matches: matchesEnriched,
    standings: table,
    scorers,
    assisters,
    appearances: db.appearances
  };
}

// ---- http helpers ----
function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

function sendText(res, code, text, type = "text/plain; charset=utf-8") {
  res.writeHead(code, { "Content-Type": type, "Content-Length": Buffer.byteLength(text) });
  res.end(text);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff2": "font/woff2"
};

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  // block admin key leak: never serve data dir
  const safe = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, "");
  let file = path.join(PUBLIC_DIR, safe);
  if (!file.startsWith(PUBLIC_DIR)) { sendText(res, 403, "Forbidden"); return; }
  // SPA fallback: /team/..., /match/... -> index.html (we use hash routing so not needed, but handle)
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const idx = path.join(PUBLIC_DIR, "index.html");
    if (fs.existsSync(idx)) {
      const html = fs.readFileSync(idx);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html); return;
    }
    sendText(res, 404, "Not found"); return;
  }
  const ext = path.extname(file).toLowerCase();
  const data = fs.readFileSync(file);
  const headers = { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600" };
  if (file.endsWith(`${path.sep}sw.js`)) {
    headers["Service-Worker-Allowed"] = "/";
    headers["Cache-Control"] = "no-cache";
  }
  res.writeHead(200, headers);
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", c => { buf += c; if (buf.length > 1_000_000) req.destroy(); });
    req.on("end", () => {
      if (!buf) return resolve({});
      try { resolve(JSON.parse(buf)); } catch { reject(new Error("Некорректный JSON")); }
    });
    req.on("error", reject);
  });
}

const POSITIONS = ["ВР", "ЗЩ", "ПЗ", "НП"];

function validateTeam(body, partial = false) {
  if (!partial || body.name !== undefined) {
    if (!body.name || String(body.name).trim().length < 2) throw new Error("Название команды слишком короткое");
  }
  if (!partial || body.abbr !== undefined) {
    if (!body.abbr || String(body.abbr).trim().length < 1 || String(body.abbr).trim().length > 6) throw new Error("Аббревиатура: 1–6 символов");
  }
}

function validatePlayer(body, db, partial = false, selfId = null) {
  if (!partial || body.name !== undefined) {
    if (!body.name || String(body.name).trim().length < 2) throw new Error("Имя игрока слишком короткое");
  }
  if (body.position !== undefined && body.position !== "" && !POSITIONS.includes(body.position)) {
    throw new Error("Некорректная позиция. Допустимо: " + POSITIONS.join(", "));
  }
  if (body.teamId !== undefined && body.teamId !== null && body.teamId !== "") {
    if (!db.teams.find(t => t.id === body.teamId)) throw new Error("Команда не найдена");
  }
  if (body.manualAppsOverride !== undefined && body.manualAppsOverride !== null && body.manualAppsOverride !== "") {
    const n = Number(body.manualAppsOverride);
    if (!Number.isInteger(n) || n < 0 || n > 500) throw new Error("Матчи вручную: целое 0–500");
  }
}

function validateMatch(body, db, partial = false) {
  if (!partial || body.homeTeamId !== undefined || body.awayTeamId !== undefined) {
    const h = body.homeTeamId, a = body.awayTeamId;
    if (!h || !a) throw new Error("Выберите обе команды");
    if (h === a) throw new Error("Команда не может играть сама с собой");
    if (!db.teams.find(t => t.id === h) || !db.teams.find(t => t.id === a)) throw new Error("Команда не найдена");
  }
  if (body.date !== undefined) {
    if (!body.date || isNaN(new Date(body.date).getTime())) throw new Error("Некорректная дата матча");
  }
  if (body.status !== undefined) {
    if (!["scheduled", "completed", "cancelled", "draft"].includes(body.status)) throw new Error("Некорректный статус");
  }
}

function validateEvent(body, db, settings) {
  const minute = Number(body.minute);
  if (!Number.isInteger(minute) || minute < 1 || minute > 130) throw new Error("Минута: 1–130");
  if (!body.teamId || !db.teams.find(t => t.id === body.teamId)) throw new Error("Команда гола не найдена");
  const match = db.matches.find(m => m.id === body.matchId);
  if (!match) throw new Error("Матч не найден");
  if (body.teamId !== match.homeTeamId && body.teamId !== match.awayTeamId) throw new Error("Команда гола не участвует в матче");
  if (!body.scorerId || !db.players.find(p => p.id === body.scorerId)) throw new Error("Автор гола не найден");
  if (body.assisterId) {
    if (!db.players.find(p => p.id === body.assisterId)) throw new Error("Ассистент не найден");
    if (!settings.allowSelfAssist && body.assisterId === body.scorerId) throw new Error("Игрок не может ассистировать сам себе");
  }
  const scorer = db.players.find(p => p.id === body.scorerId);
  const assister = body.assisterId ? db.players.find(p => p.id === body.assisterId) : null;
  // team membership check (soft: allow explicit override)
  if (!body.allowMismatch) {
    if (scorer && scorer.teamId !== body.teamId) {
      throw new Error(`Бомбардир (${scorer.name}) не из команды гола. Отметьте «исключение» для подтверждения.`);
    }
    if (assister && assister.teamId !== body.teamId) {
      throw new Error(`Ассистент (${assister.name}) не из команды гола. Отметьте «исключение» для подтверждения.`);
    }
  }
  if (body.type !== undefined && !["goal", "own-goal", "penalty"].includes(body.type)) throw new Error("Некорректный тип события");
}

// ============ SERVER ============
let db = loadDb();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;
    const method = req.method;

    // CORS (same-origin by default, but allow)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (method === "OPTIONS") { res.writeHead(204); res.end(); return; }

    // ---- public API ----
    if (pathname === "/api/health" && method === "GET") {
      return sendJson(res, 200, { ok: true, time: new Date().toISOString() });
    }
    if (pathname === "/api/public" && method === "GET") {
      db = loadDb();
      return sendJson(res, 200, { ok: true, data: computeState(db) });
    }
    if (pathname === "/api/login" && method === "POST") {
      const body = await readBody(req);
      if (String(body.password || "") === ADMIN_PASSWORD) {
        const token = createToken();
        return sendJson(res, 200, { ok: true, token });
      }
      return sendJson(res, 401, { ok: false, error: "Неверный пароль" });
    }
    if (pathname === "/api/logout" && method === "POST") {
      const h = req.headers["authorization"] || "";
      const m = /^Bearer\s+(.+)$/.exec(h);
      if (m) sessions.delete(m[1]);
      return sendJson(res, 200, { ok: true });
    }

    // ---- admin: dashboard ----
    if (pathname === "/api/dashboard" && method === "GET") {
      if (!checkAuth(req)) return sendJson(res, 401, { ok: false, error: "Требуется вход" });
      db = loadDb();
      const st = computeState(db);
      return sendJson(res, 200, {
        ok: true,
        data: {
          totalTeams: st.teams.length,
          totalPlayers: st.players.length,
          totalMatches: st.matches.length,
          completed: st.matches.filter(m => m.status === "completed").length,
          upcoming: st.matches.filter(m => m.status === "scheduled").length,
          audit: db.audit.slice(0, 20)
        }
      });
    }

    // ---- settings ----
    if (pathname === "/api/settings" && method === "GET") {
      db = loadDb();
      return sendJson(res, 200, { ok: true, data: db.settings });
    }
    if (pathname === "/api/settings" && method === "PUT") {
      if (!checkAuth(req)) return sendJson(res, 401, { ok: false, error: "Требуется вход" });
      const body = await readBody(req);
      db = loadDb();
      const s = db.settings;
      if (body.competitionName !== undefined) s.competitionName = String(body.competitionName).slice(0, 60) || s.competitionName;
      if (body.subtitle !== undefined) s.subtitle = String(body.subtitle).slice(0, 60);
      if (body.season !== undefined) s.season = String(body.season).slice(0, 60);
      if (body.pointsWin !== undefined) {
        const n = Number(body.pointsWin);
        if (!Number.isInteger(n) || n < 0 || n > 10) return sendJson(res, 400, { ok: false, error: "Очки за победу: 0–10" });
        s.pointsWin = n;
      }
      if (body.pointsDraw !== undefined) {
        const n = Number(body.pointsDraw);
        if (!Number.isInteger(n) || n < 0 || n > 10) return sendJson(res, 400, { ok: false, error: "Очки за ничью: 0–10" });
        s.pointsDraw = n;
      }
      if (body.pointsLoss !== undefined) {
        const n = Number(body.pointsLoss);
        if (!Number.isInteger(n) || n < 0 || n > 10) return sendJson(res, 400, { ok: false, error: "Очки за поражение: 0–10" });
        s.pointsLoss = n;
      }
      if (body.tiebreakers !== undefined) {
        if (!Array.isArray(body.tiebreakers) || !body.tiebreakers.length) return sendJson(res, 400, { ok: false, error: "Некорректные критерии" });
        s.tiebreakers = body.tiebreakers.filter(x => ["points", "goalDiff", "goalsFor", "wins", "name"].includes(x));
      }
      if (body.allowSelfAssist !== undefined) s.allowSelfAssist = !!body.allowSelfAssist;
      audit(db, "settings.update", "Настройки лиги обновлены");
      saveDb(db);
      return sendJson(res, 200, { ok: true, data: s });
    }

    // ---- teams ----
    if (pathname === "/api/teams" && method === "GET") {
      db = loadDb();
      return sendJson(res, 200, { ok: true, data: computeState(db).teams });
    }
    if (pathname === "/api/teams" && method === "POST") {
      if (!checkAuth(req)) return sendJson(res, 401, { ok: false, error: "Требуется вход" });
      const body = await readBody(req);
      try { validateTeam(body); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
      db = loadDb();
      const t = {
        id: uid("team"),
        name: String(body.name).trim(),
        abbr: String(body.abbr).trim().toUpperCase().slice(0, 6),
        colorPrimary: String(body.colorPrimary || "#1c2a4a").slice(0, 20),
        colorSecondary: String(body.colorSecondary || "#9aa4b2").slice(0, 20),
        crestVariant: String(body.crestVariant || "shield").slice(0, 30),
        crest: body.crest ? String(body.crest).slice(0, 300) : "",
        captainId: null,
        archived: false,
        createdAt: new Date().toISOString()
      };
      db.teams.push(t);
      audit(db, "team.create", t.name);
      saveDb(db);
      return sendJson(res, 200, { ok: true, data: t });
    }
    let mTeam = pathname.match(/^\/api\/teams\/([^\/]+)$/);
    if (mTeam) {
      const id = decodeURIComponent(mTeam[1]);
      if (method === "PUT") {
        if (!checkAuth(req)) return sendJson(res, 401, { ok: false, error: "Требуется вход" });
        const body = await readBody(req);
        try { validateTeam(body, true); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
        db = loadDb();
        const t = db.teams.find(x => x.id === id);
        if (!t) return sendJson(res, 404, { ok: false, error: "Команда не найдена" });
        if (body.name !== undefined) t.name = String(body.name).trim();
        if (body.abbr !== undefined) t.abbr = String(body.abbr).trim().toUpperCase().slice(0, 6);
        if (body.colorPrimary !== undefined) t.colorPrimary = String(body.colorPrimary).slice(0, 20);
        if (body.colorSecondary !== undefined) t.colorSecondary = String(body.colorSecondary).slice(0, 20);
        if (body.crestVariant !== undefined) t.crestVariant = String(body.crestVariant).slice(0, 30);
        if (body.crest !== undefined) t.crest = body.crest ? String(body.crest).slice(0, 300) : "";
        if (body.captainId !== undefined) {
          if (body.captainId) {
            const cap = db.players.find(p => p.id === body.captainId);
            if (!cap) return sendJson(res, 400, { ok: false, error: "Капитан не найден" });
            if (cap.teamId !== id) return sendJson(res, 400, { ok: false, error: "Капитаном может быть только игрок этой команды" });
            t.captainId = cap.id;
          } else t.captainId = null;
        }
        if (body.archived !== undefined) t.archived = !!body.archived;
        audit(db, "team.update", t.name);
        saveDb(db);
        return sendJson(res, 200, { ok: true, data: t });
      }
      if (method === "DELETE") {
        if (!checkAuth(req)) return sendJson(res, 401, { ok: false, error: "Требуется вход" });
        db = loadDb();
        const hasMatches = db.matches.some(x => x.homeTeamId === id || x.awayTeamId === id);
        if (hasMatches) return sendJson(res, 400, { ok: false, error: "Нельзя удалить: есть матчи с этой командой. Архивируйте её." });
        const hasPlayers = db.players.some(p => p.teamId === id);
        if (hasPlayers) return sendJson(res, 400, { ok: false, error: "Нельзя удалить: есть игроки в команде. Переведите их или архивируйте." });
        const i = db.teams.findIndex(x => x.id === id);
        if (i < 0) return sendJson(res, 404, { ok: false, error: "Команда не найдена" });
        const [rm] = db.teams.splice(i, 1);
        audit(db, "team.delete", rm.name);
        saveDb(db);
        return sendJson(res, 200, { ok: true });
      }
    }

    // ---- players ----
    if (pathname === "/api/players" && method === "GET") {
      db = loadDb();
      return sendJson(res, 200, { ok: true, data: computeState(db).players });
    }
    if (pathname === "/api/players" && method === "POST") {
      if (!checkAuth(req)) return sendJson(res, 401, { ok: false, error: "Требуется вход" });
      const body = await readBody(req);
      db = loadDb();
      try { validatePlayer(body, db); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
      const p = {
        id: uid("pl"),
        name: String(body.name).trim(),
        position: body.position || "ПЗ",
        teamId: body.teamId || null,
        photo: "",
        manualAppsOverride: body.manualAppsOverride !== undefined && body.manualAppsOverride !== "" && body.manualAppsOverride !== null ? Number(body.manualAppsOverride) : null,
        createdAt: new Date().toISOString()
      };
      db.players.push(p);
      audit(db, "player.create", p.name);
      saveDb(db);
      return sendJson(res, 200, { ok: true, data: p });
    }
    let mPl = pathname.match(/^\/api\/players\/([^\/]+)$/);
    if (mPl) {
      const id = decodeURIComponent(mPl[1]);
      if (method === "PUT") {
        if (!checkAuth(req)) return sendJson(res, 401, { ok: false, error: "Требуется вход" });
        const body = await readBody(req);
        db = loadDb();
        try { validatePlayer(body, db, true, id); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
        const p = db.players.find(x => x.id === id);
        if (!p) return sendJson(res, 404, { ok: false, error: "Игрок не найден" });
        const oldTeam = p.teamId;
        if (body.name !== undefined) p.name = String(body.name).trim();
        if (body.position !== undefined) p.position = body.position;
        if (body.teamId !== undefined) p.teamId = body.teamId || null;
        if (body.manualAppsOverride !== undefined) {
          p.manualAppsOverride = (body.manualAppsOverride === "" || body.manualAppsOverride === null) ? null : Number(body.manualAppsOverride);
        }
        if (oldTeam !== p.teamId) {
          const old = db.teams.find(t => t.id === oldTeam);
          if (old && old.captainId === p.id) old.captainId = null; // ушёл — повязка снята
          audit(db, "player.transfer", `${p.name}: ${oldTeam || "—"} → ${p.teamId || "—"}`);
        }
        else audit(db, "player.update", p.name);
        saveDb(db);
        return sendJson(res, 200, { ok: true, data: p });
      }
      if (method === "DELETE") {
        if (!checkAuth(req)) return sendJson(res, 401, { ok: false, error: "Требуется вход" });
        db = loadDb();
        const used = db.events.some(e => e.scorerId === id || e.assisterId === id);
        if (used) return sendJson(res, 400, { ok: false, error: "Нельзя удалить: игрок есть в событиях матчей. Переведите или оставьте в истории." });
        const i = db.players.findIndex(x => x.id === id);
        if (i < 0) return sendJson(res, 404, { ok: false, error: "Игрок не найден" });
        const [rm] = db.players.splice(i, 1);
        db.appearances = db.appearances.filter(a => a.playerId !== id);
        audit(db, "player.delete", rm.name);
        saveDb(db);
        return sendJson(res, 200, { ok: true });
      }
    }

    // ---- matches ----
    if (pathname === "/api/matches" && method === "GET") {
      db = loadDb();
      return sendJson(res, 200, { ok: true, data: computeState(db).matches });
    }
    if (pathname === "/api/matches" && method === "POST") {
      if (!checkAuth(req)) return sendJson(res, 401, { ok: false, error: "Требуется вход" });
      const body = await readBody(req);
      db = loadDb();
      try { validateMatch(body, db); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
      const mm = {
        id: uid("match"),
        homeTeamId: body.homeTeamId,
        awayTeamId: body.awayTeamId,
        date: new Date(body.date).toISOString(),
        status: body.status || "scheduled",
        note: String(body.note || "").slice(0, 300),
        createdAt: new Date().toISOString()
      };
      db.matches.push(mm);
      audit(db, "match.create", mm.id);
      saveDb(db);
      return sendJson(res, 200, { ok: true, data: mm });
    }
    let mMatch = pathname.match(/^\/api\/matches\/([^\/]+)$/);
    if (mMatch && !pathname.includes("/events") && !pathname.includes("/appearances")) {
      const id = decodeURIComponent(mMatch[1]);
      if (method === "PUT") {
        if (!checkAuth(req)) return sendJson(res, 401, { ok: false, error: "Требуется вход" });
        const body = await readBody(req);
        db = loadDb();
        const mm = db.matches.find(x => x.id === id);
        if (!mm) return sendJson(res, 404, { ok: false, error: "Матч не найден" });
        const merged = { homeTeamId: mm.homeTeamId, awayTeamId: mm.awayTeamId, ...body };
        try { validateMatch(merged, db, true); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
        if (body.homeTeamId !== undefined) mm.homeTeamId = body.homeTeamId;
        if (body.awayTeamId !== undefined) mm.awayTeamId = body.awayTeamId;
        if (body.date !== undefined) mm.date = new Date(body.date).toISOString();
        if (body.status !== undefined) mm.status = body.status;
        if (body.note !== undefined) mm.note = String(body.note).slice(0, 300);
        audit(db, "match.update", `${mm.id} → ${mm.status}`);
        saveDb(db);
        return sendJson(res, 200, { ok: true, data: mm });
      }
      if (method === "DELETE") {
        if (!checkAuth(req)) return sendJson(res, 401, { ok: false, error: "Требуется вход" });
        db = loadDb();
        const i = db.matches.findIndex(x => x.id === id);
        if (i < 0) return sendJson(res, 404, { ok: false, error: "Матч не найден" });
        db.matches.splice(i, 1);
        const evCount = db.events.filter(e => e.matchId === id).length;
        db.events = db.events.filter(e => e.matchId !== id);
        db.appearances = db.appearances.filter(a => a.matchId !== id);
        audit(db, "match.delete", `${id} (событий: ${evCount})`);
        saveDb(db);
        return sendJson(res, 200, { ok: true });
      }
    }

    // ---- events ----
    let mEvPost = pathname.match(/^\/api\/matches\/([^\/]+)\/events$/);
    if (mEvPost && method === "POST") {
      if (!checkAuth(req)) return sendJson(res, 401, { ok: false, error: "Требуется вход" });
      const matchId = decodeURIComponent(mEvPost[1]);
      const body = await readBody(req);
      db = loadDb();
      const full = { ...body, matchId };
      try { validateEvent(full, db, db.settings); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
      const ev = {
        id: uid("ev"),
        matchId,
        minute: Number(body.minute),
        teamId: body.teamId,
        scorerId: body.scorerId,
        assisterId: body.assisterId || null,
        type: body.type || "goal",
        createdAt: new Date().toISOString()
      };
      db.events.push(ev);
      audit(db, "event.create", `${matchId} ${ev.minute}' scorer=${ev.scorerId}`);
      saveDb(db);
      return sendJson(res, 200, { ok: true, data: ev });
    }
    let mEvPut = pathname.match(/^\/api\/events\/([^\/]+)$/);
    if (mEvPut) {
      const id = decodeURIComponent(mEvPut[1]);
      if (method === "PUT") {
        if (!checkAuth(req)) return sendJson(res, 401, { ok: false, error: "Требуется вход" });
        const body = await readBody(req);
        db = loadDb();
        const ev = db.events.find(x => x.id === id);
        if (!ev) return sendJson(res, 404, { ok: false, error: "Событие не найдено" });
        const merged = { matchId: ev.matchId, minute: ev.minute, teamId: ev.teamId, scorerId: ev.scorerId, assisterId: ev.assisterId, type: ev.type, ...body, matchId: ev.matchId };
        try { validateEvent(merged, db, db.settings); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
        if (body.minute !== undefined) ev.minute = Number(body.minute);
        if (body.teamId !== undefined) ev.teamId = body.teamId;
        if (body.scorerId !== undefined) ev.scorerId = body.scorerId;
        if (body.assisterId !== undefined) ev.assisterId = body.assisterId || null;
        if (body.type !== undefined) ev.type = body.type;
        audit(db, "event.update", `${ev.matchId} ${ev.minute}' ${ev.id}`);
        saveDb(db);
        return sendJson(res, 200, { ok: true, data: ev });
      }
      if (method === "DELETE") {
        if (!checkAuth(req)) return sendJson(res, 401, { ok: false, error: "Требуется вход" });
        db = loadDb();
        const i = db.events.findIndex(x => x.id === id);
        if (i < 0) return sendJson(res, 404, { ok: false, error: "Событие не найдено" });
        const [rm] = db.events.splice(i, 1);
        audit(db, "event.delete", `${rm.matchId} ${rm.minute}'`);
        saveDb(db);
        return sendJson(res, 200, { ok: true });
      }
    }

    // ---- appearances ----
    let mApp = pathname.match(/^\/api\/matches\/([^\/]+)\/appearances$/);
    if (mApp) {
      const matchId = decodeURIComponent(mApp[1]);
      if (method === "GET") {
        db = loadDb();
        return sendJson(res, 200, { ok: true, data: db.appearances.filter(a => a.matchId === matchId) });
      }
      if (method === "PUT") {
        if (!checkAuth(req)) return sendJson(res, 401, { ok: false, error: "Требуется вход" });
        const body = await readBody(req);
        db = loadDb();
        if (!db.matches.find(m => m.id === matchId)) return sendJson(res, 404, { ok: false, error: "Матч не найден" });
        if (!Array.isArray(body.playerIds)) return sendJson(res, 400, { ok: false, error: "playerIds должен быть массивом" });
        for (const pid of body.playerIds) {
          if (!db.players.find(p => p.id === pid)) return sendJson(res, 400, { ok: false, error: "Игрок не найден: " + pid });
        }
        const uniq = [...new Set(body.playerIds)];
        db.appearances = db.appearances.filter(a => a.matchId !== matchId);
        for (const pid of uniq) db.appearances.push({ matchId, playerId: pid });
        audit(db, "appearances.update", `${matchId}: ${uniq.length} игроков`);
        saveDb(db);
        return sendJson(res, 200, { ok: true, data: db.appearances.filter(a => a.matchId === matchId) });
      }
    }

    // fallback static
    if (method === "GET") return serveStatic(req, res);
    return sendJson(res, 404, { ok: false, error: "Не найдено" });
  } catch (e) {
    console.error(e);
    try { sendJson(res, 500, { ok: false, error: e.message || "Ошибка сервера" }); } catch {}
  }
});

server.listen(PORT, () => {
  console.log(`Adilet Pro Liga запущена: http://localhost:${PORT}`);
  console.log(`Админ-пароль: ${ADMIN_PASSWORD === "adilet2026" ? "adilet2026 (по умолчанию, задайте ADMIN_PASSWORD)" : "(из ADMIN_PASSWORD)"}`);
});
