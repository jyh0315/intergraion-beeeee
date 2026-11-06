import { PROBLEMS, DIFFICULTY_LABEL, DEFAULT_TIME } from "./problems.js";
import { checkAnswer, evaluate } from "./check.js";

const $ = (s) => document.querySelector(s);
const READY_MS = 3000;   // 문제 시작 전 카운트다운
const REVEAL_MS = 4000;  // 정답 공개 후 다음 문제까지
const LOCK_MS = 2000;    // 오답 시 재제출 금지
const MAX_PLAYERS = 8;
const FB_VERSION = "10.12.2";

let fb = null;          // Firebase 핸들
let mode = null;        // 'online' | 'solo' | null
let roomCode = null;
let room = null;        // 현재 방 상태 { meta, players, game }
let myUid = null;
let serverOffset = 0;
let unsubRoom = null;
let timers = [];
let shownKey = null;
let lockUntil = 0;

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
const isHost = () => mode === "solo" || effectiveHost() === myUid;

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
      meta: { difficulty: "normal", totalRounds: 5, timeLimit: DEFAULT_TIME.normal, hostId: f.uid, createdAt: f.serverTimestamp() },
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
  await f.update(meRef, { name, online: true, score: mine?.score || 0, joinedAt: mine?.joinedAt || f.serverTimestamp() });
  f.onDisconnect(meRef).update({ online: false });

  mode = "online"; roomCode = code; myUid = f.uid;
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
  mode = "solo"; roomCode = null; myUid = "me"; serverOffset = 0;
  room = {
    meta: { difficulty: "normal", totalRounds: 5, timeLimit: DEFAULT_TIME.normal, hostId: "me" },
    players: { me: { name, score: 0, online: true } },
    game: { status: "lobby" },
  };
  homeMsg("");
  render();
}

