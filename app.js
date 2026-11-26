import { PROBLEMS, getProblem, TEMPLATE_IDS, templateInfo, newSeed, DIFFICULTY_LABEL, DEFAULT_TIME } from "./problems.js";
import { checkAnswer, previewAnswer } from "./check.js";

const $ = (s) => document.querySelector(s);
const READY_MS = 3000;   // 문제 시작 전 카운트다운
const REVEAL_MS = 4000;  // 정답 공개 후 다음 문제까지
const LOCK_MS = 2000;    // 오답 시 재제출 금지
const SKIP_MS = 1500;    // 타임어택 넘기기 후 대기
const MAX_PLAYERS = 8;
const FB_VERSION = "10.12.2";

let fb = null;          // Firebase 핸들
let net = null;        // 'online' | 'solo' | null
let roomCode = null;
let room = null;        // 현재 방 상태 { meta, players, game }
let myUid = null;
let serverOffset = 0;
let unsubRoom = null;
let timers = [];
let shownKey = null;
let lockUntil = 0;
let busy = false;
let skipUntil = 0;

const DEFAULT_META = { mode: "rounds", difficulty: "normal", kind: "all", totalRounds: 5, target: 3, attackTime: 180, timeLimit: DEFAULT_TIME.normal, penalty: 0, source: "mix" };

const now = () => Date.now() + serverOffset;

/* ---------------- 유틸 ---------------- */
function tex(el, src, display = true) {
  try { katex.render(src, el, { displayMode: display, throwOnError: false }); }
  catch { el.textContent = src; }
}
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2000);
}
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function genCode() { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from({ length: 5 }, () => c[Math.floor(Math.random() * c.length)]).join(""); }
function show(id) { for (const s of document.querySelectorAll(".screen")) s.classList.toggle("hidden", s.id !== id); }
function getName() {
  const n = $("#nameInput").value.trim();
  if (n) try { localStorage.setItem("ib-name", n); } catch {}
  return n;
}
function homeMsg(m, info = false) { const el = $("#homeMsg"); el.textContent = m; el.classList.toggle("info", info); }
function playersArr() {
  return Object.entries(room?.players || {}).map(([uid, p]) => ({ uid, ...p }));
}
// 방장이 나가면 남은 사람 중 가장 먼저 들어온 사람이 방장 역할
function effectiveHost() {
  const ps = playersArr();
  const host = ps.find((p) => p.uid === room.meta.hostId);
  if (host && host.online !== false) return host.uid;
  const on = ps.filter((p) => p.online !== false).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
  return on[0]?.uid || room.meta.hostId;
}
const isHost = () => net === "solo" || effectiveHost() === myUid;

