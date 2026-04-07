(() => {
  const DATA = window.AIN_LAM_DATA;
  if (!DATA || !Array.isArray(DATA.categories)) {
    document.body.innerHTML = '<div style="padding:20px;font-family:Cairo">خطأ: ملف questions.js لم يتم تحميله.</div>';
    return;
  }

  const POINTS = DATA.points || [200, 400, 600];
  const LS_KEY = "AIN_LAM_PREFS_V3";

  // DOM
  const body = document.body;

  const screenHome = document.getElementById("screenHome");
  const screenGame = document.getElementById("screenGame");
  const screenQuestion = document.getElementById("screenQuestion");
  const screenResult = document.getElementById("screenResult");

  const btnExitToHome = document.getElementById("btnExitToHome");
  const btnEndGame = document.getElementById("btnEndGame");

  const categoriesGrid = document.getElementById("categoriesGrid");
  const selectedCountEl = document.getElementById("selectedCount");
  const btnStart = document.getElementById("btnStart");
  const startHint = document.getElementById("startHint");

  const roundNameInput = document.getElementById("roundName");
  const team1NameInput = document.getElementById("team1Name");
  const team2NameInput = document.getElementById("team2Name");
  const optSounds = document.getElementById("optSounds");
  const optConfirmEnd = document.getElementById("optConfirmEnd");

  const miniRoundName = document.getElementById("miniRoundName");
  const roundLabel = document.getElementById("roundLabel");
  const team1Label = document.getElementById("team1Label");
  const team2Label = document.getElementById("team2Label");
  const team1ScoreEl = document.getElementById("team1Score");
  const team2ScoreEl = document.getElementById("team2Score");
  const boardEl = document.getElementById("board");

  const qCategoryPill = document.getElementById("qCategoryPill");
  const qPointsPill = document.getElementById("qPointsPill");
  const qSidePill = document.getElementById("qSidePill");
  const timerValue = document.getElementById("timerValue");
  const qText = document.getElementById("qText");
  const btnReveal = document.getElementById("btnReveal");
  const answerBox = document.getElementById("answerBox");
  const aText = document.getElementById("aText");
  const awardRow = document.getElementById("awardRow");
  const btnAwardT1 = document.getElementById("btnAwardT1");
  const btnAwardT2 = document.getElementById("btnAwardT2");
  const btnAwardNone = document.getElementById("btnAwardNone");
  const btnBackToBoard = document.getElementById("btnBackToBoard");

  const lifelineTeam1Title = document.getElementById("lifelineTeam1Title");
  const lifelineTeam2Title = document.getElementById("lifelineTeam2Title");
  const t1Two = document.getElementById("t1Two");
  const t1Steal = document.getElementById("t1Steal");
  const t1Block = document.getElementById("t1Block");
  const t2Two = document.getElementById("t2Two");
  const t2Steal = document.getElementById("t2Steal");
  const t2Block = document.getElementById("t2Block");

  const resultTitle = document.getElementById("resultTitle");
  const resultSubtitle = document.getElementById("resultSubtitle");
  const resT1Name = document.getElementById("resT1Name");
  const resT2Name = document.getElementById("resT2Name");
  const resT1Score = document.getElementById("resT1Score");
  const resT2Score = document.getElementById("resT2Score");
  const btnNewGame = document.getElementById("btnNewGame");
  const btnHome = document.getElementById("btnHome");

  // State
  const app = {
    selected: new Set(),
    game: null,
  };

  function showScreen(name){
    screenHome.classList.add("hidden");
    screenGame.classList.add("hidden");
    screenQuestion.classList.add("hidden");
    screenResult.classList.add("hidden");

    if (name === "home") screenHome.classList.remove("hidden");
    if (name === "game") screenGame.classList.remove("hidden");
    if (name === "question") screenQuestion.classList.remove("hidden");
    if (name === "result") screenResult.classList.remove("hidden");

    const onHome = name === "home";
    btnExitToHome.classList.toggle("hidden", onHome);
    btnEndGame.classList.toggle("hidden", name !== "game");

    body.classList.toggle("bgHome", name === "home" || name === "result");
    body.classList.toggle("bgGame", name === "game" || name === "question");
  }

  function loadPrefs(){
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch { return null; }
  }
  function savePrefs(p){
    try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch {}
  }

  function beep(){
    if (!optSounds.checked) return;
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.04;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 140);
    } catch {}
  }

  function shuffle(arr){
    const a = arr.slice();
    for (let i=a.length-1; i>0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickRandom(list){
    if (!Array.isArray(list) || list.length === 0) return { q:"لا يوجد سؤال مُعد لهذه الخانة بعد.", a:"—" };
    const idx = Math.floor(Math.random() * list.length);
    return list[idx];
  }

  function pickTwoDistinct(list){
    if (!Array.isArray(list) || list.length === 0) {
      const x = { q:"لا يوجد سؤال مُعد لهذه الخانة بعد.", a:"—" };
      return [x, x];
    }
    if (list.length === 1) return [list[0], list[0]];
    const a = pickRandom(list);
    let b = pickRandom(list);
    let safe = 0;
    while (b === a && safe < 10) { b = pickRandom(list); safe++; }
    return [a, b];
  }

  function syncHeaderRoundName(text){
    miniRoundName.textContent = text || "—";
    roundLabel.textContent = text || "—";
  }

  // HOME: render categories (vertical cards)
  function renderCategories(){
    categoriesGrid.innerHTML = "";
    for (const cat of DATA.categories){
      const card = document.createElement("div");
      card.className = "catV";
      card.dataset.id = cat.id;

      const imgWrap = document.createElement("div");
      imgWrap.className = "img";

      const img = document.createElement("img");
      img.src = cat.image;
      img.alt = cat.name;
      img.onerror = () => { img.style.display = "none"; imgWrap.style.background = "linear-gradient(135deg, rgba(255,106,0,0.12), rgba(59,130,246,0.12))"; };

      const check = document.createElement("div");
      check.className = "check";
      check.textContent = "✓";

      imgWrap.appendChild(img);
      imgWrap.appendChild(check);

      const name = document.createElement("div");
      name.className = "name";
      name.textContent = cat.name;

      card.appendChild(imgWrap);
      card.appendChild(name);

      card.addEventListener("click", () => toggleCategory(cat.id));
      categoriesGrid.appendChild(card);
    }
    syncCategoryUI();
  }

  function toggleCategory(catId){
    if (app.selected.has(catId)){
      app.selected.delete(catId);
      syncCategoryUI();
      return;
    }
    if (app.selected.size >= 6){
      beep();
      startHint.textContent = "لا يمكن اختيار أكثر من ست فئات.";
      setTimeout(() => syncCategoryUI(), 900);
      return;
    }
    app.selected.add(catId);
    syncCategoryUI();
  }

  function syncCategoryUI(){
    selectedCountEl.textContent = String(app.selected.size);
    document.querySelectorAll(".catV").forEach(el => {
      el.classList.toggle("selected", app.selected.has(el.dataset.id));
    });

    const ok = app.selected.size === 6;
    btnStart.disabled = !ok;
    startHint.textContent = ok ? "تم اختيار ست فئات. يمكنك بدء اللعبة." : "لا بد من اختيار ست فئات لبدء اللعبة.";
  }
// تحميل وسائط الجولة الحالية في الخلفية
const mediaPreloadStore = [];

function preloadGameMedia(bank){
  if (!bank) return;

  const seen = new Set();

  for (const catId in bank){
    const byPoints = bank[catId];
    for (const points in byPoints){
      const pair = byPoints[points];
      const entries = [pair?.right, pair?.left];

      for (const q of entries){
        const media = q?.media;
        if (!media || !media.src) continue;
        if (seen.has(media.src)) continue;
        seen.add(media.src);

        if (media.type === "image"){
          const img = new Image();
          img.src = media.src;
          mediaPreloadStore.push(img);
          continue;
        }

        if (media.type === "audio"){
          const audio = document.createElement("audio");
          audio.preload = "auto";
          audio.src = media.src;
          mediaPreloadStore.push(audio);
          continue;
        }

        if (media.type === "video"){
          const video = document.createElement("video");
          video.preload = "auto";
          video.src = media.src;
          if (media.poster){
            const posterImg = new Image();
            posterImg.src = media.poster;
            mediaPreloadStore.push(posterImg);
          }
          mediaPreloadStore.push(video);
        }
      }
    }
  }
}

  // GAME build
  function cellKey(catId, side, points){
    return `${catId}:${side}:${points}`;
  }
const USED_QUESTIONS_STORAGE_KEY = "AIN_LAM_USED_QUESTIONS_V1";

function makeSessionKey(roundName, team1, team2){
  const r = (roundName || "").trim().toLowerCase();
  const t1 = (team1 || "").trim().toLowerCase();
  const t2 = (team2 || "").trim().toLowerCase();
  return `${r}__${t1}__${t2}`;
}

function loadUsedQuestionsMap(){
  try{
    return JSON.parse(localStorage.getItem(USED_QUESTIONS_STORAGE_KEY) || "{}");
  }catch{
    return {};
  }
}

function saveUsedQuestionsMap(map){
  localStorage.setItem(USED_QUESTIONS_STORAGE_KEY, JSON.stringify(map));
}

function makeQuestionId(catId, points, qObj){
  return `${catId}__${points}__${qObj?.q || ""}`;
}
function pickTwoDistinctAvoidingUsed(list, usedIds, catId, points){
  if (!Array.isArray(list) || list.length === 0) {
    const fallback = { q: "لا يوجد سؤال مُعد لهذه الخانة بعد.", a: "—", media: null };
    return [fallback, fallback];
  }

  const fresh = list.filter(item => !usedIds.has(makeQuestionId(catId, points, item)));
  const source = fresh.length >= 2 ? fresh : list;

  if (source.length === 1) return [source[0], source[0]];

  const shuffled = shuffle(source);
  return [shuffled[0], shuffled[1]];
}
  function buildGame(){
    const roundName = (roundNameInput.value || "").trim() || "جولة عين لام";
    const team1 = (team1NameInput.value || "").trim() || "الفريق الأول";
    const team2 = (team2NameInput.value || "").trim() || "الفريق الثاني";
const sessionKey = makeSessionKey(roundName, team1, team2);
const usedMap = loadUsedQuestionsMap();
const usedIds = new Set(usedMap[sessionKey] || []);

    savePrefs({
      roundName, team1, team2,
      optSounds: optSounds.checked,
      optConfirmEnd: optConfirmEnd.checked,
    });

    const cats = shuffle(DATA.categories.filter(c => app.selected.has(c.id)));

// bank: for each category and points we pick two questions (right/left)
const bank = {};
for (const cat of cats){
  bank[cat.id] = {};
  for (const p of POINTS){
    const list = cat.questions?.[p] || [];
const [rightQ, leftQ] = pickTwoDistinctAvoidingUsed(list, usedIds, cat.id, p);

    const safeRight = rightQ || { q: "—", a: "—", media: null };
    const safeLeft  = leftQ  || { q: "—", a: "—", media: null };

    bank[cat.id][p] = {
      right: safeRight,
      left:  safeLeft
    };
  }
}
const newlyUsed = [];

for (const cat of cats){
  for (const p of POINTS){
    const pair = bank[cat.id][p];
    if (pair?.right) newlyUsed.push(makeQuestionId(cat.id, p, pair.right));
    if (pair?.left) newlyUsed.push(makeQuestionId(cat.id, p, pair.left));
  }
}

const merged = new Set([...(usedMap[sessionKey] || []), ...newlyUsed]);
usedMap[sessionKey] = Array.from(merged);
saveUsedQuestionsMap(usedMap);
    return {
      roundName,
      categories: cats.map(c => ({ id:c.id, name:c.name, image:c.image })),
      bank,
      used: new Set(),
      current: null,
      revealed: false,
      teams:{
        t1:{ name: team1, score:0, lifelines:{ two:false, steal:false, block:false } },
        t2:{ name: team2, score:0, lifelines:{ two:false, steal:false, block:false } },
      }
    };
  }

  function syncTeams(){
    team1Label.textContent = app.game.teams.t1.name;
    team2Label.textContent = app.game.teams.t2.name;
    lifelineTeam1Title.textContent = app.game.teams.t1.name;
    lifelineTeam2Title.textContent = app.game.teams.t2.name;

    btnAwardT1.textContent = app.game.teams.t1.name;
    btnAwardT2.textContent = app.game.teams.t2.name;
  }

  function syncScores(){
    team1ScoreEl.textContent = String(app.game.teams.t1.score);
    team2ScoreEl.textContent = String(app.game.teams.t2.score);
  }

  function renderBoard(){
    boardEl.innerHTML = "";

    for (const cat of app.game.categories){
      const card = document.createElement("div");
      card.className = "catGameCard";

      const head = document.createElement("div");
      head.className = "catGameHead";

      const badge = document.createElement("div");
      badge.className = "catBadge";

      const img = document.createElement("img");
      img.src = cat.image;
      img.alt = cat.name;
      img.onerror = () => { img.style.display = "none"; badge.style.background = "linear-gradient(135deg, rgba(255,106,0,0.12), rgba(59,130,246,0.12))"; };

      badge.appendChild(img);

      const meta = document.createElement("div");
      const title = document.createElement("div");
      title.className = "catTitle";
      title.textContent = cat.name;

      meta.appendChild(title);

      head.appendChild(badge);
      head.appendChild(meta);

      const body = document.createElement("div");
      body.className = "pointsWrap";

      const rightCol = document.createElement("div");
      rightCol.className = "pointsCol";

      const leftCol = document.createElement("div");
      leftCol.className = "pointsCol";

      for (const p of POINTS) rightCol.appendChild(makeCell(cat.id, "right", p));
      for (const p of POINTS) leftCol.appendChild(makeCell(cat.id, "left", p));

      body.appendChild(rightCol);

      const mid = document.createElement("div");
mid.className = "midCard";

const midImg = document.createElement("div");
midImg.className = "midImg";
midImg.appendChild(img);

const midName = document.createElement("div");
midName.className = "midName";
midName.textContent = cat.name;

mid.appendChild(midImg);
mid.appendChild(midName);

body.appendChild(mid);

      body.appendChild(leftCol);

      card.appendChild(body);
      boardEl.appendChild(card);
    }
    updateUsedUI();
  }

  function makeCell(catId, side, points){
    const el = document.createElement("div");
    el.className = `cell p${points}`;
    el.dataset.k = cellKey(catId, side, points);
    el.textContent = String(points);

    el.addEventListener("click", () => {
      if (app.game.used.has(el.dataset.k)) return;
      openQuestion(catId, side, points);
    });

    return el;
  }

  function updateUsedUI(){
    document.querySelectorAll(".cell").forEach(el => {
      el.classList.toggle("used", app.game.used.has(el.dataset.k));
    });
  }

  // Timer
  let timerId = null;
  let sec = 0;
  function fmt(s){
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}`;
  }
  function startTimer(){
    stopTimer();
    sec = 0;
    timerValue.textContent = fmt(sec);
    timerId = setInterval(() => {
      sec += 1;
      timerValue.textContent = fmt(sec);
    }, 1000);
  }
  function stopTimer(){
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  // Lifelines
  function setLife(btn, used, locked){
    btn.classList.toggle("used", used);
    btn.disabled = used || locked;
  }
  function syncLifelines(){
    const g = app.game;
    const locked = g.revealed;

    setLife(t1Two, g.teams.t1.lifelines.two, locked);
    setLife(t1Steal, g.teams.t1.lifelines.steal, locked);
    setLife(t1Block, g.teams.t1.lifelines.block, locked);

    setLife(t2Two, g.teams.t2.lifelines.two, locked);
    setLife(t2Steal, g.teams.t2.lifelines.steal, locked);
    setLife(t2Block, g.teams.t2.lifelines.block, locked);
  }

  // Question flow
function renderMedia(media){
  const box = document.getElementById("mediaBox");
  const controls = document.getElementById("mediaControls");
  if(!box || !controls) return;

  // تنظيف
  box.innerHTML = "";
  box.classList.add("hidden");
  controls.classList.add("hidden");

  // إذا لا يوجد ميديا: لا شيء
  if(!media || !media.type || !media.src) return;

  let player = null;

  if(media.type === "image"){
    const img = document.createElement("img");
    img.src = media.src;
    img.alt = "وسائط السؤال";
    box.appendChild(img);
    box.classList.remove("hidden");
    // لا نعرض أزرار تشغيل للصورة
    return;
  }

  if(media.type === "audio"){
    player = document.createElement("audio");
    player.src = media.src;
    player.preload = "metadata";
  }

  if(media.type === "video"){
    player = document.createElement("video");
    player.src = media.src;
    player.preload = "metadata";
    player.playsInline = true;
    if(media.poster) player.poster = media.poster;
  }

  if(!player) return;

  box.appendChild(player);
  box.classList.remove("hidden");
  controls.classList.remove("hidden");

  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const restartBtn = document.getElementById("restartBtn");

  playBtn.onclick = () => player.play();
  pauseBtn.onclick = () => player.pause();
  restartBtn.onclick = () => { player.currentTime = 0; player.play(); };
}  
function openQuestion(catId, side, points){
    const cat = app.game.categories.find(c => c.id === catId);
    const qa = app.game.bank?.[catId]?.[points]?.[side] || { q:"—", a:"—" };

    app.game.current = {
      catId, side, points,
      categoryName: cat?.name || "—",
      q: qa.q,
      a: qa.a,
      media: qa.media || null,
      state: { blockedTeam: null } // t1 or t2
    };

    qCategoryPill.textContent = app.game.current.categoryName;
    qPointsPill.textContent = `النقاط: ${points}`;

    qText.textContent = app.game.current.q;
    renderMedia(app.game.current.media);
    aText.textContent = app.game.current.a;

    app.game.revealed = false;
    answerBox.classList.add("hidden");
    awardRow.classList.add("hidden");
    btnReveal.disabled = false;

    // reset award buttons
    btnAwardT1.disabled = false;
    btnAwardT2.disabled = false;

    syncLifelines();
    startTimer();
    showScreen("question");
  }

  // lifeline handlers
  function useTwo(teamKey){
    const t = app.game.teams[teamKey].lifelines;
    if (t.two || app.game.revealed) return;
    t.two = true;
    syncLifelines();
  }
  function useSteal(teamKey){
    const t = app.game.teams[teamKey].lifelines;
    if (t.steal || app.game.revealed) return;
    t.steal = true;
    syncLifelines();
  }
  function useBlock(teamKey){
    const t = app.game.teams[teamKey].lifelines;
    if (t.block || app.game.revealed) return;
    t.block = true;
    const other = teamKey === "t1" ? "t2" : "t1";
    app.game.current.state.blockedTeam = other;
    syncLifelines();
  }

  t1Two.addEventListener("click", () => useTwo("t1"));
  t1Steal.addEventListener("click", () => useSteal("t1"));
  t1Block.addEventListener("click", () => useBlock("t1"));

  t2Two.addEventListener("click", () => useTwo("t2"));
  t2Steal.addEventListener("click", () => useSteal("t2"));
  t2Block.addEventListener("click", () => useBlock("t2"));

  btnReveal.addEventListener("click", () => {
    if (!app.game.current) return;
    app.game.revealed = true;
    stopTimer();

    answerBox.classList.remove("hidden");
    awardRow.classList.remove("hidden");
    btnReveal.disabled = true;

    // apply block
    const blocked = app.game.current.state.blockedTeam;
    if (blocked === "t1") btnAwardT1.disabled = true;
    if (blocked === "t2") btnAwardT2.disabled = true;

    syncLifelines();
  });

  function markUsed(){
    const q = app.game.current;
    app.game.used.add(cellKey(q.catId, q.side, q.points));
    updateUsedUI();
  }

  function totalCells(){
    return app.game.categories.length * 6;
  }

  function maybeAutoEnd(){
    if (app.game.used.size >= totalCells()){
      endGame(false);
    }
  }

  function award(to){
    const q = app.game.current;
    if (!q) return;

    if (to === "t1") app.game.teams.t1.score += q.points;
    if (to === "t2") app.game.teams.t2.score += q.points;

    syncScores();
    markUsed();
    app.game.current = null;

    showScreen("game");
    maybeAutoEnd();
  }

  btnAwardT1.addEventListener("click", () => award("t1"));
  btnAwardT2.addEventListener("click", () => award("t2"));
  btnAwardNone.addEventListener("click", () => award("none"));

  btnBackToBoard.addEventListener("click", () => {
    stopTimer();
    app.game.current = null;
    showScreen("game");
  });

  function endGame(askConfirm = true){
    if (!app.game) return;

    if (askConfirm && optConfirmEnd.checked){
      if (!confirm("هل تريد إنهاء اللعبة الآن وإظهار النتيجة؟")) return;
    }

    const t1 = app.game.teams.t1;
    const t2 = app.game.teams.t2;

    resT1Name.textContent = t1.name;
    resT2Name.textContent = t2.name;
    resT1Score.textContent = String(t1.score);
    resT2Score.textContent = String(t2.score);

    if (t1.score > t2.score){
      resultTitle.textContent = `الفائز: ${t1.name}`;
      resultSubtitle.textContent = "تهانينا للفريق الفائز.";
    } else if (t2.score > t1.score){
      resultTitle.textContent = `الفائز: ${t2.name}`;
      resultSubtitle.textContent = "تهانينا للفريق الفائز.";
    } else {
      resultTitle.textContent = "النتيجة: تعادل";
      resultSubtitle.textContent = "تعادل الفريقان في النقاط.";
    }

    showScreen("result");
  }

  // Header buttons
  btnEndGame.addEventListener("click", () => endGame(true));

  btnExitToHome.addEventListener("click", () => {
    if (!confirm("هل تريد الخروج إلى الشاشة الأولى؟ سيتم إنهاء الجولة الحالية دون إظهار نتيجة.")) return;
    stopTimer();
    app.game = null;
    showScreen("home");
  });

  btnNewGame.addEventListener("click", () => {
    app.game = null;
    showScreen("home");
  });

  btnHome.addEventListener("click", () => {
    app.game = null;
    showScreen("home");
  });

  // Start
  btnStart.addEventListener("click", () => {
    if (app.selected.size !== 6) return;

    app.game = buildGame();
    syncHeaderRoundName(app.game.roundName);
    syncTeams();
    syncScores();
    renderBoard();
    showScreen("game");
  });

  // Prefill
  const prefs = loadPrefs();
  if (prefs){
    if (typeof prefs.roundName === "string") roundNameInput.value = prefs.roundName;
    if (typeof prefs.team1 === "string") team1NameInput.value = prefs.team1;
    if (typeof prefs.team2 === "string") team2NameInput.value = prefs.team2;
    if (typeof prefs.optSounds === "boolean") optSounds.checked = prefs.optSounds;
    if (typeof prefs.optConfirmEnd === "boolean") optConfirmEnd.checked = prefs.optConfirmEnd;
  }

  syncHeaderRoundName(roundNameInput.value.trim() || "—");
  renderCategories();
  showScreen("home");
})();