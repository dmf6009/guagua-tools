// Shared helpers for every game page: the post-game panel and result sharing.
(function () {
  "use strict";
  var shareText = "";
  function el(id) { return document.getElementById(id); }
  function copy(text, btn) {
    var done = function () { var old = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = old; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
    else { fallback(text); done(); }
  }
  function fallback(text) {
    var t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) {} document.body.removeChild(t);
  }
  window.GG = {
    // Called by a game when a round ends. opts.share: text to share; opts.lost: true for a loss.
    done: function (opts) {
      opts = opts || {};
      var a = el("after"); if (!a) return;
      a.hidden = false;
      var t = el("after-title"); if (t) t.textContent = opts.lost ? "Try a different game?" : "Nicely done. What next?";
      var b = el("share");
      shareText = opts.share || "";
      if (b) b.hidden = !shareText;
    },
    reset: function () { var a = el("after"); if (a) a.hidden = true; }
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#share");
    if (!b || !shareText) return;
    if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) navigator.share({ text: shareText }).catch(function () {});
    else copy(shareText, b);
  });
})();
