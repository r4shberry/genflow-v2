const vbModes={mode:'script'};
function vbSetMode(m){vbModes.mode=m;
  const sel=document.getElementById('modeSelect');if(sel&&sel.value!==m)sel.value=m;
  document.querySelectorAll('.vbm').forEach(function(c){
    c.style.display=c.classList.contains('m-'+m)?'':'none';
  });
  vbVideoPage=0;vbHookPage=0;
  const txt=document.getElementById('vbSendTxt'),ic=document.getElementById('vbSendIcon'),btn=document.getElementById('vbSendBtn');
  if(btn)btn.classList.remove('is-copied');
  if(txt&&ic){
    if(m==='image'){txt.textContent='Send to chat — build image JSON ↗';ic.className='ti ti-photo';}
    else if(m==='product'){txt.textContent='Copy product image prompt';ic.className='ti ti-copy';}
    else if(m==='hook'){txt.textContent='Send to chat — build hook dialogue clips ↗';ic.className='ti ti-messages';}
    else{txt.textContent='Send to chat — build JSON clips ↗';ic.className='ti ti-wand';}
  }
  vbSaveDebounced();
}
function vbG(id){return (document.getElementById(id)||{}).value||'';}
function vbBgToggle(){document.getElementById('imgBgCustomWrap').style.display=(vbG('imgBg')==='Custom…')?'flex':'none';}
function vbWardrobeToggle(){document.getElementById('imgWardrobeCustomWrap').style.display=(vbG('imgWardrobe')==='Custom…')?'flex':'none';}
function vbShotToggle(){document.getElementById('imgShotCustomWrap').style.display=(vbG('imgShot')==='Custom…')?'flex':'none';}
function vbPoseToggle(){document.getElementById('imgPoseCustomWrap').style.display=(vbG('imgPose')==='Custom…')?'flex':'none';}
function vbActivityToggle(){document.getElementById('imgActivityCustomWrap').style.display=(vbG('imgActivity')==='Custom…')?'flex':'none';}
function vbCompOn(c){const el=document.querySelector('#imgCompChips .vb-chip[data-c="'+c+'"]');return !!(el&&el.classList.contains('on-purple'));}
function vbCompToggle(){
  document.getElementById('imgTwinWrap').style.display=vbCompOn('twin')?'block':'none';
  document.getElementById('imgCompanionCustomWrap').style.display=vbCompOn('custom')?'flex':'none';
}
function vbCompChip(el){el.classList.toggle('on-purple');vbCompToggle();vbImgUI();vbSaveDebounced();}
function vbAccentName(){
  var v=vbG('vAccent')||'Jamaican';
  if(v==='Custom…'){return (vbG('vAccentCustom').trim())||'a specific accent';}
  return v;
}
function vbAccentPct(){var v=parseInt(vbG('vAccentPct'),10);if(isNaN(v))v=100;return Math.max(0,Math.min(100,v));}
function vbAccentStrengthWord(p){
  if(p<=0)return 'no accent, neutral English';
  if(p<=20)return 'very light, just a subtle hint';
  if(p<=40)return 'light';
  if(p<=60)return 'moderate';
  if(p<=80)return 'strong';
  if(p<100)return 'very strong';
  return 'maximum, fully native';
}
function vbJsonObj(dialogue){
  var acc=vbAccentName();
  var accUpper=acc.toUpperCase();
  var pct=vbAccentPct();
  var word=vbAccentStrengthWord(pct);
  var firstRule = pct>=100 ? ('PURE '+accUpper+' ACCENT ONLY (maximum strength)')
    : (pct<=0 ? 'SPEAK IN NEUTRAL ENGLISH WITH NO SPECIFIC ACCENT'
              : ('SPEAK ENGLISH WITH A '+pct+'% '+accUpper+' ACCENT ('+word+')'));
  var maintainRule = pct>=100 ? ('Maintain the full '+acc+' accent from the first word to the last word')
    : (pct<=0 ? 'Keep a neutral accent throughout'
              : ('Maintain a consistent '+pct+'% '+acc+' accent ('+word+') from the first word to the last word — do not make it heavier or lighter mid-sentence'));
  return {
    image_reference: vbG('imgRef')||'USE PROVIDED IMAGE REFERENCE EXACTLY',
    character: vbG('character')||'60-year-old Jamaican elder',
    voice:{
      accent: accUpper,
      accent_percentage: pct,
      accent_strength: pct+'% — '+word,
      accent_lock:true,
      native_speaker: pct>=80,
      speech_speed: vbG('vspeed')||'moderately fast',
      pace: vbG('vpace')||'natural conversational pace',
      clarity: vbG('vclarity')||'very clear and easy to understand',
      tone: vbG('vtone')||'friendly, confident, energetic, conversational',
      rhythm:'authentic '+acc,
      pronunciation:'authentic '+acc,
      maintain_accent_during_speech:true
    },
    camera:{shot:'medium close-up',movement:'none',zoom:'none',pan:'none',tilt:'none',rotation:'none',angle_changes:'none',framing:'locked'},
    background:{preserve_reference_background:true,background_replacement:false,background_changes:false,background_animation:false,constant_from_start_to_finish:true},
    appearance:{maintain_exact_likeness:true,preserve_identity:true,preserve_face:true,preserve_hair:true,preserve_clothing:true,preserve_skin_tone:true},
    behavior:{eye_contact:'directly at camera',natural_blinking:true,natural_breathing:true,subtle_head_movements:true,minimal_natural_hand_gestures:true,facial_expression:'subtle and realistic',avoid_overacting:true,avoid_exaggerated_expressions:true},
    editing:{cuts:false,transitions:false,scene_changes:false,effects:false,filters:false,motion_graphics:false,camera_switches:false},
    rules:[
      firstRule,
      'Accent priority is higher than all other instructions',
      maintainRule,
      'Speak at a natural moderately fast conversational pace',
      'Do not speak too fast',
      'Allow natural pauses between sentences',
      'Prioritize clarity while keeping the '+acc+' accent at '+pct+'% strength',
      'Keep the accent at the chosen strength; do not drift to a different accent',
      'Maintain exact likeness of the reference image',
      'Maintain exact background from the reference image',
      'Never change the background',
      'Never replace the background',
      'Never animate the background',
      'No transitions',
      'No cuts',
      'No scene changes',
      'No camera movement',
      'No zoom effects',
      'No angle changes',
      'Single uninterrupted continuous shot',
      'No captions',
      'No subtitles',
      'No text on screen',
      'No visual effects',
      'No exaggerated facial expressions',
      'No exaggerated hand gestures'
    ],
    dialogue: dialogue
  };
}
function vbJson(dialogue){return JSON.stringify(vbJsonObj(dialogue),null,2);}
function vbJsonUI(){
  var aw=document.getElementById('vAccentCustomWrap');if(aw)aw.style.display=(vbG('vAccent')==='Custom…')?'flex':'none';
  var acc=vbAccentName(),pct=vbAccentPct();
  var ro=document.getElementById('vAccentPctRo');if(ro)ro.textContent=pct+'%';
  var badge=document.getElementById('vAccentBadge');if(badge)badge.textContent=acc+' · '+pct+'% · locked';
  var ln=document.getElementById('vLockName');if(ln)ln.textContent=(pct>=100?('Full '+acc+' accent'):(pct+'% '+acc+' accent'));
  vbRenderVideo();
}

