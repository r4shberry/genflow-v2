/* ============================================================
   sync.js  —  app-side auth guard + cross-device sync
   Load order in index.html:
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="supabase-config.js"></script>
     <script src="system.js"></script>
     <script src="gemini.js"></script>
     <script src="hook-people.js"></script>
     <script src="sync.js"></script>

   - If not signed in -> redirects to login.html.
   - Syncs builder state (pb_state) across devices (last-write-wins).
   - Gemini key + chat history stay local to each device.
   ============================================================ */
(function () {
  var sb = window.sbClient;
  var STATE_KEY = 'pb_state', TS_KEY = 'pb_state_ts';
  var user = null, pushT = null, statusEl = null;

  function ts() { return parseInt(localStorage.getItem(TS_KEY) || '0', 10) || 0; }
  function setTs(ms) { try { localStorage.setItem(TS_KEY, String(ms)); } catch (e) {} }

  if (!sb) { console.warn('[sync] Supabase not configured — running without login.'); return; }

  // ---- guard: must be signed in ----
  sb.auth.getSession().then(function (r) {
    if (!r.data.session) { location.replace('login.html'); return; }
    user = r.data.session.user;
    start();
  });
  sb.auth.onAuthStateChange(function (_e, session) {
    if (!session) { location.replace('login.html'); return; }
    user = session.user;
  });

  function start() {
    buildBar();
    if (typeof window.vbSave === 'function') {
      var orig = window.vbSave;
      window.vbSave = function () { var x = orig.apply(this, arguments); schedulePush(); return x; };
    }
    pullNow(false);
  }

  // ---- small top-right bar: email · Save · Load · Log out ----
  function buildBar() {
    var bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;right:16px;top:16px;z-index:9997;display:flex;gap:6px;align-items:center;background:#15151b;border:1px solid #2a2a33;border-radius:999px;padding:5px 6px 5px 12px;box-shadow:0 6px 20px rgba(0,0,0,.4);font:600 12px system-ui;color:#eee';
    bar.innerHTML =
      '<span style="color:#bbb;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (user.email || 'Signed in') + '</span>' +
      '<button data-save title="Save now" style="border:none;border-radius:999px;cursor:pointer;background:#6c5ce7;color:#fff;padding:5px 9px"><i class="ti ti-cloud-upload"></i></button>' +
      '<button data-load title="Load from cloud" style="border:1px solid #3a3a44;border-radius:999px;cursor:pointer;background:#1d1d25;color:#eee;padding:5px 9px"><i class="ti ti-cloud-download"></i></button>' +
      '<button data-out title="Log out" style="border:1px solid #3a3a44;border-radius:999px;cursor:pointer;background:#1d1d25;color:#eee;padding:5px 9px"><i class="ti ti-logout"></i></button>';
    document.body.appendChild(bar);
    statusEl = document.createElement('div');
    statusEl.style.cssText = 'position:fixed;right:16px;top:52px;z-index:9997;font:12px system-ui;color:#888';
    document.body.appendChild(statusEl);
    bar.querySelector('[data-save]').onclick = function () { pushNow(true); };
    bar.querySelector('[data-load]').onclick = function () { pullNow(true); };
    bar.querySelector('[data-out]').onclick = function () { sb.auth.signOut(); };
  }
  function status(t) { if (statusEl) statusEl.textContent = t || ''; }

  // ---- cloud read/write ----
  async function fetchRow() {
    var r = await sb.from('profiles').select('state,updated_at').eq('id', user.id).maybeSingle();
    if (r.error) { status(r.error.message); return null; }
    return r.data;
  }
  async function pushNow() {
    if (!user) return;
    var state; try { state = JSON.parse(localStorage.getItem(STATE_KEY) || '{}'); } catch (e) { state = {}; }
    var iso = new Date().toISOString();
    setTs(Date.now());
    var r = await sb.from('profiles').upsert({ id: user.id, state: state, updated_at: iso });
    status(r.error ? r.error.message : ('Saved ' + new Date().toLocaleTimeString()));
  }
  function schedulePush() { if (!user) return; clearTimeout(pushT); pushT = setTimeout(function () { pushNow(); }, 1500); }

  async function pullNow(manual) {
    if (!user) return;
    var row = await fetchRow();
    if (!row || !row.state) { status('No cloud data yet — saving this device.'); return pushNow(); }
    var cloudTs = row.updated_at ? Date.parse(row.updated_at) : 0;
    var incoming = JSON.stringify(row.state);
    var localNow = localStorage.getItem(STATE_KEY) || '';
    var adopt = manual || cloudTs > ts();
    if (adopt && incoming !== localNow) {
      localStorage.setItem(STATE_KEY, incoming);
      setTs(cloudTs || Date.now());
      if (!sessionStorage.getItem('pb_pulled')) {
        sessionStorage.setItem('pb_pulled', '1');
        status('Loading your data...');
        location.reload();
        return;
      }
    }
    sessionStorage.removeItem('pb_pulled');
    if (!adopt) pushNow();          // local newer -> push up
    else status('Up to date.');
  }
})();
