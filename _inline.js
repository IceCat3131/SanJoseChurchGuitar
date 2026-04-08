
  const BOOKS = {
    c: {
      label: "大本诗歌",
      folderText: "c_text",
      gtzPrefix: "assets/c/c",
      svgPrefix: "assets/c/c",
      codePrefix: "c"
    },
    ts: {
      label: "小本诗歌",
      folderText: "ts_text",
      gtzPrefix: "assets/ts/ts",
      svgPrefix: "assets/ts/ts",
      codePrefix: "ts"
    }
  };

  const MAX_RANGES = 20; // 最多支持 2000 首（够用了）

  const state = {
    currentBook: "c",
    currentNo: 1,
    // “显示模式”：score=吉他谱，lyrics=歌词
    mode: "score",
    // 歌词当前显示：simplified=简体, traditional=繁体
    script: "simplified",
    lyricsFontSize: 24,
    data: { c: [], ts: [] },
    loadedRanges: { c: {}, ts: {} },
    searchBook: "c",
    searchDraft: "1",
    searchResults: []
  };

  const DEFAULT_VIEWER_PREFS = {
    scoreFontSizePx: 30,
    scoreSpacingFactor: 2.0,
    chordFontSizePx: 16,
    pureLyricsFontSize: 24,
    playbackSpeedPercent: 100,
    transposeSemitones: 0
  };

  let viewerPrefs = loadViewerPrefs();
  let __currentMeta = null;

  let converterToTraditional = null; // 简 -> 繁
  let converterToSimplified = null;  // 繁 -> 简

  function setupConvertersIfNeeded() {
    if (!window.OpenCC) return;
    if (!converterToTraditional) {
      // 简体（cn） -> 繁体（tw）
      converterToTraditional = OpenCC.Converter({ from: "cn", to: "tw" });
    }
    if (!converterToSimplified) {
      // 繁体（tw） -> 简体（cn）
      converterToSimplified = OpenCC.Converter({ from: "tw", to: "cn" });
    }
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function(ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function convertTextByScript(text) {
    setupConvertersIfNeeded();
    if (state.script === "traditional" && converterToTraditional) {
      return converterToTraditional(text);
    }
    if (state.script === "simplified" && converterToSimplified) {
      return converterToSimplified(text); // 如果原 JSON 就是简体，这里基本等于原文
    }
    return text;
  }

  function loadViewerPrefs() {
    try {
      const raw = localStorage.getItem('sjcg.viewerPrefs.v1');
      if (!raw) return { ...DEFAULT_VIEWER_PREFS };
      const obj = JSON.parse(raw);
      if (obj && Object.prototype.hasOwnProperty.call(obj, 'capoOverride')) {
        try { delete obj.capoOverride; } catch (e) {}
      }
      return { ...DEFAULT_VIEWER_PREFS, ...obj };
    } catch (e) {
      return { ...DEFAULT_VIEWER_PREFS };
    }
  }

  function saveViewerPrefs() {
    try { localStorage.setItem('sjcg.viewerPrefs.v1', JSON.stringify(viewerPrefs)); } catch (e) {}
  }

  function getSongCapo() {
    const metaCapo = parseInt(window.__gtzMeta?.capo, 10);
    return Number.isFinite(metaCapo) ? Math.max(0, Math.min(12, metaCapo)) : 0;
  }

  function getEffectiveCapo() {
    return getSongCapo();
  }

  function getDisplayedCapoLabel() {
    return getSongCapo();
  }

  function getUserTranspose() {
    const n = parseInt(viewerPrefs.transposeSemitones, 10);
    return Number.isFinite(n) ? Math.max(-11, Math.min(11, n)) : 0;
  }

  function getEffectiveTranspose() {
    return getUserTranspose();
  }

  function trackUsesTab(track) {
    const staves = Array.isArray(track?.staves) ? track.staves : [];
    return staves.some((staff) => !!staff?.showTablature);
  }

  function getTrackTransposeSemitones(track) {
    const base = getUserTranspose();
    return trackUsesTab(track) ? (base + getEffectiveCapo()) : base;
  }

  const NOTE_INDEX_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const NOTE_INDEX_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const NOTE_TO_INDEX = {
    C: 0, 'B#': 0,
    'C#': 1, Db: 1,
    D: 2,
    'D#': 3, Eb: 3,
    E: 4, Fb: 4,
    F: 5, 'E#': 5,
    'F#': 6, Gb: 6,
    G: 7,
    'G#': 8, Ab: 8,
    A: 9,
    'A#': 10, Bb: 10,
    B: 11, Cb: 11
  };

  function prefersFlatsFromKeyName(keyName) {
    if (!keyName) return true;
    return String(keyName).includes('b') || /^F(?:$|m)/i.test(String(keyName));
  }

  function transposePitchName(name, semitones, preferFlats) {
    if (!name || !Number.isFinite(semitones)) return name || '--';
    const normalized = String(name).trim();
    const m = normalized.match(/^([A-G](?:#|b)?)(.*)$/);
    if (!m) return normalized;
    const root = m[1];
    const suffix = m[2] || '';
    const idx = NOTE_TO_INDEX[root];
    if (idx == null) return normalized;
    const next = (idx + semitones % 12 + 12) % 12;
    const names = preferFlats ? NOTE_INDEX_FLAT : NOTE_INDEX_SHARP;
    return names[next] + suffix;
  }


  function transposeChordSymbol(symbol, semitones, preferFlats) {
    const raw = String(symbol || '').trim();
    if (!raw || !Number.isFinite(semitones) || semitones === 0) return raw;
    const m = raw.match(/^([A-G](?:#|b)?)([^/]*?)(?:\/([A-G](?:#|b)?))?$/);
    if (!m) return raw;
    const root = m[1];
    const quality = m[2] || '';
    const bass = m[3] || '';
    if (NOTE_TO_INDEX[root] == null) return raw;
    if (bass && NOTE_TO_INDEX[bass] == null) return raw;
    const nextRoot = transposePitchName(root, semitones, preferFlats);
    const nextBass = bass ? transposePitchName(bass, semitones, preferFlats) : '';
    return nextRoot + quality + (nextBass ? '/' + nextBass : '');
  }

  function getChordFontSizePx() {
    const n = parseInt(viewerPrefs?.chordFontSizePx, 10);
    return Number.isFinite(n) ? Math.max(10, Math.min(36, n)) : 16;
  }

  function looksLikeChordSymbol(text) {
    const s = String(text || '').trim();
    if (!s || s.length > 20) return false;
    if (!/^[A-G](?:#|b)?/.test(s)) return false;
    if (/[^A-Ga-g0-9#b\/()\-+susmajdimaugaddnoø°△mM ]/.test(s)) return false;
    return /^(?:[A-G](?:#|b)?)(?:m|maj|min|sus|dim|aug|add|[0-9]|\(|\/|$)/i.test(s);
  }

  function rewriteRenderedChordTexts() {
    const root = document.getElementById('alphaTab');
    if (!root) return;
    const semitones = getUserTranspose();
    const preferFlats = prefersFlatsFromKeyName((__currentMeta && __currentMeta.key_name) || '');
    const chordFontPx = getChordFontSizePx();
    const nodes = root.querySelectorAll('text, tspan');
    nodes.forEach((el) => {
      if (el.children && el.children.length) return;
      const current = (el.textContent || '').trim();
      if (!current) return;
      const original = el.getAttribute('data-orig-chord') || current;
      if (!looksLikeChordSymbol(original)) return;
      if (!el.getAttribute('data-orig-chord')) {
        el.setAttribute('data-orig-chord', original);
      }
      const next = semitones === 0 ? original : transposeChordSymbol(original, semitones, preferFlats);
      if (next && next !== current) {
        el.textContent = next;
      }
      try {
        el.style.fontSize = chordFontPx + 'px';
      } catch (e) {}
    });
  }

  let __chordObserver = null;
  let __chordRewriteTimer = null;
  function scheduleChordRewrite(delay = 80) {
    try { if (__chordRewriteTimer) clearTimeout(__chordRewriteTimer); } catch (e) {}
    __chordRewriteTimer = setTimeout(() => {
      rewriteRenderedChordTexts();
    }, delay);
  }

  function ensureChordObserver() {
    const root = document.getElementById('alphaTab');
    if (!root || __chordObserver) return;
    __chordObserver = new MutationObserver(() => {
      scheduleChordRewrite(30);
    });
    __chordObserver.observe(root, { childList: true, subtree: true, characterData: false });
  }

  function computeDisplayedKeyName(meta) {
    const m = meta || {};
    const original = m.key_name || '--';
    const semitones = getUserTranspose();
    if (!original || original === '--' || semitones === 0) return original;
    const preferFlats = prefersFlatsFromKeyName(original);
    return transposePitchName(original, semitones, preferFlats);
  }

  function getAllTracks(api) {
    const tracks = api?.score?.tracks || __currentScore?.tracks || [];
    return Array.isArray(tracks) ? tracks : [];
  }

  function getSelectedTrackIndices(api) {
    const tracks = getAllTracks(api);
    if (!tracks.length) return [];
    if (Array.isArray(__visibleTrackIndices)) return __visibleTrackIndices.slice();
    return tracks.map((_, i) => i);
  }

  function applyPlaybackTrackVisibility(api) {
    if (!api) return;
    const tracks = getAllTracks(api);
    if (!tracks.length || typeof api.changeTrackMute !== 'function') return;

    const selected = new Set(getSelectedTrackIndices(api));
    const hasExplicitSelection = Array.isArray(__visibleTrackIndices);
    const useAll = !hasExplicitSelection;

    tracks.forEach((track, i) => {
      const muted = useAll ? false : !selected.has(i);
      try { api.changeTrackMute([track], muted); } catch (e) {}
    });
  }

  function applyScoreTransposition(api) {
    if (!api || !api.settings) return;
    const tracks = getAllTracks(api);
    const trackTranspositions = tracks.length
      ? tracks.map((track) => getTrackTransposeSemitones(track))
      : [getEffectiveTranspose()];
    try {
      if (!api.settings.notation) api.settings.notation = {};
      api.settings.notation.transpositionPitches = trackTranspositions.slice();
      api.updateSettings();
      if (typeof api.changeTrackTranspositionPitch === 'function' && tracks.length) {
        tracks.forEach((track, i) => {
          const semitones = trackTranspositions[i] || 0;
          try { api.changeTrackTranspositionPitch([track], semitones); } catch (e) { console.warn('live transpose failed', e); }
        });
      }
      try { api.render(); } catch (e) {}
      scheduleChordRewrite(120);
      scheduleTabCapoOverlay(140);
    } catch (e) {
      console.warn('applyScoreTransposition failed', e);
    }
  }

  function goHome() {
    window.location.href = "index.html";
  }

  async function goPrevSong() {
    await tryGoTo(-1);
  }

  async function goNextSong() {
    await tryGoTo(1);
  }


  async function unlockAlphaTabAudio() {
    const api = window.__atApi;
    if (!api || window.__alphaTabAudioUnlocked) return;
    try {
      if (!api.isReadyForPlayback) return;
      api.play();
      await new Promise(resolve => setTimeout(resolve, 0));
      api.pause();
      window.__alphaTabAudioUnlocked = true;
    } catch (e) {
      console.warn('unlockAlphaTabAudio failed', e);
    }
  }

  function installAudioUnlockHandlers() {
    if (window.__alphaTabAudioUnlockHandlersInstalled) return;
    window.__alphaTabAudioUnlockHandlersInstalled = true;
    const handler = () => { unlockAlphaTabAudio(); };
    ['pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
      document.addEventListener(eventName, handler, { passive: true });
    });
  }

  async function togglePlayPause() {
    try {
      await unlockAlphaTabAudio();
      if (window.__atApi) window.__atApi.playPause();
    } catch (e) {
      console.warn('togglePlayPause failed', e);
    }
  }

  function setPlaybackSpeedPercent(value) {
    viewerPrefs.playbackSpeedPercent = Math.min(150, Math.max(50, parseInt(value, 10) || 100));
    saveViewerPrefs();
    refreshAdjustUI();
    updateMetaRow();
    try { if (window.__atApi) window.__atApi.playbackSpeed = viewerPrefs.playbackSpeedPercent / 100; } catch (e) {}
  }

  function changeTranspose(delta) {
    viewerPrefs.transposeSemitones = Math.max(-11, Math.min(11, getUserTranspose() + delta));
    saveViewerPrefs();
    refreshAdjustUI();
    updateMetaRow();
    applyViewerPrefsToScore();
  }

  function resetTranspose() {
    viewerPrefs.transposeSemitones = 0;
    saveViewerPrefs();
    refreshAdjustUI();
    updateMetaRow();
    applyViewerPrefsToScore();
  }

  function changeScoreFont(delta) {
    viewerPrefs.scoreFontSizePx = Math.max(14, Math.min(52, viewerPrefs.scoreFontSizePx + delta));
    saveViewerPrefs();
    refreshAdjustUI();
    applyViewerPrefsToScore();
  }

  function changeSpacing(delta) {
    const next = Math.round((viewerPrefs.scoreSpacingFactor + delta) * 10) / 10;
    viewerPrefs.scoreSpacingFactor = Math.max(1.0, Math.min(3.5, next));
    saveViewerPrefs();
    refreshAdjustUI();
    applyViewerPrefsToScore();
  }

  function changeChordFont(delta) {
    viewerPrefs.chordFontSizePx = Math.max(10, Math.min(36, getChordFontSizePx() + delta));
    saveViewerPrefs();
    scheduleChordRewrite(10);
    refreshAdjustUI();
  }

  function resetTextSettings() {
    viewerPrefs.scoreFontSizePx = DEFAULT_VIEWER_PREFS.scoreFontSizePx;
    viewerPrefs.scoreSpacingFactor = DEFAULT_VIEWER_PREFS.scoreSpacingFactor;
    viewerPrefs.chordFontSizePx = DEFAULT_VIEWER_PREFS.chordFontSizePx;
    saveViewerPrefs();
    applyViewerPrefsToScore();
    refreshAdjustUI();
  }

  async function setSearchBook(book, autoSearch = false) {
    state.searchBook = (book === 'ts') ? 'ts' : 'c';
    const inputEl = document.getElementById('ui-search-input');
    const currentInput = String(inputEl?.value || '').trim();
    if (currentInput) state.searchDraft = currentInput;
    syncBookButtons();
    clearSearchResults();
    syncUI();

    const value = String(state.searchDraft || currentInput || '').trim();
    if (autoSearch && value) {
      return await performSearch(value, state.searchBook);
    }
    return true;
  }

  function setScriptMode(mode) {
    state.script = (mode === 'traditional') ? 'traditional' : 'simplified';
    syncScriptButton();
    getSong(state.currentBook, state.currentNo).then(song => {
      if (song) renderLyrics(song);
    });
  }

  async function setBook(book) {
    const nextBook = (book === 'ts') ? 'ts' : 'c';
    if (state.currentBook === nextBook) return true;
    state.currentBook = nextBook;
    syncBookButtons();
    updateURL();
    await loadAndRenderCurrentSong();
    return true;
  }

  async function performSearch(raw, bookOverride = null) {
    const value = String(raw || '').trim();
    state.searchDraft = value;
    if (!value) {
      clearSearchResults();
      return false;
    }

    const targetBook = (bookOverride === 'ts' || bookOverride === 'c')
      ? bookOverride
      : ((state.searchBook === 'ts') ? 'ts' : 'c');

    const digitsMatch = value.match(/^(\d{1,4})$/);
    if (digitsMatch) {
      const no = parseInt(digitsMatch[1], 10);
      if (!Number.isFinite(no) || no <= 0) {
        clearSearchResults();
        return false;
      }
      const song = await getSong(targetBook, no);
      if (!song) {
        renderSearchResults([], value, targetBook);
        return false;
      }

      state.searchBook = targetBook;
      state.currentBook = targetBook;
      state.currentNo = no;
      state.searchDraft = String(no);
      clearSearchResults();
      updateURL();
      await loadAndRenderCurrentSong();
      return true;
    }

    state.searchBook = targetBook;
    const results = await searchSongsByKeyword(targetBook, value);
    renderSearchResults(results, value, targetBook);
    return results.length > 0;
  }


  function updateMetaRow(meta) {
    __currentMeta = meta || __currentMeta || {};
  }

  function refreshAdjustUI() {
    return {
      scoreFontSizePx: viewerPrefs.scoreFontSizePx,
      scoreSpacingFactor: viewerPrefs.scoreSpacingFactor,
      playbackSpeedPercent: viewerPrefs.playbackSpeedPercent,
      transposeSemitones: getUserTranspose(),
      capo: getDisplayedCapoLabel()
    };
  }

  function applyViewerPrefsToScore() {
    if (!window.__atApi) return;
    applyLyricsFont(window.__atApi, viewerPrefs.scoreFontSizePx);
    applyLyricSpacing(window.__atApi, viewerPrefs.scoreSpacingFactor);
    applyScoreTransposition(window.__atApi);
    try { window.__atApi.playbackSpeed = viewerPrefs.playbackSpeedPercent / 100; } catch (e) {}
    scheduleChordRewrite(30);
    scheduleTabCapoOverlay(120);
  }


  let __tabCapoOverlayTimer = null;

  function ensureTabCapoOverlayRoot() {
    const host = document.getElementById('alphaTab');
    if (!host) return null;
    host.style.position = host.style.position || 'relative';
    let root = host.querySelector('.tab-capo-overlay-root');
    if (!root) {
      root = document.createElement('div');
      root.className = 'tab-capo-overlay-root';
      root.style.position = 'absolute';
      root.style.left = '0';
      root.style.top = '0';
      root.style.right = '0';
      root.style.bottom = '0';
      root.style.pointerEvents = 'none';
      root.style.zIndex = '20';
      host.appendChild(root);
    }
    return root;
  }

  function clearTabCapoOverlay() {
    const root = document.querySelector('#alphaTab .tab-capo-overlay-root');
    if (root) root.innerHTML = '';
  }

  function isTabBarBounds(barBounds) {
    const staff = barBounds?.bar?.staff;
    if (!staff) return false;
    // 只要这一条 staff 显示了 TAB，就允许 overlay；
    // 不再要求它必须是“纯TAB无五线谱”的 staff。
    return !!staff.showTablature;
  }

  function getDisplayedFretForCapo(note) {
    if (!note || !Number.isFinite(note.fret) || note.fret < 0) return null;

    const capo = getEffectiveCapo();
    const transpose = getUserTranspose();

    // 正确显示逻辑：
    // TAB显示 = 原始品位 + Capo + 用户转调
    const displayed = note.fret + capo + transpose;

    if (!Number.isFinite(displayed) || displayed < 0) return null;
    return displayed;
  }

  function renderTabCapoOverlay() {
    const api = window.__atApi;
    const root = ensureTabCapoOverlayRoot();
    if (!api || !root) return;
    root.innerHTML = '';

    const offset = getEffectiveCapo() + getUserTranspose();
    const lookup = api.boundsLookup || api.renderer?.boundsLookup || null;
    if (!offset || !lookup || !Array.isArray(lookup.staffSystems)) return;

    for (const system of lookup.staffSystems) {
      const masterBars = Array.isArray(system?.bars) ? system.bars : [];
      for (const masterBar of masterBars) {
        const barBoundsList = Array.isArray(masterBar?.bars) ? masterBar.bars : [];
        for (const barBounds of barBoundsList) {
          if (!isTabBarBounds(barBounds)) continue;
          const beats = Array.isArray(barBounds?.beats) ? barBounds.beats : [];
          for (const beatBounds of beats) {
            const notes = Array.isArray(beatBounds?.notes) ? beatBounds.notes : [];
            for (const noteBounds of notes) {
              const note = noteBounds?.note;
              const displayFret = getDisplayedFretForCapo(note);
              const box = noteBounds?.noteHeadBounds || noteBounds;
              if (displayFret === null || !box) continue;
              const bw = box.w ?? box.width ?? 16;
              const bh = box.h ?? box.height ?? 16;
              const bx = box.x ?? 0;
              const by = box.y ?? 0;

              const el = document.createElement('div');
              el.className = 'tab-capo-overlay-note';
              el.textContent = String(displayFret);
              el.style.position = 'absolute';
              el.style.left = `${bx}px`;
              el.style.top = `${by}px`;
              el.style.width = `${bw}px`;
              el.style.height = `${bh}px`;
              el.style.display = 'flex';
              el.style.alignItems = 'center';
              el.style.justifyContent = 'center';
              el.style.background = '#fff';
              el.style.color = '#111';
              el.style.fontWeight = '700';
              el.style.fontSize = `${Math.max(12, Math.round(bh * 0.95))}px`;
              el.style.lineHeight = '1';
              el.style.borderRadius = '2px';
              el.style.boxSizing = 'border-box';
              root.appendChild(el);
            }
          }
        }
      }
    }
  }

  function scheduleTabCapoOverlay(delay = 60) {
    try { if (__tabCapoOverlayTimer) clearTimeout(__tabCapoOverlayTimer); } catch (e) {}
    __tabCapoOverlayTimer = setTimeout(() => {
      try { renderTabCapoOverlay(); } catch (e) { console.warn('renderTabCapoOverlay failed', e); }
    }, delay);
  }


  function applyViewerPrefsToLyricsPage() {
    state.lyricsFontSize = viewerPrefs.pureLyricsFontSize;
    const root = document.getElementById('lyrics-view');
    if (root) root.style.fontSize = state.lyricsFontSize + 'px';
  }

  function bindViewerControls() {
    return;
  }

  
  
  function setPlayerStatus(text) {
    return text || "";
  }
// ===== alphaTab + .gtz 加载 =====
  function base64ToUint8Array(b64) {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function loadGtzIntoAlphaTab(api, gtzUrl) {
    try { api.stop(); } catch(e) {}
    setPlayerUI({ current: 0, total: 0, playing: false });

    const res = await fetch(gtzUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${gtzUrl}`);
    const txt = await res.text();
    let gtz;
    try { gtz = JSON.parse(txt); } catch(e) { throw new Error('gtz 不是合法 JSON: ' + e.message); }

    let scoreB64 = null;
    if (gtz?.gpBase64) scoreB64 = gtz.gpBase64;
    else if (gtz?.score?.data) scoreB64 = gtz.score.data;
    else if (gtz?.scoreBase64) scoreB64 = gtz.scoreBase64;
    if (!scoreB64) throw new Error('gtz 格式错误：缺少谱面数据');

    const st = gtz?.state || null;
    const vs = gtz?.viewerState || null;
    window.__gtzState = {
      fontSizePx: st?.fontSizePx ?? vs?.fontSizePx ?? DEFAULT_VIEWER_PREFS.scoreFontSizePx,
      spacingFactor: st?.spacingFactor ?? vs?.spacingFactor ?? DEFAULT_VIEWER_PREFS.scoreSpacingFactor,
      zoom: st?.zoom ?? (vs?.zoom != null ? Math.round(vs.zoom * 100) : 100),
      visibleTrackIndices: st?.visibleTrackIndices ?? vs?.visibleTrackIndices ?? null
    };
    window.__gtzMeta = gtz?.meta || null;
    updateMetaRow(window.__gtzMeta || null);

    const bytes = base64ToUint8Array(scoreB64);
    api.load(bytes);

    setPlayerStatus('谱面已加载');
    return gtz;
  }

  function msToMMSS(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }


  // ===== 从 .gtz.state 还原“导出时的显示效果” =====
  function applyLyricsFont(api, px) {
    if (!api || !px) return;
    try {
      const settings = api.settings;
      if (!settings.display) settings.display = {};
      if (!settings.display.resources) settings.display.resources = {};
      if (!settings.display.resources.elementFonts) settings.display.resources.elementFonts = new Map();

      const FontCtor = window.alphaTab?.model?.Font || window.alphaTab?.Font;
      const ne = window.alphaTab?.NotationElement;

      if (settings.display.resources.elementFonts && typeof settings.display.resources.elementFonts.set === 'function' && FontCtor && ne) {
        const fontObj = new FontCtor('Microsoft YaHei', px, window.alphaTab.model.FontStyle.Plain, window.alphaTab.model.FontWeight.Regular);
        try { fontObj.families = ['Microsoft YaHei', 'Arial', 'sans-serif']; } catch (e) {}
        if (ne.EffectLyrics != null) settings.display.resources.elementFonts.set(ne.EffectLyrics, fontObj);
        api.updateSettings();
      }
    } catch (e) {
      console.warn('applyLyricsFont failed', e);
    }
  }

  function applyLyricSpacing(api, factor) {
    if (!api || !factor) return;
    // 与 gp-lyrics-fixed-export 保持一致：1.00x => 0px, 2.00x => 12px
    const padding = Math.max(0, Math.round((factor - 1) * 12));
    try {
      const settings = api.settings;
      if (!settings.display) settings.display = {};
      if ('lyricLinesPaddingBetween' in settings.display) {
        settings.display.lyricLinesPaddingBetween = padding;
        api.updateSettings();
      } else {
        // 旧版本兜底：不报错即可（必要时再走 SVG 后处理）
      }
    } catch (e) {
      console.warn('applyLyricSpacing failed', e);
    }
  }

  function applyZoom(api, zoom) {
    if (!api || !zoom) return;
    try {
      const settings = api.settings;
      if (!settings.display) settings.display = {};
      // 这里以 1.0 为基准缩放（你导出的 zoom=100 表示不缩放）
      settings.display.scale = (zoom / 100);
      __exportBaseScale = settings.display.scale || 1.0;
      api.updateSettings();
    } catch (e) {}
  }

  
  // ===== 响应式：控制每行小节数（barsPerRow）与横竖屏 =====
  // 目标：
  // - 手机竖屏：>=2 小节/行
  // - 手机横屏：>=3 小节/行
  // - iPad/电脑：>=5 小节/行（宽屏可到 6）
  let __exportBaseScale = 1.0; // 来自 .gtz.state.zoom
  let __lastBarsPerRow = null;
  let __lastResponsiveScale = null;

  function computeBarsPerRow(width, isLandscape) {
    // width: alphaTab 容器可用宽度
    if (width <= 0 || !isFinite(width)) return -1;
    if (width < 520) return isLandscape ? 3 : 2;        // 手机
    if (width < 740) return isLandscape ? 4 : 3;        // 大屏手机/小平板
    if (width < 1100) return 5;                         // iPad/笔记本
    return 6;                                           // 大屏桌面
  }

  function computeResponsiveScale(width, isLandscape) {
    // 为了保证“每行小节数”能达到目标，小屏适当缩放
    if (width < 520) return isLandscape ? 0.88 : 0.92;
    if (width < 740) return isLandscape ? 0.90 : 0.94;
    if (width < 1100) return 0.96;
    return 1.0;
  }

  function applyResponsiveLayout(api) {
    if (!api) return;
    const el = document.getElementById('score-view') || document.getElementById('alphaTab') || document.body;
    const w = (el && el.clientWidth) ? el.clientWidth : window.innerWidth;
    const isLandscape = window.matchMedia && window.matchMedia('(orientation: landscape)').matches;

    const bars = computeBarsPerRow(w, isLandscape);
    const mul = computeResponsiveScale(w, isLandscape);

    try {
      const settings = api.settings;
      if (!settings.display) settings.display = {};

      // 强制 Page 布局，barsPerRow 才会生效
      if (window.alphaTab?.LayoutMode) {
        settings.display.layoutMode = window.alphaTab.LayoutMode.Page;
      }

      // 使用系统自动布局（避免小屏变成 1 小节/行）
      if (window.alphaTab?.SystemsLayoutMode) {
        settings.display.systemsLayoutMode = window.alphaTab.SystemsLayoutMode.Automatic;
      }

      // 设置每行小节数
      settings.display.barsPerRow = bars;

      // 缩放：导出基准 * 响应式乘子
      const responsiveScale = (__exportBaseScale || 1.0) * mul;
      settings.display.scale = responsiveScale;

      // 仅当有变化才更新，减少闪烁
      if (__lastBarsPerRow !== bars || Math.abs((__lastResponsiveScale||0) - responsiveScale) > 0.001) {
        __lastBarsPerRow = bars;
        __lastResponsiveScale = responsiveScale;
        api.updateSettings();
        // alphaTab 会自动响应 resize，但 barsPerRow/scale 变化最好强制 render
        try { api.render(); } catch(e) {}
      }
    } catch (e) {
      console.warn('applyResponsiveLayout failed', e);
    }
  }

  let __resizeTimer = null;
  function scheduleResponsiveLayout(api) {
    if (__resizeTimer) clearTimeout(__resizeTimer);
    __resizeTimer = setTimeout(() => applyResponsiveLayout(api), 120);
  }

// ===== 多轨道同页显示 + 轨道开关 =====
  let __currentScore = null;
  let __visibleTrackIndices = null;

  function renderVisibleTracks(api) {
    if (!api || !__currentScore) return;
    let idxs = Array.isArray(__visibleTrackIndices) ? __visibleTrackIndices.slice() : [];
    if (!idxs.length) {
      // 默认：全选
      idxs = __currentScore.tracks.map((_, i) => i);
    }
    try {
      api.renderScore(__currentScore, idxs);
    } catch (e) {
      console.warn('renderScore failed, fallback render', e);
      try { api.render(); } catch(e2) {}
    }
    applyPlaybackTrackVisibility(api);
  }

  window.renderVisibleTracks = renderVisibleTracks;

  function buildTracksPanel(score) {
    return score;
  }

  function setupTracksButton() {
    return;
  }

  // ===== 播放位置标记（长竖线光标） =====
  function enableCursor(api) {
    try {
      const settings = api.settings;
      if (!settings.player) settings.player = {};
      if ('enableCursor' in settings.player) settings.player.enableCursor = true;
      if ('enableAnimatedBeatCursor' in settings.player) settings.player.enableAnimatedBeatCursor = true;
      api.updateSettings();
    } catch (e) {}
  }
  let __playerUi = null;
  let __playbackState = { current: 0, total: 0, playing: false, progress: 0 };
  function setupPlayerBar(api) {
    if (__playerUi) return;
    const btnPrev = document.getElementById("ui-prev");
    const btnPlay = document.getElementById("ui-play");
    const btnNext = document.getElementById("ui-next");
    const timeEl = document.getElementById("ui-time");
    const progressEl = document.getElementById("ui-progress");

    __playerUi = { btnPrev, btnPlay, btnNext, timeEl, progressEl, isSeeking: false };

    api.playerStateChanged.on((args) => {
      const playing = (args.state === alphaTab.synth.PlayerState.Playing);
      __playbackState.playing = playing;
      if (btnPlay) btnPlay.textContent = playing ? "⏸" : "▶";
    });

    let previousSec = -1;
    api.playerPositionChanged.on((args) => {
      const currentSec = Math.floor(args.currentTime / 1000);
      if (currentSec === previousSec) return;
      previousSec = currentSec;

      const max = Math.max(1, args.endTime);
      const v = Math.floor((args.currentTime / max) * 1000);
      __playbackState.current = args.currentTime || 0;
      __playbackState.total = args.endTime || 0;
      __playbackState.progress = isFinite(v) ? v : 0;
      if (!__playerUi.isSeeking && progressEl) {
        progressEl.value = String(__playbackState.progress);
      }
      if (timeEl) timeEl.textContent = `${msToMMSS(args.currentTime)} / ${msToMMSS(args.endTime)}`;
    });

    if (progressEl) {
      progressEl.addEventListener("input", () => {
        __playerUi.isSeeking = true;
        const v = parseInt(progressEl.value, 10);
        const total = __playbackState.total || 0;
        const target = Math.floor(total * (v / 1000));
        if (timeEl) timeEl.textContent = `${msToMMSS(target)} / ${msToMMSS(total)}`;
      });

      progressEl.addEventListener("change", () => {
        const v = parseInt(progressEl.value, 10);
        const total = __playbackState.total || 0;
        const target = Math.floor(total * (v / 1000));
        try { api.timePosition = target; } catch(e) {}
        __playerUi.isSeeking = false;
      });
    }
  }

  function parseTimeFromText(t) {
    // t like " 03:12" or "03:12"
    const s = (t || "").trim();
    const m = s.match(/^(\d+):(\d{2})$/);
    if (!m) return 0;
    const min = parseInt(m[1], 10);
    const sec = parseInt(m[2], 10);
    return (min * 60 + sec) * 1000;
  }

  function setPlayerUI({ current, total, playing }) {
    __playbackState.current = current || 0;
    __playbackState.total = total || 0;
    __playbackState.playing = !!playing;
    __playbackState.progress = 0;
    const timeEl = document.getElementById("ui-time");
    const progressEl = document.getElementById("ui-progress");
    if (timeEl) timeEl.textContent = `${msToMMSS(current)} / ${msToMMSS(total)}`;
    if (progressEl) progressEl.value = "0";
    const btnPlay = document.getElementById("ui-play");
    if (btnPlay) btnPlay.textContent = playing ? "⏸" : "▶";
  }
  // ===== /alphaTab + .gtz 加载 =====

function pad4(num) {
    return String(num).padStart(4, "0");
  }

  function parseQuery() {
    const params = new URLSearchParams(window.location.search);
    const book = params.get("book") || "c";
    let no = parseInt(params.get("no") || "1", 10);
    if (!Number.isFinite(no) || no < 1) no = 1;
    state.currentBook = (book === "ts") ? "ts" : "c";
    state.currentNo = no;
    state.searchBook = state.currentBook;
    state.searchDraft = String(state.currentNo || 1);
  }

  function getRangeIndex(no) {
    return Math.floor((no - 1) / 100); // 1-100 -> 0, 101-200 -> 1 ...
  }

  function getRangeFilePath(bookKey, rangeIndex) {
    const start = rangeIndex * 100 + 1;
    const end = (rangeIndex + 1) * 100;
    const folder = BOOKS[bookKey].folderText;
    return `assets/${folder}/${bookKey}_${start}_${end}.json`;
  }

  async function loadRange(bookKey, rangeIndex) {
    if (state.loadedRanges[bookKey][rangeIndex]) return true;
    const url = getRangeFilePath(bookKey, rangeIndex);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        state.loadedRanges[bookKey][rangeIndex] = true;
        return false;
      }
      const json = await res.json();
      if (!Array.isArray(json) || json.length === 0) {
        state.loadedRanges[bookKey][rangeIndex] = true;
        return false;
      }
      state.data[bookKey] = state.data[bookKey].concat(json);
      state.loadedRanges[bookKey][rangeIndex] = true;
      return true;
    } catch (e) {
      console.error("加载区间失败", bookKey, rangeIndex, e);
      state.loadedRanges[bookKey][rangeIndex] = true;
      return false;
    }
  }

  async function ensureRangeForNo(bookKey, no) {
    const rangeIndex = getRangeIndex(no);
    return await loadRange(bookKey, rangeIndex);
  }

  function findLocalSong(bookKey, no) {
    const songs = state.data[bookKey] || [];
    return songs.find(s => s.no === no) || null;
  }

  async function getSong(bookKey, no) {
    await ensureRangeForNo(bookKey, no);
    return findLocalSong(bookKey, no);
  }

  function normalizeSearchText(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[\s　]+/g, '')
      .replace(/[，。、“”‘’？！：；（）()《》〈〉【】\[\]\-—_.,!?:;"'`~·]/g, '');
  }

  function flattenSongText(value, bucket) {
    if (value == null) return;
    if (typeof value === 'string' || typeof value === 'number') {
      const s = String(value).trim();
      if (s) bucket.push(s);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(item => flattenSongText(item, bucket));
      return;
    }
    if (typeof value === 'object') {
      Object.values(value).forEach(item => flattenSongText(item, bucket));
    }
  }

  function getSongSearchBundle(song) {
    const titleParts = [];
    const bodyParts = [];
    flattenSongText(song?.title, titleParts);
    flattenSongText(song?.full_title, titleParts);
    flattenSongText(song?.big_title, titleParts);
    flattenSongText(song?.subtitle, titleParts);
    flattenSongText(song?.lyrics, bodyParts);
    flattenSongText(song?.verses, bodyParts);
    flattenSongText(song?.chorus, bodyParts);
    flattenSongText(song?.content, bodyParts);
    const titleText = titleParts.join(' ');
    const bodyText = bodyParts.join(' ');
    return {
      titleText,
      bodyText,
      titleNorm: normalizeSearchText(titleText),
      bodyNorm: normalizeSearchText(bodyText)
    };
  }

  async function ensureSearchCorpus(bookKey) {
    for (let i = 0; i < MAX_RANGES; i++) {
      const ok = await loadRange(bookKey, i);
      if (!ok) break;
    }
    return state.data[bookKey] || [];
  }

  function clearSearchResults() {
    state.searchResults = [];
    const box = document.getElementById('ui-search-results');
    if (box) {
      box.hidden = true;
      box.innerHTML = '';
    }
  }

  function renderSearchResults(items, query, bookKey) {
    state.searchResults = Array.isArray(items) ? items.slice() : [];
    const box = document.getElementById('ui-search-results');
    if (!box) return;
    box.innerHTML = '';
    const list = state.searchResults;
    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'core-search-empty';
      empty.textContent = `在${BOOKS[bookKey].label}中找不到“${query}”`;
      box.appendChild(empty);
      box.hidden = false;
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach(item => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'core-search-result-item';
      row.innerHTML = `<span class="core-search-result-title">${BOOKS[item.book].label} 第 ${item.no} 首｜${escapeHtml(item.title || '未命名')}</span>${item.snippet ? `<span class="core-search-result-snippet">${escapeHtml(item.snippet)}</span>` : ''}`;
      row.addEventListener('click', async () => {
        state.searchBook = item.book;
        state.currentBook = item.book;
        state.currentNo = item.no;
        state.searchDraft = String(item.no);
        clearSearchResults();
        updateURL();
        await loadAndRenderCurrentSong();
        closePanels();
        syncUI();
      });
      frag.appendChild(row);
    });
    box.appendChild(frag);
    box.hidden = false;
  }

  async function searchSongsByKeyword(bookKey, rawQuery) {
    const query = String(rawQuery || '').trim();
    const norm = normalizeSearchText(query);
    if (!norm) return [];
    const songs = await ensureSearchCorpus(bookKey);
    const hits = [];
    songs.forEach(song => {
      if (!song || !song.no) return;
      const bundle = getSongSearchBundle(song);
      const titleHit = bundle.titleNorm.includes(norm);
      const bodyHit = !titleHit && bundle.bodyNorm.includes(norm);
      if (!titleHit && !bodyHit) return;
      const sourceText = titleHit ? (bundle.titleText || '') : (bundle.bodyText || '');
      const idx = sourceText.indexOf(query);
      let snippet = '';
      if (idx >= 0) {
        const start = Math.max(0, idx - 12);
        const end = Math.min(sourceText.length, idx + query.length + 18);
        snippet = sourceText.slice(start, end).replace(/\s+/g, ' ').trim();
      } else if (sourceText) {
        snippet = sourceText.slice(0, 36).replace(/\s+/g, ' ').trim();
      }
      hits.push({
        book: bookKey,
        no: song.no,
        title: song.title || song.full_title || `${BOOKS[bookKey].label} 第 ${song.no} 首`,
        snippet,
        rank: titleHit ? 0 : 1
      });
    });
    hits.sort((a, b) => (a.rank - b.rank) || (a.no - b.no));
    return hits.slice(0, 50);
  }

  function ensureAlphaTabHost() {
    const container = document.getElementById("score-view");
    if (!container) return null;

    let atEl = document.getElementById("alphaTab");
    if (!atEl) {
      atEl = document.createElement('div');
      atEl.id = 'alphaTab';
      atEl.className = 'at-viewport';
      container.innerHTML = '';
      container.appendChild(atEl);
      window.__atApi = null;
    }
    return atEl;
  }

  function renderScore(bookKey, no) {
    const container = document.getElementById("score-view");
    // alphaTab 渲染容器（在 HTML 里我们放了 #alphaTab）
    const atEl = ensureAlphaTabHost();
    if (!container || !atEl) return;
    atEl.style.display = '';

    // 首次初始化 alphaTab API
    if (!window.__atApi) {
      const settings = {
        core: {
          includeNoteBounds: true
        },
        // 文件由我们手动 load(ArrayBuffer) 提供，因此这里不设置 file
        display: {
          scale: 1.0
        },
        player: {
          enablePlayer: true,
          // alphaTab 官方教程示例音源（SoundFont2）
          soundFont: './assets/soundfont/FSS-SteelStringGuitar-small.sf2',
          // 播放时滚动这个元素
          scrollElement: container
        }
      };

      window.__atApi = new alphaTab.AlphaTabApi(atEl, settings);
      installAudioUnlockHandlers();

      // 轨道开关按钮（只影响多轨显示）
      setupTracksButton();

      // 响应式：根据屏幕宽度/横竖屏调整每行小节数
      applyResponsiveLayout(window.__atApi);
      window.addEventListener('resize', () => scheduleResponsiveLayout(window.__atApi));
      window.addEventListener('orientationchange', () => scheduleResponsiveLayout(window.__atApi));

      // 载入谱面后：还原歌词字号/行距/缩放/多轨
      window.__atApi.scoreLoaded.on((e) => {
        __currentScore = e.score || window.__atApi.score;
        const st = window.__gtzState || {};
        __visibleTrackIndices = Array.isArray(st.visibleTrackIndices) ? st.visibleTrackIndices.slice() : null;

        if (!viewerPrefs.__initializedFromSong) {
          viewerPrefs.scoreFontSizePx = st.fontSizePx || viewerPrefs.scoreFontSizePx;
          viewerPrefs.scoreSpacingFactor = st.spacingFactor || viewerPrefs.scoreSpacingFactor;
          viewerPrefs.__initializedFromSong = true;
          saveViewerPrefs();
        }
        applyZoom(window.__atApi, st.zoom);
        applyViewerPrefsToScore();
        refreshAdjustUI();
        updateMetaRow(window.__gtzMeta || null);

        enableCursor(window.__atApi);

        const liveHost = document.getElementById('alphaTab');
        if (liveHost) liveHost.style.display = '';
        const oldFallback = document.getElementById('score-fallback-image');
        if (oldFallback) oldFallback.remove();

        renderVisibleTracks(window.__atApi);
        applyScoreTransposition(window.__atApi);
        applyPlaybackTrackVisibility(window.__atApi);
        scheduleTabCapoOverlay(180);
      });

      window.__atApi.renderFinished.on(() => {
        scheduleTabCapoOverlay(40);
        try { if (typeof window.applyStaffMode === 'function') window.applyStaffMode({ domOnly: true }); } catch (e) {}
      });

      // 播放条绑定
      setupPlayerBar(window.__atApi);
    }

    // 加载 .gtz (JSON) -> 解 base64 -> load 到 alphaTab
    const oldFallback = document.getElementById('score-fallback-image');
    if (oldFallback) oldFallback.remove();

    const gtzPrefix = BOOKS[bookKey].gtzPrefix || BOOKS[bookKey].svgPrefix;
    const gtzUrl = `${gtzPrefix}${pad4(no)}_cn_g.gtz`; // 如 assets/c/c0001_cn_g.gtz

    loadGtzIntoAlphaTab(window.__atApi, gtzUrl).catch(err => {
      console.error("加载 gtz 失败:", err);
      setPlayerStatus('加载失败: ' + (err && err.message ? err.message : err));
      // fallback: 如果没有 gtz，就尝试旧的 svg（便于过渡）
      try {
        const liveHost = ensureAlphaTabHost();
        if (liveHost) liveHost.style.display = 'none';
        const oldFallback = document.getElementById('score-fallback-image');
        if (oldFallback) oldFallback.remove();
        const folderPrefix = BOOKS[bookKey].svgPrefix;
        const src = `${folderPrefix}${pad4(no)}_cn_g.svg`;
        const img = document.createElement("img");
        img.id = 'score-fallback-image';
        img.alt = `${BOOKS[bookKey].label} 第 ${no} 首 吉他谱`;
        img.src = src;
        container.appendChild(img);
      } catch (e) {}
    });
  }


  function renderLyrics(song) {
    const root = document.getElementById("lyrics-view");
    root.innerHTML = "";
    if (!song || !song.lyrics) return;

    state.lyricsFontSize = viewerPrefs.pureLyricsFontSize;
    root.style.fontSize = state.lyricsFontSize + "px";

    song.lyrics.forEach(section => {
      const sec = document.createElement("div");
      sec.className = "lyrics-section";

      const noDiv = document.createElement("div");
      noDiv.className = "lyrics-section-no";
      noDiv.textContent = section.section_no || "";

      const linesWrap = document.createElement("div");
      linesWrap.className = "lyrics-lines";

      (section.lines || []).forEach(lineText => {
        const p = document.createElement("p");
        p.textContent = convertTextByScript(lineText || "");
        linesWrap.appendChild(p);
      });

      sec.appendChild(noDiv);
      sec.appendChild(linesWrap);
      root.appendChild(sec);
    });
  }

  function updateTitle(song) {
    const coreTitleEl = document.getElementById("ui-title-main");
    const nextTitle = (song && song.title)
      ? song.title
      : `${BOOKS[state.currentBook].label} 第 ${state.currentNo} 首`;

    if (coreTitleEl) coreTitleEl.textContent = nextTitle;
    document.title = (song && song.title)
      ? song.title + " - 召会诗歌吉他谱"
      : nextTitle;
  }

  function setMode(mode) {
    state.mode = mode;
    const scoreView = document.getElementById("score-view");
    const lyricsView = document.getElementById("lyrics-view");

    if (mode === "score") {
      if (scoreView) { scoreView.style.display = ""; scoreView.setAttribute("aria-hidden", "false"); }
      if (lyricsView) { lyricsView.style.display = "none"; lyricsView.setAttribute("aria-hidden", "true"); }
    } else {
      if (scoreView) { scoreView.style.display = "none"; scoreView.setAttribute("aria-hidden", "true"); }
      if (lyricsView) { lyricsView.style.display = ""; lyricsView.setAttribute("aria-hidden", "false"); }
    }
  }

  function syncBookButtons() {
    return;
  }

  function syncScriptButton() {
    return;
  }

  function updateURL() {
    const url = new URL(window.location.href);
    url.searchParams.set("book", state.currentBook);
    url.searchParams.set("no", String(state.currentNo));
    window.history.replaceState({}, "", url.toString());
  }

  async function loadAndRenderCurrentSong() {
    const song = await getSong(state.currentBook, state.currentNo);
    if (!song) {
      alert("找不到这首诗歌的歌词数据。");
      return;
    }
    updateTitle(song);
    renderScore(state.currentBook, state.currentNo);
    renderLyrics(song);
    setMode(state.mode); // 保持当前 吉他 / 歌词 模式
    syncScriptButton();
  }

  async function tryGoTo(delta) {
    const newNo = state.currentNo + delta;
    if (newNo <= 0) {
      alert("已经是第一首了。");
      return;
    }
    const song = await getSong(state.currentBook, newNo);
    if (!song) {
      alert(delta > 0 ? "已经是最后一首了。" : "已经是第一首了。");
      return;
    }
    state.currentNo = newNo;
    updateURL();
    await loadAndRenderCurrentSong();
  }

  function goToNumber(no) {
    state.currentNo = no;
    updateURL();
    loadAndRenderCurrentSong();
  }

  function handleSearch() {
    performSearch(document.getElementById("ui-search-input")?.value || "");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    parseQuery();
    applyViewerPrefsToLyricsPage();
    await loadAndRenderCurrentSong();
  });



(function(){
  function getStaffMode(){
    try { return localStorage.getItem('staffMode') || 'five'; } catch(e) { return 'five'; }
  }
  function updateCoreStaffUI(){
    const mode = getStaffMode();
    document.getElementById('ui-staff-five')?.classList.toggle('active', mode === 'five');
    document.getElementById('ui-staff-jian')?.classList.toggle('active', mode === 'jian');
    document.getElementById('ui-staff') && (document.getElementById('ui-staff').textContent = mode === 'jian' ? '简' : '谱');
  }
  function applyStaffModeToTracks(score, mode){
    if (!score || !Array.isArray(score.tracks)) return;
    for (const track of score.tracks){
      if (!track || !Array.isArray(track.staves)) continue;
      for (const staff of track.staves){
        if (!staff || staff.showTablature) continue;
        staff.showStandardNotation = (mode !== 'jian');
        if ('showNumbered' in staff) staff.showNumbered = (mode === 'jian');
        if ('showNumberedNotation' in staff) staff.showNumberedNotation = (mode === 'jian');
      }
    }
  }
  function fixRenderedJianpuDom(mode){
    const showJian = mode === 'jian';
    document.body.classList.toggle('jian-mode', showJian);
    document.querySelectorAll('#alphaTab .atj-keysig, #alphaTab .atj-jianpu, #alphaTab .atj-time-signature').forEach(el => {
      el.style.display = showJian ? '' : 'none';
    });
  }
  let __staffModeRendering = false;
  function rerenderForStaffMode(){
    const api = window.__atApi;
    if (!api || __staffModeRendering) return;
    const mode = getStaffMode();
    applyStaffModeToTracks(window.__currentScore || api.score, mode);
    applyStaffModeToTracks(api.score, mode);
    __staffModeRendering = true;
    try {
      if (typeof window.renderVisibleTracks === 'function') {
        window.renderVisibleTracks(api);
      } else if (typeof api.render === 'function') {
        api.render();
      }
    } catch (e) {
      console.warn('rerenderForStaffMode failed', e);
    } finally {
      setTimeout(() => { __staffModeRendering = false; }, 0);
    }
    setTimeout(() => fixRenderedJianpuDom(mode), 30);
    setTimeout(() => fixRenderedJianpuDom(mode), 180);
  }
  function applyStaffMode(options){
    const opts = options || {};
    const mode = getStaffMode();
    updateCoreStaffUI();
    if (opts.domOnly) {
      fixRenderedJianpuDom(mode);
      return;
    }
    rerenderForStaffMode();
  }
  window.applyStaffMode = applyStaffMode;
  document.addEventListener('DOMContentLoaded', () => {
    updateCoreStaffUI();
    setTimeout(applyStaffMode, 400);
  });
  const t = setInterval(() => {
    if (window.__atApi) {
      clearInterval(t);
      try { window.__atApi.renderFinished.on(() => setTimeout(() => fixRenderedJianpuDom(getStaffMode()), 30)); } catch(e) {}
    }
  }, 300);
})();



(function(){
  function $(id){ return document.getElementById(id); }
  function qa(sel, root){ return Array.from((root||document).querySelectorAll(sel)); }
  function openPanel(id){
    const layer = $('core-panel-layer');
    if(!layer) return;
    qa('.core-panel', layer).forEach(p=>p.hidden=true);
    if(!id){
      layer.hidden = true;
      layer.setAttribute('aria-hidden','true');
      return;
    }
    layer.hidden = false;
    layer.setAttribute('aria-hidden','false');
    const p = $(id);
    if(p) p.hidden = false;
  }
  function closePanels(){ openPanel(null); }

    function syncUI(){
    const tempoMeta = (__currentMeta && __currentMeta.tempo != null && __currentMeta.tempo !== '') ? String(__currentMeta.tempo) : '--';
    const keyMeta = computeDisplayedKeyName(__currentMeta || {});
    const capoMeta = String(getDisplayedCapoLabel());
    const speedPct = parseInt(viewerPrefs.playbackSpeedPercent, 10) || 100;
    const transVal = getUserTranspose();
    const transText = transVal > 0 ? `+${transVal}` : String(transVal);
    const fontText = String(viewerPrefs.scoreFontSizePx);
    const spacingText = `${viewerPrefs.scoreSpacingFactor.toFixed(1)}x`;
    const chordText = String(getChordFontSizePx());
    const currentTime = msToMMSS(__playbackState.current || 0);
    const originalTempo = parseInt(tempoMeta,10);
    const displayTempo = Number.isFinite(originalTempo) ? Math.round(originalTempo * speedPct / 100) : speedPct;

    if($('ui-speed')) $('ui-speed').textContent = String(displayTempo || tempoMeta || '95');
    if($('ui-key')) $('ui-key').textContent = keyMeta || '--';
    if($('ui-capo')) $('ui-capo').textContent = 'CP' + capoMeta;
    if($('ui-mode')) $('ui-mode').textContent = state.mode === 'lyrics' ? '词' : '吉';
    if($('ui-play')) $('ui-play').textContent = __playbackState.playing ? '⏸' : '▶';
    if($('ui-time')) $('ui-time').textContent = currentTime;
    if($('ui-progress')) $('ui-progress').value = String(__playbackState.progress || 0);
    if($('ui-speed-range')) $('ui-speed-range').value = String(speedPct);
    if($('ui-speed-value')) $('ui-speed-value').textContent = speedPct + '%';
    if($('ui-key-value')) $('ui-key-value').textContent = transText;
    if($('ui-font-value')) $('ui-font-value').textContent = fontText;
    if($('ui-spacing-value')) $('ui-spacing-value').textContent = spacingText;
    if($('ui-chord-value')) $('ui-chord-value').textContent = chordText;
    const searchPanelOpen = $('panel-search') && !$('panel-search').hidden;
    if($('ui-search-input') && document.activeElement !== $('ui-search-input') && !searchPanelOpen) $('ui-search-input').value = String(state.searchDraft || state.currentNo || '');
    if($('search-input') && document.activeElement !== $('search-input')) $('search-input').value = String(state.searchDraft || state.currentNo || '');
    $('ui-book-c')?.classList.toggle('active', (state.searchBook || state.currentBook) === 'c');
    $('ui-book-ts')?.classList.toggle('active', (state.searchBook || state.currentBook) === 'ts');
    $('ui-mode-score')?.classList.toggle('active', state.mode === 'score');
    $('ui-mode-lyrics')?.classList.toggle('active', state.mode === 'lyrics');
    $('ui-lang-simp')?.classList.toggle('active', state.script === 'simplified');
    $('ui-lang-trad')?.classList.toggle('active', state.script === 'traditional');
  }

  function initBindings(){
    $('ui-home')?.addEventListener('click', goHome);
    $('ui-prev')?.addEventListener('click', ()=>{ goPrevSong(); });
    $('ui-play')?.addEventListener('click', togglePlayPause);
    $('ui-next')?.addEventListener('click', ()=>{ goNextSong(); });
    $('ui-speed')?.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); openPanel('panel-speed'); });
    $('ui-key')?.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); openPanel('panel-key'); });
    $('ui-mode')?.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); openPanel('panel-mode'); });
    $('ui-text')?.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); openPanel('panel-text'); });
    $('ui-track')?.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); openNewTrackPanel(); });
    $('ui-staff')?.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); openPanel('panel-staff'); });
    $('ui-lang')?.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); openPanel('panel-lang'); });
    $('ui-search')?.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); openPanel('panel-search'); });
    qa('[data-close-panel]').forEach(btn=>btn.addEventListener('click', closePanels));

    $('ui-speed-range')?.addEventListener('input', e=>{
      setPlaybackSpeedPercent(e.target.value);
      syncUI();
    });
    $('ui-speed-reset')?.addEventListener('click', ()=>{
      setPlaybackSpeedPercent(100);
      syncUI();
    });

    $('ui-key-plus')?.addEventListener('click', ()=>{ changeTranspose(1); syncUI(); });
    $('ui-key-minus')?.addEventListener('click', ()=>{ changeTranspose(-1); syncUI(); });
    $('ui-key-reset')?.addEventListener('click', ()=>{ resetTranspose(); syncUI(); });

    $('ui-mode-score')?.addEventListener('click', ()=>{ setMode('score'); syncUI(); });
    $('ui-mode-lyrics')?.addEventListener('click', ()=>{ setMode('lyrics'); syncUI(); });

    $('ui-font-plus')?.addEventListener('click', ()=>{ changeScoreFont(2); syncUI(); });
    $('ui-font-minus')?.addEventListener('click', ()=>{ changeScoreFont(-2); syncUI(); });
    $('ui-spacing-plus')?.addEventListener('click', ()=>{ changeSpacing(0.1); syncUI(); });
    $('ui-spacing-minus')?.addEventListener('click', ()=>{ changeSpacing(-0.1); syncUI(); });
    $('ui-chord-plus')?.addEventListener('click', ()=>{ changeChordFont(1); syncUI(); });
    $('ui-chord-minus')?.addEventListener('click', ()=>{ changeChordFont(-1); syncUI(); });
    $('ui-text-reset')?.addEventListener('click', ()=>{ resetTextSettings(); syncUI(); });

    $('ui-lang-simp')?.addEventListener('click', ()=>{ setScriptMode('simplified'); syncUI(); });
    $('ui-lang-trad')?.addEventListener('click', ()=>{ setScriptMode('traditional'); syncUI(); });

    $('ui-book-c')?.addEventListener('click', async ()=>{
      await setSearchBook('c', true);
      syncUI();
    });
    $('ui-book-ts')?.addEventListener('click', async ()=>{
      await setSearchBook('ts', true);
      syncUI();
    });
    $('ui-search-go')?.addEventListener('click', async ()=>{
      const ok = await performSearch($('ui-search-input')?.value || '');
      const v = String($('ui-search-input')?.value || '').trim();
      if (ok && /^\d+$/.test(v)) closePanels();
      syncUI();
    });
    $('ui-search-input')?.addEventListener('input', e=>{
      state.searchDraft = String(e.target?.value || '').trim();
    });
    $('ui-search-input')?.addEventListener('keydown', async e=>{
      if (e.key === 'Enter') {
        e.preventDefault();
        const v = String($('ui-search-input')?.value || '').trim();
        const ok = await performSearch(v);
        if (ok && /^\d+$/.test(v)) closePanels();
        syncUI();
      }
    });

    $('ui-staff-five')?.addEventListener('click', ()=>{
      try { localStorage.setItem('staffMode', 'five'); } catch(e) {}
      if (typeof window.applyStaffMode === 'function') window.applyStaffMode();
      setTimeout(syncUI, 30);
    });
    $('ui-staff-jian')?.addEventListener('click', ()=>{
      try { localStorage.setItem('staffMode', 'jian'); } catch(e) {}
      if (typeof window.applyStaffMode === 'function') window.applyStaffMode();
      setTimeout(syncUI, 30);
    });

    document.addEventListener('click', (e)=>{
      const layer = $('core-panel-layer');
      if (layer && !layer.hidden && e.target === layer) {
        closePanels();
        return;
      }
      const insidePanel = e.target.closest('.core-panel');
      const insideToolbar = e.target.closest('.core-ui-toolbar');
      if(!insidePanel && !insideToolbar) closePanels();
    });

    $('core-panel-layer')?.addEventListener('click', (e)=>{
      if (e.target === $('core-panel-layer')) closePanels();
    });
    qa('.core-panel', $('core-panel-layer')).forEach((panel)=>{
      panel.addEventListener('click', (e)=>{ e.stopPropagation(); });
    });
  }

    document.addEventListener('DOMContentLoaded', ()=>{
    initBindings();
    syncUI();
    setInterval(syncUI, 400);
    setTimeout(syncUI, 1200);
  });
})();



