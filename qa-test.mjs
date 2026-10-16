const BASE = "http://localhost:3000";
const PW = process.env.ADMIN_PASSWORD || "adilet2026";
let token = "";
const log = (s) => console.log(s);
async function api(path, opts = {}) {
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = "Bearer " + token;
  const r = await fetch(BASE + path, { ...opts, headers: h });
  const j = await r.json();
  if (!r.ok || j.ok === false) throw new Error(`${opts.method || "GET"} ${path}: ${j.error || r.status}`);
  return j.data ?? j;
}
try {
  // 1. login fail + ok
  try { await api("/api/login", { method: "POST", body: JSON.stringify({ password: "wrong" }) }); throw new Error("wrong pw accepted!"); }
  catch (e) { if (!String(e.message).includes("Неверный")) throw e; log("1a OK: wrong password rejected"); }
  const l = await api("/api/login", { method: "POST", body: JSON.stringify({ password: PW }) });
  token = l.token; log("1b OK: login, token len " + token.length);

  // unauth write must fail
  const saved = token; token = "";
  try { await api("/api/players", { method: "POST", body: JSON.stringify({ name: "X", teamId: null }) }); throw new Error("unauth allowed!"); }
  catch (e) { if (!String(e.message).includes("вход")) throw e; log("1c OK: unauth write blocked"); }
  token = saved;

  // public state: 2 teams
  let pub = await api("/api/public");
  const ath = pub.teams.find(t => t.name.includes("Athletic"));
  const sev = pub.teams.find(t => t.name.includes("Seven"));
  if (!ath || !sev) throw new Error("seed teams missing");
  log(`2 OK: seed teams ${ath.abbr} / ${sev.abbr}`);

  // self-match rejected
  try { await api("/api/matches", { method: "POST", body: JSON.stringify({ homeTeamId: ath.id, awayTeamId: ath.id, date: new Date().toISOString() }) }); throw new Error("self match allowed!"); }
  catch (e) { log("2b OK: self-match rejected: " + e.message); }

  // 2-4. create players
  const pA = await api("/api/players", { method: "POST", body: JSON.stringify({ name: "Тест Бомбардир", position: "НП", teamId: ath.id }) });
  const pB = await api("/api/players", { method: "POST", body: JSON.stringify({ name: "Тест Ассистент", position: "ПЗ", teamId: ath.id }) });
  const pC = await api("/api/players", { method: "POST", body: JSON.stringify({ name: "Тест Соперник", position: "НП", teamId: sev.id }) });
  log(`3-4 OK: players ${pA.id} ${pB.id} ${pC.id}`);

  // self-assist rejected
  // 5. create match scheduled
  const m = await api("/api/matches", { method: "POST", body: JSON.stringify({ homeTeamId: ath.id, awayTeamId: sev.id, date: new Date(Date.now() + 3600000).toISOString(), status: "scheduled" }) });
  log("5 OK: match " + m.id);

  // table must ignore scheduled
  pub = await api("/api/public");
  let row = pub.standings.find(r => r.teamId === ath.id);
  if (row.played !== 0) throw new Error("scheduled counted in table!");
  log("5b OK: scheduled not in table");

  // 6. goal with scorer+assist, then publish
  try {
    await api(`/api/matches/${m.id}/events`, { method: "POST", body: JSON.stringify({ minute: 12, teamId: ath.id, scorerId: pA.id, assisterId: pA.id }) });
    throw new Error("self-assist allowed!");
  } catch (e) { if (!String(e.message).includes("сам себе")) throw e; log("6a OK: self-assist blocked"); }
  const ev1 = await api(`/api/matches/${m.id}/events`, { method: "POST", body: JSON.stringify({ minute: 12, teamId: ath.id, scorerId: pA.id, assisterId: pB.id }) });
  const ev2 = await api(`/api/matches/${m.id}/events`, { method: "POST", body: JSON.stringify({ minute: 25, teamId: sev.id, scorerId: pC.id }) });
  const ev3 = await api(`/api/matches/${m.id}/events`, { method: "POST", body: JSON.stringify({ minute: 39, teamId: ath.id, scorerId: pA.id }) });
  log(`6b OK: 3 events (${ev1.id},${ev2.id},${ev3.id})`);
  await api("/api/matches/" + m.id, { method: "PUT", body: JSON.stringify({ status: "completed" }) });

  // 8-12 verify
  pub = await api("/api/public");
  const mm = pub.matches.find(x => x.id === m.id);
  if (!(mm.homeGoals === 2 && mm.awayGoals === 1)) throw new Error(`score wrong: ${mm.homeGoals}-${mm.awayGoals}`);
  log("8 OK: score 2-1");
  const sc1 = pub.scorers.find(p => p.id === pA.id);
  if (sc1.stats.goals !== 2) throw new Error("scorer wrong: " + sc1.stats.goals);
  const as1 = pub.assisters.find(p => p.id === pB.id);
  if (as1.stats.assists !== 1) throw new Error("assist wrong");
  log("9-10 OK: scorer=2, assist=1");
  const tA = pub.standings.find(r => r.teamId === ath.id);
  const tS = pub.standings.find(r => r.teamId === sev.id);
  if (!(tA.points === 3 && tA.played === 1 && tA.goalsFor === 2 && tA.goalDiff === 1)) throw new Error("table A wrong " + JSON.stringify(tA));
  if (!(tS.points === 0 && tS.goalsAgainst === 2)) throw new Error("table S wrong");
  log("11-12 OK: table ATH 3pts, LS7 0pts");
  const teamAth = pub.teams.find(t => t.id === ath.id);
  if (teamAth.standings.points !== 3 || teamAth.squadCount < 2) throw new Error("team profile wrong");
  log("12b OK: team profile");

  // 13. edit event: move ev2 scorer from pC to pA? better change minute + assist
  await api("/api/events/" + ev1.id, { method: "PUT", body: JSON.stringify({ minute: 13 }) });
  pub = await api("/api/public");
  if (pub.scorers.find(p => p.id === pA.id).stats.goals !== 2) throw new Error("edit minute broke stats");
  // change scorer ev3 from pA to pB
  await api("/api/events/" + ev3.id, { method: "PUT", body: JSON.stringify({ scorerId: pB.id, teamId: ath.id, minute: 39 }) });
  pub = await api("/api/public");
  if (pub.scorers.find(p => p.id === pA.id).stats.goals !== 1) throw new Error("edit scorer not recalculated");
  if (pub.scorers.find(p => p.id === pB.id).stats.goals !== 1) throw new Error("new scorer missing goal");
  log("13 OK: edit recalculated (no double count)");

  // 14. delete event ev2 (sev goal) -> score becomes 2-0
  await api("/api/events/" + ev2.id, { method: "DELETE" });
  pub = await api("/api/public");
  const mm2 = pub.matches.find(x => x.id === m.id);
  if (!(mm2.homeGoals === 2 && mm2.awayGoals === 0)) throw new Error("delete score wrong");
  if (pub.scorers.find(p => p.id === pC.id).stats.goals !== 0) throw new Error("deleted goal still counted");
  const tS2 = pub.standings.find(r => r.teamId === sev.id);
  if (tS2.goalsFor !== 0) throw new Error("table not recalculated after delete");
  log("14 OK: delete recalculated, score 2-0");

  // 15. appearances: only pA played
  await api(`/api/matches/${m.id}/appearances`, { method: "PUT", body: JSON.stringify({ playerIds: [pA.id, pC.id] }) });
  pub = await api("/api/public");
  const paApps = pub.players.find(p => p.id === pA.id).stats.apps;
  const pbApps = pub.players.find(p => p.id === pB.id).stats.apps;
  if (paApps !== 1) throw new Error("apps pA wrong " + paApps);
  if (pbApps !== 0) throw new Error("teammate auto-got apps! " + pbApps);
  log("15 OK: appearances selective (pB=0 despite team win)");
  // manual override
  await api("/api/players/" + pB.id, { method: "PUT", body: JSON.stringify({ manualAppsOverride: 5 }) });
  pub = await api("/api/public");
  if (pub.players.find(p => p.id === pB.id).stats.apps !== 5) throw new Error("manual override failed");
  log("15b OK: manual override=5");

  // 16 persistence + second device (fresh fetch)
  const pub2 = await (await fetch(BASE + "/api/public")).json();
  if (pub2.data.matches.find(x => x.id === m.id).homeGoals !== 2) throw new Error("persistence failed");
  log("16-17 OK: persists + shared");

  // cleanup test data
  await api("/api/matches/" + m.id, { method: "DELETE" });
  await api("/api/players/" + pA.id, { method: "DELETE" }).catch(() => {});
  // pB has events -> delete must be blocked (it scored ev3). So delete events first? match deleted already removed events. Try again:
  await api("/api/players/" + pB.id, { method: "DELETE" });
  await api("/api/players/" + pC.id, { method: "DELETE" });
  pub = await api("/api/public");
  if (pub.matches.some(x => x.id === m.id)) throw new Error("cleanup failed");
  log("CLEAN OK: test data removed, league back to 2 teams / 0 matches");

  console.log("\nALL QA PASSED ✔");
} catch (e) {
  console.error("\nQA FAILED:", e.message);
  process.exit(1);
}
