(function () {
  "use strict";
  var C = window.GGCards, KEY = "gg.spider.v1";
  var $ = function (id) { return document.getElementById(id); };
  var table = $("table"), msgEl = $("msg"), timeEl = $("time"), movesEl = $("moves"), scoreEl = $("score");
  var st, undoStack = [], timer = null, hintId = null, els = {};
  var SUITSETS = { 1: [0, 0, 0, 0, 0, 0, 0, 0], 2: [0, 0, 0, 0, 1, 1, 1, 1], 4: [0, 0, 1, 1, 2, 2, 3, 3] };

  function deal(suits) {
    var deck = [], id = 0;
    SUITSETS[suits].forEach(function (s) { for (var r = 1; r <= 13; r++) deck.push({ r: r, s: s, up: false, k: id++ }); });
    for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    st = { suits: suits, tab: [], stock: [], done: [], moves: 0, score: 500, seconds: 0, won: false };
    for (var c = 0; c < 10; c++) {
      var col = deck.splice(0, c < 4 ? 6 : 5);
      col[col.length - 1].up = true;
      st.tab.push(col);
    }
    st.stock = deck;                                // 50 cards = 5 deals of 10
    undoStack = []; hintId = null; msg("");
    if (window.GG) GG.reset();
    save(); render(); startTimer();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.tab && s.tab.length === 10) return s; } catch (e) {} return null; }
  function msg(t, cls) { msgEl.textContent = t; msgEl.className = "msg" + (cls ? " " + cls : ""); }
  function startTimer() {
    clearInterval(timer);
    timer = setInterval(function () { if (st && !st.won && st.moves > 0 && !document.hidden) { st.seconds++; timeEl.textContent = C.fmt(st.seconds); } }, 1000);
  }
  function snap() { undoStack.push(JSON.stringify(st)); if (undoStack.length > 400) undoStack.shift(); }
  function undo() {
    if (!undoStack.length) return;
    var keep = st.seconds; st = JSON.parse(undoStack.pop()); st.seconds = keep; st.won = false; hintId = null; msg("");
    if (window.GG) GG.reset();
    save(); render();
  }

  // ---------- rules ----------
  // A movable run: face up, one suit, descending by one.
  function isRun(col, i) {
    if (!col[i] || !col[i].up) return false;
    for (var k = i; k < col.length - 1; k++) if (col[k].s !== col[k + 1].s || col[k].r !== col[k + 1].r + 1) return false;
    return true;
  }
  function legal(src, dst) {
    if (src.n === dst.n || !isRun(st.tab[src.n], src.i)) return false;
    var col = st.tab[dst.n]; if (!col.length) return true;
    return col[col.length - 1].r === st.tab[src.n][src.i].r + 1;
  }
  function flip(col) { if (col.length && !col[col.length - 1].up) col[col.length - 1].up = true; }
  function collect(n) {                            // remove a finished King-to-Ace run of one suit
    var col = st.tab[n]; if (col.length < 13) return;
    var i = col.length - 13;
    if (col[i].r === 13 && isRun(col, i)) { st.done.push(col[i].s); col.splice(i); st.score += 100; flip(col); }
  }
  function move(src, dst) {
    snap();
    var cards = st.tab[src.n].splice(src.i);
    Array.prototype.push.apply(st.tab[dst.n], cards);
    flip(st.tab[src.n]); collect(dst.n);
    st.moves++; st.score--; after();
  }
  function dealRow() {
    if (st.won || !st.stock.length) return;
    if (st.tab.some(function (c) { return !c.length; })) { msg("Fill every empty column before dealing a new row.", "lose"); return; }
    snap();
    for (var c = 0; c < 10; c++) { var card = st.stock.pop(); card.up = true; st.tab[c].push(card); }
    for (c = 0; c < 10; c++) collect(c);
    st.moves++; st.score--; after();
  }
  function after() {
    hintId = null;
    if (st.done.length === 8) {
      st.won = true;
      var label = st.suits + " suit" + (st.suits > 1 ? "s" : "");
      msg("Solved with a score of " + st.score + " in " + st.moves + " moves.", "win");
      if (window.GG) GG.done({ share: "I won Spider Solitaire (" + label + ") with a score of " + st.score + " in " + st.moves + " moves.\n" + location.origin + location.pathname });
    } else msg("");
    save(); render();
  }
  function pointless(src, dst) {
    var col = st.tab[src.n];
    if (!st.tab[dst.n].length && src.i === 0) return true;                                  // whole column to an empty one
    var under = col[src.i - 1], top = st.tab[dst.n][st.tab[dst.n].length - 1];
    if (under && under.up && under.r === col[src.i].r + 1) {
      if (under.s === col[src.i].s) return true;                                          // already on a same-suit parent
      if (!top || top.s !== col[src.i].s) return true;                                    // no improvement in suit
    }
    return false;
  }
  function score(src, dst) {                       // higher is a better suggestion
    var col = st.tab[src.n], top = st.tab[dst.n][st.tab[dst.n].length - 1], v = 0;
    if (top && top.s === col[src.i].s) v += 4;
    if (src.i > 0 && !col[src.i - 1].up) v += 3;
    if (src.i === 0) v += 2;
    if (!top) v -= 3;
    return v;
  }
  function moves() {
    var out = [];
    for (var a = 0; a < 10; a++) for (var i = 0; i < st.tab[a].length; i++) {
      if (!isRun(st.tab[a], i)) continue;
      for (var b = 0; b < 10; b++) { var s = { n: a, i: i }, d = { n: b }; if (legal(s, d) && !pointless(s, d)) out.push({ src: s, dst: d, v: score(s, d) }); }
    }
    return out.sort(function (x, y) { return y.v - x.v; });
  }
  function bestDest(src) {
    var best = null, bv = -99;
    for (var b = 0; b < 10; b++) {
      var d = { n: b };
      if (!legal(src, d)) continue;
      var v = score(src, d) - (pointless(src, d) ? 10 : 0);
      if (v > bv) { bv = v; best = d; }
    }
    return best;
  }

  // ---------- rendering ----------
  function build() {
    var h = '<div class="sol-top t10"><button type="button" class="pile stock" id="stock" aria-label="Deal a new row"></button><div class="stock-count" id="stockcount"></div>';
    for (var k = 0; k < 8; k++) h += '<div class="pile fnd done-slot"></div>';
    h += '</div><div class="sol-tab t10">';
    for (k = 0; k < 10; k++) h += '<div class="col" data-n="' + k + '"><div class="pile"></div></div>';
    table.innerHTML = h + "</div>";
    els.stock = $("stock"); els.count = $("stockcount"); els.done = table.querySelectorAll(".done-slot"); els.col = table.querySelectorAll(".col");
    els.stock.addEventListener("click", dealRow);
  }
  function render() {
    var k, el, rows = st.stock.length / 10;
    els.stock.innerHTML = ""; els.stock.classList.toggle("empty", !rows);
    if (rows) { el = C.make({ up: false }); el.style.top = "0"; el.style.pointerEvents = "none"; els.stock.appendChild(el); }
    els.count.textContent = rows ? rows + " deal" + (rows > 1 ? "s" : "") + " left" : "";
    els.stock.setAttribute("aria-label", rows ? "Deal a new row, " + rows + " left" : "No deals left");
    for (k = 0; k < 8; k++) {
      els.done[k].innerHTML = "";
      if (st.done[k] != null) { el = C.make({ r: 13, s: st.done[k] }); el.style.top = "0"; el.tabIndex = -1; els.done[k].appendChild(el); }
    }
    var max = 0, av = C.avail();
    for (k = 0; k < 10; k++) (function (t) {
      max = Math.max(max, C.column(els.col[t], st.tab[t], av, function (e, i) {
        e.dataset.n = t; e.dataset.i = i;
        if (hintId !== null && st.tab[t][i].k === hintId) e.classList.add("hint");
      }));
    })(k);
    for (k = 0; k < 10; k++) els.col[k].style.height = (max + 8) + "px";
    movesEl.textContent = st.moves; scoreEl.textContent = st.score; timeEl.textContent = C.fmt(st.seconds);
    $("undo").disabled = !undoStack.length;
    Array.prototype.forEach.call(document.querySelectorAll("#suits button"), function (b) { b.setAttribute("aria-pressed", +b.dataset.suits === st.suits); });
  }

  C.interact(table, {
    source: function (el) {
      if (st.won || el.dataset.i == null || !el.parentNode.classList.contains("col")) return null;
      var src = { n: +el.dataset.n, i: +el.dataset.i };
      return isRun(st.tab[src.n], src.i) ? src : null;
    },
    zones: function () { var z = []; for (var k = 0; k < 10; k++) z.push({ el: els.col[k], dst: { n: k } }); return z; },
    legal: legal, move: move, redraw: render,
    tap: function (src) { var d = bestDest(src); if (d) move(src, d); }
  });

  $("new").addEventListener("click", function () { deal(st.suits); });
  $("undo").addEventListener("click", undo);
  $("hint").addEventListener("click", function () {
    if (st.won) return;
    var m = moves();
    if (m.length) { var c = st.tab[m[0].src.n][m[0].src.i]; hintId = c.k; msg(""); }
    else { hintId = null; msg(st.stock.length ? "No useful move on the table. Deal a new row." : "No moves left. Undo or start a new game.", st.stock.length ? "" : "lose"); }
    render();
  });
  $("suits").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b && +b.dataset.suits !== st.suits) deal(+b.dataset.suits); });
  document.addEventListener("keydown", function (e) { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); } });
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(render, 80); });

  build();
  st = load();
  if (st) { render(); startTimer(); if (st.won) msg("Solved. Deal a new game when you are ready.", "win"); } else deal(1);
  window.__spider = { state: function () { return st; }, legal: legal, isRun: isRun, moves: moves };
})();