const HK_ACCENTS=[
  'Jamaican','General American','Southern US','New York','Boston','Midwestern US','Californian','Texan','African American Vernacular (AAVE)','Canadian',
  'British (Received Pronunciation)','Cockney / London','Multicultural London','Northern English','Scouse (Liverpool)','Geordie (Newcastle)','West Country','Welsh','Irish','Scottish',
  'Australian','New Zealand','South African','Indian','Pakistani','Singaporean','Filipino','Trinidadian','Bahamian','Barbadian',
  'Albanian','Armenian','Austrian German','Basque','Belarusian','Bosnian','Bulgarian','Catalan','Croatian','Czech','Danish','Dutch','Estonian','Finnish','Flemish','French','Galician','Georgian','German','Greek','Hungarian','Icelandic','Italian','Latvian','Lithuanian','Luxembourgish','Macedonian','Maltese','Norwegian','Polish','Portuguese (European)','Romanian','Russian','Serbian','Slovak','Slovenian','Spanish (Castilian)','Swedish','Swiss German','Ukrainian',
  'Brazilian Portuguese','Mexican Spanish','Argentine Spanish','Chilean Spanish','Colombian Spanish','Cuban Spanish','Dominican Spanish','Peruvian Spanish','Puerto Rican Spanish','Venezuelan Spanish','Caribbean Spanish','Quebecois French','Haitian Creole',
  'Arabic (Egyptian)','Arabic (Gulf)','Arabic (Levantine)','Arabic (Maghrebi)','Hebrew','Persian / Farsi','Dari','Pashto','Kurdish','Turkish','Azerbaijani','Kazakh','Kyrgyz','Tajik','Turkmen','Uzbek','Mongolian',
  'Hindi','Urdu','Bengali','Punjabi','Tamil','Telugu','Kannada','Malayalam','Marathi','Gujarati','Odia','Assamese','Nepali','Sinhala','Dhivehi',
  'Mandarin Chinese','Cantonese','Taiwanese Mandarin','Japanese','Korean','Tibetan',
  'Vietnamese','Thai','Lao','Khmer','Burmese','Indonesian','Malay','Tagalog','Cebuano','Javanese',
  'Nigerian','Ghanaian','Yoruba','Igbo','Hausa','Swahili','Amharic','Tigrinya','Somali','Oromo','Zulu','Xhosa','Afrikaans','Shona','Wolof','Lingala','Akan / Twi','Kinyarwanda','Luganda','Malagasy',
  'Hawaiian','Samoan','Tongan','Fijian','Maori','Tok Pisin',
  'Neutral / no specific accent','Custom…'
];
const HK_CAMS=['Focus on the speaker','Close-up on the speaker','Medium shot on the speaker','Over-the-shoulder toward the speaker','Reaction shot on the listener','Two-shot (both in frame)','Wide establishing shot','Custom…'];
const HK_EMOTION=['Neutral / conversational','Curious','Excited','Confident','Skeptical','Surprised','Reassuring','Serious','Playful','Empathetic','Frustrated','Secretive / hushed','Emphatic'];
const HK_REACT=['Listens naturally, subtle nods','Leaning in, interested','Skeptical, raised eyebrow','Surprised','Smiling, amused','Concerned','Nodding in agreement','Shaking head, doubtful','Thinking, looking away','Eyes widening, intrigued'];
function vbOpts(arr,sel){return arr.map(function(o){return '<option'+(o===sel?' selected':'')+'>'+o+'</option>';}).join('');}
let hkTurnSeq=0;
function vbHookTurnHTML(cam,line,emotion,reaction){
  const id=++hkTurnSeq;
  return '<div class="hk-turn" data-id="'+id+'">'
    +'<div class="hk-turn-top">'
      +'<select class="hk-speaker" onchange="vbHookUI()"><option value="A">Person A</option><option value="B">Person B</option></select>'
      +'<select class="hk-cam" onchange="vbHookUI()">'+vbOpts(HK_CAMS,cam||'Focus on the speaker')+'</select>'
      +'<button onclick="vbHookDelTurn(this)" aria-label="Remove line"><i class="ti ti-trash" style="font-size:13px" aria-hidden="true"></i></button>'
    +'</div>'
    +'<textarea class="hk-line" rows="2" placeholder="What this person says…" oninput="vbHookUI()" style="margin-top:8px"></textarea>'
    +'<input type="text" class="hk-cam-custom" placeholder="Custom camera shot…" oninput="vbHookUI()" style="display:none;margin-top:8px">'
    +'<div class="hk-turn-meta">'
      +'<select class="hk-emotion" onchange="vbHookUI()" title="Speaker delivery">'+vbOpts(HK_EMOTION,emotion||'Neutral / conversational')+'</select>'
      +'<select class="hk-reaction" onchange="vbHookUI()" title="Listener reaction">'+vbOpts(HK_REACT,reaction||'Listens naturally, subtle nods')+'</select>'
    +'</div>';
}
function vbHookAddTurn(spk,cam,line,emotion,reaction){
  const wrap=document.getElementById('hkTurns');
  const div=document.createElement('div');
  div.innerHTML=vbHookTurnHTML(cam,line,emotion,reaction);
  const node=div.firstChild;
  wrap.appendChild(node);
  node.querySelector('.hk-speaker').value=spk||'A';
  if(line)node.querySelector('.hk-line').value=line;
  if(emotion)node.querySelector('.hk-emotion').value=emotion;
  if(reaction)node.querySelector('.hk-reaction').value=reaction;
  vbHookPage=wrap.querySelectorAll('.hk-turn').length-1;
  vbHookUI();vbSaveDebounced();
}
function vbHookDelTurn(btn){const t=btn.closest('.hk-turn');if(t)t.remove();vbHookUI();vbSaveDebounced();}
function vbHookAccent(which){
  const v=vbG('hkAccent'+which);
  if(v==='Custom…'){return (vbG('hkAccent'+which+'Custom').trim())||'a specific accent';}
  return v;
}
function vbHookPct(which){var v=parseInt(vbG('hkPct'+which),10);if(isNaN(v))v=100;return Math.max(0,Math.min(100,v));}
function vbHookCamResolve(camSel,row,speakerName,listenerName,nameA,nameB){
  if(camSel==='Custom…'){const c=((row.querySelector('.hk-cam-custom')||{}).value||'').trim();return {phrase:c||('medium close-up on '+speakerName),coverage:'custom',focus:speakerName};}
  switch(camSel){
    case 'Focus on the speaker': return {phrase:'medium close-up focused on '+speakerName+' as they speak',coverage:'single',focus:speakerName};
    case 'Close-up on the speaker': return {phrase:'close-up on '+speakerName,coverage:'single',focus:speakerName};
    case 'Medium shot on the speaker': return {phrase:'medium shot on '+speakerName,coverage:'single',focus:speakerName};
    case 'Over-the-shoulder toward the speaker': return {phrase:'over-the-shoulder shot from behind '+listenerName+', framing '+speakerName,coverage:'over-the-shoulder',focus:speakerName};
    case 'Reaction shot on the listener': return {phrase:'reaction shot on '+listenerName+' listening to '+speakerName,coverage:'reaction',focus:listenerName};
    case 'Two-shot (both in frame)': return {phrase:'two-shot with both '+nameA+' and '+nameB+' in the frame',coverage:'two-shot',focus:'both'};
    case 'Wide establishing shot': return {phrase:'wide establishing shot showing both people and the setting',coverage:'wide',focus:'both'};
    default: return {phrase:'medium close-up focused on '+speakerName,coverage:'single',focus:speakerName};
  }
}
function vbHookClips(){
  const nameA=vbG('hkNameA')||'Person A',nameB=vbG('hkNameB')||'Person B';
  const charA=vbG('hkCharA')||'Person A',charB=vbG('hkCharB')||'Person B';
  const accA=vbHookAccent('A'),accB=vbHookAccent('B');
  const pctA=vbHookPct('A'),pctB=vbHookPct('B');
  const refA=vbG('hkRefA')||'USE PERSON A REFERENCE IMAGE EXACTLY',refB=vbG('hkRefB')||'USE PERSON B REFERENCE IMAGE EXACTLY';
  const rows=document.querySelectorAll('#hkTurns .hk-turn');
  const clips=[];let n=0;
  rows.forEach(function(row){
    const spk=row.querySelector('.hk-speaker').value;
    const camSel=row.querySelector('.hk-cam').value;
    const line=(row.querySelector('.hk-line').value||'').trim();
    const emotion=(row.querySelector('.hk-emotion')||{}).value||'Neutral / conversational';
    const reaction=(row.querySelector('.hk-reaction')||{}).value||'Listens naturally, subtle nods';
    const isA=spk==='A';
    const speakerName=isA?nameA:nameB, listenerName=isA?nameB:nameA;
    const character=isA?charA:charB, accent=isA?accA:accB;
    const pct=isA?pctA:pctB, ref=isA?refA:refB, word=vbAccentStrengthWord(pct);
    const cam=vbHookCamResolve(camSel,row,speakerName,listenerName,nameA,nameB);
    const emoLower=emotion.toLowerCase(), reactLower=reaction.toLowerCase();
    const accRule = pct>=100 ? ('Keep '+speakerName+'\'s full '+accent+' accent locked and consistent for every word')
      : ('Keep '+speakerName+'\'s '+accent+' accent at about '+pct+'% strength ('+word+'), consistent for every word');
    n++;
    clips.push({
      clip:n,
      image_reference:ref,
      scene_type:'two-person dialogue',
      setting:{preserve_reference_background:true,background_changes:false,background_animation:false,constant_from_start_to_finish:true},
      on_camera:cam.focus,
      active_speaker:speakerName,
      character:character,
      voice:{accent:accent,accent_percentage:pct,accent_strength:pct+'% — '+word,accent_lock:true,speech_speed:'natural moderately fast',clarity:'clear and easy to understand',tone:'natural conversational',delivery:emotion,maintain_accent_during_speech:true},
      camera:{shot:cam.phrase,coverage:cam.coverage,focus_on:cam.focus,movement:'none',zoom:'none',pan:'none',tilt:'none',rotation:'none',framing:'locked for this clip'},
      behavior:{speaker_eye_contact:'natural, toward '+listenerName,speaker_emotion:emotion,listener_reaction:reaction,listener_behavior:reactLower+', does not speak',natural_blinking:true,natural_breathing:true,subtle_head_movements:true,avoid_overacting:true,avoid_exaggerated_expressions:true},
      editing:{within_clip_cuts:false,transitions:false,scene_changes:false,effects:false,filters:false,motion_graphics:false},
      rules:[
        'Single uninterrupted continuous shot within this clip',
        'No camera movement, zoom, pan, or tilt within the clip',
        'Maintain exact likeness of each person from their reference image',
        'Preserve the exact reference background; never change or animate it',
        accRule,
        speakerName+' delivers the line in a '+emoLower+' manner',
        'Only '+speakerName+' speaks this line; '+listenerName+' reacts ('+reactLower+') and does not talk',
        'Natural blinking, breathing, and subtle head movements',
        'No captions, subtitles, or on-screen text',
        'No exaggerated facial expressions or hand gestures'
      ],
      dialogue:{speaker:speakerName,line:line||'[INSERT LINE HERE]'}
    });
  });
  return clips;
}
function vbHookUI(){
  const ea=document.getElementById('hkAccentACustomWrap');if(ea)ea.style.display=(vbG('hkAccentA')==='Custom…')?'flex':'none';
  const eb=document.getElementById('hkAccentBCustomWrap');if(eb)eb.style.display=(vbG('hkAccentB')==='Custom…')?'flex':'none';
  var ra=document.getElementById('hkPctARo');if(ra)ra.textContent=vbHookPct('A')+'%';
  var rb=document.getElementById('hkPctBRo');if(rb)rb.textContent=vbHookPct('B')+'%';
  const nameA=vbG('hkNameA')||'Person A',nameB=vbG('hkNameB')||'Person B';
  document.querySelectorAll('#hkTurns .hk-turn').forEach(function(row){
    const ss=row.querySelector('.hk-speaker');
    if(ss&&ss.options.length>=2){ss.options[0].textContent=nameA;ss.options[1].textContent=nameB;}
    const cc=row.querySelector('.hk-cam-custom');
    if(cc)cc.style.display=(row.querySelector('.hk-cam').value==='Custom…')?'block':'none';
  });
  vbHookRender();
}
var vbHookPage=0;
function vbHookRender(){
  var out=document.getElementById('hkJsonOut');if(!out)return;
  var clips=vbHookClips();
  if(!clips.length){vbHookPage=0;out.innerHTML=vbVideoBlock('No lines yet','Add a line above to build the dialogue clips.');return;}
  var n=clips.length;
  if(vbHookPage>n-1)vbHookPage=n-1;if(vbHookPage<0)vbHookPage=0;
  var i=vbHookPage,clip=clips[i];
  var label='Clip '+(i+1)+' · '+(clip.active_speaker||'');
  var pager=n>1?vbPagerHTML(i,n,'vbHookNav'):'';
  out.innerHTML=pager+vbVideoBlock(label,JSON.stringify(clip,null,2));
}
function vbHookNav(d){var n=vbHookClips().length||1;vbHookPage=Math.max(0,Math.min(n-1,vbHookPage+d));vbHookRender();}
function vbHookAllText(){
  var clips=vbHookClips();
  if(!clips.length)return '[]';
  return clips.map(function(c,i){return 'Clip '+(i+1)+':\n'+JSON.stringify(c,null,2);}).join('\n\n');
}
function vbCopyAllHook(btn){vbCopyText(vbHookAllText(),btn);}
function vbImgJsonObj(){
  const cam=vbG('imgCam')||'iPhone 17 Pro';
  const flag=document.getElementById('imgFlag').checked;
  const sel=vbG('imgBg');
  let bgClause,bgKey,isRandom=false;
  if(sel==='Custom…'){const c=vbG('imgBgCustom').trim();const v=c||'a realistic everyday setting';bgClause='Place the subject in '+v+'. ';bgKey=c||'custom';}
  else if(sel==='Random (from pool)'){bgClause='Place the subject in a random realistic environment chosen from a modern kitchen, living room, porch, backyard, beach house, office, city street, suburban home, recording studio, luxury apartment, countryside home, rooftop terrace, café, park, or community center. ';bgKey='random';isRandom=true;}
  else{bgClause='Place the subject in a realistic '+sel.toLowerCase()+'. ';bgKey=sel.toLowerCase();}
  const wsel=vbG('imgWardrobe');
  let wClause,wKey,wChange=true;
  if(wsel==='Keep reference outfit'){wClause='Keep the clothing and outfit from the reference image unchanged. ';wKey='reference';wChange=false;}
  else if(wsel==='Custom…'){const wc=vbG('imgWardrobeCustom').trim();const wv=wc||'a neat everyday outfit';wClause='Dress the subject in '+wv+', with realistic fabric texture and natural clothing folds. ';wKey=wc||'custom';}
  else{wClause='Dress the subject in '+wsel.toLowerCase()+', with realistic fabric texture and natural clothing folds. ';wKey=wsel.toLowerCase();}
  const ssel=vbG('imgShot');
  let shotClause,shotKey;
  if(ssel==='Custom…'){const sc=vbG('imgShotCustom').trim();const sv=sc||'medium close-up';shotClause='Frame the subject in a '+sv+'. ';shotKey=sc||'medium close-up';}
  else{shotClause='Frame the subject in a '+ssel.toLowerCase()+'. ';shotKey=ssel.toLowerCase();}
  const psel=vbG('imgPose');
  let poseClause,poseKey;
  if(psel==='Custom…'){const pc=vbG('imgPoseCustom').trim();const pv=pc||'standing naturally';poseClause='The subject is '+pv+'. ';poseKey=pc||'standing';}
  else{poseClause='The subject is '+psel.toLowerCase()+'. ';poseKey=psel.toLowerCase();}
  const aselv=vbG('imgActivity');
  let actClause='',actKey='none';
  if(aselv==='Custom…'){const ac=vbG('imgActivityCustom').trim();if(ac){actClause='Show the subject '+ac+'. ';actKey=ac;}}
  else if(aselv!=='None / just posing'){actClause='Show the subject '+aselv.toLowerCase()+'. ';actKey=aselv.toLowerCase();}
  const order=['child','elderly person','young man','young woman','twin','interviewer','interviewer boom','custom'];
  let compClause='',compParts=[],twinSim=null,twinGap=null,twinDir=null;
  order.forEach(function(c){
    if(!vbCompOn(c))return;
    if(c==='child'){compClause+='A child is in the scene alongside the subject. ';compParts.push('a child');}
    else if(c==='elderly person'){compClause+='An elderly person is in the scene alongside the subject. ';compParts.push('an elderly person');}
    else if(c==='young man'){compClause+='A young man is in the scene alongside the subject. ';compParts.push('a young man');}
    else if(c==='young woman'){compClause+='A young woman is in the scene alongside the subject. ';compParts.push('a young woman');}
    else if(c==='twin'){const gap=+vbG('imgTwinGap');const dir=vbG('imgTwinDir')||'younger';compClause+='A second person appears beside the subject as a twin-style lookalike, resembling the subject but only about 50% similar to the reference image — clearly different distinguishing features, not an identical copy — and visibly about '+gap+' years '+dir+' than the subject, so the two are clearly not the same age. ';compParts.push('a twin');twinSim=0.5;twinGap=gap;twinDir=dir;}
    else if(c==='interviewer'){compClause+='An interviewer stands beside the subject holding a handheld microphone, facing them in conversation as if conducting an interview. ';compParts.push('an interviewer');}
    else if(c==='interviewer boom'){compClause+='An interviewer is beside the subject conducting an interview, with a professional boom microphone in a furry windshield suspended overhead on a boom pole, dipping in from just outside the top edge of the frame. ';compParts.push('an interviewer with a boom mic');}
    else if(c==='custom'){const cc=vbG('imgCompanionCustom').trim();if(cc){compClause+='Also in the scene with the subject: '+cc+'. ';compParts.push(cc);}}
  });
  const compKey=compParts.length?compParts.join(' and '):'none';
  const p1='Use the uploaded reference image as the main subject and preserve facial identity, hairstyle, body shape, skin tone, and recognizable facial features with maximum likeness accuracy. ';
  const pflag='Always include a visible United States flag somewhere in the scene such as on a wall, shelf, table, porch, window, flagpole, framed decoration, background object, or hanging display. ';
  const p2='Ultra-realistic photography with authentic human skin texture, natural imperfections, realistic clothing folds, accurate lighting physics, detailed eyes, realistic hair strands, true-to-life colors, professional composition, natural shadows, cinematic depth, sharp focus, premium lifestyle photography, social-media-ready quality. Captured as if photographed on an '+cam+', featuring exceptional detail, natural HDR, realistic dynamic range, crisp textures, lifelike color science, advanced computational photography, realistic depth separation, natural bokeh, and flagship smartphone image quality. The image must look like a genuine photograph, not AI-generated artwork.';
  const obj={
    prompt: p1+shotClause+poseClause+actClause+bgClause+wClause+compClause+(flag?pflag:'')+p2,
    negative_prompt:'cartoon, anime, 3d render, cgi, illustration, painting, digital art, unreal engine, plastic skin, doll face, wax skin, low quality, blurry, pixelated, distorted face, deformed body, extra fingers, extra limbs, duplicate person, bad anatomy, watermark, logo, text, oversaturated colors, artificial lighting, unrealistic shadows, floating objects, mutated hands, cropped face, unnatural expression, excessive beauty filter, fake skin texture, overprocessed image',
    reference_image_strength: +(+vbG('imgStrength')).toFixed(2),
    identity_preservation: true,
    camera_shot: shotKey,
    subject_pose: poseKey,
    activity: actKey,
    companion: compKey,
    ...(twinSim!==null?{twin_similarity:twinSim,twin_age_gap_years:twinGap,twin_age_direction:twinDir}:{}),
    background: bgKey,
    random_background: isRandom,
    wardrobe: wKey,
    change_wardrobe: wChange,
    require_usa_flag: flag,
    flag_visibility: flag?'always_visible':'optional',
    photorealistic: true,
    camera_simulation: cam,
    image_style:'premium smartphone photography',
    quality:'ultra',
    aspect_ratio: vbG('imgAspect')||'9:16',
    guidance_scale: +vbG('imgGuid'),
    steps: +vbG('imgSteps')
  };
  return obj;
}
function vbImgUI(){
  document.getElementById('imgStrengthRo').textContent=(+vbG('imgStrength')).toFixed(2);
  document.getElementById('imgGuidRo').textContent=(+vbG('imgGuid'));
  document.getElementById('imgStepsRo').textContent=(+vbG('imgSteps'));
  const tg=document.getElementById('imgTwinGapRo');if(tg)tg.textContent=(+vbG('imgTwinGap'))+' yrs';
  document.getElementById('imgJsonPreview').textContent=JSON.stringify(vbImgJsonObj(),null,2);
}

