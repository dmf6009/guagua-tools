(function () {
  "use strict";
  var Core = window.SudokuCore, LABEL = { easy: "Easy", medium: "Medium", hard: "Hard", expert: "Expert" };
  var $ = function (id) { return document.getElementById(id); };
  var form = $("print-form"), out = $("sheets"), status = $("print-status"), printBtn = $("print");
  var busy = false;

  function grid(values, givens) {
    var h = '<div class="ps-grid">';
    for (var k = 0; k < 81; k++) h += "<span" + (givens && !givens[k] ? ' class="ans"' : "") + ">" + (values[k] || "") + "</span>";
    return h + "</div>";
  }
  function sheet(items, per, answers) {
    var h = '<section class="ps-sheet ps-' + per + (answers ? " ps-answers" : "") + '"><header class="ps-head"><b>' + (answers ? "Answers" : "Sudoku") +
      "</b><span>games.guagua-alvin.top/printable-sudoku</span></header><div class=\"ps-body\">";
    items.forEach(function (it) {
      h += '<figure><figcaption>' + LABEL[it.level] + " · Puzzle " + it.code + "</figcaption>" +
        (answers ? grid(it.solution, it.puzzle) : grid(it.puzzle)) + "</figure>";
    });
    return h + "</div></section>";
  }
  function generateAll(e) {
    if (e) e.preventDefault();
    if (busy) return;
    var level = $("ps-level").value, per = +$("ps-per").value, pages = +$("ps-pages").value, withAnswers = $("ps-answers").checked;
    var total = per * pages, items = [];
    busy = true; printBtn.disabled = true; out.innerHTML = "";
    (function next() {
      if (items.length === total) {
        var html = "";
        for (var p = 0; p < pages; p++) html += sheet(items.slice(p * per, p * per + per), per, false);
        if (withAnswers) for (p = 0; p < pages; p++) html += sheet(items.slice(p * per, p * per + per), per, true);
        out.innerHTML = html;
        status.textContent = total + " " + LABEL[level].toLowerCase() + " puzzle" + (total === 1 ? "" : "s") + " ready on " + pages + " page" + (pages === 1 ? "" : "s") + (withAnswers ? ", plus answer pages" : "") + ".";
        busy = false; printBtn.disabled = false;
        return;
      }
      status.textContent = "Generating puzzle " + (items.length + 1) + " of " + total + "…";
      var seed = 100000 + Math.floor(Math.random() * 900000), g = Core.generate(level, seed);
      items.push({ level: level, code: seed, puzzle: g.puzzle, solution: g.solution });
      setTimeout(next, 0);     // let the page repaint between puzzles
    })();
  }
  form.addEventListener("submit", generateAll);
  ["ps-level", "ps-per", "ps-pages", "ps-answers"].forEach(function (id) { $(id).addEventListener("change", function () { generateAll(); }); });
  printBtn.addEventListener("click", function () { window.print(); });
  generateAll();
  window.__print = { busy: function () { return busy; } };
})();
