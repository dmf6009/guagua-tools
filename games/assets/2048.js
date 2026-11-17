(function () {
  "use strict";
  var KEY = "gg.2048.v1", BEST = "gg.2048.best.v1", N = 4;
  var $ = function (id) { return document.getElementById(id); };
  var board = $("board"), layer = $("tiles"), msgEl = $("msg"), scoreEl = $("score"), bestEl = $("best");
  var st, prev = null, nextId = 1, best = 0, els = {};
  try { best = +localStorage.getItem(BEST) || 0; } catch (e) {}

  // state: tiles [{id, v, x, y}], score, won (reached 2048 and chose to continue), over
  function empty() {
    var used = {}, out = [];
    st.tiles.forEach(function (t) { used[t.y * N + t.x] = 1; });
    for (var i = 0; i < N * N; i++) if (!used[i]) out.push(i);
    return out;
  }
  function spawn() {
    var e = empty(); if (!e.length) return;
    var i = e[Math.floor(Math.random() * e.length)];
    st.tiles.push({ id: nextId++, v: Math.random() < 0.9 ? 2 : 4, x: i % N, y: Math.floor(i / N), fresh: true });
  }
  function newGame() {
    st = { tiles: [], score: 0, won: false, over: false, max: 0 };
    prev = null; spawn(); spawn(); msg("");
    if (window.GG) GG.reset();
    save(); render();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.tiles) { s.tiles.forEach(function (t) { nextId = Math.max(nextId, t.id + 1); delete t.fresh; delete t.merged; }); return s; } } catch (e) {}
    return null;
  }
  function msg(t, cls) { msgEl.textContent = t; msgEl.className = "msg" + (cls ? " " + cls : ""); }
  function clone(s) { return JSON.parse(JSON.stringify(s)); }

  // ---------- one move ----------
  // dir: 0 up, 1 right, 2 down, 3 left. Returns true if anything moved.
  function slide(s, dir, ghosts) {
    var grid = {}, moved = false, gained = 0;
    s.tiles.forEach(function (t) { grid[t.y * N + t.x] = t; delete t.fresh; delete t.merged; });
    var vertical = dir === 0 || dir === 2, forward = dir === 1 || dir === 2, survivors = [];
    for (var line = 0; line < N; line++) {
      var cells = [];
      for (var k = 0; k < N; k++) {
        var idx = forward ? N - 1 - k : k;
        var x = vertical ? line : idx, y = vertical ? idx : line;
        if (grid[y * N + x]) cells.push(grid[y * N + x]);
      }
      var pos = 0, last = null;
      cells.forEach(function (t) {
        if (last && last.v === t.v && !last.merged) {
          last.v *= 2; last.merged = true; gained += last.v; moved = true;
          if (ghosts) ghosts.push({ id: t.id, v: t.v / 1, x: last.x, y: last.y });
          return;
        }
        var p = forward ? N - 1 - pos : pos, nx = vertical ? line : p, ny = vertical ? p : line;
        if (t.x !== nx || t.y !== ny) moved = true;
        t.x = nx; t.y = ny; pos++; last = t; survivors.push(t);
      });
    }
    s.tiles = survivors; s.score += gained;
    s.tiles.forEach(function (t) { if (t.v > s.max) s.max = t.v; });
    return moved;
  }
  function canMove(s) {
    if (s.tiles.length < N * N) return true;
    for (var d = 0; d < 4; d++) if (slide(clone(s), d)) return true;
    return false;
  }
  function move(dir) {
    if (st.over) return;
    var before = clone(st), ghosts = [];
    if (!slide(st, dir, ghosts)) return;
    prev = before;
    spawn();
    if (st.score > best) { best = st.score; try { localStorage.setItem(BEST, best); } catch (e) {} }
    var reached = st.tiles.some(function (t) { return t.v >= 2048; });
    if (reached && !st.won) {
      st.won = true;
      msg("You made 2048! Keep going for a bigger tile, or start a new game.", "win");
      if (window.GG) GG.done({ share: shareText() });
    } else if (!canMove(st)) {
      st.over = true;
      msg("No moves left. Final score " + st.score + ".", st.won ? "win" : "lose");
      if (window.GG) GG.done({ share: shareText() });
    } else if (!st.won) msg("");
    save(); render(ghosts);
  }
  function shareText() {
    return "I scored " + st.score + " in 2048, with a best tile of " + st.max + ".\n" + location.origin + location.pathname;
  }
  function undo() {
    if (!prev) return;
    st = prev; prev = null; st.over = false; msg("");
    if (window.GG) GG.reset();
    save(); render();
  }

  // ---------- rendering ----------
  // Tiles keep their DOM element between moves so position changes animate.
  function place(el, x, y) { el.style.setProperty("--x", x); el.style.setProperty("--y", y); }
  function render(ghosts) {
    var keep = {};
    st.tiles.forEach(function (t) {
      var el = els[t.id];
      if (!el) { el = els[t.id] = document.createElement("div"); layer.appendChild(el); }
      el.className = "tile t" + Math.min(t.v, 4096) + (t.fresh ? " new" : "") + (t.merged ? " pop" : "") + (t.v >= 1024 ? " small" : "") + (t.v >= 16384 ? " tiny" : "");
      el.textContent = t.v;
      place(el, t.x, t.y);
      keep[t.id] = 1;
    });
    (ghosts || []).forEach(function (g) {     // a tile absorbed by a merge slides into place, then disappears
      var el = els[g.id]; if (!el) return;
      place(el, g.x, g.y); el.style.zIndex = 0; keep[g.id] = 1;
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); delete els[g.id]; }, 120);
    });
    Object.keys(els).forEach(function (id) { if (!keep[id]) { var el = els[id]; if (el.parentNode) el.parentNode.removeChild(el); delete els[id]; } });
    scoreEl.textContent = st.score; bestEl.textContent = best;
    $("undo").disabled = !prev;
    board.setAttribute("aria-label", "2048 board. " + st.tiles.map(function (t) { return t.v; }).sort(function (a, b) { return b - a; }).slice(0, 3).join(", ") + " are the largest tiles. Score " + st.score + ".");
  }

  // ---------- input ----------
  var KEYS = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, w: 0, d: 1, s: 2, a: 3, W: 0, D: 1, S: 2, A: 3 };
  document.addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest("input, textarea, .g-header, .article, .g-footer")) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (KEYS[e.key] != null) { e.preventDefault(); move(KEYS[e.key]); }
  });
  var start = null;
  board.addEventListener("pointerdown", function (e) { start = { x: e.clientX, y: e.clientY, id: e.pointerId }; try { board.setPointerCapture(e.pointerId); } catch (err) {} });
  board.addEventListener("pointerup", function (e) {
    if (!start || e.pointerId !== start.id) return;
    var dx = e.clientX - start.x, dy = e.clientY - start.y; start = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
  });
  board.addEventListener("pointercancel", function () { start = null; });
  $("new").addEventListener("click", newGame);
  $("undo").addEventListener("click", undo);

  st = load();
  if (st) {
    render();
    if (st.over) { msg("No moves left. Final score " + st.score + ".", "lose"); if (window.GG) GG.done({ share: shareText() }); }
    else if (st.won) msg("You made 2048! Keep going for a bigger tile.", "win");
  } else newGame();
  window.__g2048 = { state: function () { return st; }, move: move, slide: slide, canMove: canMove,
    set: function (s) { st = s; prev = null; Object.keys(els).forEach(function (id) { els[id].remove(); delete els[id]; }); save(); render(); } };
})();
