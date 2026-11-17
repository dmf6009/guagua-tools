(function () {
  "use strict";
  var C = window.GGCards, KEY = "gg.pyramid.v1", PASSES = 3;
  var $ = function (id) { return document.getElementById(id); };
  var table = $("table"), msgEl = $("msg"), timeEl = $("time"), movesEl = $("moves"), passEl = $("pass"), leftEl = $("left");
  var st, undoStack = [], timer = null, sel = null, hint = null;

  // Pyramid position p (0..27): row r, index i. Card p is free when both cards below it are gone.
  var ROWOF = [], IDXOF = [];
  (function () { var p = 0; for (var r = 0; r < 7; r++) for (var i = 0; i <= r; i++) { ROWOF[p] = r; IDXOF[p] = i; p++; } })();
  function pos(r, i) { return r * (r + 1) / 2 + i; }
  function free(p) {
    if (!st.pyr[p]) return false;
    var r = ROWOF[p], i = IDXOF[p];
    return r === 6 || (!st.pyr[pos(r + 1, i)] && !st.pyr[pos(r + 1, i + 1)]);
  }

  function deal() {
    var deck = [];
    for (var s = 0; s < 4; s++) for (var r = 1; r <= 13; r++) deck.push({ r: r, s: s });
    for (var k = deck.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = deck[k]; deck[k] = deck[j]; deck[j] = t; }
    st = { pyr: deck.slice(0, 28), stock: deck.slice(28), waste: [], pass: 1, moves: 0, seconds: 0, won: false, over: false };
    undoStack = []; sel = null; hint = null; msg("");
    if (window.GG) GG.reset();
    save(); render(); startTimer();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.pyr && s.pyr.length === 28) return s; } catch (e) {} return null; }
  function msg(t, cls) { msgEl.textContent = t; msgEl.className = "msg" + (cls ? " " + cls : ""); }
  function startTimer() {
    clearInterval(timer);
    timer = setInterval(function () { if (st && !st.won && !st.over && st.moves > 0 && !document.hidden) { st.seconds++; timeEl.textContent = C.fmt(st.seconds); } }, 1000);
  }
  function snap() { undoStack.push(JSON.stringify(st)); if (undoStack.length > 300) undoStack.shift(); }
  function undo() {
    if (!undoStack.length) return;
    var keep = st.seconds; st = JSON.parse(undoStack.pop()); st.seconds = keep; sel = null; hint = null; msg("");
    if (window.GG) GG.reset();
    save(); render();
  }

  // A reference to an available card: {p: index} in the pyramid, or {w: true} for the waste top.
  function cardOf(ref) { return ref.w ? st.waste[st.waste.length - 1] : st.pyr[ref.p]; }
  function remove(ref) { if (ref.w) st.waste.pop(); else st.pyr[ref.p] = null; }
  function available() {
    var out = [];
    for (var p = 0; p < 28; p++) if (free(p)) out.push({ p: p });
    if (st.waste.length) out.push({ w: true });
    return out;
  }
  function findPair() {
    var a = available();
    for (var i = 0; i < a.length; i++) {
      if (cardOf(a[i]).r === 13) return [a[i]];
      for (var j = i + 1; j < a.length; j++) if (cardOf(a[i]).r + cardOf(a[j]).r === 13) return [a[i], a[j]];
    }
    return null;
  }
  function same(a, b) { return a && b && (a.w ? !!b.w : a.p === b.p); }
  function take(refs) {
    snap();
    refs.sort(function (a, b) { return (a.w ? 1 : 0) - (b.w ? 1 : 0); });
    refs.forEach(remove);
    st.moves++; sel = null; hint = null;
    after();
  }
  function choose(ref) {
    if (st.won || st.over) return;
    var c = cardOf(ref); if (!c) return;
    if (c.r === 13) { take([ref]); return; }
    if (!sel) { sel = ref; render(); return; }
    if (same(sel, ref)) { sel = null; render(); return; }
    if (cardOf(sel).r + c.r === 13) take([sel, ref]);
    else { sel = ref; msg(""); render(); }
  }
  function draw() {
    if (st.won || st.over) return;
    sel = null; hint = null;
    if (st.stock.length) { snap(); st.waste.push(st.stock.pop()); st.moves++; }
    else if (st.pass < PASSES && st.waste.length) { snap(); st.stock = st.waste.reverse(); st.waste = []; st.pass++; st.moves++; }
    else return;
    after();
  }
  function after() {
    if (st.pyr.every(function (c) { return !c; })) {
      st.won = true;
      msg("Pyramid cleared in " + st.moves + " moves and " + C.fmt(st.seconds) + ".", "win");
      if (window.GG) GG.done({ share: "I cleared the pyramid in Pyramid Solitaire in " + st.moves + " moves.\n" + location.origin + location.pathname });
    } else if (!findPair() && !st.stock.length && (st.pass >= PASSES || !st.waste.length)) {
      st.over = true;
      var left = st.pyr.filter(Boolean).length;
      msg("No moves left, with " + left + " card" + (left === 1 ? "" : "s") + " still in the pyramid. Undo or deal again.", "lose");
      if (window.GG) GG.done({ lost: true });
    } else msg("");
    save(); render();
  }

  // ---------- rendering ----------
  function build() {
    table.innerHTML = '<div class="pyr-top"><button type="button" class="pile stock" id="stock" aria-label="Draw a card"></button><div class="pile waste-fan" id="waste"></div><div class="pyr-info" id="pinfo"></div></div><div class="pyr" id="pyr"></div>';
    $("stock").addEventListener("click", draw);
    table.addEventListener("click", function (e) {
      var el = e.target.closest(".card"); if (!el || el.dataset.ref == null) return;
      choose(el.dataset.ref === "w" ? { w: true } : { p: +el.dataset.ref });
    });
  }
  function mark(el, ref) {
    el.dataset.ref = ref.w ? "w" : ref.p;
    if (same(sel, ref)) el.classList.add("sel");
    if (hint && hint.some(function (h) { return same(h, ref); })) el.classList.add("hint");
  }
  function render() {
    var pyr = $("pyr"), w = pyr.clientWidth, cw = Math.min(w / 7.6, 96), ch = cw * 1.4, gap = cw * 0.08, step = ch * 0.5;
    pyr.innerHTML = ""; pyr.style.height = (step * 6 + ch + 4) + "px";
    for (var p = 0; p < 28; p++) {
      var c = st.pyr[p]; if (!c) continue;
      var r = ROWOF[p], i = IDXOF[p], el = C.make(c);
      el.style.width = cw + "px"; el.style.top = (r * step) + "px";
      el.style.left = (w / 2 - (r + 1) * (cw + gap) / 2 + i * (cw + gap)) + "px";
      el.style.zIndex = r + 1;
      if (free(p)) mark(el, { p: p }); else { el.classList.add("blocked"); el.tabIndex = -1; }
      pyr.appendChild(el);
    }
    var stock = $("stock"); stock.innerHTML = ""; stock.classList.toggle("empty", !st.stock.length);
    if (st.stock.length) { var b = C.make({ up: false }); b.style.top = "0"; b.style.pointerEvents = "none"; stock.appendChild(b); }
    stock.setAttribute("aria-label", st.stock.length ? "Draw a card, " + st.stock.length + " left" : st.pass < PASSES ? "Turn the waste over" : "Stock finished");
    var waste = $("waste"); waste.innerHTML = "";
    if (st.waste.length) { var t = C.make(st.waste[st.waste.length - 1]); t.style.top = "0"; mark(t, { w: true }); waste.appendChild(t); }
    $("pinfo").textContent = st.stock.length + " in stock";
    movesEl.textContent = st.moves; timeEl.textContent = C.fmt(st.seconds);
    passEl.textContent = st.pass + " of " + PASSES; leftEl.textContent = st.pyr.filter(Boolean).length;
    $("undo").disabled = !undoStack.length;
  }

  $("new").addEventListener("click", deal);
  $("undo").addEventListener("click", undo);
  $("hint").addEventListener("click", function () {
    if (st.won || st.over) return;
    var h = findPair();
    if (h) { hint = h; msg(""); }
    else { hint = null; msg(st.stock.length ? "No pair on the table. Draw a card." : st.pass < PASSES ? "No pair available. Turn the waste over and go through the stock again." : "No moves left."); }
    render();
  });
  document.addEventListener("keydown", function (e) { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); } });
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(render, 80); });

  build();
  st = load();
  if (st) { render(); startTimer(); if (st.won) msg("Pyramid cleared. Deal again when you are ready.", "win"); else if (st.over) msg("No moves left. Undo or deal again.", "lose"); }
  else deal();
  window.__pyr = { state: function () { return st; }, free: free, findPair: findPair, choose: choose, draw: draw };
})();
