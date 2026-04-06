
(function(){
  const BUILD='V13_2h_FIX_REAL';
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
            <div class="auto-hub-layout auto-hub-layout-v2">
              <div class="auto-hub-left auto-hub-left-v2">
                <div class="auto-hub-col-title">和弦组</div>
                <div class="auto-hub-chord-row">
                  <button type="button" class="core-option-btn auto-mini-btn auto-chord-btn" id="ui-scheme-a">和弦A</button>
                  <button type="button" class="core-option-btn auto-mini-btn auto-chord-btn" id="ui-scheme-b">和弦B</button>
                  <button type="button" class="core-option-btn auto-mini-btn auto-chord-btn" id="ui-scheme-c">和弦C</button>
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
      badge.textContent = 'build: ' + BUILD;
      document.body.appendChild(badge);
    }
  }

  function buildContext(){
 const raw=extractOriginalChords();
 const capo=getSongCapoSafe();
 const real=raw.map(c=>window.SchemeEngine?SchemeEngine.shiftChord(c,capo,true):c);
 return {
   originalKey:getOriginalKeyName(),
   songCapo:0,
   transpose:getTransposeSafe(),
   originalChords:real,
   preferFlats:true
 };
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

  function schemeInfoData(){
    const original = extractOriginalChords().slice(0, 5);
    return oldComputeDisplayedKeyName ? oldComputeDisplayedKeyName(meta) : getOriginalKeyName();
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
