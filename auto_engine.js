
(function(){
  const BUILD = 'V13_0a_auto_base';
  const AUTO = {
    mode: 'original',
    schemeIndex: 0,
    schemes: [],
    currentScheme: null,
    currentPatternId: 'arp_53231323'
  };
  window.__AUTO13 = AUTO;

  function $(id){ return document.getElementById(id); }
  function q(sel, root){ return (root || document).querySelector(sel); }
  function qa(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }
  function getSongCapoSafe(){ return typeof getSongCapo === 'function' ? getSongCapo() : 0; }
  function getOriginalKeyName(){ return (window.__currentMeta && window.__currentMeta.key_name) || 'C'; }
  function preferFlats(){ return typeof prefersFlatsFromKeyName === 'function' ? prefersFlatsFromKeyName(getOriginalKeyName()) : true; }
  function extractOriginalChords(){
    const root = $('alphaTab');
    if(!root) return [];
    const out=[]; const seen = new Set();
    qa('text, tspan', root).forEach((el)=>{
      if(el.children && el.children.length) return;
      const raw = (el.getAttribute('data-orig-chord') || el.textContent || '').trim();
      if(!raw) return;
      if(typeof looksLikeChordSymbol === 'function' && !looksLikeChordSymbol(raw)) return;
      if(!seen.has(raw)){ seen.add(raw); out.push(raw); }
    });
    return out;
  }
  function currentMeter(){ return '4/4'; }
  function ensureUi(){
    const toolbar = q('.core-ui-toolbar');
    if(toolbar && !$('ui-auto-toggle')){
      const autoBtn = document.createElement('button');
      autoBtn.className = 'core-btn core-btn-pill core-btn-mini core-btn-auto';
      autoBtn.id = 'ui-auto-toggle';
      autoBtn.textContent = '原';
      autoBtn.title = '原谱 / 自动伴奏';

      const schemeBtn = document.createElement('button');
      schemeBtn.className = 'core-btn core-btn-pill core-btn-mini';
      schemeBtn.id = 'ui-auto-scheme';
      schemeBtn.textContent = 'A';
      schemeBtn.title = '方案';

      const rhythmBtn = document.createElement('button');
      rhythmBtn.className = 'core-btn core-btn-pill core-btn-mini';
      rhythmBtn.id = 'ui-rhythm';
      rhythmBtn.textContent = '节';
      rhythmBtn.title = '节奏';

      const frag = document.createDocumentFragment();
      frag.appendChild(autoBtn);
      frag.appendChild(schemeBtn);
      frag.appendChild(rhythmBtn);
      const trackBtn = $('ui-track');
      toolbar.insertBefore(frag, trackBtn || null);
    }

    const layer = $('core-panel-layer');
    if(layer && !$('panel-auto-mode')){
      layer.insertAdjacentHTML('beforeend', `
        <div class="core-panel auto-panel-wide" id="panel-auto-mode" hidden>
          <div class="core-panel-head"><span>自动伴奏</span></div>
          <div class="core-panel-actions core-panel-actions-left">
            <button type="button" class="core-option-btn" id="ui-auto-original">原谱模式</button>
            <button type="button" class="core-option-btn" id="ui-auto-enabled">自动伴奏</button>
          </div>
          <div class="auto-status-strip">
            <span class="auto-chip" id="auto-chip-build">${BUILD}</span>
            <span class="auto-chip" id="auto-chip-family">--</span>
            <span class="auto-chip" id="auto-chip-pattern">--</span>
          </div>
          <div class="auto-note">V13_0a：先接入新框架、方案状态、节菜单与二级菜单。6线谱重写生成将在下一阶段接入。</div>
        </div>
        <div class="core-panel auto-panel-wide" id="panel-auto-scheme" hidden>
          <div class="core-panel-head"><span>方案</span></div>
          <div class="auto-panel-grid">
            <button type="button" class="core-option-btn" id="ui-scheme-a">方案 A</button>
            <button type="button" class="core-option-btn" id="ui-scheme-b">方案 B</button>
            <button type="button" class="core-option-btn" id="ui-scheme-c">方案 C</button>
          </div>
          <div class="auto-debug-card">
            <div class="auto-debug-row"><span>当前方案</span><strong id="ui-auto-current-scheme">--</strong></div>
            <div class="auto-debug-row"><span>Family</span><strong id="ui-auto-current-family">--</strong></div>
            <div class="auto-debug-row"><span>Capo</span><strong id="ui-auto-current-capo">--</strong></div>
            <div class="auto-debug-row"><span>目标调</span><strong id="ui-auto-current-key">--</strong></div>
          </div>
          <div class="auto-scheme-summary" id="ui-auto-scheme-summary">等待生成方案…</div>
        </div>
        <div class="core-panel auto-panel-wide" id="panel-rhythm" hidden>
          <div class="core-panel-head"><span>节</span></div>
          <div class="auto-panel-list" id="ui-rhythm-list"></div>
          <div class="auto-note">当前版本先接入 4/4、3/4、6/8 的节奏库骨架，用于测试入口与状态联动。</div>
        </div>`);
    }

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
      transpose: typeof getUserTranspose === 'function' ? getUserTranspose() : 0,
      originalChords: extractOriginalChords(),
      preferFlats: preferFlats()
    };
  }

  function refreshSchemes(){
    AUTO.schemes = window.SchemeEngine ? SchemeEngine.generateSchemes(buildContext()) : [];
    if(!AUTO.schemes.length){ AUTO.currentScheme = null; AUTO.schemeIndex = 0; return; }
    AUTO.schemeIndex = Math.max(0, Math.min(AUTO.schemeIndex, AUTO.schemes.length - 1));
    AUTO.currentScheme = AUTO.schemes[AUTO.schemeIndex] || AUTO.schemes[0];
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
        const semitones = (typeof getUserTranspose === 'function') ? getUserTranspose() : 0;
        next = semitones === 0 ? original : transposeChordSymbol(original, semitones, preferFlats());
      }
      if(next !== current) el.textContent = next;
      try { el.style.fontSize = chordFontPx + 'px'; } catch(e) {}
    });
  }

  function updateUi(){
    $('ui-auto-toggle') && ($('ui-auto-toggle').textContent = AUTO.mode === 'auto' ? '伴' : '原');
    $('ui-auto-scheme') && ($('ui-auto-scheme').textContent = ['A','B','C'][AUTO.schemeIndex] || 'A');
    $('ui-auto-original')?.classList.toggle('active', AUTO.mode === 'original');
    $('ui-auto-enabled')?.classList.toggle('active', AUTO.mode === 'auto');
    $('ui-scheme-a')?.classList.toggle('active', AUTO.schemeIndex === 0);
    $('ui-scheme-b')?.classList.toggle('active', AUTO.schemeIndex === 1);
    $('ui-scheme-c')?.classList.toggle('active', AUTO.schemeIndex === 2);
    const currentPattern = getCurrentPattern();
    $('auto-chip-family') && ($('auto-chip-family').textContent = AUTO.currentScheme ? `${AUTO.currentScheme.family}组 / CP${AUTO.currentScheme.capo}` : '--');
    $('auto-chip-pattern') && ($('auto-chip-pattern').textContent = currentPattern ? currentPattern.name : '--');
    $('ui-auto-current-scheme') && ($('ui-auto-current-scheme').textContent = ['A','B','C'][AUTO.schemeIndex] || '--');
    $('ui-auto-current-family') && ($('ui-auto-current-family').textContent = AUTO.currentScheme ? AUTO.currentScheme.family : '--');
    $('ui-auto-current-capo') && ($('ui-auto-current-capo').textContent = AUTO.currentScheme ? 'CP' + AUTO.currentScheme.capo : '--');
    $('ui-auto-current-key') && ($('ui-auto-current-key').textContent = AUTO.currentScheme ? AUTO.currentScheme.targetConcertKey : '--');
    $('ui-auto-scheme-summary') && ($('ui-auto-scheme-summary').textContent = AUTO.currentScheme ? `${AUTO.currentScheme.summary} ｜ 原谱CAPO=${getSongCapoSafe()} ｜ 全局转调=${(typeof getUserTranspose === 'function' ? getUserTranspose() : 0)}` : '当前歌曲尚未抓取到和弦，方案稍后生成。');
    buildRhythmPanel();
    setTimeout(rewriteChordsForAuto, 40);
    setTimeout(rewriteChordsForAuto, 180);
    setTimeout(() => { window.dispatchEvent(new CustomEvent('auto13:statechange', { detail: { ...AUTO } })); }, 0);
  }

  function applyScheme(){
    if(AUTO.mode !== 'auto'){ updateUi(); return; }
    if(!AUTO.schemes.length) refreshSchemes();
    AUTO.currentScheme = AUTO.schemes[AUTO.schemeIndex] || AUTO.schemes[0] || null;
    updateUi();
    if(typeof scheduleChordRewrite === 'function') scheduleChordRewrite(20);
  }

  function setMode(mode){
    AUTO.mode = mode === 'auto' ? 'auto' : 'original';
    if(AUTO.mode === 'auto') refreshSchemes();
    applyScheme();
  }

  function setSchemeIndex(index){
    AUTO.schemeIndex = Math.max(0, Math.min(index, Math.max(0, AUTO.schemes.length - 1)));
    applyScheme();
  }

  function getCurrentPattern(){
    const patterns = window.RhythmEngine ? RhythmEngine.getPatternsForMeter(currentMeter()) : [];
    return patterns.find((p)=>p.id === AUTO.currentPatternId) || patterns[0] || null;
  }

  function buildRhythmPanel(){
    const list = $('ui-rhythm-list');
    if(!list || !window.RhythmEngine) return;
    const patterns = RhythmEngine.getPatternsForMeter(currentMeter());
    if(patterns.length && !patterns.some((p)=>p.id===AUTO.currentPatternId)) AUTO.currentPatternId = patterns[0].id;
    list.innerHTML = '';
    patterns.forEach((pattern)=>{
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'core-option-btn';
      btn.textContent = pattern.name;
      btn.classList.toggle('active', pattern.id === AUTO.currentPatternId);
      btn.addEventListener('click', ()=>{ AUTO.currentPatternId = pattern.id; updateUi(); });
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
    $('ui-auto-toggle')?.addEventListener('click', ()=>{
      const panel = $('panel-auto-mode');
      if(!panel) return;
      const layer = $('core-panel-layer');
      if(layer?.hidden || panel.hidden){
        qa('.core-panel', layer).forEach(p=>p.hidden=true);
        layer.hidden = false;
        panel.hidden = false;
      } else {
        panel.hidden = true;
        if(layer) layer.hidden = true;
      }
    });
    $('ui-auto-scheme')?.addEventListener('click', ()=>{
      const panel = $('panel-auto-scheme');
      const layer = $('core-panel-layer');
      if(!panel || !layer) return;
      qa('.core-panel', layer).forEach(p=>p.hidden=true);
      layer.hidden = false; panel.hidden = false;
    });
    $('ui-rhythm')?.addEventListener('click', ()=>{
      const panel = $('panel-rhythm');
      const layer = $('core-panel-layer');
      if(!panel || !layer) return;
      qa('.core-panel', layer).forEach(p=>p.hidden=true);
      layer.hidden = false; panel.hidden = false;
    });
    $('ui-auto-original')?.addEventListener('click', ()=> setMode('original'));
    $('ui-auto-enabled')?.addEventListener('click', ()=> setMode('auto'));
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
        if(AUTO.mode === 'auto'){
          refreshSchemes();
          setTimeout(rewriteChordsForAuto, 30);
        }
      });
      mo.observe(root, { childList:true, subtree:true });
    }
    setInterval(updateUi, 800);
  }

  document.addEventListener('DOMContentLoaded', bootstrap);
})();
