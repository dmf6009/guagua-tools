(function () {
  "use strict";
  var KEY = "gg.mines.v1";
  var LEVELS = { beginner: [9, 9, 10], intermediate: [16, 16, 40], expert: [30, 16, 99] };
  var $ = function (id) { return document.getElementById(id); };
  var gridEl = $("grid"), msgEl = $("msg"), timeEl = $("time"), leftEl = $("left"), bestEl = $("best");
  var W, H, M, level, mines, open, flag, started, over, won, seconds, timer, flagMode = false, cells = [], focusI = 0;
  var best = {};
  try { best = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}

  function nb(i) {
    var x = i % W, y = Math.floor(i / W), out = [];
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      var nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < W && ny >= 0 && ny < H) out.push(ny * W + nx);
    }
    return out;
  }
  function count(i) { return nb(i).reduce(function (n, j) { return n + (mines[j] ? 1 : 0); }, 0); }
  function msg(t, cls) { msgEl.textContent = t; msgEl.className = "msg" + (cls ? " " + cls : ""); }
  function fmt(s) { return s > 999 ? "999" : String(s); }

  function start(lv) {
    level = lv; W = LEVELS[lv][0]; H = LEVELS[lv][1]; M = LEVELS[lv][2];
    var n = W * H;
    mines = new Array(n).fill(false); open = new Array(n).fill(false); flag = new Array(n).fill(false);
    started = false; over = false; won = false; seconds = 0; focusI = 0;
    clearInterval(timer);
    gridEl.style.gridTemplateColumns = "repeat(" + W + ",var(--ms,32px))";
    gridEl.innerHTML = ""; cells = [];
    for (var i = 0; i < n; i++) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "cell"; b.dataset.i = i; b.tabIndex = i === 0 ? 0 : -1;
      gridEl.appendChild(b); cells.push(b);
    }
    fit(); msg(""); render();
    Array.prototype.forEach.call(document.querySelectorAll("#levels button"), function (b) { b.setAttribute("aria-pressed", b.dataset.level === level); });
  }
  function fit() {
    var avail = gridEl.parentNode.clientWidth - 6, size = Math.floor((avail - (W - 1) * 2) / W);
    gridEl.style.setProperty("--ms", Math.max(26, Math.min(36, size)) + "px");
  }
  function place(safe) {
    var banned = {}; banned[safe] = 1; nb(safe).forEach(function (j) { banned[j] = 1; });
    var pool = []; for (var i = 0; i < W * H; i++) if (!banned[i]) pool.push(i);
    for (var k = 0; k < M; k++) { var r = k + Math.floor(Math.random() * (pool.length - k)); var t = pool[k]; pool[k] = pool[r]; pool[r] = t; mines[pool[k]] = true; }
    started = true;
    timer = setInterval(function () { if (!over && !document.hidden) { seconds++; timeEl.textContent = fmt(seconds); } }, 1000);
  }
  function reveal(i) {
    if (over || flag[i] || open[i]) return;
    if (!started) place(i);
    if (mines[i]) return lose(i);
    var stack = [i];
    while (stack.length) {
      var c = stack.pop();
      if (open[c] || flag[c]) continue;
      open[c] = true;
      if (count(c) === 0) nb(c).forEach(function (j) { if (!open[j] && !mines[j]) stack.push(j); });
    }
    check(); render();
  }
  function chord(i) {
    if (over || !open[i]) return;
    var n = count(i); if (!n) return;
    var around = nb(i);
    if (around.filter(function (j) { return flag[j]; }).length !== n) return;
    var hit = -1;
    around.forEach(function (j) { if (!flag[j] && !open[j]) { if (mines[j]) hit = j; } });
    if (hit >= 0) return lose(hit);
    around.forEach(function (j) { if (!flag[j]) reveal(j); });
  }
  function toggleFlag(i) { if (over || open[i]) return; flag[i] = !flag[i]; render(); }
  function lose(i) {
    over = true; clearInterval(timer); render();
    cells[i].classList.add("boom");
    msg("You hit a mine. Press New game to try again.", "lose");
  }
  function check() {
    for (var i = 0; i < W * H; i++) if (!mines[i] && !open[i]) return;
    over = true; won = true; clearInterval(timer);
    for (i = 0; i < W * H; i++) if (mines[i]) flag[i] = true;
    var rec = !best[level] || seconds < best[level];
    if (rec) { best[level] = seconds; try { localStorage.setItem(KEY, JSON.stringify(best)); } catch (e) {} }
    msg("Cleared in " + seconds + " second" + (seconds === 1 ? "" : "s") + (rec ? ". New best time." : "."), "win");
  }
  function render() {
    var flags = 0;
    for (var i = 0; i < W * H; i++) {
      var el = cells[i], cls = "cell", txt = "", label = "hidden";
      if (flag[i]) flags++;
      if (open[i]) { var n = count(i); cls += " open" + (n ? " n" + n : ""); txt = n || ""; label = n ? n + " adjacent mines" : "empty"; }
      else if (over && mines[i] && !flag[i]) { cls += " open mine"; label = "mine"; }
      else if (over && flag[i] && !mines[i]) { cls += " open wrong"; label = "wrong flag"; }
      else if (flag[i]) { cls += " flag"; label = "flagged"; }
      el.className = cls; el.textContent = txt; el.tabIndex = i === focusI ? 0 : -1;
      el.setAttribute("aria-label", "Row " + (Math.floor(i / W) + 1) + ", column " + (i % W + 1) + ", " + label);
    }
    leftEl.textContent = M - flags; timeEl.textContent = fmt(seconds);
    bestEl.textContent = best[level] != null ? best[level] + "s" : "—";
    $("flagmode").setAttribute("aria-pressed", flagMode);
  }

  // ---------- input ----------
  var pressTimer = null, longPressed = false;
  function act(i, secondary) {
    if (open[i]) chord(i);
    else if (secondary !== flagMode) toggleFlag(i);   // right-click XOR flag mode
    else reveal(i);
  }
  gridEl.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  gridEl.addEventListener("pointerdown", function (e) {
    var b = e.target.closest(".cell"); if (!b) return;
    longPressed = false;
    if (e.pointerType === "touch") {
      pressTimer = setTimeout(function () { longPressed = true; if (navigator.vibrate) navigator.vibrate(15); act(+b.dataset.i, true); }, 380);
    } else if (e.button === 2) { act(+b.dataset.i, true); longPressed = true; }
  });
  ["pointerup", "pointercancel", "pointerleave", "pointermove"].forEach(function (t) {
    gridEl.addEventListener(t, function (e) { if (t === "pointermove" && Math.abs(e.movementX) + Math.abs(e.movementY) < 6) return; clearTimeout(pressTimer); });
  });
  gridEl.addEventListener("click", function (e) {
    var b = e.target.closest(".cell"); if (!b) return;
    if (longPressed) { longPressed = false; return; }
    focusI = +b.dataset.i; act(focusI, false);
  });
  gridEl.addEventListener("keydown", function (e) {
    var i = focusI, x = i % W, y = Math.floor(i / W);
    if (e.key === "ArrowLeft") x = Math.max(0, x - 1); else if (e.key === "ArrowRight") x = Math.min(W - 1, x + 1);
    else if (e.key === "ArrowUp") y = Math.max(0, y - 1); else if (e.key === "ArrowDown") y = Math.min(H - 1, y + 1);
    else if (e.key === "f" || e.key === "F") { toggleFlag(i); e.preventDefault(); return; }
    else return;
    e.preventDefault(); focusI = y * W + x;
    cells.forEach(function (c, k) { c.tabIndex = k === focusI ? 0 : -1; }); cells[focusI].focus();
  });
  gridEl.addEventListener("focusin", function (e) { var b = e.target.closest(".cell"); if (b) focusI = +b.dataset.i; });
  $("new").addEventListener("click", function () { start(level); });
  $("flagmode").addEventListener("click", function () { flagMode = !flagMode; render(); });
  $("levels").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) start(b.dataset.level); });
  window.addEventListener("resize", fit);

  start(window.matchMedia("(max-width: 760px)").matches ? "beginner" : "beginner");
  window.__mines = { state: function () { return { W: W, H: H, M: M, mines: mines, open: open, flag: flag, over: over, won: won }; } };
})();