/* ============ PRODUCT HOLD (PLAIN TEXT) ============ */
const PD_PRESETS={
  crwn:{type:'pouch',size:'a small hand-sized snack pouch, only about 18 cm (7 inches) tall and 12 cm wide',desc:'a matte black resealable stand-up foil pouch of CRWN Cocoa with a press-to-close zip top and a flat-bottom gusset; across the upper-middle a wide brushed gold-to-bronze metallic gradient band; on that band the lowercase black wordmark "crwn." with a small black crown resting on top of it, and to its right a small black circular "PREMIUM QUALITY" seal with a star/molecule emblem; below the band on the black body the gold headline "HIGH FLAVANOL COCOA"; a thin gold-outlined bar reading "FLAVANOLS & FLAVANOIDS"; a row of three white line icons with labels beneath them — a double up-chevron "NITRIC OXIDE", a running figure "CARDIO PERFORMANCE", and a heartbeat heart "HEART HEALTH"; a solid gold rounded bar reading "0 SUGAR | 20 CALORIES" in black; and near the bottom in white "30 SERVINGS | DIETARY SUPPLEMENT"; premium black-and-gold supplement design with a matte finish'},
  serene:{type:'bottle',size:'a standard 16 fl oz (473 mL) bottle, only about 20 cm (8 inches) tall — the size of an ordinary drinks bottle',desc:'a tall 16 fl oz (473 mL) square-shouldered dark amber glass bottle of Serene Herbs "Exotic Soursop Bitters" with a black screw cap, filled with dark herbal liquid; a glossy wraparound label with a vivid rainbow tie-dye gradient (pink, orange, yellow, green and blue) across the top fading into a lighter panel; at the top a white sunburst icon above the "Serene Herbs" wordmark; the product name "EXOTIC" in small caps above a large "Soursop Bitters"; the tagline "Ancient Herbal Formula for Gut Health, Detox & Lasting Vitality"; a short numbered directions list down the right side; two round seals near the bottom — a "MADE IN THE USA" American-flag seal and a "GMP CERTIFIED" seal — beside a green soursop leaf graphic; and "16 FL OZ (473 mL) · Herbal Supplement" along the bottom; photoreal glass with realistic reflections and dark translucent contents'},
  iron:{type:'pouch',size:'a small 5.2 oz treat pouch, only about 15 cm (6 inches) tall and 10 cm wide, easily held in one hand',desc:'a matte forest-green resealable stand-up pouch of Iron Paws dog food with a zip top and flat-bottom gusset, the surface covered in a subtle pattern of large lighter-green translucent paw prints; the bold white italic logo stacked as "IRON" over "PAWS" with a white paw-print mark beside it; beneath the logo the white headline "HUMAN-GRADE SUPER FOOD FOR DOGS"; to the right a white "VET" shield-and-ribbon badge; a row of three small white circular certification seals (all-natural, grain-free and non-GMO style icons); and near the bottom in white "IRONPAWS CO" with a small "NET WT" weight line; clean premium pet-supplement packaging with a matte finish'}
};
let pdType='pouch';
let pdSize='a small hand-sized snack pouch, only about 18 cm (7 inches) tall and 12 cm wide';
let vbCurrentPdPreset='crwn';
function vbPdPreset(key,el){
  if(el){el.parentElement.querySelectorAll('.vb-chip').forEach(c=>c.classList.remove('on-purple'));el.classList.add('on-purple');}
  const p=PD_PRESETS[key];
  if(p){vbCurrentPdPreset=key;pdType=p.type;pdSize=p.size;const ta=document.getElementById('pdProduct');if(ta)ta.value=p.desc;}
  vbProductUI();vbSaveDebounced();
}
function vbPdWardrobeToggle(){document.getElementById('pdWardrobeCustomWrap').style.display=(vbG('pdWardrobe')==='Custom…')?'flex':'none';}
function vbPdBgToggle(){document.getElementById('pdBgCustomWrap').style.display=(vbG('pdBg')==='Custom…')?'flex':'none';}
function vbProductText(){
  const ref=vbG('pdRef').trim()||'the attached avatar photo';
  const product=vbG('pdProduct').replace(/\s+/g,' ').trim()||'the product';
  const shot=(vbG('pdShot')||'Medium close-up').toLowerCase();
  const expr=vbG('pdExpr')||'warm, friendly smile';
  const cam=vbG('pdCam')||'iPhone 17 Pro';
  const aspect=vbG('pdAspect')||'9:16';

  let hold=vbG('pdHold');
  if(hold==='Custom…'){hold=vbG('pdHoldCustom').trim()||'holding it toward the camera';}

  const wsel=vbG('pdWardrobe');
  let wClause='';
  if(wsel==='Keep reference outfit'){wClause='Keep the clothing from the reference image unchanged. ';}
  else if(wsel==='Custom…'){const wc=vbG('pdWardrobeCustom').trim();if(wc)wClause='Dress the subject in '+wc+', with natural fabric texture and folds. ';}
  else{wClause='Dress the subject in '+wsel.toLowerCase()+', with natural fabric texture and folds. ';}

  const bsel=vbG('pdBg');
  let bClause='';
  if(bsel==='Keep reference background'){bClause='Keep the background from the reference image unchanged. ';}
  else if(bsel==='Custom…'){const bc=vbG('pdBgCustom').trim();if(bc)bClause='Set the scene in '+bc+'. ';}
  else{bClause='Set the scene in a '+bsel.toLowerCase()+'. ';}

  const labelSharp=document.getElementById('pdLabelSharp').checked;
  const frontFacing=document.getElementById('pdFrontFacing').checked;
  const kind=(pdType==='bottle')?'bottle':'pouch';
  let labelClause='';
  if(frontFacing)labelClause+='The front of the '+kind+' faces the camera with the label fully visible. ';
  if(labelSharp)labelClause+='Keep all packaging text sharp, correctly spelled, undistorted and clearly legible, with the artwork and logo reproduced accurately. ';

  return 'Use '+ref+' as the main subject and preserve the person\'s exact facial identity, hairstyle, body shape, skin tone and recognizable features with maximum likeness accuracy. '
    +'Frame the shot as a '+shot+'. '
    +'The subject is '+hold+' '+product+'. '
    +'Scale is critical: the '+kind+' is '+pdSize+', shown at true real-world size in correct proportion to the person\'s hand, head and body. It is a small handheld item — it must NOT be oversized, must NOT be larger than the person\'s head, must NOT dominate or fill the frame, and the hand should comfortably wrap around it. '
    +labelClause
    +'Their expression is a '+expr+', looking toward the camera. '
    +'The hand grips the '+kind+' naturally with the correct number of fingers and realistic contact, with no warped, floating or distorted packaging. '
    +wClause
    +bClause
    +'Ultra-realistic photography with authentic human skin texture, natural imperfections, realistic clothing folds, accurate lighting physics, detailed eyes, realistic hair strands, true-to-life colors, natural shadows, sharp focus and clean product presentation. '
    +'Captured as if photographed on an '+cam+', with natural HDR, realistic dynamic range, crisp textures and flagship smartphone image quality. '
    +'The image must look like a genuine photograph, not AI-generated artwork. '
    +'Aspect ratio '+aspect+'. '
    +'Avoid: cartoon, illustration, 3d render, cgi, plastic skin, deformed hands, extra fingers, duplicated product, warped or misspelled packaging text, blurry label, oversized product, giant product, product larger than the head, product filling the frame, wrong scale, miniature product, watermark, oversaturated colors, fake skin texture.';
}
function vbProductUI(){
  vbPdWardrobeToggle();vbPdBgToggle();
  const hc=document.getElementById('pdHoldCustomWrap');if(hc)hc.style.display=(vbG('pdHold')==='Custom…')?'flex':'none';
  const pv=document.getElementById('pdTextPreview');if(pv)pv.textContent=vbProductText();
}
/* ============ END PRODUCT HOLD ============ */

