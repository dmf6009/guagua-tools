(function () {
  "use strict";
  // Page configuration, set inline by the page before this script:
  //   window.GG_SUDOKU = { mode: "free" }                      level picker, new puzzle on demand
  //   window.GG_SUDOKU = { mode: "level", level: "hard" }     fixed difficulty
  //   window.GG_SUDOKU = { mode: "daily" }                    one shared puzzle per calendar day
  var CFG = window.GG_SUDOKU || { mode: "free" };
  var MODE = CFG.mode || "free";
  var KEY = MODE === "level" ? "gg.sudoku.v1." + CFG.level : "gg.sudoku.v1";
  var LABEL = { easy: "Easy", medium: "Medium", hard: "Hard", expert: "Expert" };
  var DAILY_LEVEL = ["expert", "easy", "easy", "medium", "medium", "hard", "hard"];   // by weekday, Sunday first
  var DAILY_EPOCH = Date.UTC(2026, 0, 1);                                                // puzzle #1 = 1 Jan 2026
  var $ = function (id) { return document.getElementById(id); };
  var gridEl = $("grid"), padEl = $("pad"), msgEl = $("msg"), timeEl = $("time"), errEl = $("errors");
  var st = null, sel = -1, notesMode = false, timer = null;

  var Core = window.SudokuCore, solve = Core.solve, generate = Core.generate;
  var ROW = Core.ROW, COL = Core.COL, BOX = Core.BOX, PEERS = Core.PEERS;

  // ---------- daily puzzle ----------
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function dailyInfo(dateStr) {
    var p = dateStr.split("-").map(Number), utc = Date.UTC(p[0], p[1] - 1, p[2]);
    return { date: dateStr, number: Math.round((utc - DAILY_EPOCH) / 864e5) + 1, level: DAILY_LEVEL[new Date(utc).getUTCDay()], seed: p[0] * 10000 + p[1] * 100 + p[2] };
  }
  function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  // The daily page plays today's puzzle, or a past one when the URL says ?d=YYYY-MM-DD.
  var PLAY_DATE = today(), ARCHIVE = false;
  if (MODE === "daily") {
    var want = new URLSearchParams(location.search).get("d");
    if (want && /^\d{4}-\d{2}-\d{2}$/.test(want) && want >= "2026-01-01" && want < today() && !isNaN(Date.parse(want))) { PLAY_DATE = want; ARCHIVE = true; }
    KEY = "gg.sudoku.daily.v1" + (ARCHIVE ? "." + PLAY_DATE : "");
  }
  var DONE_KEY = "gg.sudoku.daily.done.v1";
  function doneLog() { try { return JSON.parse(localStorage.getItem(DONE_KEY)) || {}; } catch (e) { return {}; } }
  function streak(log) {
    var n = 0, d = new Date();
    var onTime = function (k) { return log[k] && !log[k].late; };
    if (!onTime(today())) d.setDate(d.getDate() - 1);         // today not yet solved: count up to yesterday
    for (;;) {
      var k = ymd(d);
      if (!onTime(k)) return n;
      n++; d.setDate(d.getDate() - 1);
    }
  }
  function renderDaily() {
    if (MODE !== "daily") return;
    var log = doneLog(), info = dailyInfo(st.date);
    if ($("dnum")) $("dnum").textContent = "#" + info.number;
    if ($("dlevel")) $("dlevel").textContent = LABEL[info.level];
    if ($("dstreak")) $("dstreak").textContent = streak(log);
    if ($("dsolved")) $("dsolved").textContent = Object.keys(log).length;
    var note = $("darchive");
    if (note) { note.hidden = !ARCHIVE; if (ARCHIVE) note.innerHTML = "Playing " + nice(PLAY_DATE) + ' · <a href="daily-sudoku">Back to today</a>'; }
    renderArchive(log);
  }
  function nice(dateStr) {
    var p = dateStr.split("-").map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2])).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  }
  var archiveDrawn = "";
  function renderArchive(log) {
    var list = $("archive-list"); if (!list) return;
    var d = new Date(), rows = [], sig = JSON.stringify(log) + PLAY_DATE;
    if (sig === archiveDrawn) return;
    archiveDrawn = sig;
    for (var n = 0; n < 30; n++) {
      var k = ymd(d); if (k < "2026-01-01") break;
      var info = dailyInfo(k), done = log[k], status;
      if (done) status = '<span class="ok">✓ ' + fmt(done.s || 0) + "</span>";
      else {
        var saved = null;
        try { saved = JSON.parse(localStorage.getItem("gg.sudoku.daily.v1" + (n ? "." + k : ""))); } catch (e) {}
        status = saved && saved.date === k && !saved.done ? "In progress" : "Not played";
      }
      var href = n ? "daily-sudoku?d=" + k : "daily-sudoku";
      rows.push('<li' + (k === PLAY_DATE ? ' class="cur"' : "") + '><a href="' + href + '">' + (n ? nice(k) : "Today") + "</a><span>#" + info.number + " · " + LABEL[info.level] + "</span><span>" + status + "</span></li>");
      d.setDate(d.getDate() - 1);
    }
    list.innerHTML = rows.join("");
  }

  // ---------- state ----------
  function newGame(level) {
    var g, extra = {};
    if (MODE === "daily") {
      var info = dailyInfo(PLAY_DATE);
      level = info.level; g = generate(level, info.seed); extra = { date: info.date };
    } else g = generate(level);
    st = { level: level, puzzle: g.puzzle, solution: g.solution, values: g.puzzle.slice(), notes: new Array(81).fill(0), seconds: 0, errors: 0, hints: 0, history: [], done: false };
    for (var k in extra) st[k] = extra[k];
    sel = st.puzzle.indexOf(0);
    save(); render(); startTimer();
    msg("");
    if (window.GG) GG.reset();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.puzzle && s.puzzle.length === 81 && s.solution) return s; } catch (e) {} return null; }
  function msg(t, cls) { msgEl.textContent = t; msgEl.className = "msg" + (cls ? " " + cls : ""); }
  function fmt(s) { var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r; }
  function startTimer() {
    clearInterval(timer);
    timer = setInterval(function () {
      if (MODE === "daily" && !ARCHIVE && st && st.date !== today()) { PLAY_DATE = today(); newGame(); return; }   // rolled over midnight
      if (st && !st.done && !document.hidden) { st.seconds++; timeEl.textContent = fmt(st.seconds); if (st.seconds % 5 === 0) save(); }
    }, 1000);
  }

  // ---------- rendering ----------
  var cells = [];
  function build() {
    for (var c = 0; c < 81; c++) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "cell"; b.dataset.i = c; b.tabIndex = c === 0 ? 0 : -1;
      gridEl.appendChild(b); cells.push(b);
    }
    for (var d = 1; d <= 9; d++) {
      var p = document.createElement("button");
      p.type = "button"; p.dataset.n = d; p.innerHTML = d + "<small></small>"; p.setAttribute("aria-label", "Enter " + d);
      padEl.appendChild(p);
    }
  }
  function render() {
    var selVal = sel >= 0 ? st.values[sel] : 0, left = new Array(10).fill(9);
    for (var c = 0; c < 81; c++) {
      var el = cells[c], v = st.values[c], cls = "cell";
      if (v) left[v]--;
      if (st.puzzle[c]) cls += " given"; else if (v) cls += " user";
      if (v && !st.puzzle[c] && v !== st.solution[c]) cls += " bad";
      if (sel >= 0 && c !== sel && (ROW[c] === ROW[sel] || COL[c] === COL[sel] || BOX[c] === BOX[sel])) cls += " peer";
      if (selVal && v === selVal && c !== sel) cls += " same";
      if (c === sel) cls += " sel";
      el.className = cls; el.tabIndex = c === sel ? 0 : -1;
      if (v) el.textContent = v;
      else if (st.notes[c]) {
        var h = '<span class="sdk-notes">';
        for (var d = 1; d <= 9; d++) h += "<span>" + (st.notes[c] & (1 << d) ? d : "") + "</span>";
        el.innerHTML = h + "</span>";
      } else el.textContent = "";
      el.setAttribute("aria-label", "Row " + (ROW[c] + 1) + ", column " + (COL[c] + 1) + ", " + (v ? v + (st.puzzle[c] ? " given" : "") : "empty"));
    }
    Array.prototype.forEach.call(padEl.children, function (p) {
      var n = +p.dataset.n; p.classList.toggle("done", left[n] <= 0); p.querySelector("small").textContent = left[n] > 0 ? left[n] : "";
    });
    timeEl.textContent = fmt(st.seconds); errEl.textContent = st.errors;
    $("notes").setAttribute("aria-pressed", notesMode);
    $("undo").disabled = !st.history.length || st.done;
    Array.prototype.forEach.call(document.querySelectorAll("#levels button"), function (b) { b.setAttribute("aria-pressed", b.dataset.level === st.level); });
    renderDaily();
  }

  // ---------- actions ----------
  function push(c) { st.history.push([c, st.values[c], st.notes[c]]); if (st.history.length > 300) st.history.shift(); }
  function enter(n) {
    if (st.done || sel < 0 || st.puzzle[sel]) return;
    if (notesMode && n) {
      if (st.values[sel]) return;
      push(sel); st.notes[sel] ^= 1 << n;
    } else {
      if (st.values[sel] === n) return;
      push(sel); st.values[sel] = n; st.notes[sel] = 0;
      if (n) {
        if (n !== st.solution[sel]) st.errors++;
        else PEERS[sel].forEach(function (p) { st.notes[p] &= ~(1 << n); });
      }
    }
    finish();
  }
  function summary() {
    return "in " + fmt(st.seconds) + " with " + st.errors + " mistake" + (st.errors === 1 ? "" : "s") +
      (st.hints ? " and " + st.hints + " hint" + (st.hints === 1 ? "" : "s") : "");
  }
  function shareText() {
    if (MODE === "daily") {
      var info = dailyInfo(st.date);
      return "Guagua Daily Sudoku #" + info.number + " (" + LABEL[st.level] + ")\nSolved " + summary() + (st.errors || st.hints ? "" : " ✅") +
        (ARCHIVE ? "" : "\nStreak: " + streak(doneLog()) + " day" + (streak(doneLog()) === 1 ? "" : "s")) + "\n" + location.origin + location.pathname + (ARCHIVE ? "?d=" + PLAY_DATE : "");
    }
    return "I solved a " + LABEL[st.level] + " Sudoku " + summary() + ".\n" + location.origin + location.pathname;
  }
  function finish() {
    if (st.values.every(function (v, c) { return v === st.solution[c]; })) {
      var first = !st.done;
      st.done = true; sel = -1;
      if (MODE === "daily" && first) {
        var log = doneLog(); log[st.date] = { s: st.seconds, e: st.errors, h: st.hints };
        if (ARCHIVE) log[st.date].late = true;
        try { localStorage.setItem(DONE_KEY, JSON.stringify(log)); } catch (e) {}
      }
      msg("Solved " + summary() + "." + (MODE === "daily" ? (ARCHIVE ? " Pick another day from the list below." : " A new daily puzzle appears at midnight.") : ""), "win");
      if (window.GG) GG.done({ share: shareText() });
    }
    save(); render();
  }
  function undo() {
    var h = st.history.pop(); if (!h || st.done) return;
    st.values[h[0]] = h[1]; st.notes[h[0]] = h[2]; sel = h[0]; save(); render();
  }
  function hint() {
    if (st.done) return;
    var c = sel >= 0 && !st.puzzle[sel] && st.values[sel] !== st.solution[sel] ? sel : -1;
    if (c < 0) { var open = []; for (var k = 0; k < 81; k++) if (st.values[k] !== st.solution[k]) open.push(k); if (!open.length) return; c = open[Math.floor(Math.random() * open.length)]; }
    push(c); st.values[c] = st.solution[c]; st.notes[c] = 0; st.hints++; sel = c;
    PEERS[c].forEach(function (p) { st.notes[p] &= ~(1 << st.solution[c]); });
    finish();
  }
  function select(c, focus) { sel = c; render(); if (focus) cells[c].focus(); }

  // ---------- events ----------
  gridEl.addEventListener("click", function (e) { var b = e.target.closest(".cell"); if (b && !st.done) select(+b.dataset.i); });
  padEl.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) enter(+b.dataset.n); });
  $("erase").addEventListener("click", function () { enter(0); });
  $("undo").addEventListener("click", undo);
  $("hint").addEventListener("click", hint);
  $("notes").addEventListener("click", function () { notesMode = !notesMode; render(); });
  if ($("new")) $("new").addEventListener("click", function () { newGame(st.level); });
  if ($("levels")) $("levels").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) newGame(b.dataset.level); });
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); } return; }
    if (e.target.closest && e.target.closest(".g-header, .article, .g-footer, .after, input, textarea")) return;
    if (/^[1-9]$/.test(e.key)) { enter(+e.key); e.preventDefault(); }
    else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") { enter(0); e.preventDefault(); }
    else if (e.key === "n" || e.key === "N") { notesMode = !notesMode; render(); }
    else if (e.key.indexOf("Arrow") === 0 && !st.done) {
      var c = sel < 0 ? 0 : sel;
      if (e.key === "ArrowUp") c = (c + 72) % 81; else if (e.key === "ArrowDown") c = (c + 9) % 81;
      else if (e.key === "ArrowLeft") c = ROW[c] * 9 + (COL[c] + 8) % 9; else c = ROW[c] * 9 + (COL[c] + 1) % 9;
      select(c, true); e.preventDefault();
    }
  });

  build();
  st = load();
  if (st && MODE === "daily" && st.date !== PLAY_DATE) st = null;          // a different day's puzzle: start this one
  if (st && MODE === "level" && st.level !== CFG.level) st = null;
  if (st) {
    sel = st.done ? -1 : st.values.findIndex(function (v, c) { return v !== st.solution[c]; });
    render(); startTimer();
    if (st.done) {
      msg(MODE === "daily" ? (ARCHIVE ? "You solved this puzzle " + summary() + ". Pick another day from the list below." : "You solved today's puzzle " + summary() + ". Come back tomorrow for the next one.") : "Solved. Start a new puzzle when you are ready.", "win");
      if (window.GG) GG.done({ share: shareText() });
    }
  } else newGame(MODE === "level" ? CFG.level : "easy");
  window.__sudoku = { solve: solve, generate: generate, dailyInfo: dailyInfo, state: function () { return st; } };
})();
