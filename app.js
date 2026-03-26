(function () {
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  const state = {
    api: null,
    gtz: null,
    xmlBlobUrl: null,
    currentNotation: 'staff',
    currentMode: 'score',
    originalTempo: 95,
    currentTempo: 95,
    fontSizePx: 30,
    spacingFactor: 2.0,
    visibleTrackIndices: [0],
    notationTrackIndices: [0],
    currentPath: './assets/c0001_cn_g.gtz'
  };

  const el = {
    songTitle: qs('#songTitle'),
    songSubtitle: qs('#songSubtitle'),
    scoreLoading: qs('#scoreLoading'),
    scoreError: qs('#scoreError'),
    lyricsPlaceholder: qs('#lyricsPlaceholder'),
    alphaTabHost: qs('#alphaTabHost'),
    pathInput: qs('#pathInput'),
    reloadBtn: qs('#reloadBtn'),
    tempoValue: qs('#tempoValue'),
    tempoRange: qs('#tempoRange'),
    tempoBtn: qs('#tempoBtn'),
    tempoResetBtn: qs('#tempoResetBtn'),
    keyBtn: qs('#keyBtn'),
    keyValue: qs('#keyValue'),
    capoBtn: qs('#capoBtn'),
    fontSizeValue: qs('#fontSizeValue'),
    spacingValue: qs('#spacingValue'),
    fontMinusBtn: qs('#fontMinusBtn'),
    fontPlusBtn: qs('#fontPlusBtn'),
    spacingMinusBtn: qs('#spacingMinusBtn'),
    spacingPlusBtn: qs('#spacingPlusBtn'),
    trackList: qs('#trackList')
  };

  function getQueryFile() {
    const params = new URLSearchParams(window.location.search);
    return params.get('file') || './assets/c0001_cn_g.gtz';
  }

  function showError(message) {
    el.scoreError.textContent = message;
    el.scoreError.classList.remove('hidden');
    el.scoreLoading.classList.add('hidden');
  }

  function clearError() {
    el.scoreError.textContent = '';
    el.scoreError.classList.add('hidden');
  }

  function setLoading(message) {
    el.scoreLoading.textContent = message || '正在加载...';
    el.scoreLoading.classList.remove('hidden');
  }

  function hideLoading() {
    el.scoreLoading.classList.add('hidden');
  }

  function decodeBase64ToBlobUrl(base64Data) {
    const binary = atob(base64Data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/vnd.recordare.musicxml+xml' });
    return URL.createObjectURL(blob);
  }

  function getPackageScoreData(pkg) {
    return pkg?.score?.data || pkg?.scoreBase64 || '';
  }

  function absoluteUrl(relativePath) {
    return new URL(relativePath, window.location.href).href;
  }

  function readViewerState(pkg) {
    const viewer = pkg?.viewerState || {};
    const legacy = pkg?.state || {};
    state.fontSizePx = Number(viewer.fontSizePx ?? legacy.fontSizePx ?? 30);
    state.spacingFactor = Number(viewer.spacingFactor ?? legacy.spacingFactor ?? 2.0);
    state.visibleTrackIndices = Array.isArray(viewer.visibleTrackIndices)
      ? [...viewer.visibleTrackIndices]
      : (Array.isArray(legacy.visibleTrackIndices) ? [...legacy.visibleTrackIndices] : [0]);

    const showNumberedNotation = !!(viewer.showNumberedNotation ?? legacy.showNumberedNotation ?? false);
    const showStandardNotation = viewer.showStandardNotation ?? legacy.showStandardNotation ?? true;
    state.currentNotation = showNumberedNotation && !showStandardNotation ? 'jianpu' : 'staff';
  }

  function updateMetaUi(pkg) {
    const meta = pkg.meta || {};
    const bigTitle = meta.big_title || meta.full_title || meta.title || '未命名歌曲';
    const subTitle = meta.title || meta.full_title || '';
    el.songTitle.textContent = bigTitle;
    el.songSubtitle.textContent = subTitle;
    document.title = `${bigTitle} - GTZ 乐谱`;

    state.originalTempo = Number(meta.tempo || 95);
    state.currentTempo = state.originalTempo;
    el.tempoBtn.textContent = String(state.currentTempo);
    el.tempoValue.textContent = String(state.currentTempo);
    el.tempoRange.value = String(state.currentTempo);

    const keyName = meta.key_name || 'C';
    el.keyBtn.textContent = keyName;
    el.keyValue.textContent = keyName;

    const capo = Number(meta.capo ?? 0);
    el.capoBtn.textContent = `CP${capo}`;
  }

  function menuButtonLeft(btn) {
    const rect = btn.getBoundingClientRect();
    return Math.max(10, rect.left + window.scrollX - 6);
  }

  function openMenu(menuId, anchorButton) {
    qsa('.dropdown-menu').forEach(m => m.classList.add('hidden'));
    const menu = document.getElementById(menuId);
    if (!menu) return;
    menu.classList.remove('hidden');
    if (anchorButton) {
      menu.style.left = `${Math.min(menuButtonLeft(anchorButton), window.innerWidth - Math.min(menu.offsetWidth || 320, window.innerWidth - 20) - 10)}px`;
    }
  }

  function closeMenus() {
    qsa('.dropdown-menu').forEach(m => m.classList.add('hidden'));
  }

  function syncNotationUi() {
    const isStaff = state.currentNotation === 'staff';
    qs('#staffOption').classList.toggle('selected', isStaff);
    qs('#jianpuOption').classList.toggle('selected', !isStaff);
    el.alphaTabHost.classList.toggle('jianpu-mode', !isStaff);
  }

  function syncModeUi() {
    qsa('[data-mode-option]').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.modeOption === state.currentMode);
    });
    const lyricsMode = state.currentMode === 'lyrics';
    el.lyricsPlaceholder.classList.toggle('hidden', !lyricsMode);
    el.alphaTabHost.classList.toggle('hidden', lyricsMode);
  }

  function normalizeLooseText(value) {
    return String(value || '').replace(/\s+/g, '').replace(/[♭]/g, 'b').replace(/[♯]/g, '#');
  }

  function markAndHideTopLeftJianpuHeader(svg) {
    const textNodes = Array.from(svg.querySelectorAll('text'));
    let hiddenCount = 0;

    textNodes.forEach((node) => {
      const raw = node.textContent || '';
      const normalized = normalizeLooseText(raw);
      if (!normalized) return;
      let box;
      try { box = node.getBBox(); } catch (_) { return; }
      if (!box || box.width <= 0 || box.height <= 0) return;

      const isHeaderToken = /^1=/.test(normalized)
        || normalized === '1'
        || normalized === '='
        || /^[#b][A-G]$/.test(normalized)
        || /^[A-G]$/.test(normalized)
        || /^([#b]?)([A-G])$/.test(normalized);

      if (isHeaderToken && box.x < 260 && box.y < 220) {
        node.style.display = 'none';
        node.setAttribute('data-jianpu-hidden', '1');
        hiddenCount += 1;
      }
    });

    return hiddenCount;
  }

  function shiftFirstSystemLyrics(svg) {
    // reset previous shifts
    svg.querySelectorAll('[data-lyric-shift="1"]').forEach((node) => {
      const target = node;
      const orig = target.getAttribute('data-orig-transform');
      if (orig === null) {
        target.removeAttribute('transform');
      } else {
        target.setAttribute('transform', orig);
      }
      target.removeAttribute('data-lyric-shift');
      target.removeAttribute('data-orig-transform');
    });

    if (state.currentNotation !== 'jianpu') return;

    const texts = Array.from(svg.querySelectorAll('text'));
    texts.forEach((node) => {
      const raw = (node.textContent || '').trim();
      if (!raw) return;
      if (!/[\u3400-\u9FFF]/.test(raw)) return;
      let box;
      try { box = node.getBBox(); } catch (_) { return; }
      if (!box || box.width <= 0 || box.height <= 0) return;
      if (box.x < 40 || box.x > 1400) return;
      if (box.y < 130 || box.y > 280) return;
      if (raw.length > 12) return;

      const orig = node.getAttribute('transform');
      node.setAttribute('data-orig-transform', orig === null ? '' : orig);
      node.setAttribute('transform', `${orig ? orig + ' ' : ''}translate(0,18)`);
      node.setAttribute('data-lyric-shift', '1');
    });
  }

  function fixRenderedSvg() {
    const svg = el.alphaTabHost.querySelector('svg');
    if (!svg) return;

    svg.querySelectorAll('[data-jianpu-hidden="1"]').forEach((node) => {
      node.style.display = '';
      node.removeAttribute('data-jianpu-hidden');
    });

    if (state.currentNotation === 'jianpu') {
      const hiddenCount = markAndHideTopLeftJianpuHeader(svg);
      shiftFirstSystemLyrics(svg);
      el.alphaTabHost.classList.toggle('jianpu-header-hidden', hiddenCount > 0);
    } else {
      shiftFirstSystemLyrics(svg);
      el.alphaTabHost.classList.remove('jianpu-header-hidden');
    }
  }

  function detectNotationTrackIndices(score) {
    if (!score || !Array.isArray(score.tracks) || !score.tracks.length) return [0];
    return [0];
  }

  function staffLooksLikeTab(staff) {
    return String(staff?.clef ?? '').toLowerCase() === 'tab'
      || Number(staff?.stringTuning?.tunings?.length || staff?.stringCount || 0) >= 6
      || Number(staff?.staffLines || 0) === 6;
  }

  function applyNotationToScore(score) {
    if (!score || !Array.isArray(score.tracks)) return;

    const notationTrackIndices = detectNotationTrackIndices(score);
    state.notationTrackIndices = notationTrackIndices;
    const jianpuMode = state.currentNotation === 'jianpu';

    score.tracks.forEach((track, trackIndex) => {
      if (!track || !Array.isArray(track.staves)) return;
      const isNotationTrack = notationTrackIndices.includes(trackIndex);

      track.staves.forEach((staff) => {
        if (!staff) return;
        const isTab = staffLooksLikeTab(staff);

        if (isNotationTrack) {
          if (isTab) {
            // Keep TAB as TAB only, never numbered notation.
            if ('showNumbered' in staff) staff.showNumbered = false;
            if ('showStandardNotation' in staff) staff.showStandardNotation = false;
            return;
          }
          if ('showNumbered' in staff) staff.showNumbered = jianpuMode;
          if ('showStandardNotation' in staff) staff.showStandardNotation = !jianpuMode;
          return;
        }

        if (isTab) {
          if ('showNumbered' in staff) staff.showNumbered = false;
          if ('showStandardNotation' in staff) staff.showStandardNotation = false;
          return;
        }

        // In jianpu mode, hide all non-target non-tab standard staves completely,
        // so multi-track mode will not spawn an extra numbered/standard layer.
        if ('showNumbered' in staff) staff.showNumbered = false;
        if ('showStandardNotation' in staff) staff.showStandardNotation = !jianpuMode;
      });
    });
  }

  function renderVisibleTracks() {
    if (!state.api || !state.api.score || !state.api.score.tracks) return;
    const indices = state.visibleTrackIndices.length ? state.visibleTrackIndices : [0];
    const tracks = indices.map(i => state.api.score.tracks[i]).filter(Boolean);
    if (tracks.length) {
      state.api.renderTracks(tracks);
    } else {
      state.api.renderScore(state.api.score);
    }
  }

  function updateDisplaySettings() {
    if (!state.api) return;
    applyNotationToScore(state.api.score);
    renderVisibleTracks();
  }

  function updateTrackList() {
    el.trackList.innerHTML = '';
    if (!state.api || !state.api.score || !state.api.score.tracks) {
      el.trackList.innerHTML = '<div class="menu-hint">暂无轨道信息</div>';
      return;
    }

    state.api.score.tracks.forEach((track, index) => {
      const row = document.createElement('label');
      row.className = 'check-row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = state.visibleTrackIndices.includes(index);
      cb.addEventListener('change', () => {
        if (cb.checked) {
          if (!state.visibleTrackIndices.includes(index)) state.visibleTrackIndices.push(index);
        } else {
          state.visibleTrackIndices = state.visibleTrackIndices.filter(i => i !== index);
          if (!state.visibleTrackIndices.length) state.visibleTrackIndices = [index];
        }
        updateTrackList();
        updateDisplaySettings();
      });
      const text = document.createElement('span');
      text.textContent = track.name || `轨道 ${index + 1}`;
      row.appendChild(cb);
      row.appendChild(text);
      el.trackList.appendChild(row);
    });
  }

  function destroyApi() {
    if (state.api) {
      try { state.api.destroy(); } catch (_) {}
      state.api = null;
    }
    if (state.xmlBlobUrl) {
      URL.revokeObjectURL(state.xmlBlobUrl);
      state.xmlBlobUrl = null;
    }
    el.alphaTabHost.innerHTML = '';
  }

  function buildAlphaTab(xmlBlobUrl) {
    destroyApi();
    state.xmlBlobUrl = xmlBlobUrl;

    const scriptFile = absoluteUrl('./assets/alphatab/alphaTab.js');
    const fontDirectory = absoluteUrl('./assets/alphatab/font/');

    state.api = new alphaTab.AlphaTabApi(el.alphaTabHost, {
      core: {
        file: xmlBlobUrl,
        scriptFile,
        fontDirectory,
        useWorkers: false
      },
      display: {
        showStandardNotation: state.currentNotation === 'staff',
        showNumberedNotation: state.currentNotation === 'jianpu',
        showTab: true,
        showChordNames: true,
        showScoreLyrics: true
      },
      player: {
        enablePlayer: false
      }
    });

    state.api.error.on((e) => {
      showError(`alphaTab 错误：${e && e.message ? e.message : String(e)}`);
    });

    state.api.renderStarted.on(() => {
      setLoading('正在渲染乐谱...');
    });

    state.api.scoreLoaded.on(() => {
      applyNotationToScore(state.api.score);
    });

    state.api.renderFinished.on(() => {
      hideLoading();
      clearError();
      syncNotationUi();
      syncModeUi();
      updateTrackList();
      window.requestAnimationFrame(fixRenderedSvg);
    });
  }

  async function loadGtz(path) {
    try {
      closeMenus();
      destroyApi();
      clearError();
      setLoading('正在读取 GTZ...');
      state.currentPath = path;
      el.pathInput.value = path;

      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`读取失败：${response.status} ${response.statusText}`);
      }
      const text = await response.text();
      const pkg = JSON.parse(text);
      if (pkg.packageType !== 'songpack-gtz') {
        throw new Error(`不是支持的 GTZ 包：packageType=${pkg.packageType || '缺失'}`);
      }
      const scoreData = getPackageScoreData(pkg);
      if (!scoreData) {
        throw new Error('GTZ 中没有 score.data 或 scoreBase64');
      }

      state.gtz = pkg;
      readViewerState(pkg);
      updateMetaUi(pkg);
      syncNotationUi();
      syncModeUi();

      const blobUrl = decodeBase64ToBlobUrl(scoreData);
      buildAlphaTab(blobUrl);
    } catch (err) {
      showError(err && err.message ? err.message : String(err));
    }
  }

  function bindMenus() {
    qsa('[data-menu]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const menuId = btn.dataset.menu;
        const menu = document.getElementById(menuId);
        const isHidden = menu.classList.contains('hidden');
        if (!isHidden) {
          closeMenus();
          return;
        }
        openMenu(menuId, btn);
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown-menu') && !e.target.closest('[data-menu]')) {
        closeMenus();
      }
    });
  }

  function bindControls() {
    el.reloadBtn.addEventListener('click', () => loadGtz(el.pathInput.value.trim() || './assets/c0001_cn_g.gtz'));

    qsa('[data-notation]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.currentNotation = btn.dataset.notation === 'jianpu' ? 'jianpu' : 'staff';
        syncNotationUi();
        updateDisplaySettings();
        closeMenus();
      });
    });

    qsa('[data-mode-option]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.currentMode = btn.dataset.modeOption;
        syncModeUi();
        closeMenus();
      });
    });

    el.tempoRange.addEventListener('input', () => {
      state.currentTempo = Number(el.tempoRange.value);
      el.tempoValue.textContent = String(state.currentTempo);
      el.tempoBtn.textContent = String(state.currentTempo);
    });

    el.tempoResetBtn.addEventListener('click', () => {
      state.currentTempo = state.originalTempo;
      el.tempoRange.value = String(state.currentTempo);
      el.tempoValue.textContent = String(state.currentTempo);
      el.tempoBtn.textContent = String(state.currentTempo);
    });

    const syncTextUi = () => {
      el.fontSizeValue.textContent = String(state.fontSizePx);
      el.spacingValue.textContent = state.spacingFactor.toFixed(1);
    };
    syncTextUi();

    el.fontMinusBtn.addEventListener('click', () => {
      state.fontSizePx = Math.max(12, state.fontSizePx - 1);
      syncTextUi();
    });
    el.fontPlusBtn.addEventListener('click', () => {
      state.fontSizePx = Math.min(72, state.fontSizePx + 1);
      syncTextUi();
    });
    el.spacingMinusBtn.addEventListener('click', () => {
      state.spacingFactor = Math.max(0.5, Math.round((state.spacingFactor - 0.1) * 10) / 10);
      syncTextUi();
    });
    el.spacingPlusBtn.addEventListener('click', () => {
      state.spacingFactor = Math.min(5.0, Math.round((state.spacingFactor + 0.1) * 10) / 10);
      syncTextUi();
    });

    qs('#homeBtn').addEventListener('click', () => { window.location.href = './index.html'; });
    window.addEventListener('resize', closeMenus);
  }

  bindMenus();
  bindControls();
  loadGtz(getQueryFile());
})();