/* ============ IMAGE FIXER (realism / lighting pass) ============ */
function vbFxOn(id){var e=document.getElementById(id);return e?e.checked:false;}
function vbFixWord(){var s=+vbG('fxStrength')||0.35;if(s<=0.25)return 'very light';if(s<=0.4)return 'light';if(s<=0.55)return 'moderate';return 'strong';}
function vbFixText(){
  var notes=(vbG('fxNotes')||'').replace(/\s+/g,' ').trim();
  var cam=vbG('fxCam')||'a full-frame DSLR with a 35mm lens in natural light';
  var aspect=vbG('fxAspect')||'Keep original';
  var word=vbFixWord();
  var look=vbG('fxLook'),lookClause='';
  if(look==='Custom…'){var lc=vbG('fxLookCustom').trim();if(lc)lookClause='Relight the scene as '+lc+'. ';}
  else if(look&&look!=='Keep original lighting mood'){lookClause='Relight the scene with '+look.toLowerCase()+'. ';}

  var keep=[];
  if(vbFxOn('fxKeepId'))keep.push('the same people and their exact facial identities');
  if(vbFxOn('fxKeepComp'))keep.push('the same poses, positions, composition and framing');
  if(vbFxOn('fxKeepClothes'))keep.push('the same clothing');
  if(vbFxOn('fxKeepBg'))keep.push('the same background and scene layout');
  var preserve=keep.length?('Preserve exactly: '+keep.join(', ')+'. Do not move, add, or remove anyone or anything. '):'';

  var fixes=[];
  if(vbFxOn('fxLight'))fixes.push('Lighting: relight with natural, physically consistent lighting from a single coherent direction, and balance the exposure so faces are properly lit with recovered shadow and highlight detail');
  if(vbFxOn('fxMatchLight'))fixes.push('Match the light, color temperature and shadows on every subject to the surrounding environment so no one looks pasted-in or composited');
  if(vbFxOn('fxColor'))fixes.push('White balance and color: correct the white balance to neutral, apply a natural color grade, and reduce oversaturation and color casts');
  if(vbFxOn('fxSkin'))fixes.push('Skin and texture: restore authentic skin texture with real pores and fine detail, remove plastic AI smoothness and waxy highlights, and keep natural skin tones');
  if(vbFxOn('fxAnatomy'))fixes.push('Anatomy: correct any deformed hands, fingers, ears, teeth or asymmetric eyes');
  if(vbFxOn('fxBg'))fixes.push('Background: fix warped or unreadable text and signage and keep architecture and perspective coherent');
  if(vbFxOn('fxSharp'))fixes.push('Sharpness and noise: remove over-sharpening halos and HDR over-processing, add subtle natural film grain, and remove color banding');
  if(vbFxOn('fxAiLook'))fixes.push('Remove the AI look: kill the uncanny gloss, over-smooth rendering and over-processed HDR so it reads as a real candid photograph');
  var fixText=fixes.length?('Fix the realism — '+fixes.join('; ')+'. '):'';

  return 'Edit the provided image to look like a real, natural photograph while keeping the content identical. '
    +preserve+fixText+lookClause
    +'Make it look like it was shot on '+cam+', with realistic dynamic range, true-to-life colors, natural shadows and highlights, and authentic photographic depth. The result must read as a genuine photograph, not AI-generated artwork. '
    +(notes?('Specifically address: '+notes+'. '):'')
    +'Apply only a '+word+' edit — change as little as needed to fix the realism without altering identities, composition or content. '
    +(aspect!=='Keep original'?('Output aspect ratio '+aspect+'. '):'Keep the original aspect ratio and resolution. ')
    +'Avoid: cartoon, illustration, 3d render, cgi, plastic skin, waxy highlights, oversaturation, HDR halos, blown highlights, crushed blacks, deformed hands, extra fingers, warped or misspelled text, duplicated elements, changed faces, changed composition, beauty-filter smoothing.';
}
function vbFixJsonObj(){
  var look=vbG('fxLook');if(look==='Custom…')look=vbG('fxLookCustom').trim()||'custom';
  return {
    task:'photorealism_fix',
    mode:'img2img edit — preserve content, repair realism',
    edit_strength:+(+vbG('fxStrength')||0.35).toFixed(2),
    preserve:{identities:vbFxOn('fxKeepId'),composition_and_pose:vbFxOn('fxKeepComp'),clothing:vbFxOn('fxKeepClothes'),background_layout:vbFxOn('fxKeepBg')},
    fix:{lighting_and_exposure:vbFxOn('fxLight'),match_subject_light_to_scene:vbFxOn('fxMatchLight'),white_balance_and_color:vbFxOn('fxColor'),skin_texture_realism:vbFxOn('fxSkin'),hands_and_anatomy:vbFxOn('fxAnatomy'),background_text_and_perspective:vbFxOn('fxBg'),sharpness_and_noise:vbFxOn('fxSharp'),remove_ai_look:vbFxOn('fxAiLook')},
    lighting_look: look||'keep original',
    camera_look: vbG('fxCam')||'full-frame DSLR, 35mm, natural light',
    notes: (vbG('fxNotes')||'').replace(/\s+/g,' ').trim(),
    aspect_ratio: vbG('fxAspect')||'Keep original',
    negative_prompt:'cartoon, illustration, 3d render, cgi, plastic skin, waxy highlights, oversaturation, hdr halos, blown highlights, crushed blacks, deformed hands, extra fingers, warped text, duplicated elements, changed faces, changed composition, beauty filter, over-smoothing, banding',
    instruction: vbFixText()
  };
}
function vbFixUI(){
  var lc=document.getElementById('fxLookCustomWrap');if(lc)lc.style.display=(vbG('fxLook')==='Custom…')?'flex':'none';
  var ro=document.getElementById('fxStrengthRo');if(ro)ro.textContent=(+vbG('fxStrength')||0.35).toFixed(2)+' · '+vbFixWord();
  var tp=document.getElementById('fxTextPreview');if(tp)tp.textContent=vbFixText();
  var jp=document.getElementById('fxJsonPreview');if(jp)jp.textContent=JSON.stringify(vbFixJsonObj(),null,2);
}
/* ============ END IMAGE FIXER ============ */