(function(){
  function trackEl(id){ return document.getElementById(id); }

  function getCurrentTracks(){
    try {
      const score = (typeof __currentScore !== 'undefined' && __currentScore) ? __currentScore : (window.__atApi && window.__atApi.score ? window.__atApi.score : null);
      return (score && Array.isArray(score.tracks)) ? score.tracks : [];
    } catch(e) { return []; }
  }

  function getSelectedTrackIndicesSafe(){
    try {
      const tracks = getCurrentTracks();
      if (!tracks.length) return [];
      if (typeof __visibleTrackIndices !== 'undefined' && Array.isArray(__visibleTrackIndices) && __visibleTrackIndices.length) {
        return __visibleTrackIndices.slice();
      }
      return tracks.map((_, i) => i);
    } catch(e) {
      return [];
    }
  }

  function setSelectedTrackIndicesSafe(indices){
    try {
      if (typeof __visibleTrackIndices !== 'undefined') {
        __visibleTrackIndices = indices.slice().sort((a,b)=>a-b);
      } else {
        window.__visibleTrackIndices = indices.slice().sort((a,b)=>a-b);
      }
    } catch(e) {
      window.__visibleTrackIndices = indices.slice().sort((a,b)=>a-b);
    }
  }

  function applyTrackSelection(){
    try {
      if (window.__atApi && typeof renderVisibleTracks === 'function') {
        renderVisibleTracks(window.__atApi);
      } else if (window.__atApi && typeof applyPlaybackTrackVisibility === 'function') {
        applyPlaybackTrackVisibility(window.__atApi);
      }
    } catch(e) {
      console.warn('applyTrackSelection failed', e);
    }
  }

  function buildNewTrackPanel(){
    const list = trackEl('new-track-list');
    if (!list) return;
    const tracks = getCurrentTracks();
    const selected = new Set(getSelectedTrackIndicesSafe());
    list.innerHTML = '';

    tracks.forEach((t, i) => {
      const row = document.createElement('label');
      row.className = 'new-track-item';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = selected.has(i);
      cb.addEventListener('change', () => {
        const now = new Set(getSelectedTrackIndicesSafe());
        if (!now.size) tracks.forEach((_, k) => now.add(k));
        if (cb.checked) now.add(i); else now.delete(i);
        setSelectedTrackIndicesSafe(Array.from(now));
        applyTrackSelection();
      });

      const name = document.createElement('div');
      name.className = 'new-track-name';
      name.textContent = (t && (t.name || t.shortName)) ? (t.name || t.shortName) : ('Track ' + (i + 1));

      row.appendChild(cb);
      row.appendChild(name);
      list.appendChild(row);
    });
  }

  function openNewTrackPanel(){
    const panel = trackEl('new-track-panel');
    if (!panel) return;
    buildNewTrackPanel();
    panel.classList.remove('hidden');
  }

  function closeNewTrackPanel(){
    const panel = trackEl('new-track-panel');
    if (!panel) return;
    panel.classList.add('hidden');
  }

  document.addEventListener('DOMContentLoaded', () => {
    trackEl('new-track-close')?.addEventListener('click', closeNewTrackPanel);
    trackEl('new-track-all')?.addEventListener('click', () => {
      const tracks = getCurrentTracks();
      setSelectedTrackIndicesSafe(tracks.map((_, i) => i));
      buildNewTrackPanel();
      applyTrackSelection();
    });
    trackEl('new-track-none')?.addEventListener('click', () => {
      setSelectedTrackIndicesSafe([]);
      buildNewTrackPanel();
      applyTrackSelection();
    });

    document.addEventListener('click', (e) => {
      const panel = trackEl('new-track-panel');
      if (!panel || panel.classList.contains('hidden')) return;
      if (e.target.closest('#new-track-panel')) return;
      if (e.target.closest('#ui-track')) return;
      closeNewTrackPanel();
    });

  });

  window.openNewTrackPanel = openNewTrackPanel;
})();
