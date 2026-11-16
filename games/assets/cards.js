// Shared playing-card rendering and pointer handling for FreeCell and Spider.
// Klondike (solitaire.js) predates this file and keeps its own copy.
(function () {
  "use strict";
  var SUITS = ["♠", "♥", "♦", "♣"], NAMES = ["spades", "hearts", "diamonds", "clubs"];
  var RANKS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  function red(c) { return c.s === 1 || c.s === 2; }

  function make(c) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "card" + (c.up === false ? " down" : red(c) ? " red" : "");
    if (c.up !== false) {
      b.innerHTML = '<span class="ix">' + RANKS[c.r] + "<span>" + SUITS[c.s] + '</span></span><span class="big">' + SUITS[c.s] + "</span>";
      b.setAttribute("aria-label", RANKS[c.r] + " of " + NAMES[c.s]);
    } else { b.setAttribute("aria-label", "Face-down card"); b.tabIndex = -1; }
    return b;
  }

  // Stacks `cards` inside `host` (whose first child is the empty-slot placeholder), compressing the
  // spacing so the column fits in `avail` pixels. `tag(el, i)` marks playable cards. Returns the height used.
  function column(host, cards, avail, tag) {
    while (host.children.length > 1) host.removeChild(host.lastChild);
    var w = host.clientWidth, h = w * 1.4, down = h * 0.13, up = h * 0.27, total = 0, k;
    for (k = 0; k < cards.length - 1; k++) total += cards[k].up === false ? down : up;
    if (total + h > avail && total > 0) { var scale = Math.max(0.25, (avail - h) / total); down *= scale; up *= scale; }
    var y = 0;
    for (k = 0; k < cards.length; k++) {
      var el = make(cards[k]);
      el.style.top = y + "px"; el.style.zIndex = k + 1;
      if (cards[k].up !== false && tag) tag(el, k);
      host.appendChild(el);
      if (k < cards.length - 1) y += cards[k].up === false ? down : up;
    }
    return cards.length ? y + h : h;
  }

  // Pointer handling. h.source(el) -> src or null; h.zones() -> [{el, dst}]; h.legal(src, dst);
  // h.move(src, dst); h.tap(src); h.redraw().
  function interact(table, h) {
    var drag = null, suppress = false;
    table.addEventListener("pointerdown", function (e) {
      var el = e.target.closest(".card"); if (!el || e.button > 0) return;
      var src = h.source(el); if (!src) return;
      var group = [el];
      if (el.parentNode.classList.contains("col")) { var sib = el.nextElementSibling; while (sib) { group.push(sib); sib = sib.nextElementSibling; } }
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
    table.addEventListener("pointerup", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag; drag = null;
      if (!d.moved) return;
      suppress = true; setTimeout(function () { suppress = false; }, 0);
      var r = d.els[0].getBoundingClientRect(), best = null, bestArea = 0;
      h.zones().forEach(function (z) {
        var b = z.el.getBoundingClientRect();
        var bottom = Math.max(b.bottom, b.top + r.height);
        var ox = Math.min(r.right, b.right) - Math.max(r.left, b.left), oy = Math.min(r.bottom, bottom) - Math.max(r.top, b.top);
        if (ox > 0 && oy > 0 && ox * oy > bestArea && h.legal(d.src, z.dst)) { bestArea = ox * oy; best = z.dst; }
      });
      if (best) h.move(d.src, best); else h.redraw();
    });
    table.addEventListener("pointercancel", function (e) { if (drag && e.pointerId === drag.id) { drag = null; h.redraw(); } });
    table.addEventListener("click", function (e) {
      if (suppress) return;
      var el = e.target.closest(".card"); if (!el) return;
      var src = h.source(el); if (src) h.tap(src);
    });
  }

  function fmt(s) { var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r; }
  function avail() { return Math.max(260, window.innerHeight * 0.62); }

  window.GGCards = { SUITS: SUITS, RANKS: RANKS, red: red, make: make, column: column, interact: interact, fmt: fmt, avail: avail };
})();
