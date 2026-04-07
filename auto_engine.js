
(function(){
  const BUILD = '14.4.2.12';
  const AUTO = {
    mode: 'original',
    schemeIndex: 0,
    schemes: [],
    currentScheme: null,
    currentPatternId: null,
    lastAutoPatternId: null,
    manualCapoMode: false,
    manualCapo: 0,
    cachedOriginalChords: [],
    currentDisplayedChords: []
  };
  window.__AUTO13 = AUTO;

  function $(id){ return document.getElementById(id); }
  function q(sel, root){ return (root || document).querySelector(sel); }
  function qa(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }
  function getSongCapoSafe(){ return typeof getSongCapo === 'function' ? getSongCapo() : 0; }

  function normalizeEnharmonicKeyName(name){
    const raw = String(name || '').trim();
    const map = { 'G#':'Ab', 'D#':'Eb', 'A#':'Bb', 'C#':'Db', 'F#':'Gb', 'Cb':'B', 'E#':'F', 'B#':'C' };
    return map[raw] || raw;
  }
  function getUiDisplayedKeyName(){
    const el = $('ui-key');
    return normalizeEnharmonicKeyName((el && el.textContent) || '');
  }

  function getOriginalKeyName(){ return normalizeEnharmonicKeyName((window.__currentMeta && window.__currentMeta.key_name) || 'C'); }
  function getDisplayedSongKeyName(){
    const uiKey = getUiDisplayedKeyName();
    if(uiKey) return uiKey;
    try{
      if(typeof computeDisplayedKeyName === 'function'){
        return normalizeEnharmonicKeyName(computeDisplayedKeyName(window.__currentMeta || { key_name: getOriginalKeyName() }));
      }
    }catch(e){}
    return getOriginalKeyName();
  }
  function preferFlats(){
    const keyName = normalizeEnharmonicKeyName(getDisplayedSongKeyName());
    if(window.SchemeEngine && typeof SchemeEngine.isFlatKeyName === 'function') return SchemeEngine.isFlatKeyName(keyName);
    if(typeof prefersFlatsFromKeyName === 'function') return !!prefersFlatsFromKeyName(keyName);
    return ['F','Bb','Eb','Ab','Db','Gb','Cb'].includes(keyName);
  }
  function getTransposeSafe(){ return (typeof getUserTranspose === 'function') ? getUserTranspose() : (window.viewerPrefs ? (parseInt(viewerPrefs.transposeSemitones, 10) || 0) : 0); }

  function extractTimelineOriginalChords(){
    const raw = Array.isArray(window.__chordTimelineRaw) ? window.__chordTimelineRaw : [];
    const out = [];
    const seen = new Set();
    raw.forEach((item)=>{
      const chord = String(item?.chordRaw || '').trim();
      if(!chord) return;
      if(typeof looksLikeChordSymbol === 'function' && !looksLikeChordSymbol(chord)) return;
      if(!seen.has(chord)){ seen.add(chord); out.push(chord); }
    });
    return out;
  }

  function extractOriginalChords(){
    const timelineChords = extractTimelineOriginalChords();
    if(timelineChords.length){
      AUTO.cachedOriginalChords = timelineChords.slice();
      return timelineChords;
    }
    const root = $('alphaTab');
    if(!root){
      return Array.isArray(AUTO.cachedOriginalChords) ? AUTO.cachedOriginalChords.slice() : [];
    }
    const out=[]; const seen = new Set();
    qa('text, tspan', root).forEach((el)=>{
      if(el.children && el.children.length) return;
      const raw = (el.getAttribute('data-orig-chord') || el.textContent || '').trim();
      if(!raw) return;
      if(typeof looksLikeChordSymbol === 'function' && !looksLikeChordSymbol(raw)) return;
      if(!el.getAttribute('data-orig-chord')) el.setAttribute('data-orig-chord', raw);
      if(!seen.has(raw)){ seen.add(raw); out.push(raw); }
    });
    if(out.length) AUTO.cachedOriginalChords = out.slice();
    return out.length ? out : (Array.isArray(AUTO.cachedOriginalChords) ? AUTO.cachedOriginalChords.slice() : []);
  }

  function applyCapoToChords(chords, capo){
    if(!window.SchemeEngine) return chords;
    const useFlats = preferFlats();
    return (chords || []).map((ch)=>{
      try{
        return SchemeEngine.shiftChord(ch, capo || 0, useFlats);
      }catch(e){
        return ch;
      }
    });
  }

  function currentMeter(){ return '4/4'; }


  let __lastStateDispatchSignature = null;
  function buildStateDispatchSignature(){
    let info = { capo:'--', family:'--', chords:'--' };
    try { info = schemeInfoData() || info; } catch(e) {}
    const keyName = normalizeEnharmonicKeyName(getDisplayedSongKeyName());
    return JSON.stringify({
      mode: AUTO.mode,
      manualCapoMode: !!AUTO.manualCapoMode,
      manualCapo: parseInt(AUTO.manualCapo, 10) || 0,
      schemeIndex: AUTO.schemeIndex,
      currentPatternId: AUTO.currentPatternId || '',
      keyName,
      capo: info.capo || '--',
      family: info.family || '--',
      chords: info.chords || '--'
    });
  }
  function dispatchStateChangeIfNeeded(force){
    const sig = buildStateDispatchSignature();
    if(!force && sig === __lastStateDispatchSignature) return;
    __lastStateDispatchSignature = sig;
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('auto13:statechange', { detail: { ...AUTO, currentSchemeResult: getCurrentSchemeResult(), currentPatternResult: getCurrentPatternResult() } }));
    }, 0);
  }

  function ensureUi(){
    const toolbar = q('.core-ui-toolbar');
    if(toolbar){
      $('ui-auto-toggle')?.remove();
      $('ui-auto-scheme')?.remove();
      if(!$('ui-rhythm')){
        const rhythmBtn = document.createElement('button');
        rhythmBtn.className = 'core-btn core-btn-pill core-btn-mini';
        rhythmBtn.id = 'ui-rhythm';
        rhythmBtn.textContent = '节';
        rhythmBtn.title = '原谱 / 自动伴奏 / 方案 / 节奏';
        const trackBtn = $('ui-track');
        toolbar.insertBefore(rhythmBtn, trackBtn || null);
      }
    }

    const layer = $('core-panel-layer');
    if(layer){
      $('panel-auto-mode')?.remove();
      $('panel-auto-scheme')?.remove();
      $('panel-rhythm')?.remove();
      if(!$('panel-rhythm-hub')){
        layer.insertAdjacentHTML('beforeend', `
          <div class="core-panel auto-panel-hub" id="panel-rhythm-hub" hidden>
            <div class="core-panel-head"><span>节</span><span id="auto-chip-build" class="auto-chip">v${BUILD}</span></div>
            <div class="auto-hub-layout auto-hub-layout-v2">
              <div class="auto-hub-left auto-hub-left-v2">
                <div class="auto-hub-col-title">和弦组</div>
                <div class="auto-hub-chord-row">
                  <button type="button" class="core-option-btn auto-mini-btn auto-chord-btn" id="ui-scheme-a">和弦A</button>
                  <button type="button" class="core-option-btn auto-mini-btn auto-chord-btn" id="ui-scheme-b">和弦B</button>
                  <button type="button" class="core-option-btn auto-mini-btn auto-chord-btn" id="ui-scheme-c">和弦C</button>
                  <button type="button" class="core-option-btn auto-mini-btn auto-chord-btn" id="ui-manual-capo-minus">CAPO-</button>
                  <button type="button" class="core-option-btn auto-mini-btn auto-chord-btn" id="ui-manual-capo-plus">CAPO+</button>
                </div>
                <div class="auto-hub-scheme-info" id="ui-auto-scheme-info">
                  <div>CAPO ${getSongCapoSafe()}</div>
                  <div>family:原谱</div>
                  <div>--</div>
                </div>
              </div>
              <div class="auto-hub-right-wrap auto-hub-right-wrap-v2">
                <div class="auto-hub-col-title">节奏组</div>
                <div class="auto-hub-right auto-hub-right-v2" id="ui-rhythm-list"></div>
              </div>
            </div>
          </div>`);
      }
    }

    $('auto-debug-info')?.remove();

    if(!$('auto-version-badge')){
      const badge = document.createElement('div');
      badge.id = 'auto-version-badge';
      badge.className = 'auto-version-badge';
      badge.textContent = 'v' + BUILD;
      document.body.appendChild(badge);
    }
  }

  function buildContext(){
    const rawChords = extractOriginalChords();
    const sourceCapo = getSongCapoSafe();
    const realChords = applyCapoToChords(rawChords, sourceCapo);
    return {
      originalKey: getOriginalKeyName(),
      // sourceCapo 在这里用于把原谱和弦提升成“真实和弦”；
      // 进入 scheme_engine 后不再重复参与目标调和显示和弦计算。
      songCapo: 0,
      transpose: getTransposeSafe(),
      originalChords: realChords,
      preferFlats: preferFlats()
    };
  }


  function getTargetConcertChords(){
    const ctx = buildContext();
    const semis = ctx.transpose || 0;
    const useFlats = !!ctx.preferFlats;
    return (ctx.originalChords || []).map((ch)=>{
      try{ return window.SchemeEngine ? SchemeEngine.shiftChord(ch, semis, useFlats) : ch; }catch(e){ return ch; }
    });
  }

  function getManualCapoInfo(){
    const targetKey = getDisplayedSongKeyName();
    const useFlats = preferFlats();
    const capo = Math.max(0, Math.min(11, parseInt(AUTO.manualCapo, 10) || 0));
    const targetChords = getTargetConcertChords().slice(0, 5);
    const displayChords = targetChords.map((ch)=>{
      try{
        const raw = window.SchemeEngine ? SchemeEngine.shiftChord(ch, -capo, useFlats) : ch;
        return (window.SchemeEngine && typeof SchemeEngine.normalizeChordForKey === 'function') ? SchemeEngine.normalizeChordForKey(raw, targetKey) : raw;
      }catch(e){
        return ch;
      }
    });
    let family = '--';
    if(window.SchemeEngine && displayChords.length){
      const first = SchemeEngine.parseChord(displayChords[0]);
      family = first && first.root ? first.root : '--';
    }
    return {
      capo: `CAPO ${capo}`,
      family: `family:${family}`,
      chords: displayChords.length ? displayChords.join(', ') : '--'
    };
  }

  function setManualCapo(delta){
    AUTO.manualCapoMode = true;
    AUTO.manualCapo = Math.max(0, Math.min(11, (parseInt(AUTO.manualCapo, 10) || 0) + delta));
    updateUi();
    if(typeof scheduleChordRewrite === 'function') scheduleChordRewrite(20);
  }

  function enterManualCapoFromCurrentSong(){
    if(!AUTO.manualCapoMode){
      const baseCapo = AUTO.currentScheme ? AUTO.currentScheme.capo : getSongCapoSafe();
      AUTO.manualCapo = Math.max(0, Math.min(11, parseInt(baseCapo, 10) || 0));
    }
    AUTO.manualCapoMode = true;
  }

  function exitManualCapoMode(){
    AUTO.manualCapoMode = false;
  }

  function refreshSchemes(){
    AUTO.schemes = window.SchemeEngine ? SchemeEngine.generateSchemes(buildContext()) : [];
    if(!AUTO.schemes.length){
      AUTO.currentScheme = null;
      AUTO.schemeIndex = 0;
      return;
    }
    AUTO.schemeIndex = Math.max(0, Math.min(AUTO.schemeIndex, AUTO.schemes.length - 1));
    AUTO.currentScheme = AUTO.schemes[AUTO.schemeIndex] || AUTO.schemes[0];
  }

  function getCurrentPattern(){
    const patterns = window.RhythmEngine ? RhythmEngine.getPatternsForMeter(currentMeter()) : [];
    if(!patterns.length) return null;
    return patterns.find((p)=>p.id === AUTO.currentPatternId) || patterns[0] || null;
  }


  function getCurrentPatternResult(){
    const p = getCurrentPattern();
    return p ? { id: p.id, name: p.name, type: p.type, steps: Array.isArray(p.steps) ? p.steps.slice() : [] } : null;
  }

  function getAutoDisplayedChordForOriginal(originalChord){
    const original = String(originalChord || '').trim();
    if(!original) return original;
    const useFlats = preferFlats();
    if(AUTO.mode === 'auto' && AUTO.manualCapoMode){
      let realChord = window.SchemeEngine ? SchemeEngine.shiftChord(original, getSongCapoSafe(), useFlats) : original;
      let targetChord = window.SchemeEngine ? SchemeEngine.shiftChord(realChord, getTransposeSafe(), useFlats) : realChord;
      let next = window.SchemeEngine ? SchemeEngine.shiftChord(targetChord, -(parseInt(AUTO.manualCapo, 10) || 0), useFlats) : targetChord;
      if(window.SchemeEngine && typeof SchemeEngine.normalizeChordForKey === 'function') next = SchemeEngine.normalizeChordForKey(next, getDisplayedSongKeyName());
      return next;
    }
    if(AUTO.mode === 'auto' && AUTO.currentScheme && AUTO.currentScheme.chordMap){
      const realChord = window.SchemeEngine ? SchemeEngine.shiftChord(original, getSongCapoSafe(), useFlats) : original;
      let next = AUTO.currentScheme.chordMap[realChord] || original;
      if(window.SchemeEngine && typeof SchemeEngine.normalizeChordForKey === 'function') next = SchemeEngine.normalizeChordForKey(next, getDisplayedSongKeyName());
      return next;
    }
    return original;
  }

  function schemeInfoData(){
    const original = extractOriginalChords().slice(0, 5);
    if(AUTO.mode !== 'auto'){
      AUTO.currentDisplayedChords = original.slice();
      return {
        capo: `CAPO ${getSongCapoSafe()}`,
        family: 'family:原谱',
        chords: original.length ? original.join(', ') : '--'
      };
    }
    if(AUTO.manualCapoMode){
      const info = getManualCapoInfo();
      AUTO.currentDisplayedChords = String(info.chords || '').split(/\s*,\s*/).filter(Boolean);
      return info;
    }
    if(!AUTO.currentScheme){
      AUTO.currentDisplayedChords = original.slice();
      return {
        capo: `CAPO ${getSongCapoSafe()}`,
        family: 'family:原谱',
        chords: original.length ? original.join(', ') : '--'
      };
    }
    const realPreview = applyCapoToChords(original, getSongCapoSafe()).slice(0, 5);
    const targetKey = getDisplayedSongKeyName();
    const mapped = realPreview.map((c)=> {
      const raw = AUTO.currentScheme.chordMap?.[c] || c;
      return (window.SchemeEngine && typeof SchemeEngine.normalizeChordForKey === 'function') ? SchemeEngine.normalizeChordForKey(raw, targetKey) : raw;
    });
    AUTO.currentDisplayedChords = mapped.slice();
    return {
      capo: `CAPO ${AUTO.currentScheme.capo}`,
      family: `family:${AUTO.currentScheme.family || '--'}`,
      chords: mapped.length ? mapped.join(', ') : '--'
    };
  }

  function updateUi(){
    const inAuto = AUTO.mode === 'auto';
    $('ui-rhythm') && ($('ui-rhythm').textContent = inAuto ? '节·伴' : '节·原');
    ['a','b','c'].forEach((k, idx)=>{
      const btn = $('ui-scheme-' + k);
      if(!btn) return;
      btn.classList.toggle('active', inAuto && !AUTO.manualCapoMode && AUTO.schemeIndex === idx);
      btn.disabled = !inAuto;
      btn.classList.toggle('disabled', !inAuto);
    });
    const manualMinus = $('ui-manual-capo-minus');
    const manualPlus = $('ui-manual-capo-plus');
    if(manualMinus){
      manualMinus.disabled = !inAuto;
      manualMinus.classList.toggle('disabled', !inAuto);
      manualMinus.classList.toggle('active', inAuto && AUTO.manualCapoMode);
    }
    if(manualPlus){
      manualPlus.disabled = !inAuto;
      manualPlus.classList.toggle('disabled', !inAuto);
      manualPlus.classList.toggle('active', inAuto && AUTO.manualCapoMode);
    }
    const infoBox = $('ui-auto-scheme-info');
    if(infoBox){
      const info = schemeInfoData();
      infoBox.innerHTML = `<div>${info.capo}</div><div>${info.family}</div><div>${info.chords}</div>`;
    }
    buildRhythmPanel();
    setTimeout(rewriteChordsForAuto, 40);
    setTimeout(rewriteChordsForAuto, 180);
    dispatchStateChangeIfNeeded(false);
  }

  function rewriteChordsForAuto(){
    const root = $('alphaTab');
    if(!root) return;
    const chordFontPx = (typeof getChordFontSizePx === 'function') ? getChordFontSizePx() : 16;
    const useFlats = preferFlats();
    qa('text, tspan', root).forEach((el)=>{
      if(el.children && el.children.length) return;
      const current = (el.textContent || '').trim();
      if(!current) return;
      const original = el.getAttribute('data-orig-chord') || current;
      if(typeof looksLikeChordSymbol === 'function' && !looksLikeChordSymbol(original)) return;
      if(!el.getAttribute('data-orig-chord')) el.setAttribute('data-orig-chord', original);
      let next = original;
      if(AUTO.mode === 'auto' && AUTO.manualCapoMode){
        const realChord = window.SchemeEngine ? SchemeEngine.shiftChord(original, getSongCapoSafe(), useFlats) : original;
        const targetChord = window.SchemeEngine ? SchemeEngine.shiftChord(realChord, getTransposeSafe(), useFlats) : realChord;
        next = window.SchemeEngine ? SchemeEngine.shiftChord(targetChord, -(parseInt(AUTO.manualCapo, 10) || 0), useFlats) : targetChord;
        if(window.SchemeEngine && typeof SchemeEngine.normalizeChordForKey === 'function'){
          next = SchemeEngine.normalizeChordForKey(next, getDisplayedSongKeyName());
        }
      } else if(AUTO.mode === 'auto' && AUTO.currentScheme && AUTO.currentScheme.chordMap){
        const realChord = window.SchemeEngine ? SchemeEngine.shiftChord(original, getSongCapoSafe(), useFlats) : original;
        next = AUTO.currentScheme.chordMap[realChord] || original;
        if(window.SchemeEngine && typeof SchemeEngine.normalizeChordForKey === 'function'){
          next = SchemeEngine.normalizeChordForKey(next, getDisplayedSongKeyName());
        }
      } else {
        // 原谱模式保持原谱和弦，不跟自动伴奏/转调链路混用
        next = original;
      }
      if(next !== current) el.textContent = next;
      try { el.style.fontSize = chordFontPx + 'px'; } catch(e) {}
    });
  }

  function applyScheme(){
    if(AUTO.mode !== 'auto'){
      updateUi();
      return;
    }
    if(!AUTO.schemes.length) refreshSchemes();
    AUTO.currentScheme = AUTO.schemes[AUTO.schemeIndex] || AUTO.schemes[0] || null;
    updateUi();
    if(typeof scheduleChordRewrite === 'function') scheduleChordRewrite(20);
  }

  function setMode(mode){
    AUTO.mode = mode === 'auto' ? 'auto' : 'original';
    if(AUTO.mode !== 'auto') exitManualCapoMode();
    if(AUTO.mode === 'auto'){
      refreshSchemes();
      if(!AUTO.currentPatternId) AUTO.currentPatternId = AUTO.lastAutoPatternId || (window.RhythmEngine ? (RhythmEngine.getDefaultPattern(currentMeter()) || {}).id : null) || null;
    }
    applyScheme();
  }

  function choosePattern(patternId){
    AUTO.currentPatternId = patternId;
    AUTO.lastAutoPatternId = patternId;
    AUTO.schemeIndex = 0;
    setMode('auto');
  }

  function setSchemeIndex(index){
    if(AUTO.mode !== 'auto') return;
    exitManualCapoMode();
    AUTO.schemeIndex = Math.max(0, Math.min(index, Math.max(0, AUTO.schemes.length - 1)));
    applyScheme();
  }

  function buildRhythmPanel(){
    const list = $('ui-rhythm-list');
    if(!list || !window.RhythmEngine) return;
    const patterns = RhythmEngine.getPatternsForMeter(currentMeter());
    if(patterns.length && !AUTO.currentPatternId) AUTO.currentPatternId = AUTO.lastAutoPatternId || patterns[0].id;
    list.innerHTML = '';

    const originalBtn = document.createElement('button');
    originalBtn.type = 'button';
    originalBtn.className = 'core-option-btn auto-rhythm-item';
    originalBtn.textContent = '原谱';
    originalBtn.classList.toggle('active', AUTO.mode !== 'auto');
    originalBtn.addEventListener('click', ()=> setMode('original'));
    list.appendChild(originalBtn);

    patterns.forEach((pattern)=>{
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'core-option-btn auto-rhythm-item';
      btn.textContent = pattern.name;
      btn.classList.toggle('active', pattern.id === AUTO.currentPatternId && AUTO.mode === 'auto');
      btn.addEventListener('click', ()=> choosePattern(pattern.id));
      list.appendChild(btn);
    });
  }

  function refreshChordSchemePanel(){
    refreshSchemes();
    applyScheme();
  }


  function getCurrentSchemeResult(){
    const info = schemeInfoData();
    const activeCapo = (AUTO.mode === 'auto')
      ? (AUTO.manualCapoMode ? (parseInt(AUTO.manualCapo, 10) || 0) : (AUTO.currentScheme ? (parseInt(AUTO.currentScheme.capo, 10) || 0) : getSongCapoSafe()))
      : getSongCapoSafe();
    return {
      mode: AUTO.mode,
      manualCapoMode: !!AUTO.manualCapoMode,
      selectedSchemeIndex: AUTO.mode === 'auto' && !AUTO.manualCapoMode ? AUTO.schemeIndex : null,
      activeCapo,
      family: AUTO.mode === 'auto'
        ? (AUTO.manualCapoMode ? String(info.family || '').replace(/^family:/,'') : (AUTO.currentScheme?.family || '--'))
        : '原谱',
      chords: (Array.isArray(AUTO.currentDisplayedChords) && AUTO.currentDisplayedChords.length
        ? AUTO.currentDisplayedChords.slice()
        : String(info.chords || '--').split(/\s*,\s*/).filter((v)=>v && v !== '--')),
      displayText: info.chords || '--'
    };
  }

  function wrapGlobals(){
    const oldDisplayedCapo = window.getDisplayedCapoLabel;
    window.getDisplayedCapoLabel = function(){
      if(AUTO.mode === 'auto' && AUTO.manualCapoMode) return AUTO.manualCapo;
      if(AUTO.mode === 'auto' && AUTO.currentScheme) return AUTO.currentScheme.capo;
      return oldDisplayedCapo ? oldDisplayedCapo() : 0;
    };
    const oldComputeDisplayedKeyName = window.computeDisplayedKeyName;
    window.computeDisplayedKeyName = function(meta){
      // 自动伴奏模式不覆盖顶部歌曲调号；顶部始终显示 原调 + 用户转调。
      return oldComputeDisplayedKeyName ? oldComputeDisplayedKeyName(meta) : getOriginalKeyName();
    };
    window.refreshChordSchemePanel = refreshChordSchemePanel;
    window.getCurrentSchemeResult = getCurrentSchemeResult;
    window.getCurrentPatternResult = getCurrentPatternResult;
    window.getAutoDisplayedChordForOriginal = getAutoDisplayedChordForOriginal;
    const oldChangeTranspose = window.changeTranspose;
    window.changeTranspose = function(delta){
      const result = oldChangeTranspose ? oldChangeTranspose(delta) : undefined;
      refreshChordSchemePanel();
      return result;
    };
    const oldResetTranspose = window.resetTranspose;
    window.resetTranspose = function(){
      const result = oldResetTranspose ? oldResetTranspose() : undefined;
      refreshChordSchemePanel();
      return result;
    };
    const oldRewrite = window.rewriteRenderedChordTexts;
    window.rewriteRenderedChordTexts = function(){
      if(AUTO.mode === 'auto') return rewriteChordsForAuto();
      return oldRewrite ? oldRewrite() : undefined;
    };
  }

  function bindUi(){
    $('ui-rhythm')?.addEventListener('click', ()=>{
      const panel = $('panel-rhythm-hub');
      const layer = $('core-panel-layer');
      if(!panel || !layer) return;
      if(layer.hidden || panel.hidden){
        qa('.core-panel', layer).forEach(p=>p.hidden=true);
        layer.hidden = false;
        panel.hidden = false;
      } else {
        panel.hidden = true;
        layer.hidden = true;
      }
    });
    $('ui-scheme-a')?.addEventListener('click', ()=> setSchemeIndex(0));
    $('ui-scheme-b')?.addEventListener('click', ()=> setSchemeIndex(1));
    $('ui-scheme-c')?.addEventListener('click', ()=> setSchemeIndex(2));
    $('ui-manual-capo-minus')?.addEventListener('click', ()=> { if(AUTO.mode !== 'auto') setMode('auto'); enterManualCapoFromCurrentSong(); setManualCapo(-1); });
    $('ui-manual-capo-plus')?.addEventListener('click', ()=> { if(AUTO.mode !== 'auto') setMode('auto'); enterManualCapoFromCurrentSong(); setManualCapo(1); });
  }

  function bootstrap(){
    ensureUi();
    wrapGlobals();
    bindUi();
    refreshSchemes();
    updateUi();
    const root = $('alphaTab');
    if(root){
      const mo = new MutationObserver(()=>{
        refreshSchemes();
        setTimeout(rewriteChordsForAuto, 30);
        setTimeout(updateUi, 60);
      });
      mo.observe(root, { childList:true, subtree:true });
    }
    setInterval(updateUi, 800);
  }

  document.addEventListener('DOMContentLoaded', bootstrap);
})();
