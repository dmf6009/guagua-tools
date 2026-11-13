(function () {
  "use strict";
  var KEY = "gg.sudoku.v1";
  var CLUES = { easy: 40, medium: 33, hard: 28, expert: 24 };
  var $ = function (id) { return document.getElementById(id); };
  var gridEl = $("grid"), padEl = $("pad"), msgEl = $("msg"), timeEl = $("time"), errEl = $("errors");
  var st = null, sel = -1, notesMode = false, timer = null;

  // ---------- solver / generator ----------
  var ROW = [], COL = [], BOX = [], PEERS = [];
  for (var i = 0; i < 81; i++) { ROW[i] = Math.floor(i / 9); COL[i] = i % 9; BOX[i] = Math.floor(ROW[i] / 3) * 3 + Math.floor(COL[i] / 3); }
  for (i = 0; i < 81; i++) { PEERS[i] = []; for (var j = 0; j < 81; j++) if (j !== i && (ROW[i] === ROW[j] || COL[i] === COL[j] || BOX[i] === BOX[j])) PEERS[i].push(j); }
  function bits(n) { var c = 0; while (n) { n &= n - 1; c++; } return c; }
  function shuffle(a) { for (var k = a.length - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)); var t = a[k]; a[k] = a[r]; a[r] = t; } return a; }

  // Counts solutions up to `limit`. If `out` is given, the first solution is written into it.
  function solve(g, limit, out, randomize) {
    var rows = new Array(9).fill(0), cols = new Array(9).fill(0), boxes = new Array(9).fill(0), k;
    for (k = 0; k < 81; k++) if (g[k]) { var b = 1 << g[k]; rows[ROW[k]] |= b; cols[COL[k]] |= b; boxes[BOX[k]] |= b; }
    var count = 0;
    (function rec() {
      var best = -1, bestMask = 0, bestN = 10;
      for (var c = 0; c < 81; c++) {
        if (g[c]) continue;
        var m = 0x3fe & ~(rows[ROW[c]] | cols[COL[c]] | boxes[BOX[c]]), n = bits(m);
        if (n === 0) return;
        if (n < bestN) { bestN = n; best = c; bestMask = m; if (n === 1) break; }
      }
      if (best < 0) { count++; if (out && count === 1) for (var q = 0; q < 81; q++) out[q] = g[q]; return; }
      var ds = []; for (var d = 1; d <= 9; d++) if (bestMask & (1 << d)) ds.push(d);
      if (randomize) shuffle(ds);
      for (var x = 0; x < ds.length && count < limit; x++) {
        var v = ds[x], bit = 1 << v;
        g[best] = v; rows[ROW[best]] |= bit; cols[COL[best]] |= bit; boxes[BOX[best]] |= bit;
        rec();
        g[best] = 0; rows[ROW[best]] &= ~bit; cols[COL[best]] &= ~bit; boxes[BOX[best]] &= ~bit;
      }
    })();
    return count;
  }
  function generate(level) {
    var sol = new Array(81).fill(0);
    solve(new Array(81).fill(0), 1, sol, true);
    var puz = sol.slice(), order = shuffle(Array.from({ length: 81 }, function (_, n) { return n; })), clues = 81, target = CLUES[level];
    for (var k = 0; k < 81 && clues > target; k++) {
      var c = order[k], keep = puz[c];
      puz[c] = 0;
      if (solve(puz.slice(), 2) !== 1) puz[c] = keep; else clues--;
    }
    return { puzzle: puz, solution: sol };
  }

  // ---------- state ----------
  function newGame(level) {
    var g = generate(level);
    st = { level: level, puzzle: g.puzzle, solution: g.solution, values: g.puzzle.slice(), notes: new Array(81).fill(0), seconds: 0, errors: 0, hints: 0, history: [], done: false };
    sel = st.puzzle.indexOf(0);
    save(); render(); startTimer();
    msg("");
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.puzzle && s.puzzle.length === 81 && s.solution) return s; } catch (e) {} return null; }
  function msg(t, cls) { msgEl.textContent = t; msgEl.className = "msg" + (cls ? " " + cls : ""); }
  function fmt(s) { var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r; }
  function startTimer() {
    clearInterval(timer);
    timer = setInterval(function () { if (st && !st.done && !document.hidden) { st.seconds++; timeEl.textContent = fmt(st.seconds); if (st.seconds % 5 === 0) save(); } }, 1000);
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
  function finish() {
    if (st.values.every(function (v, c) { return v === st.solution[c]; })) {
      st.done = true; sel = -1;
      msg("Solved in " + fmt(st.seconds) + " with " + st.errors + " mistake" + (st.errors === 1 ? "" : "s") + (st.hints ? " and " + st.hints + " hint" + (st.hints === 1 ? "" : "s") : "") + ".", "win");
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
  $("new").addEventListener("click", function () { newGame(st.level); });
  $("levels").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) newGame(b.dataset.level); });
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); } return; }
    if (e.target.closest && e.target.closest(".g-header, .article, .g-footer")) return;
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
  if (st) { sel = st.done ? -1 : st.values.findIndex(function (v, c) { return v !== st.solution[c]; }); render(); startTimer(); if (st.done) msg("Solved. Start a new puzzle when you are ready.", "win"); }
  else newGame("easy");
  window.__sudoku = { solve: solve, generate: generate, state: function () { return st; } };
})();