async function leave() {
  clearTimers();
  if (mode === "online" && fb) {
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
  mode = null; room = null; roomCode = null; shownKey = null;
  history.replaceState(null, "", location.pathname);
  show("home");
}

/* ---------------- 게임 상태 전이 (온라인/연습 공통) ---------------- */
// 각 함수는 game 객체를 받아 새 game을 돌려주거나, 해당 없으면 null
const T = {
  win: (r, uid) => (g) =>
    g.status === "playing" && g.round === r && g.phase === "question" && now() >= g.roundStart
      ? { ...g, phase: "reveal", winner: uid, revealAt: now() } : null,
  timeout: (r, limitMs) => (g) =>
    g.status === "playing" && g.round === r && g.phase === "question" && now() >= g.roundStart + limitMs - 300
      ? { ...g, phase: "reveal", winner: null, revealAt: now() } : null,
  advance: (r) => (g) => {
    if (!(g.status === "playing" && g.round === r && g.phase === "reveal")) return null;
    if (r + 1 >= g.order.length) return { ...g, status: "finished", phase: "done" };
    return { ...g, round: r + 1, phase: "question", winner: null, revealAt: null, roundStart: now() + READY_MS };
  },
};

// 트랜잭션 적용. 성공하면 새 game 값, 아니면 null
async function applyGame(transform) {
  if (mode === "solo") {
    const ng = transform(structuredClone(room.game));
    if (ng) { room.game = ng; render(); }
    return ng;
  }
  if (mode !== "online") return null;
  const res = await fb.runTransaction(fb.r(`rooms/${roomCode}/game`), (g) => {
    if (!g) return g;
    return transform(g) ?? undefined; // undefined = 중단
  });
  return res.committed ? res.snapshot.val() : null;
}

async function startGame() {
  if (!isHost()) return;
  const pool = PROBLEMS[room.meta.difficulty];
  const n = Math.min(room.meta.totalRounds, pool.length);
  const order = shuffle([...pool.keys()]).slice(0, n);
  const game = { status: "playing", order, round: 0, phase: "question", roundStart: now() + READY_MS };
  if (mode === "solo") {
    room.game = game;
    for (const p of Object.values(room.players)) p.score = 0;
    shownKey = null; render(); return;
  }
  const up = { game };
  for (const uid of Object.keys(room.players || {})) up[`players/${uid}/score`] = 0;
  await fb.update(fb.r(`rooms/${roomCode}`), up);
}

async function backToLobby() {
  if (!isHost()) return;
  if (mode === "solo") { room.game = { status: "lobby" }; render(); return; }
  await fb.set(fb.r(`rooms/${roomCode}/game`), { status: "lobby" });
}

async function updateSetting(key, value) {
  if (!isHost()) return;
  const patch = { [key]: value };
  if (key === "difficulty") patch.timeLimit = DEFAULT_TIME[value];
  if (mode === "solo") { Object.assign(room.meta, patch); render(); return; }
  await fb.update(fb.r(`rooms/${roomCode}/meta`), patch);
}

async function submitAnswer(e) {
  e.preventDefault();
  const g = room?.game;
  if (!(g?.status === "playing" && g.phase === "question")) return;
  if (now() < g.roundStart) return;
  if (Date.now() < lockUntil) return feedback(`잠시 후 다시 제출할 수 있어요`, "warn");
  const input = $("#answerInput");
  const prob = PROBLEMS[room.meta.difficulty][g.order[g.round]];
  const res = checkAnswer(input.value, prob.ans);
  if (res.error) return feedback(res.error, "warn");
  if (!res.correct) {
    lockUntil = Date.now() + LOCK_MS;
    feedback("오답! 2초 후 다시 시도하세요", "bad");
    const form = $("#answerForm"); form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
    return;
  }
  const r = g.round;
  feedback("정답! 확인 중…", "good");
  const ng = await applyGame(T.win(r, myUid));
  if (ng && ng.winner === myUid && ng.round === r) {
    feedback("정답! 🎉", "good");
    if (mode === "solo") { room.players.me.score++; render(); }
    else await fb.update(fb.r(`rooms/${roomCode}/players/${myUid}`), { score: fb.increment(1) });
  } else {
    feedback("정답이지만 한 발 늦었어요!", "warn");
  }
}

function feedback(msg, kind) { const f = $("#feedback"); f.textContent = msg; f.className = `feedback ${kind || ""}`; }

/* ---------------- 타이머 예약 ---------------- */
function clearTimers() { timers.forEach(clearTimeout); timers = []; }
function schedule() {
  clearTimers();
  const g = room?.game;
  if (!g || g.status !== "playing") return;
  const r = g.round;
  const jitter = mode === "online" ? Math.random() * 400 : 0;
  if (g.phase === "question") {
    const limit = room.meta.timeLimit * 1000;
    const t = g.roundStart + limit - now();
    timers.push(setTimeout(() => applyGame(T.timeout(r, limit)), Math.max(0, t) + jitter));
  } else if (g.phase === "reveal") {
    const t = g.revealAt + REVEAL_MS - now();
    timers.push(setTimeout(() => applyGame(T.advance(r)), Math.max(0, t) + jitter));
  }
}

/* ---------------- 렌더링 ---------------- */
function render() {
  if (!room) { show("home"); return; }
  const me = room.players?.[myUid];
  $("#meTag").textContent = me ? `${me.name}${mode === "solo" ? " · 연습" : ""}` : "";
  const st = room.game?.status || "lobby";
  if (st === "lobby") renderLobby();
  else if (st === "playing") renderGame();
  else renderResult();
  schedule();
}

function playerLi(p, extra = "") {
  const host = mode === "online" && p.uid === effectiveHost() ? " 👑" : "";
  const you = p.uid === myUid ? ' <span class="you">(나)</span>' : "";
  return `<li><span class="dot ${p.online === false ? "off" : ""}"></span>${esc(p.name)}${host}${you}${extra}</li>`;
}

function renderLobby() {
  show("lobby");
  shownKey = null;
  const solo = mode === "solo";
  $("#lobbyLabel").textContent = solo ? "혼자 연습" : "방 코드";
  $("#roomCode").textContent = solo ? "SOLO" : roomCode;
  $("#copyBtn").classList.toggle("hidden", solo);
  const host = isHost();
  const m = room.meta;
  for (const [id, v] of [["#setDiff", m.difficulty], ["#setRounds", m.totalRounds], ["#setTime", m.timeLimit]]) {
    const el = $(id); el.value = String(v); el.disabled = !host;
  }
  const ps = playersArr();
  $("#playerCount").textContent = solo ? "" : `(${ps.length}/${MAX_PLAYERS})`;
  $("#lobbyPlayers").innerHTML = ps.map((p) => playerLi(p)).join("");
  $("#startBtn").classList.toggle("hidden", !host);
  const msg = $("#lobbyMsg"); msg.classList.add("info");
  if (solo) msg.textContent = "";
  else if (!host) msg.textContent = "방장이 게임을 시작하길 기다리는 중…";
  else if (ps.length < 2) msg.textContent = "초대 링크를 친구에게 보내세요!";
  else msg.textContent = "";
}

function renderGame() {
  show("game");
  const g = room.game, m = room.meta;
  const prob = PROBLEMS[m.difficulty][g.order[g.round]];
  const key = `${g.round}:${g.order[g.round]}:${g.roundStart}`;
  const badge = $("#diffBadge");
  badge.textContent = DIFFICULTY_LABEL[m.difficulty]; badge.className = `badge ${m.difficulty}`;
  $("#roundLabel").textContent = `문제 ${g.round + 1} / ${g.order.length}`;

  if (key !== shownKey) {
    shownKey = key;
    tex($("#problem"), prob.tex);
    $("#answerInput").value = ""; $("#preview").innerHTML = ""; feedback("");
    lockUntil = 0;
  }

  const ps = playersArr().sort((a, b) => (b.score || 0) - (a.score || 0));
  $("#scoreList").innerHTML = ps.map((p) => playerLi(p, `<span class="pts">${p.score || 0}</span>`)).join("");

  const reveal = g.phase === "reveal";
  $("#reveal").classList.toggle("hidden", !reveal);
  $("#answerInput").disabled = reveal;
  $("#submitBtn").disabled = reveal;
  if (reveal) {
    const w = g.winner && room.players[g.winner];
    $("#revealTitle").textContent = g.winner
      ? (g.winner === myUid ? "🎉 정답! +1점" : `⚡ ${w?.name || "?"} 님이 먼저 풀었어요`)
      : "⏰ 시간 초과";
    tex($("#revealAns"), `${prob.tex} = ${prob.ansTex}`);
  }
  tick();
}

function renderResult() {
  show("result");
  shownKey = null;
  const ps = playersArr().sort((a, b) => (b.score || 0) - (a.score || 0));
  const medals = ["🥇", "🥈", "🥉"];
  const total = room.game.order?.length || 0;
  $("#ranking").innerHTML = ps.map((p, i) => {
    const rank = ps.findIndex((q) => (q.score || 0) === (p.score || 0));
    return `<li><span class="medal">${medals[rank] || rank + 1}</span>${esc(p.name)}${p.uid === myUid ? ' <span class="you">(나)</span>' : ""}<span class="pts">${p.score || 0} / ${total}</span></li>`;
  }).join("");
  const top = ps[0], tie = ps.length > 1 && (ps[1].score || 0) === (top?.score || 0);
  $("#resultTitle").textContent = mode === "solo"
    ? `${top?.score || 0} / ${total} 정답`
    : tie ? "무승부!" : top?.uid === myUid ? "🏆 승리!" : `${top?.name} 님 승리`;
  const host = isHost();
  $("#againBtn").classList.toggle("hidden", !host);
  $("#toLobbyBtn").classList.toggle("hidden", !host || mode === "solo");
  const msg = $("#resultMsg"); msg.classList.add("info");
  msg.textContent = host ? "" : "방장이 다음 게임을 준비하는 중…";
}

// 0.1초마다 시계/카운트다운 갱신
function tick() {
  const g = room?.game;
  if (!g || g.status !== "playing" || $("#game").classList.contains("hidden")) return;
  const limit = room.meta.timeLimit * 1000;
  const t = now();
  const ready = g.phase === "question" && t < g.roundStart;
  $("#readyOverlay").classList.toggle("hidden", !ready);
  if (ready) $("#readyCount").textContent = Math.ceil((g.roundStart - t) / 1000);
  let left = g.phase === "question" ? Math.min(limit, Math.max(0, g.roundStart + limit - t)) : 0;
  if (g.phase === "reveal") {
    left = 0;
    const n = Math.max(0, Math.ceil((g.revealAt + REVEAL_MS - t) / 1000));
    $("#revealNext").textContent = g.round + 1 >= g.order.length ? `결과 발표까지 ${n}초` : `다음 문제까지 ${n}초`;
  }
  const sec = Math.ceil(left / 1000);
  const clock = $("#clock");
  clock.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  clock.classList.toggle("low", g.phase === "question" && !ready && sec <= 10);
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
  $("#copyBtn").onclick = async () => {
    const url = `${location.origin}${location.pathname}?room=${roomCode}`;
    try { await navigator.clipboard.writeText(url); toast("초대 링크를 복사했어요"); }
    catch { prompt("이 링크를 친구에게 보내세요", url); }
  };
  $("#setDiff").onchange = (e) => updateSetting("difficulty", e.target.value);
  $("#setRounds").onchange = (e) => updateSetting("totalRounds", Number(e.target.value));
  $("#setTime").onchange = (e) => updateSetting("timeLimit", Number(e.target.value));
  $("#answerForm").addEventListener("submit", submitAnswer);
  $("#answerInput").addEventListener("input", (e) => {
    const v = e.target.value; const pv = $("#preview");
    if (!v.trim()) { pv.innerHTML = ""; return; }
    const r = evaluate(v);
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
