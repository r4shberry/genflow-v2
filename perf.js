/* ============================================================
   perf.js  —  debounce the live-preview rebuilds
   Install LAST in index.html (after system/gemini/hook-people):
       <script src="system.js"></script>
       <script src="gemini.js"></script>
       <script src="hook-people.js"></script>
       <script src="perf.js"></script>

   The preview functions (vbJsonUI, vbImgUI, vbHookUI, vbProductUI,
   vbFixUI) re-run on every keystroke and rebuild JSON + innerHTML.
   They return nothing (pure render), so debouncing them is safe and
   makes typing smooth without changing any behavior. vbSeg is left
   alone because callers use its return value.
   ============================================================ */
(function () {
  var MS = 120;
  function debounce(fn, ms) {
    var t;
    var w = function () { var c = this, a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); };
    w.now = fn; // immediate version, if ever needed
    return w;
  }
  function go() {
    ['vbJsonUI', 'vbImgUI', 'vbHookUI', 'vbProductUI', 'vbFixUI'].forEach(function (name) {
      if (typeof window[name] === 'function' && !window[name].now) {
        var original = window[name];
        window[name] = debounce(original, MS);
        try { original(); } catch (e) {} // one immediate render so the initial view is correct
      }
    });
  }
  // run after the other scripts have defined/overridden these
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else setTimeout(go, 0);
})();