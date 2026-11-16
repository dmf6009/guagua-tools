(function () {
  "use strict";
  var C = window.GGCards, KEY = "gg.freecell.v1";
  var $ = function (id) { return document.getElementById(id); };
  var table = $("table"), msgEl = $("msg"), timeEl = $("time"), movesEl = $("moves"), dealEl = $("dealno");
  var st, undoStack = [], timer = null, hintKey = null, els = {};

  // ---------- Microsoft-compatible numbered deals ----------
  // Deal N uses the same linear congruential generator as the Windows FreeCell, so "game #N" matches it.
  function msDeal(n) {
    var seed = n >>> 0, cards = [], k;
    function rnd() { seed = (seed * 214013 + 2531011) % 2147483648; return seed >> 16; }
    for (k = 51; k >= 0; k--) cards.push(k);
    for (k = 0; k < 52; k++) { var j = 51 - rnd() % (52 - k); var t = cards[k]; cards[k] = cards[j]; cards[j] = t; }
    var SUIT = [3, 2, 1, 0];                       // MS order clubs, diamonds, hearts, spades -> our indices
    var tab = [[], [], [], [], [], [], [], []];
    cards.forEach(function (c, i) { tab[i % 8].push({ r: Math.floor(c / 4) + 1, s: SUIT[c % 4] }); });
    return tab;
  }
  function newDeal(n) {
    if (!(n >= 1 && n <= 1000000)) n = 1 + Math.floor(Math.random() * 1000000);
    st = { deal: n, cells: [null, null, null, null], fnd: [[], [], [], []], tab: msDeal(n), moves: 0, seconds: 0, won: false };
    undoStack = []; hintKey = null; hintMove = null; msg("");
    if (window.GG) GG.reset();
    try { window.history.replaceState(null, "", "#" + n); } catch (e) {}
    save(); render(); startTimer();
  }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.tab && s.tab.length === 8 && s.cells) return s; } catch (e) {} return null; }
  function msg(t, cls) { msgEl.textContent = t; msgEl.className = "msg" + (cls ? " " + cls : ""); }
  function startTimer() {
    clearInterval(timer);
    timer = setInterval(function () { if (st && !st.won && st.moves > 0 && !document.hidden) { st.seconds++; timeEl.textContent = C.fmt(st.seconds); } }, 1000);
  }
  function snap() { undoStack.push(JSON.stringify(st)); if (undoStack.length > 500) undoStack.shift(); }
  function undo() {
    if (!undoStack.length) return;
    var keep = st.seconds; st = JSON.parse(undoStack.pop()); st.seconds = keep; st.won = false; hintKey = null; hintMove = null; msg("");
    if (window.GG) GG.reset();
    save(); render();
  }

  // ---------- rules ----------
  function cardAt(src) { return src.p === "c" ? st.cells[src.n] : src.p === "f" ? st.fnd[src.n][st.fnd[src.n].length - 1] : st.tab[src.n][src.i]; }
  function count(src) { return src.p === "t" ? st.tab[src.n].length - src.i : 1; }
  function isRun(col, i) {
    for (var k = i; k < col.length - 1; k++) if (C.red(col[k]) === C.red(col[k + 1]) || col[k].r !== col[k + 1].r + 1) return false;
    return true;
  }
  function capacity(toEmpty) {
    var free = st.cells.filter(function (c) { return !c; }).length;
    var empty = st.tab.filter(function (c) { return !c.length; }).length - (toEmpty ? 1 : 0);
    return (free + 1) * Math.pow(2, Math.max(0, empty));
  }
  function canFnd(c) { return st.fnd[c.s].length === c.r - 1; }
  function legal(src, dst) {
    var card = cardAt(src), n = count(src); if (!card) return false;
    if (src.p === "t" && !isRun(st.tab[src.n], src.i)) return false;
    if (dst.p === "f") return n === 1 && src.p !== "f" && canFnd(card);
    if (dst.p === "c") return n === 1 && src.p !== "c" && !st.cells[dst.n];
    if (src.p === "t" && src.n === dst.n) return false;
    var col = st.tab[dst.n];
    if (!col.length) return n <= capacity(true);
    var top = col[col.length - 1];
    return C.red(top) !== C.red(card) && top.r === card.r + 1 && n <= capacity(false);
  }
  function take(src) {
    if (src.p === "c") { var c = st.cells[src.n]; st.cells[src.n] = null; return [c]; }
    if (src.p === "f") return [st.fnd[src.n].pop()];
    return st.tab[src.n].splice(src.i);
  }
  function put(cards, dst) {
    if (dst.p === "c") { var free = st.cells[dst.n] ? st.cells.indexOf(null) : dst.n; st.cells[free] = cards[0]; }
    else if (dst.p === "f") st.fnd[cards[0].s].push(cards[0]);
    else Array.prototype.push.apply(st.tab[dst.n], cards);
  }
  function move(src, dst) { snap(); put(take(src), dst); st.moves++; autoplay(); after(); }
  // Send cards to the foundations when nothing could ever need them in the tableau.
  function safe(c) {
    if (!canFnd(c)) return false;
    if (c.r <= 2) return true;
    var opp = C.red(c) ? [0, 3] : [1, 2];
    return st.fnd[opp[0]].length >= c.r - 1 && st.fnd[opp[1]].length >= c.r - 1;
  }
  function autoplay() {
    var again = true;
    while (again) {
      again = false;
      for (var k = 0; k < 4; k++) if (st.cells[k] && safe(st.cells[k])) { st.fnd[st.cells[k].s].push(st.cells[k]); st.cells[k] = null; again = true; }
      for (k = 0; k < 8; k++) { var col = st.tab[k]; if (col.length && safe(col[col.length - 1])) { var c = col.pop(); st.fnd[c.s].push(c); again = true; } }
    }
  }
  function after() {
    hintKey = null; hintMove = null;
    if (st.fnd.every(function (f) { return f.length === 13; })) {
      st.won = true; msg("Solved deal #" + st.deal + " in " + st.moves + " moves and " + C.fmt(st.seconds) + ".", "win");
      if (window.GG) GG.done({ share: "I solved FreeCell deal #" + st.deal + " in " + st.moves + " moves.\n" + location.origin + location.pathname + "#" + st.deal });
    } else if (!anyMove()) msg("No moves left. Undo a few moves or try another deal.", "lose");
    else msg("");
    save(); render();
  }
  function sources() {
    var out = [], k, i;
    for (k = 0; k < 4; k++) if (st.cells[k]) out.push({ p: "c", n: k });
    for (k = 0; k < 8; k++) for (i = 0; i < st.tab[k].length; i++) if (isRun(st.tab[k], i)) out.push({ p: "t", n: k, i: i });
    return out;
  }
  function dests() {
    var out = [{ p: "f" }], k;
    for (k = 0; k < 8; k++) out.push({ p: "t", n: k });
    for (k = 0; k < 4; k++) out.push({ p: "c", n: k });
    return out;
  }
  function anyMove() {
    var s = sources(), d = dests();
    for (var a = 0; a < s.length; a++) for (var b = 0; b < d.length; b++) if (legal(s[a], d[b])) return true;
    return false;
  }
  function pointless(src, dst) {
    if (src.p !== "t") return false;
    var col = st.tab[src.n];
    if (dst.p === "t" && !st.tab[dst.n].length && src.i === 0) return true;                 // whole column to an empty column
    if (dst.p === "t" && src.i > 0 && isRun(col, src.i - 1)) return true;                     // run already sits on its parent
    return false;
  }
  function bestDest(src) {
    if (legal(src, { p: "f" })) return { p: "f" };
    var empty = null, k;
    for (k = 0; k < 8; k++) if (legal(src, { p: "t", n: k })) { if (st.tab[k].length) return { p: "t", n: k }; if (empty === null) empty = k; }
    if (empty !== null && !pointless(src, { p: "t", n: empty })) return { p: "t", n: empty };
    if (count(src) === 1 && src.p === "t") for (k = 0; k < 4; k++) if (!st.cells[k]) return { p: "c", n: k };
    return null;
  }
  // Candidate moves in order of preference; the hint takes the first one that leads somewhere new.
  function candidates() {
    var s = sources(), out = [], k, d, free = st.cells.indexOf(null);
    for (k = 0; k < s.length; k++) if (legal(s[k], { p: "f" })) out.push([s[k], { p: "f" }]);
    for (k = 0; k < s.length; k++) for (d = 0; d < 8; d++) if (st.tab[d].length && legal(s[k], { p: "t", n: d }) && !pointless(s[k], { p: "t", n: d })) out.push([s[k], { p: "t", n: d }]);
    for (k = 0; k < s.length; k++) for (d = 0; d < 8; d++) if (!st.tab[d].length && legal(s[k], { p: "t", n: d }) && !pointless(s[k], { p: "t", n: d })) out.push([s[k], { p: "t", n: d }]);
    if (free >= 0) {
      var cols = [];
      for (k = 0; k < 8; k++) if (st.tab[k].length) cols.push(k);
      // first, parking moves that expose a playable card; then the shortest columns, to dig towards an empty one
      cols.sort(function (a, b) { return exposes(b) - exposes(a) || st.tab[a].length - st.tab[b].length; });
      var last = st.cells.filter(function (c) { return !c; }).length === 1;
      cols.forEach(function (c) { if (!last || exposes(c)) out.push([{ p: "t", n: c, i: st.tab[c].length - 1 }, { p: "c", n: free }]); });
    }
    return out;
  }
  function exposes(k) {
    var col = st.tab[k]; if (col.length < 2) return 0;
    var under = col[col.length - 2]; if (canFnd(under)) return 2;
    for (var d = 0; d < 8; d++) { var t = st.tab[d]; if (d !== k && t.length && C.red(t[t.length - 1]) !== C.red(under) && t[t.length - 1].r === under.r + 1) return 1; }
    return 0;
  }
  function posKey(s) { return JSON.stringify([s.tab, s.cells, s.fnd.map(function (f) { return f.length; })]); }
  function findHint() {
    var seen = {}, list = candidates(), k;
    seen[posKey(st)] = 1;
    undoStack.forEach(function (j) { seen[posKey(JSON.parse(j))] = 1; });
    for (k = 0; k < list.length; k++) {
      var real = st;
      st = JSON.parse(JSON.stringify(real));
      put(take(list[k][0]), list[k][1]); autoplay();
      var key = posKey(st);
      st = real;
      if (!seen[key]) return { src: list[k][0], dst: list[k][1] };
    }
    return null;
  }
  var hintMove = null;
  function same(a, b) { return a.p === b.p && a.n === b.n && (a.p !== "t" || a.i === b.i); }

  // ---------- rendering ----------
  function build() {
    var top = '<div class="sol-top t8">';
    for (var k = 0; k < 4; k++) top += '<div class="pile freecell" data-p="c" data-n="' + k + '"></div>';
    for (k = 0; k < 4; k++) top += '<div class="pile fnd" data-p="f" data-n="' + k + '" data-suit="' + C.SUITS[k] + '"></div>';
    top += "</div><div class=\"sol-tab t8\">";
    for (k = 0; k < 8; k++) top += '<div class="col" data-p="t" data-n="' + k + '"><div class="pile"></div></div>';
    table.innerHTML = top + "</div>";
    els.cells = table.querySelectorAll(".freecell"); els.fnd = table.querySelectorAll(".fnd"); els.col = table.querySelectorAll(".col");
  }
  function key(c) { return c.r + "-" + c.s; }
  function tag(el, p, n, i) {
    el.dataset.p = p; el.dataset.n = n; if (i != null) el.dataset.i = i;
    var c = cardAt({ p: p, n: n, i: i });
    if (hintKey && c && key(c) === hintKey) el.classList.add("hint");
  }
  function render() {
    var k, el;
    for (k = 0; k < 4; k++) {
      els.cells[k].innerHTML = "";
      if (st.cells[k]) { el = C.make(st.cells[k]); el.style.top = "0"; tag(el, "c", k); els.cells[k].appendChild(el); }
      els.fnd[k].innerHTML = "";
      var f = st.fnd[k];
      if (f.length) { el = C.make(f[f.length - 1]); el.style.top = "0"; tag(el, "f", k); els.fnd[k].appendChild(el); }
    }
    var max = 0, av = C.avail();
    for (k = 0; k < 8; k++) (function (t) { max = Math.max(max, C.column(els.col[t], st.tab[t], av, function (e, i) { tag(e, "t", t, i); })); })(k);
    for (k = 0; k < 8; k++) els.col[k].style.height = (max + 8) + "px";
    movesEl.textContent = st.moves; timeEl.textContent = C.fmt(st.seconds); dealEl.textContent = "#" + st.deal;
    $("undo").disabled = !undoStack.length;
  }

  C.interact(table, {
    source: function (el) {
      if (st.won || !el.dataset.p) return null;
      var src = { p: el.dataset.p, n: +el.dataset.n, i: el.dataset.i != null ? +el.dataset.i : undefined };
      return src.p === "t" && !isRun(st.tab[src.n], src.i) ? null : src;
    },
    zones: function () {
      var z = [], k;
      for (k = 0; k < 4; k++) { z.push({ el: els.cells[k], dst: { p: "c", n: k } }); z.push({ el: els.fnd[k], dst: { p: "f" } }); }
      for (k = 0; k < 8; k++) z.push({ el: els.col[k], dst: { p: "t", n: k } });
      return z;
    },
    legal: legal, move: move, redraw: render,
    tap: function (src) {
      var d = hintMove && same(hintMove.src, src) ? hintMove.dst : bestDest(src);
      if (d) move(src, d);
      else if (src.p === "t" && count(src) > capacity(false)) msg("Not enough free cells to move " + count(src) + " cards at once.");
    }
  });

  $("new").addEventListener("click", function () { newDeal(); });
  $("restart").addEventListener("click", function () { newDeal(st.deal); });
  $("undo").addEventListener("click", undo);
  $("hint").addEventListener("click", function () {
    if (st.won) return;
    var h = findHint();
    if (h) { hintMove = h; hintKey = key(cardAt(h.src)); msg(""); } else msg(anyMove() ? "No new move to suggest from here. Try undoing a few moves." : "No moves left. Undo or try another deal.");
    render();
  });
  $("pick").addEventListener("submit", function (e) {
    e.preventDefault();
    var n = parseInt($("pickno").value, 10);
    if (n >= 1 && n <= 1000000) newDeal(n); else msg("Enter a deal number from 1 to 1,000,000.");
  });
  document.addEventListener("keydown", function (e) { if (e.target.tagName === "INPUT") return; if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); } });
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(render, 80); });
  window.addEventListener("hashchange", function () { var n = parseInt(location.hash.slice(1), 10); if (n && n !== st.deal) newDeal(n); });

  build();
  var want = parseInt(location.hash.slice(1), 10);
  st = load();
  if (want && (!st || st.deal !== want)) newDeal(want);
  else if (st) { render(); startTimer(); if (st.won) { msg("Solved. Deal a new game when you are ready.", "win"); } }
  else newDeal();
  window.__fc = { state: function () { return st; }, msDeal: msDeal, legal: legal, findHint: function () { var h = findHint(); return h && h.src; }, hint: findHint, capacity: capacity };
})();