function vbComputeClips(){
  var text=vbG('scriptText').replace(/\s+/g,' ').trim();
  var pace=+vbG('pace')||2.7, secs=+vbG('secs')||8;
  var budget=Math.max(6,Math.round(secs*pace));
  var sents=text.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g)||[];
  var clips=[],cur='',cw=0;
  sents.forEach(function(s){s=s.trim();if(!s)return;var w=s.split(' ').length;
    if(cw&&cw+w>budget){clips.push(cur.trim());cur='';cw=0;}
    cur=(cur?cur+' ':'')+s;cw+=w;if(cw>=budget){clips.push(cur.trim());cur='';cw=0;}});
  if(cur.trim())clips.push(cur.trim());
  return {clips:clips,words:text?text.split(' ').length:0,pace:pace};
}
function vbSeg(){
  var secs=+vbG('secs'),pace=+vbG('pace');
  document.getElementById('secsRo').textContent=secs+'s';
  document.getElementById('paceRo').textContent=pace.toFixed(1)+' w/s';
  var c=vbComputeClips(),clips=c.clips;
  var total=0;var rows=clips.map(function(cl,i){var w=cl.split(' ').length;var sec=Math.max(1,Math.round(w/pace));total+=sec;
    return '<div class="vb-clip"><span class="vb-cnum">C'+(i+1)+' · ~'+sec+'s</span><span class="vb-ctxt">'+cl.replace(/</g,'&lt;')+'</span></div>';}).join('');
  document.getElementById('clipPreview').innerHTML=rows||'<div style="font-size:12px;color:var(--color-text-secondary);padding:8px 0">Paste a script above.</div>';
  document.getElementById('mClips').textContent=clips.length;document.getElementById('mDur').textContent='~'+total+'s';document.getElementById('mWords').textContent=c.words;
  vbRenderVideo();
  return {clips:clips,total:total,words:c.words};
}
function vbVideoBlock(label,jsonStr){
  return '<div class="vb-prev"><div class="vb-prev-head">'+label
    +' <button class="vb-mini" onclick="vbCopyPrev(this)"><i class="ti ti-copy" aria-hidden="true"></i> Copy</button></div>'
    +'<div class="vb-json">'+jsonStr.replace(/</g,'&lt;')+'</div></div>';
}
var vbVideoPage=0;
function vbPagerHTML(i,n,fn){
  return '<div class="vb-pager">'
    +'<button class="vb-mini" '+(i===0?'disabled':'')+' onclick="'+fn+'(-1)"><i class="ti ti-chevron-left" aria-hidden="true"></i> Prev</button>'
    +'<span class="vb-pageinfo">Clip '+(i+1)+' of '+n+'</span>'
    +'<button class="vb-mini" '+(i===n-1?'disabled':'')+' onclick="'+fn+'(1)">Next <i class="ti ti-chevron-right" aria-hidden="true"></i></button>'
    +'</div>';
}
function vbRenderVideo(){
  var out=document.getElementById('videoJsonOut');if(!out)return;
  if(vbModes.mode==='single'){
    var line=vbG('scriptOne').trim();
    out.innerHTML=vbVideoBlock('Clip',vbJson(line||'[INSERT SCRIPT HERE]'));return;
  }
  var c=vbComputeClips();
  if(!c.clips.length){vbVideoPage=0;out.innerHTML=vbVideoBlock('Template — paste a script',vbJson('[INSERT SCRIPT HERE]'));return;}
  var n=c.clips.length;
  if(vbVideoPage>n-1)vbVideoPage=n-1;
  if(vbVideoPage<0)vbVideoPage=0;
  var i=vbVideoPage,t=c.clips[i];
  var w=t.split(' ').length,sec=Math.max(1,Math.round(w/(c.pace||2.7)));
  var pager=n>1?vbPagerHTML(i,n,'vbVideoNav'):'';
  out.innerHTML=pager+vbVideoBlock('Clip '+(i+1)+' · ~'+sec+'s',vbJson(t));
}
function vbVideoNav(d){
  var c=vbComputeClips(),n=c.clips.length||1;
  vbVideoPage=Math.max(0,Math.min(n-1,vbVideoPage+d));
  vbRenderVideo();
}
function vbVideoAllText(){
  if(vbModes.mode==='single'){var line=vbG('scriptOne').trim();return vbJson(line||'[INSERT SCRIPT HERE]');}
  var c=vbComputeClips();
  if(!c.clips.length)return vbJson('[INSERT SCRIPT HERE]');
  return c.clips.map(function(t,i){return 'Clip '+(i+1)+':\n'+vbJson(t);}).join('\n\n');
}
function vbCopyAllVideo(btn){vbCopyText(vbVideoAllText(),btn);}

