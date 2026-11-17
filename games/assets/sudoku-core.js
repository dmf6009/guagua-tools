// Sudoku generator and solver, shared by the play pages and the printable sheets.
// Do not change the order of random calls: the daily puzzle for every date depends on it.
(function () {
  "use strict";
  var CLUES = { easy: 40, medium: 33, hard: 28, expert: 24 };
  // ---------- random numbers: Math.random, or a seeded generator for the daily puzzle ----------
  var rand = Math.random;
  function seeded(seed) {           // mulberry32
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- solver / generator ----------
  var ROW = [], COL = [], BOX = [], PEERS = [];
  for (var i = 0; i < 81; i++) { ROW[i] = Math.floor(i / 9); COL[i] = i % 9; BOX[i] = Math.floor(ROW[i] / 3) * 3 + Math.floor(COL[i] / 3); }
  for (i = 0; i < 81; i++) { PEERS[i] = []; for (var j = 0; j < 81; j++) if (j !== i && (ROW[i] === ROW[j] || COL[i] === COL[j] || BOX[i] === BOX[j])) PEERS[i].push(j); }
  function bits(n) { var c = 0; while (n) { n &= n - 1; c++; } return c; }
  function shuffle(a) { for (var k = a.length - 1; k > 0; k--) { var r = Math.floor(rand() * (k + 1)); var t = a[k]; a[k] = a[r]; a[r] = t; } return a; }

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
  function generate(level, seed) {
    rand = seed == null ? Math.random : seeded(seed);
    var sol = new Array(81).fill(0);
    solve(new Array(81).fill(0), 1, sol, true);
    var puz = sol.slice(), order = shuffle(Array.from({ length: 81 }, function (_, n) { return n; })), clues = 81, target = CLUES[level];
    for (var k = 0; k < 81 && clues > target; k++) {
      var c = order[k], keep = puz[c];
      puz[c] = 0;
      if (solve(puz.slice(), 2) !== 1) puz[c] = keep; else clues--;
    }
    rand = Math.random;
    return { puzzle: puz, solution: sol };
  }

  window.SudokuCore = { solve: solve, generate: generate, CLUES: CLUES, ROW: ROW, COL: COL, BOX: BOX, PEERS: PEERS };
})();