/* ---------------- Firebase ---------------- */
async function initFirebase() {
  if (fb) return fb;
  const { firebaseConfig } = await import("./firebase-config.js");
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("YOUR"))
    throw new Error("firebase-config.js에 Firebase 설정을 넣어주세요 (README 참고)");
  const base = `https://www.gstatic.com/firebasejs/${FB_VERSION}`;
  const [appM, authM, dbM] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-database.js`),
  ]);
  const app = appM.initializeApp(firebaseConfig);
  const auth = authM.getAuth(app);
  const db = dbM.getDatabase(app);
  // 로컬 테스트용: http://localhost:포트/?emu=1 이면 Firebase 에뮬레이터에 연결
  if (location.hostname === "localhost" && new URLSearchParams(location.search).has("emu")) {
    authM.connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    dbM.connectDatabaseEmulator(db, "localhost", 9000);
  }
  const cred = await authM.signInAnonymously(auth);
  dbM.onValue(dbM.ref(db, ".info/serverTimeOffset"), (s) => { serverOffset = s.val() || 0; });
  fb = { ...dbM, db, uid: cred.user.uid, r: (p) => dbM.ref(db, p) };
  return fb;
}

async function createRoom() {
  const name = getName(); if (!name) return homeMsg("닉네임을 입력하세요");
  homeMsg("방 만드는 중…", true);
  try {
    const f = await initFirebase();
    let code;
    for (let i = 0; i < 6; i++) {
      code = genCode();
      if (!(await f.get(f.r(`rooms/${code}/meta`))).exists()) break;
    }
    await f.set(f.r(`rooms/${code}`), {
      meta: { ...DEFAULT_META, hostId: f.uid, createdAt: f.serverTimestamp() },
      game: { status: "lobby" },
    });
    await enterRoom(code, name);
  } catch (e) { console.error(e); homeMsg(e.message || "방을 만들 수 없어요"); }
}

async function joinRoom(code) {
  const name = getName(); if (!name) return homeMsg("닉네임을 입력하세요");
  code = (code || "").trim().toUpperCase();
  if (code.length !== 5) return homeMsg("5자리 방 코드를 입력하세요");
  homeMsg("참가하는 중…", true);
  try { await initFirebase(); await enterRoom(code, name); }
  catch (e) { console.error(e); homeMsg(e.message || "참가할 수 없어요"); }
}

async function enterRoom(code, name) {
  const f = fb;
  const snap = await f.get(f.r(`rooms/${code}`));
  if (!snap.exists() || !snap.val().meta) throw new Error("방을 찾을 수 없어요");
  const players = snap.val().players || {};
  const mine = players[f.uid];
  if (!mine && Object.keys(players).length >= MAX_PLAYERS) throw new Error("방이 가득 찼어요");
  const meRef = f.r(`rooms/${code}/players/${f.uid}`);
  await f.update(meRef, { name, online: true, joinedAt: mine?.joinedAt || f.serverTimestamp() });
  f.onDisconnect(meRef).update({ online: false });

  net = "online"; roomCode = code; myUid = f.uid;
  history.replaceState(null, "", `?room=${code}`);
  homeMsg("");
  unsubRoom = f.onValue(f.r(`rooms/${code}`), (s) => {
    room = s.val();
    if (!room || !room.meta) { toast("방이 사라졌어요"); leave(); return; }
    render();
  });
}

function startSolo() {
  const name = getName() || "나";
  net = "solo"; roomCode = null; myUid = "me"; serverOffset = 0;
  room = {
    meta: { ...DEFAULT_META, hostId: "me" },
    players: { me: { name, online: true } },
    game: { status: "lobby" },
  };
  homeMsg("");
  render();
}

async function leave() {
  clearTimers();
  if (net === "online" && fb) {
    unsubRoom?.();
    const meRef = fb.r(`rooms/${roomCode}/players/${myUid}`);
    fb.onDisconnect(meRef).cancel();
    try {
      if (room?.game?.status === "lobby") await fb.remove(meRef);
      else await fb.update(meRef, { online: false });
      // 마지막 사람이 나가면 방 삭제
      const left = (await fb.get(fb.r(`rooms/${roomCode}/players`))).val() || {};
      if (!Object.values(left).some((p) => p.online !== false)) await fb.remove(fb.r(`rooms/${roomCode}`));
    } catch (e) { console.warn(e); }
  }
  net = null; room = null; roomCode = null; shownKey = null;
  history.replaceState(null, "", location.pathname);
  show("home");
}

/* ---------------- 점수 ---------------- */
// RTDB는 숫자 키 객체를 배열로 돌려줄 수 있어서 객체로 통일
const toObj = (x) => (Array.isArray(x) ? Object.fromEntries(x.map((v, i) => [i, v]).filter(([, v]) => v != null)) : x || {});
const winsOf = (uid, g) => Object.values(toObj(g.results)).filter((v) => v === uid).length;
function scoreOf(uid, g = room.game) {
  const pen = toObj(g.pen)[uid] || 0;
  const plus = g.mode === "attack" ? toObj(g.solved)[uid] || 0 : winsOf(uid, g);
  return plus - pen;
}
const myIndex = (g = room.game) => toObj(g.prog)[myUid] || 0;
function currentProblem(g = room.game) {
  const i = g.mode === "attack" ? myIndex(g) : g.round;
  return i < g.order.length ? getProblem(g.order[i]) : null;
}

/* ---------------- 게임 상태 전이 (온라인/연습 공통) ---------------- */
// 각 함수는 game 객체를 받아 새 game을 돌려주거나, 해당 없으면 null
const T = {
  win: (r, uid) => (g) =>
    g.status === "playing" && g.round === r && g.phase === "question" && now() >= g.roundStart
      ? { ...g, phase: "reveal", winner: uid, revealAt: now(), results: { ...toObj(g.results), [r]: uid } } : null,
  timeout: (r) => (g) =>
    g.status === "playing" && g.round === r && g.phase === "question" && now() >= g.roundStart + g.timeLimit * 1000 - 300
      ? { ...g, phase: "reveal", winner: null, revealAt: now(), results: { ...toObj(g.results), [r]: "-" } } : null,
  advance: (r) => (g) => {
    if (!(g.status === "playing" && g.round === r && g.phase === "reveal")) return null;
    const winners = new Set(Object.values(toObj(g.results)));
    const reached = g.mode === "race" && [...winners].some((uid) => scoreOf(uid, g) >= g.target);
    if (reached || r + 1 >= g.order.length) return { ...g, status: "finished", phase: "done" };
    return { ...g, round: r + 1, phase: "question", winner: null, revealAt: null, skips: null, skipped: null, roundStart: now() + READY_MS };
  },
  // 넘기기 투표: 접속 중인 모두가 누르면 정답 공개 후 다음 문제로
  skipVote: (r, uid, need) => (g) => {
    if (!(g.status === "playing" && g.round === r && g.phase === "question")) return null;
    const skips = { ...toObj(g.skips), [uid]: true };
    if (Object.keys(skips).length >= need)
      return { ...g, skips, phase: "reveal", winner: null, skipped: true, revealAt: now(), results: { ...toObj(g.results), [r]: "-" } };
    return { ...g, skips };
  },
  attackEnd: () => (g) =>
    g.status === "playing" && g.mode === "attack" && now() >= g.endAt - 300 ? { ...g, status: "finished" } : null,
};

// 트랜잭션 적용. 성공하면 새 game 값, 아니면 null
async function applyGame(transform) {
  if (net === "solo") {
    const ng = transform(structuredClone(room.game));
    if (ng) { room.game = ng; render(); }
    return ng;
  }
  if (net !== "online") return null;
  const res = await fb.runTransaction(fb.r(`rooms/${roomCode}/game`), (g) => {
    if (!g) return g;
    return transform(g) ?? undefined; // undefined = 중단
  });
  return res.committed ? res.snapshot.val() : null;
}

// game/<key>/<내 uid> 값을 원자적으로 늘림. bumps = { prog: 1, solved: 1 }
async function bump(bumps) {
  if (net === "solo") {
    for (const [k, by] of Object.entries(bumps)) room.game[k] = { ...toObj(room.game[k]), [myUid]: (toObj(room.game[k])[myUid] || 0) + by };
    render(); return;
  }
  const up = {};
  for (const [k, by] of Object.entries(bumps)) up[`${k}/${myUid}`] = fb.increment(by);
  await fb.update(fb.r(`rooms/${roomCode}/game`), up);
}

/* ---------------- 게임 시작 ---------------- */
// source: mix = 고정 + 숫자 랜덤, gen = 숫자 랜덤만, fixed = 고정 문제만
function poolOf(diff, kind, source, perTemplate) {
  const ok = (type) => kind === "all" || type === kind;
  const fixed = source === "gen" ? [] : PROBLEMS[diff].filter((p) => ok(p.type)).map((p) => p.id);
  const gen = [];
  if (source !== "fixed") {
    for (const t of TEMPLATE_IDS) {
      const info = templateInfo(t);
      if (info.diff !== diff || !ok(info.type)) continue;
      const seenTex = new Set();
      for (let k = 0; k < perTemplate * 3 && seenTex.size < perTemplate; k++) {
        const id = `g:${t}:${newSeed()}`, tex = getProblem(id).tex;
        if (!seenTex.has(tex)) { seenTex.add(tex); gen.push(id); }
      }
    }
  }
  return [...fixed, ...gen];
}
// 같은 템플릿 변형이 연달아 나오지 않게 섞기
function spread(ids) {
  const out = [], rest = [...ids];
  while (rest.length) {
    const prev = out.length ? tplOf(out[out.length - 1]) : null;
    const i = rest.findIndex((id) => !prev || tplOf(id) !== prev);
    out.push(rest.splice(i < 0 ? 0 : i, 1)[0]);
  }
  return out;
}
const tplOf = (id) => (id.startsWith("g:") ? id.split(":")[1] : id);
function buildOrder(m) {
  const diffs = m.difficulty === "mixed" ? ["easy", "normal", "hard"] : [m.difficulty];
  const source = m.source || "mix";
  const per = m.mode === "rounds" ? 2 : 4; // 템플릿마다 만들 변형 수
  const groups = diffs.map((d) => spread(shuffle(poolOf(d, m.kind, source, per))));
  if (m.mode === "rounds") {
    if (groups.length === 1) return groups[0].slice(0, m.totalRounds);
    const n = m.totalRounds, e = Math.ceil(n / 3), h = Math.floor(n / 3);
    return [...groups[0].slice(0, e), ...groups[1].slice(0, n - e - h), ...groups[2].slice(0, h)];
  }
  if (m.mode === "attack") return groups.flat(); // 쉬운 것부터
  return spread(shuffle(groups.flat()));
}

async function startGame() {
  if (!isHost()) return;
  const m = room.meta;
  const order = buildOrder(m);
  if (!order.length) { toast("조건에 맞는 문제가 없어요"); return; }
  const start = now() + READY_MS;
  const game = {
    status: "playing", mode: m.mode, order, penalty: Number(m.penalty) || 0,
    timeLimit: m.timeLimit, target: m.target,
    ...(m.mode === "attack"
      ? { startAt: start, endAt: start + m.attackTime * 1000, attackTime: m.attackTime }
      : { round: 0, phase: "question", roundStart: start }),
  };
  shownKey = null;
  if (net === "solo") { room.game = game; render(); return; }
  await fb.set(fb.r(`rooms/${roomCode}/game`), game);
}

async function backToLobby() {
  if (!isHost()) return;
  if (net === "solo") { room.game = { status: "lobby" }; render(); return; }
  await fb.set(fb.r(`rooms/${roomCode}/game`), { status: "lobby" });
}

async function updateSetting(key, value) {
  if (!isHost()) return;
  const patch = { [key]: value };
  if (key === "difficulty") patch.timeLimit = DEFAULT_TIME[value];
  if (net === "solo") { Object.assign(room.meta, patch); render(); return; }
  await fb.update(fb.r(`rooms/${roomCode}/meta`), patch);
}

/* ---------------- 답 제출 ---------------- */
function canAnswer(g) {
  if (g?.status !== "playing") return false;
  if (g.mode === "attack") return now() >= g.startAt && now() < g.endAt && !!currentProblem(g);
  return g.phase === "question" && now() >= g.roundStart;
}

async function submitAnswer(e) {
  e.preventDefault();
  const g = room?.game;
  if (!canAnswer(g) || busy) return;
  if (Date.now() < lockUntil) return feedback("잠시 후 다시 낼 수 있어요", "warn");
  const prob = currentProblem(g);
  const res = checkAnswer($("#answerInput").value, prob);
  if (res.error) return feedback(res.error, "warn");
  if (!res.correct) {
    lockUntil = Date.now() + LOCK_MS;
    feedback(g.penalty ? "틀렸어요. 1점 감점, 2초 뒤 다시 낼 수 있어요" : "틀렸어요. 2초 뒤 다시 낼 수 있어요", "bad");
    const form = $("#answerForm"); form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
    if (g.penalty) await bump({ pen: g.penalty });
    return;
  }
  busy = true;
  try {
    if (g.mode === "attack") {
      await bump({ prog: 1, solved: 1 });
      toast("정답이에요");
      return;
    }
    const r = g.round;
    feedback("정답이에요. 확인 중…", "good");
    const ng = await applyGame(T.win(r, myUid));
    if (ng && ng.winner === myUid && ng.round === r) feedback("정답이에요", "good");
    else feedback("정답이지만 한 발 늦었어요", "warn");
  } finally { busy = false; }
}

const onlineCount = () => playersArr().filter((p) => p.online !== false).length || 1;

async function skipProblem() {
  const g = room?.game;
  if (!canAnswer(g) || busy) return;
  if (g.mode !== "attack") {
    if (toObj(g.skips)[myUid]) return;
    busy = true;
    try { await applyGame(T.skipVote(g.round, myUid, onlineCount())); } finally { busy = false; }
    return;
  }
  if (Date.now() < skipUntil) return;
  busy = true;
  skipUntil = Date.now() + SKIP_MS;
  try { await bump({ prog: 1 }); } finally { busy = false; }
}

function feedback(msg, kind) { const f = $("#feedback"); f.textContent = msg; f.className = `feedback ${kind || ""}`; }

/* ---------------- 타이머 예약 ---------------- */
function clearTimers() { timers.forEach(clearTimeout); timers = []; }
function schedule() {
  clearTimers();
  const g = room?.game;
  if (!g || g.status !== "playing") return;
  const jitter = net === "online" ? Math.random() * 400 : 0;
  const at = (t, fn) => timers.push(setTimeout(fn, Math.max(0, t - now()) + jitter));
  if (g.mode === "attack") at(g.endAt, () => applyGame(T.attackEnd()));
  else if (g.phase === "question") at(g.roundStart + g.timeLimit * 1000, () => applyGame(T.timeout(g.round)));
  else if (g.phase === "reveal") at(g.revealAt + REVEAL_MS, () => applyGame(T.advance(g.round)));
}

/* ---------------- 렌더링 ---------------- */
const MODE_LABEL = { rounds: "문제 수 대결", race: "선착 점수", attack: "타임어택" };
const MODE_DESC = {
  rounds: "정해진 문제를 다 풀고 점수가 가장 높은 사람이 이겨요. 문제마다 먼저 맞힌 한 명만 1점.",
  race: "목표 점수에 먼저 도달한 사람이 이겨요. 문제마다 먼저 맞힌 한 명만 1점.",
  attack: "제한 시간 동안 각자 최대한 많이 풀어요. 막히면 넘길 수 있어요.",
};
const KIND_LABEL = { all: "전체", d: "정적분", i: "부정적분" };

function render() {
  if (!room) { show("home"); return; }
  const me = room.players?.[myUid];
  $("#meTag").textContent = me ? `${me.name}${net === "solo" ? " (연습)" : ""}` : "";
  const st = room.game?.status || "lobby";
  if (st === "lobby") renderLobby();
  else if (st === "playing") renderGame();
  else renderResult();
  schedule();
}

function playerName(p) {
  const host = net === "online" && p.uid === effectiveHost() ? '<span class="role">방장</span>' : "";
  const you = p.uid === myUid ? '<span class="role">나</span>' : "";
  const off = p.online === false ? '<span class="role off">나감</span>' : "";
  return `<span class="pen">${esc(p.name)}</span>${host}${you}${off}`;
}

// 답안 표기란 동그라미
function bubblesFor(uid, g) {
  const b = (n, cls) => `<span class="bubble ${cls}">${n}</span>`;
  if (g.mode === "rounds") {
    const res = toObj(g.results);
    return g.order.map((_, i) => b(i + 1, res[i] === uid ? "fill" : i === g.round && g.status === "playing" ? "now" : "")).join("");
  }
  if (g.mode === "race") {
    const s = Math.max(0, scoreOf(uid, g));
    return Array.from({ length: g.target }, (_, i) => b(i + 1, i < s ? "fill" : "")).join("");
  }
  const solved = toObj(g.solved)[uid] || 0;
  const shown = Math.min(solved, 24);
  return Array.from({ length: shown }, (_, i) => b(i + 1, "fill")).join("") + (solved > shown ? `<span class="more">+${solved - shown}</span>` : "");
}

function renderLobby() {
  show("lobby");
  shownKey = null;
  const solo = net === "solo";
  $("#lobbyLabel").textContent = solo ? "연습 모드" : "방 코드";
  $("#roomCode").innerHTML = solo ? '<span class="solo-mark pen">혼자 연습</span>' : [...roomCode].map((c) => `<span>${c}</span>`).join("");
  $("#copyBtn").classList.toggle("hidden", solo);
  const host = isHost();
  const m = { ...DEFAULT_META, ...room.meta };
  const fields = [["#setMode", m.mode], ["#setDiff", m.difficulty], ["#setKind", m.kind], ["#setRounds", m.totalRounds],
    ["#setTarget", m.target], ["#setAttack", m.attackTime], ["#setTime", m.timeLimit], ["#setPenalty", Number(m.penalty) || 0], ["#setSource", m.source || "mix"]];
  for (const [id, v] of fields) { const el = $(id); el.value = String(v); el.disabled = !host; }
  $("#cellRounds").classList.toggle("hidden", m.mode !== "rounds");
  $("#cellTarget").classList.toggle("hidden", m.mode !== "race");
  $("#cellAttack").classList.toggle("hidden", m.mode !== "attack");
  $("#cellTime").classList.toggle("hidden", m.mode === "attack");
  $("#modeDesc").textContent = MODE_DESC[m.mode];
  const ps = playersArr();
  $("#playerCount").textContent = solo ? "" : `${ps.length}/${MAX_PLAYERS}`;
  $("#lobbyPlayers").innerHTML = ps.map((p) => `<li>${playerName(p)}</li>`).join("");
  $("#startBtn").classList.toggle("hidden", !host);
  const msg = $("#lobbyMsg");
  if (solo) msg.textContent = "";
  else if (!host) msg.textContent = "방장이 게임을 시작하길 기다리는 중…";
  else if (ps.length < 2) msg.textContent = "초대 링크를 보내면 친구가 바로 들어와요";
  else msg.textContent = "";
}

function renderGame() {
  show("game");
  const g = room.game;
  const attack = g.mode === "attack";
  const prob = currentProblem(g);
  const idx = attack ? myIndex(g) : g.round;
  const key = `${g.mode}:${idx}:${prob?.id}:${attack ? g.startAt : g.roundStart}`;

  const badge = $("#diffBadge");
  badge.textContent = prob ? DIFFICULTY_LABEL[prob.diff] : "";
  badge.className = `badge ${prob?.diff || ""}`;
  $("#typeTag").textContent = prob?.type === "i" ? "부정적분: x에 대한 식으로 답해요" : "";
  $("#roundLabel").textContent =
    g.mode === "rounds" ? `문제 ${g.round + 1} / ${g.order.length}`
    : g.mode === "race" ? `문제 ${g.round + 1}, ${g.target}점 먼저 내면 승리`
    : `${toObj(g.solved)[myUid] || 0}문제 풀었어요`;

  if (key !== shownKey) {
    shownKey = key;
    if (prob) tex($("#problem"), prob.tex);
    else $("#problem").textContent = "준비된 문제를 모두 풀었어요. 시간이 끝나길 기다려요.";
    const input = $("#answerInput");
    input.value = ""; $("#preview").innerHTML = "";
    input.placeholder = prob?.type === "i" ? "x^3/3, xe^x … (+C는 안 적어도 돼요)" : "pi/4, ln2, e-1 …";
    if (!attack) { feedback(""); lockUntil = 0; }
  }

  const ps = playersArr().sort((a, b) => scoreOf(b.uid, g) - scoreOf(a.uid, g));
  $("#scoreList").innerHTML = ps.map((p) =>
    `<li><div class="who">${playerName(p)}</div><div class="bubbles">${bubblesFor(p.uid, g)}</div><span class="tally pen">${scoreOf(p.uid, g)}</span></li>`).join("");

  const reveal = !attack && g.phase === "reveal";
  $("#reveal").classList.toggle("hidden", !reveal);
  const skipBtn = $("#skipBtn");
  if (attack) { skipBtn.textContent = "넘기기"; skipBtn.disabled = !prob; }
  else {
    const votes = Object.keys(toObj(g.skips)).length, need = onlineCount(), voted = !!toObj(g.skips)[myUid];
    skipBtn.textContent = need === 1 ? "넘기기" : voted ? `넘기기 대기 ${votes}/${need}` : votes ? `넘기기 ${votes}/${need}` : "넘기기";
    skipBtn.disabled = reveal || voted;
    // 누가 나가서 이미 모두 동의한 상태가 되면 넘김
    if (!reveal && votes > 0 && votes >= need) applyGame(T.skipVote(g.round, myUid, need));
  }
  $("#answerInput").disabled = reveal || !prob;
  $("#submitBtn").disabled = reveal || !prob;
  if (reveal) {
    const w = g.winner && room.players[g.winner];
    $("#reveal").classList.toggle("won", !!g.winner);
    $("#reveal").classList.toggle("missed", !g.winner);
    $("#revealTitle").textContent = g.winner
      ? (g.winner === myUid ? "정답, 1점 획득" : `${w?.name || "?"} 님이 먼저 풀었어요`)
      : g.skipped ? "넘긴 문제예요" : "시간 종료, 아무도 못 풀었어요";
    tex($("#revealAns"), prob.ansTex);
    $("#revealCat").textContent = `${prob.cat} 문제`;
  }
  tick();
}

function renderResult() {
  show("result");
  shownKey = null;
  const g = room.game;
  const ps = playersArr().sort((a, b) => scoreOf(b.uid, g) - scoreOf(a.uid, g));
  $("#ranking").innerHTML = ps.map((p) => {
    const s = scoreOf(p.uid, g);
    const rank = ps.findIndex((q) => scoreOf(q.uid, g) === s);
    return `<li class="${rank === 0 ? "first" : ""}"><span class="rank pen">${rank + 1}등</span><div class="who">${playerName(p)}</div><div class="bubbles">${bubblesFor(p.uid, g)}</div><span class="grade pen">${s}점</span></li>`;
  }).join("");
  const top = ps[0], topScore = top ? scoreOf(top.uid, g) : 0;
  const tie = ps.length > 1 && scoreOf(ps[1].uid, g) === topScore;
  $("#resultTitle").textContent = net === "solo"
    ? (g.mode === "attack" ? `${g.attackTime / 60}분 동안 ${toObj(g.solved).me || 0}문제 풀었어요` : `${topScore}점`)
    : tie ? "무승부" : top?.uid === myUid ? "내가 이겼어요" : `${top?.name} 님이 이겼어요`;
  $("#resultMode").textContent = `${MODE_LABEL[g.mode] || ""}${g.penalty ? ", 오답 감점" : ""}`;
  const host = isHost();
  $("#againBtn").classList.toggle("hidden", !host);
  $("#toLobbyBtn").classList.toggle("hidden", !host);
  $("#resultMsg").textContent = host ? "" : "방장이 다음 게임을 준비하는 중…";
}

// 0.1초마다 시계/카운트다운 갱신
function tick() {
  const g = room?.game;
  if (!g || g.status !== "playing" || $("#game").classList.contains("hidden")) return;
  const t = now();
  const attack = g.mode === "attack";
  const start = attack ? g.startAt : g.roundStart;
  const limit = (attack ? g.attackTime : g.timeLimit) * 1000;
  const ready = (attack || g.phase === "question") && t < start;
  $("#readyOverlay").classList.toggle("hidden", !ready);
  if (ready) $("#readyCount").textContent = Math.ceil((start - t) / 1000);
  let left = Math.min(limit, Math.max(0, start + limit - t));
  if (!attack && g.phase === "reveal") {
    left = 0;
    const n = Math.max(0, Math.ceil((g.revealAt + REVEAL_MS - t) / 1000));
    $("#revealNext").textContent = `${n}초 뒤 다음으로 넘어가요`;
  }
  const sec = Math.ceil(left / 1000);
  const clock = $("#clock");
  clock.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  clock.classList.toggle("low", !ready && left > 0 && sec <= 10);
  $("#timeBar").style.width = `${(left / limit) * 100}%`;
}
setInterval(tick, 100);

/* ---------------- 이벤트 ---------------- */
function wire() {
  try { $("#nameInput").value = localStorage.getItem("ib-name") || ""; } catch {}
  $("#createBtn").onclick = createRoom;
  $("#joinBtn").onclick = () => joinRoom($("#codeInput").value);
  $("#codeInput").addEventListener("keydown", (e) => { if (e.key === "Enter") joinRoom(e.target.value); });
  $("#soloBtn").onclick = startSolo;
  $("#leaveBtn").onclick = leave;
  $("#leave2Btn").onclick = leave;
  $("#startBtn").onclick = startGame;
  $("#againBtn").onclick = startGame;
  $("#toLobbyBtn").onclick = backToLobby;
  $("#skipBtn").onclick = skipProblem;
  $("#copyBtn").onclick = async () => {
    const url = `${location.origin}${location.pathname}?room=${roomCode}`;
    try { await navigator.clipboard.writeText(url); toast("초대 링크를 복사했어요"); }
    catch { prompt("이 링크를 친구에게 보내세요", url); }
  };
  const setting = (id, key, num) => { $(id).onchange = (e) => updateSetting(key, num ? Number(e.target.value) : e.target.value); };
  setting("#setMode", "mode");
  setting("#setDiff", "difficulty");
  setting("#setKind", "kind");
  setting("#setRounds", "totalRounds", true);
  setting("#setTarget", "target", true);
  setting("#setAttack", "attackTime", true);
  setting("#setTime", "timeLimit", true);
  setting("#setPenalty", "penalty", true);
  setting("#setSource", "source");
  $("#answerForm").addEventListener("submit", submitAnswer);
  $("#answerInput").addEventListener("input", (e) => {
    const v = e.target.value; const pv = $("#preview");
    if (!v.trim() || !room?.game?.order) { pv.innerHTML = ""; return; }
    const r = previewAnswer(v, currentProblem());
    if (r.error) pv.textContent = "…"; else tex(pv, r.tex, false);
  });

  const code = new URLSearchParams(location.search).get("room");
  if (code) {
    $("#codeInput").value = code.toUpperCase();
    if ($("#nameInput").value.trim()) joinRoom(code);
    else homeMsg("닉네임을 입력하고 참가를 누르세요", true);
  }
}

window.addEventListener("DOMContentLoaded", wire);
