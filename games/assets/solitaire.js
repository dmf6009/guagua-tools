(function () {
  "use strict";
  var KEY = "gg.klondike.v1";
  var SUITS = ["♠", "♥", "♦", "♣"], RANKS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var NAMES = ["spades", "hearts", "diamonds", "clubs"];
  var $ = function (id) { return document.getElementById(id); };
  var table = $("table"), msgEl = $("msg"), timeEl = $("time"), movesEl = $("moves");
  var st, history = [], timer = null, hintId = null;
  var red = function (c) { return c.s === 1 || c.s === 2; };
  var id = function (c) { return c.r + "-" + c.s; };

  function deal(draw) {
    var deck = [];
    for (var s = 0; s < 4; s++) for (var r = 1; r <= 13; r++) deck.push({ r: r, s: s, up: false });
    for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    st = { draw: draw, stock: [], waste: [], fnd: [[], [], [], []], tab: [[], [], [], [], [], [], []], moves: 0, seconds: 0, won: false };
    for (var c = 0; c < 7; c++) for (var k = 0; k <= c; k++) { var card = deck.pop(); card.up = k === c; st.tab[c].push(card); }
    st.stock = deck; history = []; hintId = null;
    msg(""); save(); render(); startTimer();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.tab && s.tab.length === 7 && s.fnd) return s; } catch (e) {} return null; }
  function snap() { history.push(JSON.stringify(st)); if (history.length > 400) history.shift(); }
  function msg(t, cls) { msgEl.textContent = t; msgEl.className = "msg" + (cls ? " " + cls : ""); }
  function fmt(s) { var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r; }
  function startTimer() {
    clearInterval(timer);
    timer = setInterval(function () { if (st && !st.won && st.moves > 0 && !document.hidden) { st.seconds++; timeEl.textContent = fmt(st.seconds); } }, 1000);
  }

  // ---------- rules ----------
  function canFnd(card) { var f = st.fnd[card.s]; return f.length === card.r - 1; }
  function canTab(card, t) {
    var col = st.tab[t]; if (!col.length) return card.r === 13;
    var top = col[col.length - 1]; return top.up && red(top) !== red(card) && top.r === card.r + 1;
  }
  function pileOf(src) { return src.p === "w" ? st.waste : src.p === "f" ? st.fnd[src.n] : st.tab[src.n]; }
  // src: {p:'w'|'f'|'t', n, i}  dst: {p:'f'|'t', n}
  function legal(src, dst) {
    var pile = pileOf(src), card = pile[src.i]; if (!card || !card.up) return false;
    var count = pile.length - src.i;
    if (dst.p === "f") return count === 1 && src.p !== "f" && canFnd(card);
    if (src.p === "t" && src.n === dst.n) return false;
    return canTab(card, dst.n);
  }
  function move(src, dst) {
    snap();
    var pile = pileOf(src), cards = pile.splice(src.i), target = dst.p === "f" ? st.fnd[cards[0].s] : st.tab[dst.n];
    Array.prototype.push.apply(target, cards);
    if (src.p === "t" && pile.length && !pile[pile.length - 1].up) pile[pile.length - 1].up = true;
    after();
  }
  function after() {
    st.moves++; hintId = null;
    if (st.fnd.every(function (f) { return f.length === 13; })) { st.won = true; msg("Solved in " + st.moves + " moves and " + fmt(st.seconds) + ".", "win"); }
    else msg("");
    save(); render();
  }
  function drawStock() {
    if (st.won) return;
    if (!st.stock.length && !st.waste.length) return;
    snap();
    if (!st.stock.length) { while (st.waste.length) { var c = st.waste.pop(); c.up = false; st.stock.push(c); } }
    else for (var k = 0; k < st.draw && st.stock.length; k++) { var d = st.stock.pop(); d.up = true; st.waste.push(d); }
    after();
  }
  function undo() {
    if (!history.length) return;
    var keep = st.seconds; st = JSON.parse(history.pop()); st.seconds = keep; st.won = false; hintId = null; msg(""); save(); render();
  }
  function bestDest(src) {
    if (legal(src, { p: "f" })) return { p: "f" };
    var empty = null;
    for (var t = 0; t < 7; t++) if (legal(src, { p: "t", n: t })) { if (st.tab[t].length) return { p: "t", n: t }; if (empty === null) empty = t; }
    // moving a king that already sits at the bottom of a column to another empty column is pointless
    if (empty !== null && !(src.p === "t" && src.i === 0)) return { p: "t", n: empty };
    return null;
  }
  function sources() {
    var out = [];
    if (st.waste.length) out.push({ p: "w", n: 0, i: st.waste.length - 1 });
    for (var t = 0; t < 7; t++) for (var i = 0; i < st.tab[t].length; i++) if (st.tab[t][i].up) out.push({ p: "t", n: t, i: i });
    return out;
  }
  function findHint() {
    var all = sources(), k, d;
    for (k = 0; k < all.length; k++) if (legal(all[k], { p: "f" })) return all[k];
    for (k = 0; k < all.length; k++) {       // moves that uncover a face-down card or empty a column usefully
      var s = all[k]; if (s.p !== "t") continue;
      if (s.i > 0 && st.tab[s.n][s.i - 1].up) continue;
      d = bestDest(s); if (d) return s;
    }
    for (k = 0; k < all.length; k++) if (all[k].p === "w" && bestDest(all[k])) return all[k];
    return null;
  }
  function canAuto() {
    return !st.won && !st.stock.length && !st.waste.length && st.tab.every(function (c) { return c.every(function (x) { return x.up; }); });
  }
  function autoFinish() {
    if (!canAuto()) return;
    snap();
    var guard = 0;
    while (guard++ < 60) {
      var done = false;
      for (var t = 0; t < 7; t++) { var col = st.tab[t]; if (col.length && canFnd(col[col.length - 1])) { var c = col.pop(); st.fnd[c.s].push(c); st.moves++; done = true; } }
      if (!done) break;
    }
    st.moves--; after();
  }

  // ---------- rendering ----------
  var els = {};
  function cardEl(c) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "card" + (c.up ? (red(c) ? " red" : "") : " down");
    if (c.up) {
      b.innerHTML = '<span class="ix">' + RANKS[c.r] + "<span>" + SUITS[c.s] + '</span></span><span class="big">' + SUITS[c.s] + "</span>";
      b.setAttribute("aria-label", RANKS[c.r] + " of " + NAMES[c.s]);
    } else { b.setAttribute("aria-label", "Face-down card"); b.tabIndex = -1; }
    return b;
  }
  function build() {
    table.innerHTML = '<div class="sol-top"><button type="button" class="pile stock" id="stock" aria-label="Stock: draw cards"></button><div class="pile waste-fan" id="waste"></div><div></div>' +
      [0, 1, 2, 3].map(function (s) { return '<div class="pile fnd" data-p="f" data-n="' + s + '" data-suit="' + SUITS[s] + '"></div>'; }).join("") +
      '</div><div class="sol-tab">' + [0, 1, 2, 3, 4, 5, 6].map(function (t) { return '<div class="col" data-p="t" data-n="' + t + '"><div class="pile"></div></div>'; }).join("") + "</div>";
    els.stock = $("stock"); els.waste = $("waste");
    els.fnd = table.querySelectorAll(".fnd"); els.col = table.querySelectorAll(".col");
    els.stock.addEventListener("click", drawStock);
  }
  function render() {
    var k, el, c;
    // stock
    els.stock.innerHTML = ""; els.stock.classList.toggle("empty", !st.stock.length);
    if (st.stock.length) { el = cardEl({ up: false }); el.style.top = "0"; el.style.pointerEvents = "none"; els.stock.appendChild(el); }
    els.stock.setAttribute("aria-label", st.stock.length ? "Stock, " + st.stock.length + " cards. Draw." : "Stock empty. Turn the waste pile over.");
    // waste: fan the last cards
    els.waste.innerHTML = "";
    var show = Math.min(st.draw === 3 ? 3 : 1, st.waste.length), start = st.waste.length - show;
    for (k = Math.max(0, start - 1); k < st.waste.length; k++) {
      c = st.waste[k]; el = cardEl(c); el.style.top = "0"; el.style.left = (Math.max(0, k - start) * 24) + "%";
      if (k === st.waste.length - 1) tag(el, "w", 0, k); else { el.style.cursor = "default"; el.tabIndex = -1; }
      els.waste.appendChild(el);
    }
    // foundations
    for (var s = 0; s < 4; s++) {
      var f = st.fnd[s]; els.fnd[s].innerHTML = "";
      for (k = Math.max(0, f.length - 2); k < f.length; k++) { el = cardEl(f[k]); el.style.top = "0"; if (k === f.length - 1) tag(el, "f", s, k); else el.tabIndex = -1; els.fnd[s].appendChild(el); }
    }
    // tableau
    var w = els.col[0].clientWidth, h = w * 1.4, avail = Math.max(260, window.innerHeight * 0.62), maxH = 0;
    for (var t = 0; t < 7; t++) {
      var col = st.tab[t], host = els.col[t];
      while (host.children.length > 1) host.removeChild(host.lastChild);
      var down = h * 0.13, up = h * 0.29, total = 0;
      col.forEach(function (x, i) { if (i < col.length - 1) total += x.up ? up : down; });
      if (total + h > avail) { var scale = (avail - h) / total; down *= scale; up *= scale; }
      var y = 0;
      for (k = 0; k < col.length; k++) {
        el = cardEl(col[k]); el.style.top = y + "px"; el.style.zIndex = k + 1;
        if (col[k].up) tag(el, "t", t, k);
        host.appendChild(el); y += col[k].up ? up : down;
      }
      maxH = Math.max(maxH, (col.length ? y - (col[col.length - 1].up ? up : down) : 0) + h);
    }
    for (t = 0; t < 7; t++) els.col[t].style.height = (maxH + 8) + "px";
    movesEl.textContent = st.moves; timeEl.textContent = fmt(st.seconds);
    $("undo").disabled = !history.length;
    $("auto").hidden = !canAuto();
    Array.prototype.forEach.call(document.querySelectorAll("#draw button"), function (b) { b.setAttribute("aria-pressed", +b.dataset.draw === st.draw); });
  }
  function tag(el, p, n, i) {
    el.dataset.p = p; el.dataset.n = n; el.dataset.i = i;
    var c = pileOf({ p: p, n: n })[i]; if (hintId && id(c) === hintId) el.classList.add("hint");
  }
  function srcOf(el) { return { p: el.dataset.p, n: +el.dataset.n, i: +el.dataset.i }; }

  // ---------- pointer input: drag, or tap to auto-move ----------
  var drag = null;
  table.addEventListener("pointerdown", function (e) {
    var el = e.target.closest(".card"); if (!el || !el.dataset.p || st.won || e.button > 0) return;
    var src = srcOf(el), group = [el];
    if (src.p === "t") { var sib = el.nextElementSibling; while (sib) { group.push(sib); sib = sib.nextElementSibling; } }
    drag = { src: src, els: group, x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
  });
  table.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 7) return;
    drag.moved = true;
    drag.els.forEach(function (c) { c.classList.add("drag"); c.style.transform = "translate(" + dx + "px," + dy + "px)"; });
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    if (!d.moved) return;                       // a tap: handled by the click listener
    suppressClick = true; setTimeout(function () { suppressClick = false; }, 0);
    var r = d.els[0].getBoundingClientRect(), best = null, bestArea = 0;
    function test(zone, dst) {
      var z = zone.getBoundingClientRect();
      var ox = Math.min(r.right, z.right) - Math.max(r.left, z.left), oy = Math.min(r.bottom, z.bottom) - Math.max(r.top, z.top);
      if (ox > 0 && oy > 0 && ox * oy > bestArea && legal(d.src, dst)) { bestArea = ox * oy; best = dst; }
    }
    for (var s = 0; s < 4; s++) test(els.fnd[s], { p: "f" });
    for (var t = 0; t < 7; t++) test(els.col[t], { p: "t", n: t });
    if (best) move(d.src, best); else render();
  }
  table.addEventListener("pointerup", endDrag);
  table.addEventListener("pointercancel", function (e) { if (drag && e.pointerId === drag.id) { drag = null; render(); } });
  var suppressClick = false;
  table.addEventListener("click", function (e) {
    if (suppressClick) return;
    var el = e.target.closest(".card"); if (!el || !el.dataset.p || st.won) return;
    var src = srcOf(el), dst = bestDest(src);
    if (dst) move(src, dst);
  });

  $("new").addEventListener("click", function () { deal(st.draw); });
  $("undo").addEventListener("click", undo);
  $("auto").addEventListener("click", autoFinish);
  $("hint").addEventListener("click", function () {
    if (st.won) return;
    var h = findHint();
    if (h) { hintId = id(pileOf(h)[h.i]); msg(""); }
    else { hintId = null; msg(st.stock.length || st.waste.length ? "No move on the table. Draw from the stock." : "No moves left. Undo or start a new game.", st.stock.length || st.waste.length ? "" : "lose"); }
    render();
  });
  $("draw").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b && +b.dataset.draw !== st.draw) deal(+b.dataset.draw); });
  document.addEventListener("keydown", function (e) { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); } });
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(render, 80); });

  build();
  st = load();
  if (st) { render(); startTimer(); if (st.won) msg("Solved. Deal a new game when you are ready.", "win"); } else deal(1);
  window.__sol = { state: function () { return st; }, legal: legal, bestDest: bestDest, findHint: findHint };
})();
