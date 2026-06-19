/* ============================================================
   hook-people.js  —  N-person support for Hook mode
   Install in index.html AFTER system.js (and after gemini.js):
       <script src="system.js"></script>
       <script src="gemini.js"></script>
       <script src="hook-people.js"></script>

   Adds Person C..F to Hook mode with a "+ Add person" button,
   extends every line's speaker dropdown, and generalizes the
   clip builder + preview (which were hardwired to A/B).
   Persons persist via the app's own localStorage state.
   ============================================================ */
(function () {
  var EXTRA = ['C', 'D', 'E', 'F'];           // addable beyond A,B
  var ALL = ['A', 'B'].concat(EXTRA);

  function $(id) { return document.getElementById(id); }
  function present() { return ALL.filter(function (L) { return $('hkName' + L); }); }
  function nameOf(L) { return (($('hkName' + L) || {}).value) || ('Person ' + L); }

  /* ---- build one person block (C..F) ---- */
  function personHTML(L) {
    return '' +
      '<div class="vb-div" data-person-div="' + L + '"></div>' +
      '<div class="vb-lbl" data-person="' + L + '">Person ' + L + '</div>' +
      '<div class="vb-grid2">' +
        '<div class="vb-fr"><label>Label</label><input type="text" id="hkName' + L + '" value="Person ' + L + '" oninput="vbHookUI()"></div>' +
        '<div class="vb-fr"><label>Accent</label><select id="hkAccent' + L + '" onchange="vbHookUI()"></select></div>' +
      '</div>' +
      '<div class="vb-fr" id="hkAccent' + L + 'CustomWrap" style="display:none;margin-top:8px"><label>Custom accent (Person ' + L + ')</label><input type="text" id="hkAccent' + L + 'Custom" value="" placeholder="e.g. Trinidadian, Lagos Nigerian…" oninput="vbHookUI()"></div>' +
      '<div class="vb-fr" style="margin-top:8px"><label>Character (Person ' + L + ')</label><input type="text" id="hkChar' + L + '" value="" placeholder="e.g. woman in her 40s" oninput="vbHookUI()"></div>' +
      '<div class="vb-row" style="margin-top:8px"><label>Accent strength</label><input type="range" id="hkPct' + L + '" min="0" max="100" step="5" value="100" oninput="vbHookUI()"><span class="ro" id="hkPct' + L + 'Ro">100%</span></div>' +
      '<div class="vb-fr" style="margin-top:4px"><label>Description (Person ' + L + ')</label><input type="text" id="hkRef' + L + '" value="USE PERSON ' + L + ' REFERENCE IMAGE EXACTLY" oninput="vbHookUI()"></div>';
  }

  function addPersonCard(L, opts) {
    if ($('hkName' + L)) return;
    var card = $('hookCard'); if (!card) return;
    var holder = document.createElement('div');
    holder.setAttribute('data-person-block', L);
    holder.innerHTML = personHTML(L);
    var ctrls = $('hkPeopleCtrls');
    if (ctrls && ctrls.parentNode === card) card.insertBefore(holder, ctrls);
    else card.appendChild(holder);
    // accent options
    if (typeof vbOpts === 'function' && typeof HK_ACCENTS !== 'undefined') {
      $('hkAccent' + L).innerHTML = vbOpts(HK_ACCENTS, (opts && opts.accent) || 'General American');
    }
    if (opts) {
      if (opts.name != null) $('hkName' + L).value = opts.name;
      if (opts.char != null) $('hkChar' + L).value = opts.char;
      if (opts.ref != null) $('hkRef' + L).value = opts.ref;
      if (opts.pct != null) $('hkPct' + L).value = opts.pct;
      if (opts.accent != null) $('hkAccent' + L).value = opts.accent;
      if (opts.accentCustom != null) $('hkAccent' + L + 'Custom').value = opts.accentCustom;
    }
    // same "Describe from photo" button as A/B
    if (typeof window.pbAttachDescribe === 'function') window.pbAttachDescribe('hkRef' + L, 'fill');
    updateCtrls();
  }

  function removeLastPerson() {
    var p = present();
    if (p.length <= 2) return;
    var L = p[p.length - 1];
    var block = document.querySelector('[data-person-block="' + L + '"]');
    if (block) block.parentNode.removeChild(block);
    // any line pointing at the removed person falls back to A
    document.querySelectorAll('#hkTurns .hk-speaker').forEach(function (s) { if (s.value === L) s.value = 'A'; });
    refreshSpeakers(); updateCtrls();
    if (typeof vbHookUI === 'function') vbHookUI();
    if (typeof vbSaveDebounced === 'function') vbSaveDebounced();
  }

  function addNextPerson() {
    var p = present();
    var L = EXTRA.filter(function (x) { return p.indexOf(x) === -1; })[0];
    if (!L) return;
    addPersonCard(L);
    refreshSpeakers();
    if (typeof vbHookUI === 'function') vbHookUI();
    if (typeof vbSaveDebounced === 'function') vbSaveDebounced();
  }

  function updateCtrls() {
    var rem = $('hkRemovePerson'); if (rem) rem.style.display = present().length > 2 ? '' : 'none';
    var add = $('hkAddPerson'); if (add) add.style.display = present().length >= ALL.length ? 'none' : '';
  }

  /* ---- speaker dropdowns: list all present persons ---- */
  function refreshSpeakers() {
    var p = present();
    document.querySelectorAll('#hkTurns .hk-speaker').forEach(function (sel) {
      var cur = sel.value;
      sel.innerHTML = p.map(function (L) { return '<option value="' + L + '">' + nameOf(L) + '</option>'; }).join('');
      sel.value = (p.indexOf(cur) > -1) ? cur : 'A';
    });
  }

  /* ---- generalized camera resolver (handles >2) ---- */
  function camResolve(camSel, row, speaker, listener, allNames) {
    var bothTxt = allNames.length <= 2 ? (allNames.join(' and ')) : ('all participants (' + allNames.join(', ') + ')');
    if (camSel === 'Custom…') { var c = ((row.querySelector('.hk-cam-custom') || {}).value || '').trim(); return { phrase: c || ('medium close-up on ' + speaker), coverage: 'custom', focus: speaker }; }
    switch (camSel) {
      case 'Focus on the speaker': return { phrase: 'medium close-up focused on ' + speaker + ' as they speak', coverage: 'single', focus: speaker };
      case 'Close-up on the speaker': return { phrase: 'close-up on ' + speaker, coverage: 'single', focus: speaker };
      case 'Medium shot on the speaker': return { phrase: 'medium shot on ' + speaker, coverage: 'single', focus: speaker };
      case 'Over-the-shoulder toward the speaker': return { phrase: 'over-the-shoulder shot from behind ' + listener + ', framing ' + speaker, coverage: 'over-the-shoulder', focus: speaker };
      case 'Reaction shot on the listener': return { phrase: 'reaction shot on ' + listener + ' listening to ' + speaker, coverage: 'reaction', focus: listener };
      case 'Two-shot (both in frame)': return { phrase: 'shot with ' + bothTxt + ' in the frame', coverage: 'group', focus: 'all' };
      case 'Wide establishing shot': return { phrase: 'wide establishing shot showing everyone and the setting', coverage: 'wide', focus: 'all' };
      default: return { phrase: 'medium close-up focused on ' + speaker, coverage: 'single', focus: speaker };
    }
  }

  /* ---- generalized clip builder (replaces A/B-only one) ---- */
  function buildClips() {
    var letters = present();
    var people = {};
    letters.forEach(function (L) {
      people[L] = {
        name: nameOf(L),
        character: vbG('hkChar' + L) || ('Person ' + L),
        accent: (typeof vbHookAccent === 'function') ? vbHookAccent(L) : 'General American',
        pct: (typeof vbHookPct === 'function') ? vbHookPct(L) : 100,
        ref: vbG('hkRef' + L) || ('USE PERSON ' + L + ' REFERENCE IMAGE EXACTLY')
      };
    });
    var allNames = letters.map(function (L) { return people[L].name; });
    var rows = document.querySelectorAll('#hkTurns .hk-turn');
    var clips = [], n = 0;
    rows.forEach(function (row) {
      var spk = row.querySelector('.hk-speaker').value;
      if (!people[spk]) spk = 'A';
      var P = people[spk];
      var others = letters.filter(function (L) { return L !== spk; }).map(function (L) { return people[L].name; });
      var listener = others[0] || 'the other person';
      var camSel = row.querySelector('.hk-cam').value;
      var line = (row.querySelector('.hk-line').value || '').trim();
      var emotion = (row.querySelector('.hk-emotion') || {}).value || 'Neutral / conversational';
      var reaction = (row.querySelector('.hk-reaction') || {}).value || 'Listens naturally, subtle nods';
      var word = (typeof vbAccentStrengthWord === 'function') ? vbAccentStrengthWord(P.pct) : '';
      var cam = camResolve(camSel, row, P.name, listener, allNames);
      var emoLower = emotion.toLowerCase(), reactLower = reaction.toLowerCase();
      var accRule = P.pct >= 100
        ? ('Keep ' + P.name + "'s full " + P.accent + ' accent locked and consistent for every word')
        : ('Keep ' + P.name + "'s " + P.accent + ' accent at about ' + P.pct + '% strength (' + word + '), consistent for every word');
      var othersTxt = others.length ? others.join(', ') : 'the others';
      n++;
      clips.push({
        clip: n,
        image_reference: P.ref,
        scene_type: allNames.length > 2 ? 'multi-person dialogue' : 'two-person dialogue',
        participants: allNames,
        setting: { preserve_reference_background: true, background_changes: false, background_animation: false, constant_from_start_to_finish: true },
        on_camera: cam.focus,
        active_speaker: P.name,
        character: P.character,
        voice: { accent: P.accent, accent_percentage: P.pct, accent_strength: P.pct + '% — ' + word, accent_lock: true, speech_speed: 'natural moderately fast', clarity: 'clear and easy to understand', tone: 'natural conversational', delivery: emotion, maintain_accent_during_speech: true },
        camera: { shot: cam.phrase, coverage: cam.coverage, focus_on: cam.focus, movement: 'none', zoom: 'none', pan: 'none', tilt: 'none', rotation: 'none', framing: 'locked for this clip' },
        behavior: { speaker_eye_contact: 'natural, toward ' + listener, speaker_emotion: emotion, listener_reaction: reaction, listener_behavior: reactLower + ', does not speak', natural_blinking: true, natural_breathing: true, subtle_head_movements: true, avoid_overacting: true, avoid_exaggerated_expressions: true },
        editing: { within_clip_cuts: false, transitions: false, scene_changes: false, effects: false, filters: false, motion_graphics: false },
        rules: [
          'Single uninterrupted continuous shot within this clip',
          'No camera movement, zoom, pan, or tilt within the clip',
          'Maintain exact likeness of each person from their reference image',
          'Preserve the exact reference background; never change or animate it',
          accRule,
          P.name + ' delivers the line in a ' + emoLower + ' manner',
          'Only ' + P.name + ' speaks this line; ' + othersTxt + ' react (' + reactLower + ') and do not talk',
          'Natural blinking, breathing, and subtle head movements',
          'No captions, subtitles, or on-screen text',
          'No exaggerated facial expressions or hand gestures'
        ],
        dialogue: { speaker: P.name, line: line || '[INSERT LINE HERE]' }
      });
    });
    return clips;
  }

  /* ---- generalized vbHookUI (toggles + readouts for all persons) ---- */
  function hookUI() {
    present().forEach(function (L) {
      var w = $('hkAccent' + L + 'CustomWrap');
      if (w) w.style.display = (vbG('hkAccent' + L) === 'Custom…') ? 'flex' : 'none';
      var ro = $('hkPct' + L + 'Ro');
      if (ro && typeof vbHookPct === 'function') ro.textContent = vbHookPct(L) + '%';
    });
    refreshSpeakers();
    document.querySelectorAll('#hkTurns .hk-turn').forEach(function (row) {
      var cc = row.querySelector('.hk-cam-custom');
      if (cc) cc.style.display = (row.querySelector('.hk-cam').value === 'Custom…') ? 'block' : 'none';
    });
    if (typeof vbHookRender === 'function') vbHookRender();
  }

  /* ---- controls row (+ Add / Remove) ---- */
  function injectControls() {
    var card = $('hookCard'); if (!card || $('hkPeopleCtrls')) return;
    var row = document.createElement('div');
    row.id = 'hkPeopleCtrls';
    row.style.cssText = 'display:flex;gap:8px;margin-top:12px';
    row.innerHTML =
      '<button type="button" class="vb-send" id="hkAddPerson" style="flex:1;margin-top:0"><i class="ti ti-user-plus" style="font-size:14px"></i> Add person</button>' +
      '<button type="button" class="vb-mini" id="hkRemovePerson" style="display:none"><i class="ti ti-user-minus" style="font-size:14px"></i> Remove last</button>';
    card.appendChild(row);
    $('hkAddPerson').onclick = addNextPerson;
    $('hkRemovePerson').onclick = removeLastPerson;
  }

  /* ---- restore persons saved in pb_state (created before our code ran) ---- */
  function restore() {
    var data = null;
    try { data = JSON.parse(localStorage.getItem('pb_state')); } catch (e) {}
    if (!data || !data.fields) return;
    EXTRA.forEach(function (L) {
      if (data.fields['hkName' + L] != null && !$('hkName' + L)) {
        addPersonCard(L, {
          name: data.fields['hkName' + L],
          char: data.fields['hkChar' + L],
          ref: data.fields['hkRef' + L],
          pct: data.fields['hkPct' + L],
          accent: data.fields['hkAccent' + L],
          accentCustom: data.fields['hkAccent' + L + 'Custom']
        });
      }
    });
    refreshSpeakers();
    // re-apply saved per-line speakers (the app set them before C+ existed)
    if (data.hook && data.hook.length) {
      var rows = document.querySelectorAll('#hkTurns .hk-turn');
      data.hook.forEach(function (t, i) {
        var sel = rows[i] && rows[i].querySelector('.hk-speaker');
        if (sel && present().indexOf(t.spk) > -1) sel.value = t.spk;
      });
    }
  }

  /* ---- init ---- */
  function init() {
    if (!$('hookCard')) return;
    injectControls();
    // override the A/B-only functions with N-person versions
    window.vbHookClips = buildClips;
    window.vbHookUI = hookUI;
    // keep new lines' speaker dropdowns in sync when added programmatically/by user
    var turns = $('hkTurns');
    if (turns && window.MutationObserver) {
      new MutationObserver(function () { refreshSpeakers(); }).observe(turns, { childList: true });
    }
    restore();
    updateCtrls();
    hookUI();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();