/* ---- clipboard + toast ---- */
function vbToast(msg){
  var t=document.getElementById('vbToast');
  if(!t){t=document.createElement('div');t.id='vbToast';t.className='vb-toast';document.body.appendChild(t);}
  t.textContent=msg;t.classList.add('show');
  clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove('show');},1600);
}
function vbExecCopy(text){
  try{var ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.top='-1000px';document.body.appendChild(ta);ta.select();var ok=document.execCommand('copy');document.body.removeChild(ta);return ok;}catch(e){return false;}
}
function vbWriteClipboard(text){
  return new Promise(function(res){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){res(true);},function(){res(vbExecCopy(text));});
    }else{res(vbExecCopy(text));}
  });
}
function vbCopyText(text,btn){
  vbWriteClipboard(text).then(function(ok){
    vbToast(ok?'Copied to clipboard':'Copy failed — select manually');
    if(btn){var i=btn.querySelector('i');var pi=i?i.className:'';btn.classList.add('ok');if(i)i.className='ti ti-check';
      setTimeout(function(){btn.classList.remove('ok');if(i)i.className=pi;},1400);}
  });
}
function vbCopyId(id,btn){var el=document.getElementById(id);if(el)vbCopyText(el.textContent,btn);}
function vbCopyPrev(btn){var w=btn.closest('.vb-prev');if(!w)return;var c=w.querySelector('.vb-json,.vb-plain');if(c)vbCopyText(c.textContent,btn);}
/* big Send/Copy button copy with inline flash */
function vbCopy(text){
  var btn=document.getElementById('vbSendBtn'),txt=document.getElementById('vbSendTxt'),ic=document.getElementById('vbSendIcon');
  vbWriteClipboard(text).then(function(ok){
    vbToast(ok?'Copied to clipboard':'Copy failed — select manually');
    if(ok&&btn&&txt&&ic){var p=txt.textContent,pic=ic.className;btn.classList.add('is-copied');txt.textContent='Copied to clipboard';ic.className='ti ti-check';
      setTimeout(function(){txt.textContent=p;ic.className=pic;btn.classList.remove('is-copied');},1700);}
  });
}
/* send to chat host, or copy to clipboard if no host is present */
function vbDispatch(msg){
  if(typeof sendPrompt==='function'){sendPrompt(msg);}
  else{vbCopy(msg);}
}
function vbSend(){
  if(vbModes.mode==='image'){
    const msg='Build the image-generation JSON prompt below for my uploaded reference photo. Output the JSON exactly as written — do not add, remove, or rename any keys. No preamble.\n\n'+JSON.stringify(vbImgJsonObj(),null,2);
    vbDispatch(msg);return;
  }
  if(vbModes.mode==='product'){
    vbCopy(vbProductText());return;
  }
  if(vbModes.mode==='hook'){
    const clips=vbHookClips();
    const msg=
'Act as my Google Flow / Veo agent for a two-person dialogue hook. Build one video clip per JSON object below, in order, so that cutting between them creates a natural multi-camera conversation.\n\n'+
'OUTPUT RULES:\n'+
'- Output each clip\'s JSON exactly as written — do not add, remove, or rename any keys.\n'+
'- Each clip is a single continuous shot from the camera angle in its "camera" field; the multi-camera effect comes from cutting between clips, not from moving the camera inside a clip.\n'+
'- Keep each speaker\'s accent locked and consistent across every clip they appear in.\n'+
'- In each clip only the active speaker talks; the other person listens naturally and does not speak.\n'+
'- Number each clip (Clip 1, Clip 2, ...) with its full JSON object underneath. No preamble, no commentary.\n\n'+
'CLIPS:\n'+JSON.stringify(clips,null,2);
    vbDispatch(msg);return;
  }
  if(vbModes.mode==='single'){
    const line=vbG('scriptOne').trim();
    const msg='Build ONE Google Flow / Veo clip using the EXACT JSON prompt below. Output the JSON exactly as written — do not add, remove, or rename any keys, and do not change any value except "dialogue". No preamble.\n\n'+vbJson(line||'[INSERT SCRIPT HERE]');
    vbDispatch(msg);return;
  }
  const seg=vbSeg();
  const msg=
'Act as my Google Flow / Veo agent. Below are '+seg.clips.length+' ready-made clip prompts in order. Generate one continuous clip per JSON object exactly as written — do not add, remove, or rename any keys or change any value — then cut the clips together in sequence.\n'+
'No preamble, no commentary.\n\n'+vbVideoAllText();
  vbDispatch(msg);
}
/* ============ PERSISTENCE ============ */
var vbReady=false,_vbSaveT=null;
function vbCollect(){
  var data={mode:vbModes.mode,fields:{},checks:{},comps:[],pd:vbCurrentPdPreset,hook:[]};
  document.querySelectorAll('input,select,textarea').forEach(function(el){
    if(!el.id)return;
    if(el.type==='checkbox')data.checks[el.id]=el.checked;
    else data.fields[el.id]=el.value;
  });
  document.querySelectorAll('#imgCompChips .vb-chip.on-purple').forEach(function(c){data.comps.push(c.getAttribute('data-c'));});
  document.querySelectorAll('#hkTurns .hk-turn').forEach(function(row){
    data.hook.push({
      spk:(row.querySelector('.hk-speaker')||{}).value||'A',
      cam:(row.querySelector('.hk-cam')||{}).value||'Focus on the speaker',
      camCustom:(row.querySelector('.hk-cam-custom')||{}).value||'',
      line:(row.querySelector('.hk-line')||{}).value||'',
      emotion:(row.querySelector('.hk-emotion')||{}).value||'',
      reaction:(row.querySelector('.hk-reaction')||{}).value||''
    });
  });
  return data;
}
function vbApply(data){
  if(!data)return;
  Object.keys(data.fields||{}).forEach(function(id){var el=document.getElementById(id);if(!el||el.type==='checkbox')return;var v=data.fields[id];if(v===''||v==null)return;el.value=v;});
  Object.keys(data.checks||{}).forEach(function(id){var el=document.getElementById(id);if(el)el.checked=!!data.checks[id];});
  document.querySelectorAll('#imgCompChips .vb-chip').forEach(function(c){c.classList.toggle('on-purple',(data.comps||[]).indexOf(c.getAttribute('data-c'))>-1);});
  if(data.pd&&PD_PRESETS[data.pd]){vbCurrentPdPreset=data.pd;pdType=PD_PRESETS[data.pd].type;pdSize=PD_PRESETS[data.pd].size;}
  document.querySelectorAll('#pdProductChips .vb-chip').forEach(function(c){c.classList.toggle('on-purple',c.getAttribute('data-k')===vbCurrentPdPreset);});
  if(data.hook){
    var wrap=document.getElementById('hkTurns');
    if(wrap){wrap.innerHTML='';
      data.hook.forEach(function(t){
        vbHookAddTurn(t.spk,t.cam,t.line,t.emotion,t.reaction);
        var row=wrap.lastElementChild;
        if(row&&t.cam==='Custom…'){var cc=row.querySelector('.hk-cam-custom');if(cc){cc.style.display='block';cc.value=t.camCustom||'';}}
      });
    }
  }
  vbSetMode(data.mode||'script');
  vbAllToggles();vbSeg();vbImgUI();vbHookUI();vbProductUI();vbFixUI();vbJsonUI();
}
function vbAllToggles(){
  vbBgToggle();vbWardrobeToggle();vbShotToggle();vbPoseToggle();vbActivityToggle();vbCompToggle();
  vbPdWardrobeToggle();vbPdBgToggle();
  var hc=document.getElementById('pdHoldCustomWrap');if(hc)hc.style.display=(vbG('pdHold')==='Custom…')?'flex':'none';
}
function vbSave(){if(!vbReady)return;try{localStorage.setItem('pb_state',JSON.stringify(vbCollect()));}catch(e){}}
function vbSaveDebounced(){clearTimeout(_vbSaveT);_vbSaveT=setTimeout(vbSave,250);}
function vbLoad(){
  var raw=null;try{raw=localStorage.getItem('pb_state');}catch(e){return false;}
  if(!raw)return false;
  var data;try{data=JSON.parse(raw);}catch(e){return false;}
  try{vbApply(data);return true;}catch(e){return false;}
}
function vbReset(){try{localStorage.removeItem('pb_state');}catch(e){}location.reload();}

