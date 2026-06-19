/* ============================================================
   gemini.js  —  "Night Chat" for Prompt Builder (free Gemini)
   Install (index.html), AFTER system.js:
       <script src="system.js"></script>
       <script src="gemini.js"></script>

   - Left-docked "Night Chat" panel (launcher bottom-left).
   - Multi-turn chat with memory (persists across reloads).
   - Compose: ATTACH an image + TYPE words, send together.
   - Scenes button: splits your Body Script into scenes and gives,
     per scene, an IMAGE prompt + a VIDEO JSON, both synced to your
     current locked character / voice / scene settings.
   - Photo -> filled video JSON (camera icon).
   - "Describe from photo" writes into the DESCRIPTION (Image
     reference) field for Character / Hook A / Hook B; Product
     shows its analysis in chat.
   - "Recreate" mode in the dropdown -> plain-text Flow prompt.

   Free key: aistudio.google.com/apikey  (no card). Key + chat
   stored only in this browser. Never commit a key.
   ============================================================ */
(function () {
  var KEY_STORE = 'pb_gemini_key', HIST_STORE = 'pb_nightchat', MODEL = 'gemini-2.5-flash';
  var SYS_CHAT =
    'You are Night Chat, a concise assistant built into a UGC video/image prompt builder ' +
    '(characters locked to a reference photo, JSON clip specs, Google Flow / Veo prompts). ' +
    'Help write scripts, hooks, character descriptions and prompts. When given a JSON or prompt spec, follow it exactly. ' +
    'Keep replies tight and practical. No preamble.';

  var history = loadHistory();
  var panel, launcher, msgWrap, input, stageInput, stagedImg = null;

  function getKey() { try { return localStorage.getItem(KEY_STORE) || ''; } catch (e) { return ''; } }
  function setKey(k) { try { localStorage.setItem(KEY_STORE, k); } catch (e) {} }
  function loadHistory() { try { return JSON.parse(localStorage.getItem(HIST_STORE)) || []; } catch (e) { return []; } }
  function saveHistory() { try { localStorage.setItem(HIST_STORE, JSON.stringify(history.slice(-40))); } catch (e) {} }

  async function apiCall(contents, systemText, useSearch) {
    if (!getKey()) throw new Error('NO_KEY');
    var payload = { system_instruction: { parts: [{ text: systemText }] }, contents: contents };
    if (useSearch) payload.tools = [{ google_search: {} }];
    var res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL +
      ':generateContent?key=' + encodeURIComponent(getKey()),
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) });
    var data = await res.json();
    if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status));
    var c = data.candidates && data.candidates[0] && data.candidates[0].content;
    return (c && c.parts && c.parts[0] && c.parts[0].text) || '';
  }
  function fileToB64(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(',')[1]); };
      r.onerror = function () { reject(new Error('Could not read image')); };
      r.readAsDataURL(file);
    });
  }
  function imgPart(b64, mime) { return { inline_data: { mime_type: mime || 'image/jpeg', data: b64 } }; }
  function stripFences(s) { return s.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim(); }

  /* ---------- panel ---------- */
  function build() {
    if (panel) return;
    launcher = document.createElement('button');
    launcher.type = 'button'; launcher.title = 'Night Chat';
    launcher.style.cssText =
      'position:fixed;left:16px;bottom:16px;z-index:9998;display:flex;align-items:center;gap:8px;' +
      'padding:10px 14px;border:none;border-radius:999px;cursor:pointer;color:#fff;' +
      'background:linear-gradient(135deg,#6c5ce7,#3b2f8f);box-shadow:0 8px 24px rgba(0,0,0,.45);font:600 14px system-ui';
    launcher.innerHTML = '<i class="ti ti-moon-stars"></i> Night Chat';
    launcher.onclick = openPanel;
    document.body.appendChild(launcher);

    panel = document.createElement('div');
    panel.style.cssText =
      'position:fixed;left:0;top:0;height:100vh;width:380px;max-width:90vw;z-index:9999;' +
      'display:flex;flex-direction:column;background:#121218;color:#eee;border-right:1px solid #2a2a33;' +
      'box-shadow:6px 0 30px rgba(0,0,0,.5);transform:translateX(-100%);transition:transform .22s ease;font:14px system-ui';
    panel.innerHTML =
      '<div style="display:flex;align-items:center;gap:6px;padding:12px 14px;border-bottom:1px solid #2a2a33">' +
        '<i class="ti ti-moon-stars" style="color:#a99bff"></i><strong style="flex:1">Night Chat</strong>' +
        '<button data-act="scenes" title="Split script into scene prompts" style="background:none;border:none;color:#999;cursor:pointer"><i class="ti ti-layout-list"></i></button>' +
        '<button data-act="img"    title="Photo -> JSON" style="background:none;border:none;color:#999;cursor:pointer"><i class="ti ti-photo"></i></button>' +
        '<button data-act="key"    title="API key" style="background:none;border:none;color:#999;cursor:pointer"><i class="ti ti-key"></i></button>' +
        '<button data-act="clear"  title="Clear chat" style="background:none;border:none;color:#999;cursor:pointer"><i class="ti ti-trash"></i></button>' +
        '<button data-act="close"  title="Close" style="background:none;border:none;color:#999;cursor:pointer"><i class="ti ti-x"></i></button>' +
      '</div>' +
      '<div data-keyrow style="display:none;padding:10px 14px;border-bottom:1px solid #2a2a33">' +
        '<input data-key type="password" placeholder="Paste free Gemini API key" style="width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid #444;background:#0e0e13;color:#eee">' +
        '<button data-act="savekey" style="margin-top:6px;width:100%;padding:8px;border:none;border-radius:8px;background:#6c5ce7;color:#fff;cursor:pointer">Save key</button>' +
        '<div style="margin-top:6px;font-size:11px;color:#888">Free key at aistudio.google.com/apikey</div>' +
      '</div>' +
      '<div data-msgs style="flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px"></div>' +
      '<div data-staged style="display:none;padding:8px 12px 0"></div>' +
      '<div style="padding:10px 12px;border-top:1px solid #2a2a33;display:flex;gap:6px;align-items:flex-end">' +
        '<button data-act="attach" title="Attach image" style="background:none;border:none;color:#999;cursor:pointer;padding:8px"><i class="ti ti-paperclip"></i></button>' +
        '<textarea data-input rows="1" placeholder="Message Night Chat..." style="flex:1;resize:none;max-height:120px;padding:9px 10px;border-radius:10px;border:1px solid #3a3a44;background:#0e0e13;color:#eee;font:14px system-ui"></textarea>' +
        '<button data-act="send" style="padding:9px 12px;border:none;border-radius:10px;background:#6c5ce7;color:#fff;cursor:pointer"><i class="ti ti-send"></i></button>' +
      '</div>';
    document.body.appendChild(panel);

    msgWrap = panel.querySelector('[data-msgs]');
    input = panel.querySelector('[data-input]');
    var keyRow = panel.querySelector('[data-keyrow]');
    panel.querySelector('[data-key]').value = getKey();

    // hidden inputs: one for photo->JSON, one for staging an attachment
    var fiJson = document.createElement('input'); fiJson.type = 'file'; fiJson.accept = 'image/*'; fiJson.style.display = 'none'; panel.appendChild(fiJson);
    fiJson.addEventListener('change', function () { if (fiJson.files && fiJson.files[0]) { analyzeToJson(fiJson.files[0]); fiJson.value = ''; } });

    stageInput = document.createElement('input'); stageInput.type = 'file'; stageInput.accept = 'image/*'; stageInput.style.display = 'none'; panel.appendChild(stageInput);
    stageInput.addEventListener('change', async function () {
      if (!stageInput.files || !stageInput.files[0]) return;
      var f = stageInput.files[0]; stageInput.value = '';
      stagedImg = { b64: await fileToB64(f), mime: f.type || 'image/jpeg', name: f.name || 'image' };
      renderStaged();
    });

    panel.addEventListener('click', function (e) {
      var hit = e.target.closest('[data-act]'); if (!hit) return;
      var act = hit.dataset.act;
      if (act === 'close')   closePanel();
      if (act === 'key')     keyRow.style.display = keyRow.style.display === 'none' ? 'block' : 'none';
      if (act === 'savekey') { setKey(panel.querySelector('[data-key]').value.trim()); keyRow.style.display = 'none'; addMsg('model', 'Key saved. Ask me anything.'); }
      if (act === 'clear')   { history = []; saveHistory(); msgWrap.innerHTML = ''; }
      if (act === 'img')     { if (ensureKey()) fiJson.click(); }
      if (act === 'attach')  { stageInput.click(); }
      if (act === 'unstage') { stagedImg = null; renderStaged(); }
      if (act === 'scenes')  { generateScenes(); }
      if (act === 'send')    chatSend();
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatSend(); } });
    input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(120, input.scrollHeight) + 'px'; });

    history.forEach(function (m) { renderMsg(m.role, m.text); });
  }

  function renderStaged() {
    var s = panel.querySelector('[data-staged]');
    if (!stagedImg) { s.style.display = 'none'; s.innerHTML = ''; return; }
    s.style.display = 'block';
    s.innerHTML =
      '<span style="display:inline-flex;align-items:center;gap:6px;background:#1d1d25;border:1px solid #3a3a44;border-radius:8px;padding:4px 8px;font-size:12px">' +
      '<img src="data:' + stagedImg.mime + ';base64,' + stagedImg.b64 + '" style="width:24px;height:24px;object-fit:cover;border-radius:4px"> ' +
      escapeHtml(stagedImg.name) + ' <button data-act="unstage" style="background:none;border:none;color:#999;cursor:pointer">&times;</button></span>';
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function openPanel()  { build(); panel.style.transform = 'translateX(0)'; launcher.style.display = 'none'; setTimeout(function () { input && input.focus(); }, 200); }
  function closePanel() { if (panel) panel.style.transform = 'translateX(-100%)'; if (launcher) launcher.style.display = 'flex'; }
  function ensureKey() {
    if (getKey()) return true;
    build(); openPanel();
    panel.querySelector('[data-keyrow]').style.display = 'block';
    addMsg('model', 'Add your free Gemini API key first (aistudio.google.com/apikey).');
    return false;
  }

  function renderMsg(role, text) {
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;flex-direction:column;max-width:88%;' + (role === 'user' ? 'align-self:flex-end;align-items:flex-end' : 'align-self:flex-start;align-items:flex-start');
    var b = document.createElement('div');
    b.textContent = text;
    b.style.cssText = 'padding:9px 12px;border-radius:12px;white-space:pre-wrap;word-break:break-word;line-height:1.45;' +
      (role === 'user' ? 'background:#6c5ce7;color:#fff' : 'background:#1d1d25;color:#eee;font-family:ui-monospace,monospace;font-size:12.5px');
    row.appendChild(b);
    if (role === 'model') {
      var copy = document.createElement('button');
      copy.type = 'button'; copy.textContent = 'Copy';
      copy.style.cssText = 'margin-top:4px;background:none;border:none;color:#888;font-size:11px;cursor:pointer';
      copy.onclick = function () { navigator.clipboard && navigator.clipboard.writeText(text); copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy'; }, 1200); };
      row.appendChild(copy);
    }
    msgWrap.appendChild(row); msgWrap.scrollTop = msgWrap.scrollHeight; return b;
  }
  function addMsg(role, text) { history.push({ role: role, text: text }); saveHistory(); return renderMsg(role, text); }

  async function chatSend(preset) {
    if (!ensureKey()) return;
    var text = preset != null ? preset : input.value.trim();
    if (!text && !stagedImg) return;
    if (preset == null) { input.value = ''; input.style.height = 'auto'; }

    var hasImg = !!stagedImg, curParts = [];
    if (hasImg) curParts.push(imgPart(stagedImg.b64, stagedImg.mime));
    curParts.push({ text: text || 'Use the attached image.' });

    addMsg('user', (text || '(image)') + (hasImg ? '  \u{1F4CE} ' + stagedImg.name : ''));
    var prior = history.slice(0, -1).filter(function (m) { return m.text; })
      .map(function (m) { return { role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }; });
    prior.push({ role: 'user', parts: curParts });
    stagedImg = null; renderStaged();

    var thinking = renderMsg('model', 'Thinking...');
    try {
      var reply = await apiCall(prior, SYS_CHAT, true);
      thinking.textContent = reply || '(no reply)';
      history.push({ role: 'model', text: reply || '(no reply)' }); saveHistory();
    } catch (e) { thinking.textContent = e.message === 'NO_KEY' ? 'Add your API key (key icon).' : ('Error: ' + e.message); }
  }

  window.sendPrompt = function (message) { openPanel(); chatSend(message); };

  /* ---------- Scenes: per-scene IMAGE prompt + VIDEO JSON, synced ---------- */
  async function generateScenes() {
    if (!ensureKey()) return;
    var scenes = [];
    if (typeof vbComputeClips === 'function') { try { scenes = (vbComputeClips().clips || []).slice(); } catch (e) {} }
    if (!scenes.length) {
      var t = (document.getElementById('scriptText') || {}).value || (input ? input.value : '') || '';
      scenes = t.split(/\n\s*\n|(?<=[.!?])\s+(?=[A-Z"'])/).map(function (s) { return s.trim(); }).filter(Boolean);
    }
    openPanel();
    if (!scenes.length) { addMsg('model', 'Add a Body Script first (or type a script), then tap the Scenes icon.'); return; }
    addMsg('user', '[Split script into ' + scenes.length + ' scene prompts]');
    var thinking = renderMsg('model', 'Building ' + scenes.length + ' scene prompts...');
    try {
      var img = (typeof vbImgJsonObj === 'function') ? vbImgJsonObj() : {};
      var character = (document.getElementById('character') || {}).value || 'the locked reference character';
      var desc = (document.getElementById('imgRef') || {}).value || '';
      var instr =
        'A video is split into ' + scenes.length + ' scenes. For EACH scene, write ONE plain-text IMAGE prompt for a still that ' +
        'keeps the SAME locked character and matches the current scene settings, showing that scene\'s moment.\n' +
        'Locked character: ' + character + '\nDescription/reference: ' + desc + '\n' +
        'Current image settings (stay consistent with these): ' + JSON.stringify(img) + '\n\n' +
        'Scenes:\n' + scenes.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n') + '\n\n' +
        'Return ONLY a JSON array of exactly ' + scenes.length + ' strings, one image prompt per scene in order. No markdown, no commentary.';
      var raw = stripFences(await apiCall([{ role: 'user', parts: [{ text: instr }] }], 'You output only a valid JSON array of strings.'));
      var imgs = null; try { imgs = JSON.parse(raw); } catch (e) {}
      thinking.parentNode && thinking.parentNode.remove();
      scenes.forEach(function (line, i) {
        var vjson = (typeof vbJsonObj === 'function') ? vbJsonObj(line) : { dialogue: line };
        var ip = (imgs && imgs[i]) ? imgs[i] : ('Photoreal still of ' + character + ', ' + desc + '. Scene: ' + line);
        addMsg('model', 'SCENE ' + (i + 1) + '\n\n\u2014 IMAGE PROMPT \u2014\n' + ip + '\n\n\u2014 VIDEO JSON \u2014\n' + JSON.stringify(vjson, null, 2));
      });
    } catch (e) { thinking.textContent = 'Error: ' + e.message; }
  }

  /* ---------- photo -> filled video JSON ---------- */
  async function analyzeToJson(file) {
    if (!ensureKey()) return;
    addMsg('user', '[Attached a reference photo -> build video JSON]');
    var thinking = renderMsg('model', 'Analyzing image...');
    try {
      var b64 = await fileToB64(file);
      var template = (typeof vbJsonObj === 'function') ? vbJsonObj('[DIALOGUE - replace with your script line]') : { character: '', dialogue: '' };
      var instruction =
        'Analyze the attached reference photo and return ONE JSON object as a video-clip prompt.\n' +
        'Use EXACTLY this schema and keys (do not rename or drop keys):\n\n' + JSON.stringify(template, null, 2) + '\n\n' +
        'Fill "character" with a detailed physical description from the photo. Keep all lock booleans and the "rules" array exactly as given. Keep "voice" and "camera" as given. Keep "dialogue" as the placeholder. ADD one top-level key "reference_analysis" describing wardrobe, setting, lighting, framing, mood, and any products in frame.\n' +
        'Output ONLY the JSON. No markdown fences, no commentary.';
      var out = stripFences(await apiCall([{ role: 'user', parts: [imgPart(b64, file.type), { text: instruction }] }],
        'You are a precise vision analyst for a video-prompt builder. You only output valid JSON.'));
      thinking.textContent = out || '(no JSON returned)';
      history.push({ role: 'model', text: out }); saveHistory();
    } catch (e) { thinking.textContent = 'Error: ' + e.message; }
  }

  /* ---------- describe-from-photo field buttons ---------- */
  function describePhoto(file) {
    return fileToB64(file).then(function (b64) {
      return apiCall([{ role: 'user', parts: [imgPart(b64, file.type), { text:
        'Look at this photo of a person. Write ONE concise but vivid physical description (about 25-40 words) usable as a video character reference: approximate age, gender, ethnicity cues, face shape, hair, facial hair, skin, build, and any distinctive features. Plain text only, no preamble, no quotes.' }] }],
        'You describe people for casting/reference. Output one plain-text line only.');
    });
  }
  function renameLabel(inputId, text) {
    var el = document.getElementById(inputId); if (!el) return;
    var fr = el.closest('.vb-fr') || el.parentNode;
    var lab = fr && fr.querySelector('label'); if (lab) lab.textContent = text;
  }
  function attachFieldButton(inputId, mode) {
    var inp = document.getElementById(inputId);
    if (!inp || inp._pbHooked) return;
    inp._pbHooked = true;
    var fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.style.display = 'none';
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'vb-mini'; btn.style.cssText = 'margin-top:6px;cursor:pointer';
    btn.innerHTML = '<i class="ti ti-camera"></i> Describe from photo';
    btn.onclick = function () { if (ensureKey()) fi.click(); };
    fi.addEventListener('change', async function () {
      if (!fi.files || !fi.files[0]) return;
      var f = fi.files[0]; fi.value = '';
      var old = btn.innerHTML; btn.innerHTML = '<i class="ti ti-loader"></i> Reading...'; btn.disabled = true;
      try {
        var desc = (await describePhoto(f)).trim();
        if (mode === 'show') { openPanel(); addMsg('user', '[Product reference photo analyzed]'); addMsg('model', desc); }
        else { inp.value = desc; inp.dispatchEvent(new Event('input', { bubbles: true })); }
      } catch (e) { openPanel(); addMsg('model', 'Error: ' + e.message); }
      btn.innerHTML = old; btn.disabled = false;
    });
    inp.parentNode.appendChild(btn); inp.parentNode.appendChild(fi);
  }

  /* ---------- Recreate mode ---------- */
  var recImg = null, recPersonImg = null;
  function injectRecreateMode() {
    var sel = document.getElementById('modeSelect'), wrap = document.querySelector('.vb-wrap');
    if (!sel || !wrap || document.getElementById('recreateCard')) return;
    if (!Array.prototype.some.call(sel.options, function (o) { return o.value === 'recreate'; })) {
      var opt = document.createElement('option'); opt.value = 'recreate'; opt.textContent = 'Recreate'; sel.appendChild(opt);
    }
    var card = document.createElement('div');
    card.className = 'vb-card vbm m-recreate'; card.id = 'recreateCard'; card.style.display = 'none';
    card.innerHTML =
      '<div class="vb-st"><i class="ti ti-copy" style="font-size:18px"></i> Recreate from reference <span class="vb-badge">plain-text Flow prompt</span></div>' +
      '<div class="vb-fr"><label>Scene / reference image to recreate</label><button type="button" class="vb-send" id="recPick" style="width:100%"><i class="ti ti-upload"></i> Upload scene reference</button></div>' +
      '<div id="recThumbWrap" style="display:none;margin-top:8px"><img id="recThumb" alt="reference" style="max-width:140px;border-radius:10px;border:1px solid #333"></div>' +
      '<div class="vb-fr" style="margin-top:10px"><label>Person to recreate with (their reference photo)</label><button type="button" class="vb-send" id="recPersonPick" style="width:100%"><i class="ti ti-user"></i> Upload person photo</button></div>' +
      '<div id="recPersonThumbWrap" style="display:none;margin-top:8px"><img id="recPersonThumb" alt="person" style="max-width:140px;border-radius:10px;border:1px solid #333"></div>' +
      '<div class="vb-lbl" style="margin-top:12px">Options</div>' +
      '<label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="checkbox" id="recOntoChar" checked> If no person photo: recreate onto my locked character (Character field)</label>' +
      '<label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="checkbox" id="recOverlay"> Include overlay (recreate on-screen text / graphics)</label>' +
      '<label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="checkbox" id="recRemoveUI" checked> Remove UI from reference (strip app / phone interface, captions, watermarks)</label>' +
      '<label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="checkbox" id="recKeepFraming" checked> Keep original framing, pose &amp; lighting</label>' +
      '<div class="vb-grid2" style="margin-top:10px"><div class="vb-fr"><label>Aspect ratio</label><select id="recAspect"><option>9:16</option><option>16:9</option><option>1:1</option><option>4:5</option><option>3:4</option></select></div></div>' +
      '<button type="button" class="vb-send" id="recGo" style="width:100%;margin-top:12px"><i class="ti ti-wand"></i> Generate recreate prompt</button>' +
      '<div class="vb-prev" style="margin-top:12px"><div class="vb-plain" id="recOut" style="white-space:pre-wrap">Upload a reference, then generate.</div><button type="button" class="vb-mini" id="recCopy" style="margin-top:8px"><i class="ti ti-copy"></i> Copy prompt</button></div>';
    wrap.appendChild(card);
    var fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.style.display = 'none'; card.appendChild(fi);
    card.querySelector('#recPick').onclick = function () { fi.click(); };
    fi.addEventListener('change', async function () {
      if (!fi.files || !fi.files[0]) return;
      var f = fi.files[0]; fi.value = '';
      recImg = { b64: await fileToB64(f), mime: f.type || 'image/jpeg' };
      card.querySelector('#recThumb').src = 'data:' + recImg.mime + ';base64,' + recImg.b64;
      card.querySelector('#recThumbWrap').style.display = 'block';
    });
    var fiP = document.createElement('input'); fiP.type = 'file'; fiP.accept = 'image/*'; fiP.style.display = 'none'; card.appendChild(fiP);
    card.querySelector('#recPersonPick').onclick = function () { fiP.click(); };
    fiP.addEventListener('change', async function () {
      if (!fiP.files || !fiP.files[0]) return;
      var f = fiP.files[0]; fiP.value = '';
      recPersonImg = { b64: await fileToB64(f), mime: f.type || 'image/jpeg' };
      card.querySelector('#recPersonThumb').src = 'data:' + recPersonImg.mime + ';base64,' + recPersonImg.b64;
      card.querySelector('#recPersonThumbWrap').style.display = 'block';
    });
    card.querySelector('#recGo').onclick = recreateGo;
    card.querySelector('#recCopy').onclick = function () { navigator.clipboard && navigator.clipboard.writeText(card.querySelector('#recOut').textContent); };
    if (typeof window.vbSend === 'function') {
      var origSend = window.vbSend;
      window.vbSend = function () { if (typeof vbModes !== 'undefined' && vbModes.mode === 'recreate') return; return origSend.apply(this, arguments); };
    }
  }
  async function recreateGo() {
    if (!ensureKey()) return;
    var card = document.getElementById('recreateCard'), out = card.querySelector('#recOut');
    if (!recImg) { out.textContent = 'Upload a scene / reference image first.'; return; }
    out.textContent = 'Generating...';
    try {
      var onto = card.querySelector('#recOntoChar').checked, overlay = card.querySelector('#recOverlay').checked,
          removeUI = card.querySelector('#recRemoveUI').checked, keep = card.querySelector('#recKeepFraming').checked,
          aspect = card.querySelector('#recAspect').value,
          charDesc = (document.getElementById('character') || {}).value || 'my locked reference character',
          hasPerson = !!recPersonImg;
      var lines = [];
      if (hasPerson) {
        lines.push('You are given TWO images. The FIRST image is the SCENE to recreate. The SECOND image is the PERSON who must appear in it.');
        lines.push('Write a SINGLE plain-text prompt for Google Flow / Veo that recreates the FIRST image as a video shot, but featuring the PERSON from the SECOND image instead of whoever appears in the first.');
        lines.push('Describe the person from the second image in detail (age, gender, ethnicity cues, face, hair, facial hair, skin, build, distinctive features) so their identity is preserved, and state that their likeness is locked to the provided person reference.');
      } else {
        lines.push('Analyze the attached reference image and write a SINGLE plain-text prompt for Google Flow / Veo that recreates it as a video shot.');
        if (onto) lines.push('The subject must be MY character, identity locked to my uploaded reference: ' + charDesc + '. Replace the person in the reference with my character while keeping the scene.');
        else lines.push('Recreate the subject as shown in the reference.');
      }
      lines.push('Describe the setting, wardrobe, pose, action, composition, camera angle/shot and lighting from the scene reference faithfully.');
      if (keep) lines.push('Match the original framing, pose and lighting closely.');
      if (overlay) lines.push('Recreate any on-screen text or graphic overlays visible in the scene reference, faithfully.');
      else lines.push('Do not add any on-screen text, captions or graphic overlays.');
      if (removeUI) lines.push('The scene reference may be a screenshot: ignore and EXCLUDE all app/phone UI, buttons, status bars, platform captions, watermarks and interface chrome. Recreate only the real photographed scene.');
      lines.push('Aspect ratio: ' + aspect + '. Photoreal, single continuous shot, no cuts. Output ONLY the prompt text - no preamble, no JSON, no markdown.');

      var parts = [imgPart(recImg.b64, recImg.mime)];
      if (hasPerson) parts.push(imgPart(recPersonImg.b64, recPersonImg.mime));
      parts.push({ text: lines.join('\n') });

      var txt = await apiCall([{ role: 'user', parts: parts }],
        'You write concise, vivid plain-text prompts for Google Flow / Veo video generation. Output only the prompt text.');
      out.textContent = stripFences(txt).trim() || '(no prompt returned)';
    } catch (e) { out.textContent = 'Error: ' + e.message; }
  }

  /* ---------- init ---------- */
  function init() {
    build();
    renameLabel('imgRef', 'Description');           attachFieldButton('imgRef', 'fill');
    renameLabel('hkRefA', 'Description (Person A)'); attachFieldButton('hkRefA', 'fill');
    renameLabel('hkRefB', 'Description (Person B)'); attachFieldButton('hkRefB', 'fill');
    attachFieldButton('pdRef', 'show');
    window.pbAttachDescribe = attachFieldButton; // used by hook-people.js for added persons
    injectRecreateMode();
    if (typeof vbSetMode === 'function' && document.getElementById('modeSelect')) vbSetMode(document.getElementById('modeSelect').value || 'script');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();