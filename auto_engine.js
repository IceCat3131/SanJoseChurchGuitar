
(function(){
  const BUILD = 'V13_0c_auto_ui_refine';
  const AUTO = {
    mode: 'original',
    schemeIndex: 0,
    schemes: [],
    currentScheme: null,
    currentPatternId: null,
    lastAutoPatternId: null
  };
  window.__AUTO13 = AUTO;

  function $(id){ return document.getElementById(id); }
  function q(sel, root){ return (root || document).querySelector(sel); }
  function qa(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }
  function getSongCapoSafe(){ return typeof getSongCapo === 'function' ? getSongCapo() : 0; }
  function getOriginalKeyName(){ return (window.__currentMeta && window.__currentMeta.key_name) || 'C'; }
  function preferFlats(){ return typeof prefersFlatsFromKeyName === 'function' ? prefersFlatsFromKeyName(getOriginalKeyName()) : true; }
  function getTransposeSafe(){ return (typeof getUserTranspose === 'function') ? getUserTranspose() : (window.viewerPrefs ? (parseInt(viewerPrefs.transposeSemitones, 10) || 0) : 0); }

  function extractOriginalChords(){
    const root = $('alphaTab');
    if(!root) return [];
    const out=[]; const seen = new Set();
    qa('text, tspan', root).forEach((el)=>{
      if(el.children && el.children.length) return;
      const raw = (el.getAttribute('data-orig-chord') || el.textContent || '').trim();
      if(!raw) return;
      if(typeof looksLikeChordSymbol === 'function' && !looksLikeChordSymbol(raw)) return;
      if(!el.getAttribute('data-orig-chord')) el.setAttribute('data-orig-chord', raw);
      if(!seen.has(raw)){ seen.add(raw); out.push(raw); }
    });
    return out;
  }

  function currentMeter(){ return '4/4'; }

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
            <div class="core-panel-head"><span>节</span><span id="auto-chip-build" class="auto-chip">${BUILD}</span></div>
            <div class="auto-hub-toprow">
              <button type="button" class="core-option-btn auto-mini-btn" id="ui-auto-original">原谱</button>
              <button type="button" class="core-option-btn auto-mini-btn" id="ui-scheme-a">自动A</button>
              <button type="button" class="core-option-btn auto-mini-btn" id="ui-scheme-b">自动B</button>
              <button type="button" class="core-option-btn auto-mini-btn" id="ui-scheme-c">自动C</button>
            </div>
            <div class="auto-hub-inline" id="ui-auto-hub-inline">CP${getSongCapoSafe()} ｜ --</div>
            <div class="auto-hub-layout">
              <div class="auto-hub-left-note">点击原谱返回原谱模式；点击右侧任意节奏进入自动伴奏并默认启用自动A。</div>
              <div class="auto-hub-right-wrap">
                <div class="auto-hub-right-title">节奏</div>
                <div class="auto-hub-right" id="ui-rhythm-list"></div>
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
      badge.textContent = 'build: ' + BUILD;
      document.body.appendChild(badge);
    }
  }

  function buildContext(){
    return {
      originalKey: getOriginalKeyName(),
      songCapo: getSongCapoSafe(),
      transpose: getTransposeSafe(),
      originalChords: extractOriginalChords(),
      preferFlats: preferFlats()
    };
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

  function chordPreviewText(){
    const original = extractOriginalChords().slice(0, 5);
    if(!original.length) return `CP${getSongCapoSafe()} ｜ --`;
    if(AUTO.mode !== 'auto' || !AUTO.currentScheme){
      return `CP${getSongCapoSafe()} ｜ ${original.join('')}`;
    }
    const mapped = original.map((c)=> AUTO.currentScheme.chordMap?.[c] || c);
    return `CP${AUTO.currentScheme.capo} ｜ ${mapped.join('')}`;
  }

  function updateUi(){
    const currentPattern = getCurrentPattern();
    const inAuto = AUTO.mode === 'auto';
    $('ui-rhythm') && ($('ui-rhythm').textContent = inAuto ? '节·伴' : '节·原');
    $('ui-auto-original')?.classList.toggle('active', !inAuto);
    ['a','b','c'].forEach((k, idx)=>{
      const btn = $('ui-scheme-' + k);
      if(!btn) return;
      btn.classList.toggle('active', inAuto && AUTO.schemeIndex === idx);
      btn.disabled = !inAuto;
      btn.classList.toggle('disabled', !inAuto);
    });
    $('ui-auto-hub-inline') && ($('ui-auto-hub-inline').textContent = chordPreviewText());
    buildRhythmPanel();
    setTimeout(rewriteChordsForAuto, 40);
    setTimeout(rewriteChordsForAuto, 180);
    setTimeout(() => { window.dispatchEvent(new CustomEvent('auto13:statechange', { detail: { ...AUTO } })); }, 0);
  }

  function rewriteChordsForAuto(){
    const root = $('alphaTab');
    if(!root) return;
    const chordFontPx = (typeof getChordFontSizePx === 'function') ? getChordFontSizePx() : 16;
    qa('text, tspan', root).forEach((el)=>{
      if(el.children && el.children.length) return;
      const current = (el.textContent || '').trim();
      if(!current) return;
      const original = el.getAttribute('data-orig-chord') || current;
      if(typeof looksLikeChordSymbol === 'function' && !looksLikeChordSymbol(original)) return;
      if(!el.getAttribute('data-orig-chord')) el.setAttribute('data-orig-chord', original);
      let next = original;
      if(AUTO.mode === 'auto' && AUTO.currentScheme && AUTO.currentScheme.chordMap){
        next = AUTO.currentScheme.chordMap[original] || original;
      } else if(typeof transposeChordSymbol === 'function') {
        const semitones = getTransposeSafe();
        next = semitones === 0 ? original : transposeChordSymbol(original, semitones, preferFlats());
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
    AUTO.schemeIndex = Math.max(0, Math.min(index, Math.max(0, AUTO.schemes.length - 1)));
    applyScheme();
  }

  function buildRhythmPanel(){
    const list = $('ui-rhythm-list');
    if(!list || !window.RhythmEngine) return;
    const patterns = RhythmEngine.getPatternsForMeter(currentMeter());
    if(patterns.length && !AUTO.currentPatternId) AUTO.currentPatternId = AUTO.lastAutoPatternId || patterns[0].id;
    list.innerHTML = '';
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

  function wrapGlobals(){
    const oldDisplayedCapo = window.getDisplayedCapoLabel;
    window.getDisplayedCapoLabel = function(){
      if(AUTO.mode === 'auto' && AUTO.currentScheme) return AUTO.currentScheme.capo;
      return oldDisplayedCapo ? oldDisplayedCapo() : 0;
    };
    const oldComputeDisplayedKeyName = window.computeDisplayedKeyName;
    window.computeDisplayedKeyName = function(meta){
      if(AUTO.mode === 'auto' && AUTO.currentScheme) return AUTO.currentScheme.targetConcertKey || '--';
      return oldComputeDisplayedKeyName ? oldComputeDisplayedKeyName(meta) : '--';
    };
    const oldChangeTranspose = window.changeTranspose;
    window.changeTranspose = function(delta){
      if(AUTO.mode === 'auto'){
        viewerPrefs.transposeSemitones = Math.max(-11, Math.min(11, ((parseInt(viewerPrefs.transposeSemitones, 10) || 0) + delta)));
        try { saveViewerPrefs(); } catch(e) {}
        refreshSchemes();
        applyScheme();
        return;
      }
      return oldChangeTranspose ? oldChangeTranspose(delta) : undefined;
    };
    const oldResetTranspose = window.resetTranspose;
    window.resetTranspose = function(){
      if(AUTO.mode === 'auto'){
        viewerPrefs.transposeSemitones = 0;
        try { saveViewerPrefs(); } catch(e) {}
        refreshSchemes();
        applyScheme();
        return;
      }
      return oldResetTranspose ? oldResetTranspose() : undefined;
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
    $('ui-auto-original')?.addEventListener('click', ()=> setMode('original'));
    $('ui-scheme-a')?.addEventListener('click', ()=> setSchemeIndex(0));
    $('ui-scheme-b')?.addEventListener('click', ()=> setSchemeIndex(1));
    $('ui-scheme-c')?.addEventListener('click', ()=> setSchemeIndex(2));
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