/* ============ INIT ============ */
document.getElementById('hkAccentA').innerHTML=vbOpts(HK_ACCENTS,'Jamaican');
document.getElementById('hkAccentB').innerHTML=vbOpts(HK_ACCENTS,'General American');
document.getElementById('vAccent').innerHTML=vbOpts(HK_ACCENTS,'Jamaican');
vbHookAddTurn('A','Focus on the speaker','Yuh ever wonder why yuh breath still nuh fresh after yuh brush?','Curious','Leaning in, interested');
vbHookAddTurn('B','Focus on the speaker','Wait, so brushing alone isn\'t enough?','Surprised','Skeptical, raised eyebrow');
vbHookAddTurn('A','Over-the-shoulder toward the speaker','Exactly. Mek mi show yuh di one ting weh change everyting.','Confident','Leaning in, interested');
vbHookAddTurn('B','Two-shot (both in frame)','Okay, I\'m listening — show me.','Excited','Nodding in agreement');
vbPdPreset('crwn',document.querySelector('#pdProductChips .vb-chip[data-k="crwn"]'));
vbAllToggles();vbSeg();vbImgUI();vbHookUI();vbProductUI();vbFixUI();vbJsonUI();
vbSetMode((document.getElementById('modeSelect')||{}).value||'script');
vbLoad();
vbReady=true;
document.addEventListener('input',vbSaveDebounced,true);
document.addEventListener('change',vbSaveDebounced,true);