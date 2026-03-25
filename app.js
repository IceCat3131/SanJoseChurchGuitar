(function () {
  'use strict';

  const App = {
    state: {
      book: 'c',
      no: 1,
      file: '',
      pkg: null,
      scoreXml: '',
      meta: {},
      api: null,
      score: null,
      currentMode: 'score',
      notationMode: 'staff',
      language: 'zh-cn',
      fontSizePx: 30,
      spacingFactor: 2.0,
      playbackSpeed: 1,
      originalTempo: 95,
      transpose: 0,
      originalKeyName: 'C',
      capo: 0,
      lyricsData: null,
      lyricsCache: new Map(),
      tracks: [],
      selectedTrackIndices: [0],
      playerReady: false,
      isSeeking: false,
      durationMs: 0,
      currentTimeMs: 0,
      packageLoaded: false,
      trackSyncApplied: false,
    },
    refs: {},
  };

  const KEY_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const QUERY = new URLSearchParams(window.location.search);

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    if (document.getElementById('homeSongList')) {
      initHomePage();
      return;
    }
    if (document.getElementById('alphaTabHost')) {
      initSongPage().catch(showFatalError);
    }
  }

  async function initHomePage() {
    const refs = App.refs;
    refs.homeBookC = document.getElementById('homeBookC');
    refs.homeBookTs = document.getElementById('homeBookTs');
    refs.homeSearchInput = document.getElementById('homeSearchInput');
    refs.homeSearchBtn = document.getElementById('homeSearchBtn');
    refs.homeSongList = document.getElementById('homeSongList');
    refs.homeCountLabel = document.getElementById('homeCountLabel');
    refs.homeResultLabel = document.getElementById('homeResultLabel');

    const qBook = normalizeBook(QUERY.get('book')) || 'c';
    const qKeyword = (QUERY.get('q') || '').trim();
    App.state.book = qBook;

    refs.homeSearchInput.value = qKeyword;
    bindBookToggle(refs.homeBookC, refs.homeBookTs, qBook, async (book) => {
      App.state.book = book;
      await renderHomeList();
    });
    refs.homeSearchBtn.addEventListener('click', renderHomeList);
    refs.homeSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') renderHomeList();
    });

    await renderHomeList();
  }

  async function renderHomeList() {
    const refs = App.refs;
    const book = App.state.book;
    const songs = await loadLyricsCatalog(book);
    const keyword = (refs.homeSearchInput.value || '').trim();
    const filtered = filterSongs(songs, keyword);

    refs.homeBookC.classList.toggle('active', book === 'c');
    refs.homeBookTs.classList.toggle('active', book === 'ts');
    refs.homeResultLabel.textContent = book === 'c' ? '大本' : '小本';
    refs.homeCountLabel.textContent = `${filtered.length} 首`;

    if (!filtered.length) {
      refs.homeSongList.innerHTML = '<div class="empty-state">没有找到匹配的诗歌。</div>';
      return;
    }

    refs.homeSongList.innerHTML = filtered.map((song) => {
      const no = Number(song.no);
      const padded = String(no).padStart(4, '0');
      const file = `${book}${padded}_cn_g.gtz`;
      const href = `song.html?book=${book}&no=${no}&file=${encodeURIComponent(file)}`;
      const title = escapeHtml(song.big_title || song.title || song.full_title || `${book.toUpperCase()} ${no}`);
      const subtitle = escapeHtml(song.title || song.full_title || '');
      return `
        <a class="song-row" href="${href}">
          <div>
            <div class="song-row-title">${title}</div>
            <div class="song-row-sub">${subtitle}</div>
          </div>
          <div class="song-row-no">${no}</div>
        </a>`;
    }).join('');
  }

  async function initSongPage() {
    collectSongRefs();
    const initial = getSongQueryInfo();
    App.state.book = initial.book;
    App.state.no = initial.no;
    App.state.file = initial.file;

    bindToolbar();
    bindSongSearch();
    setSearchBookUI(App.state.book);
    await loadSong(App.state.file, { book: App.state.book, no: App.state.no, replaceUrl: false });
  }

  function collectSongRefs() {
    const ids = [
      'btnHome', 'btnTempo', 'btnKey', 'btnCapo', 'btnMode', 'btnPrev', 'btnPlay', 'btnNext',
      'btnText', 'btnTracks', 'btnNotation', 'btnLang', 'btnSearch', 'panelTempo', 'tempoRange',
      'tempoValueLabel', 'tempoReset', 'panelTranspose', 'transposeDown', 'transposeUp',
      'transposeValueLabel', 'transposeReset', 'panelMode', 'panelText', 'fontDown', 'fontUp',
      'fontValueLabel', 'spacingDown', 'spacingUp', 'spacingValueLabel', 'panelTracks', 'trackList',
      'tracksAll', 'tracksNone', 'panelNotation', 'panelLang', 'panelSearch', 'songBookC', 'songBookTs',
      'songSearchInput', 'songSearchBtn', 'progressRange', 'timeLabel', 'mainTitle', 'subTitle',
      'scoreView', 'lyricsView', 'lyricsContent', 'alphaTabHost', 'errorBox'
    ];
    ids.forEach((id) => { App.refs[id] = document.getElementById(id); });
  }

  function bindToolbar() {
    const refs = App.refs;
    refs.btnHome.addEventListener('click', () => { window.location.href = 'index.html'; });
    refs.btnTempo.addEventListener('click', () => togglePanel('panelTempo'));
    refs.btnKey.addEventListener('click', () => togglePanel('panelTranspose'));
    refs.btnMode.addEventListener('click', () => togglePanel('panelMode'));
    refs.btnText.addEventListener('click', () => togglePanel('panelText'));
    refs.btnTracks.addEventListener('click', () => togglePanel('panelTracks'));
    refs.btnNotation.addEventListener('click', () => togglePanel('panelNotation'));
    refs.btnLang.addEventListener('click', () => togglePanel('panelLang'));
    refs.btnSearch.addEventListener('click', () => togglePanel('panelSearch'));
    refs.btnPrev.addEventListener('click', () => goAdjacent(-1));
    refs.btnNext.addEventListener('click', () => goAdjacent(1));
    refs.btnPlay.addEventListener('click', togglePlay);

    refs.tempoRange.addEventListener('input', () => {
      const tempo = Number(refs.tempoRange.value);
      applyTempoFromDisplay(tempo);
    });
    refs.tempoReset.addEventListener('click', () => {
      applyTempoFromDisplay(App.state.originalTempo);
      closePanels();
    });

    refs.transposeDown.addEventListener('click', () => setTranspose(App.state.transpose - 1));
    refs.transposeUp.addEventListener('click', () => setTranspose(App.state.transpose + 1));
    refs.transposeReset.addEventListener('click', () => setTranspose(0));

    refs.panelMode.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => setContentMode(btn.dataset.mode));
    });

    refs.fontDown.addEventListener('click', () => setFontSize(App.state.fontSizePx - 2));
    refs.fontUp.addEventListener('click', () => setFontSize(App.state.fontSizePx + 2));
    refs.spacingDown.addEventListener('click', () => setSpacing(App.state.spacingFactor - 0.1));
    refs.spacingUp.addEventListener('click', () => setSpacing(App.state.spacingFactor + 0.1));

    refs.tracksAll.addEventListener('click', () => {
      App.state.selectedTrackIndices = App.state.tracks.map((_, i) => i);
      syncTrackList();
      applyTrackSelection();
    });
    refs.tracksNone.addEventListener('click', () => {
      App.state.selectedTrackIndices = [];
      syncTrackList();
      applyTrackSelection();
    });

    refs.panelNotation.querySelectorAll('[data-notation]').forEach((btn) => {
      btn.addEventListener('click', () => setNotation(btn.dataset.notation));
    });

    refs.panelLang.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });

    refs.progressRange.addEventListener('input', () => {
      App.state.isSeeking = true;
      updateProgressStyle(refs.progressRange);
    });
    refs.progressRange.addEventListener('change', () => {
      App.state.isSeeking = false;
      const pct = Number(refs.progressRange.value) / 1000;
      seekToProgress(pct);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.toolbar-card')) closePanels();
    });
  }

  function bindSongSearch() {
    bindBookToggle(App.refs.songBookC, App.refs.songBookTs, App.state.book, (book) => {
      App.state.book = book;
      setSearchBookUI(book);
    });

    App.refs.songSearchBtn.addEventListener('click', onSongSearch);
    App.refs.songSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') onSongSearch();
    });
  }

  async function onSongSearch() {
    const keyword = (App.refs.songSearchInput.value || '').trim();
    const catalog = await loadLyricsCatalog(App.state.book);
    const found = findBestSong(catalog, keyword);
    if (!found) {
      showError('未找到对应诗歌。');
      return;
    }
    const file = buildGtzFileName(App.state.book, Number(found.no));
    await loadSong(file, { book: App.state.book, no: Number(found.no), replaceUrl: true });
    closePanels();
  }

  async function goAdjacent(delta) {
    const catalog = await loadLyricsCatalog(App.state.book);
    const index = catalog.findIndex((x) => Number(x.no) === Number(App.state.no));
    if (index < 0) return;
    const next = catalog[index + delta];
    if (!next) return;
    const file = buildGtzFileName(App.state.book, Number(next.no));
    await loadSong(file, { book: App.state.book, no: Number(next.no), replaceUrl: true });
  }

  async function loadSong(fileName, opts) {
    const book = normalizeBook(opts.book) || 'c';
    const no = Number(opts.no) || 1;
    App.state.book = book;
    App.state.no = no;
    App.state.file = fileName;
    App.state.packageLoaded = false;
    App.state.trackSyncApplied = false;
    showError('');
    closePanels();
    stopPlayback();

    const gtzPath = `./assets/${book}/${fileName}`;
    const pkg = await loadJson(gtzPath);
    App.state.pkg = pkg;
    App.state.meta = pkg.meta || {};
    App.state.originalTempo = Number(pkg.meta?.tempo || 95);
    App.state.playbackSpeed = 1;
    App.state.capo = Number(pkg.meta?.capo || 0);
    App.state.originalKeyName = pkg.meta?.key_name || 'C';
    App.state.transpose = 0;
    App.state.notationMode = pkg.viewerState?.showNumberedNotation ? 'jianpu' : 'staff';
    App.state.currentMode = 'score';
    App.state.fontSizePx = Number(pkg.viewerState?.fontSizePx || pkg.state?.fontSizePx || 30);
    App.state.spacingFactor = Number(pkg.viewerState?.spacingFactor || pkg.state?.spacingFactor || 2.0);
    App.state.selectedTrackIndices = Array.isArray(pkg.viewerState?.visibleTrackIndices)
      ? pkg.viewerState.visibleTrackIndices.slice()
      : [0];
    App.state.scoreXml = decodeBase64Utf8(pkg.score?.data || pkg.scoreBase64 || '');

    updateUrl(book, no, fileName, !!opts.replaceUrl);
    await loadLyricsForCurrentSong();
    updateLabels();
    setSearchBookUI(book);
    await renderScore();
    renderPureLyrics();
    setContentMode('score', true);
    updateTempoUI();
    updateTransposeUI();
    updateTextUI();
    updateNotationUI();
    updateLanguageUI();
    App.state.packageLoaded = true;
  }

  async function renderScore() {
    const refs = App.refs;
    if (!window.alphaTab) throw new Error('alphaTab 未加载。');
    if (App.state.api) {
      App.state.api.destroy();
      App.state.api = null;
    }

    refs.alphaTabHost.innerHTML = '';
    const settings = {
      core: {
        scriptFile: './assets/alphatab/alphaTab.js',
        fontDirectory: './assets/alphatab/font/',
      },
      file: App.state.scoreXml,
      importer: {
        encoding: 'utf-8',
        mergePartGroupsInMusicXml: false,
      },
      display: {
        scale: 1,
        layoutMode: alphaTab.LayoutMode.Page,
        stretchForce: 0.8,
        showChordDiagramsOnTop: false,
        showTrackNames: false,
        showTitle: true,
        showSubtitle: true,
        showStandardNotation: App.state.notationMode === 'staff',
        showNumberedNotation: App.state.notationMode === 'jianpu',
      },
      notation: {
        elements: {
          scoreTitle: false,
          scoreSubTitle: false,
        },
      },
      player: {
        enablePlayer: true,
      },
    };

    const api = new alphaTab.AlphaTabApi(refs.alphaTabHost, settings);
    App.state.api = api;

    api.error.on((e) => {
      showError(typeof e === 'string' ? e : (e?.message || JSON.stringify(e)));
    });

    api.scoreLoaded.on((score) => {
      App.state.score = score;
      App.state.tracks = Array.isArray(score?.tracks) ? score.tracks.slice() : [];
      buildTrackList();
      if (!App.state.trackSyncApplied) {
        App.state.trackSyncApplied = true;
        applyTrackSelection();
      } else {
        syncTrackList();
      }
      applyTransposeToTracks();
    });

    api.playerReady.on(() => {
      App.state.playerReady = true;
    });

    api.playerStateChanged.on((e) => {
      const isPlaying = e && e.state === alphaTab.PlayerState.Playing;
      refs.btnPlay.textContent = isPlaying ? '❚❚' : '▶';
    });

    api.playerPositionChanged.on((e) => {
      if (!e) return;
      App.state.currentTimeMs = Number(e.currentTime || 0);
      App.state.durationMs = Number(e.endTime || App.state.durationMs || 0);
      if (!App.state.isSeeking) {
        const pct = App.state.durationMs > 0 ? App.state.currentTimeMs / App.state.durationMs : 0;
        refs.progressRange.value = Math.max(0, Math.min(1000, Math.round(pct * 1000)));
        updateProgressStyle(refs.progressRange);
      }
      refs.timeLabel.textContent = formatMs(App.state.currentTimeMs);
    });

    api.playerFinished.on(() => {
      refs.btnPlay.textContent = '▶';
      refs.progressRange.value = 0;
      updateProgressStyle(refs.progressRange);
      refs.timeLabel.textContent = '00:00';
    });
  }

  function buildTrackList() {
    const refs = App.refs;
    const tracks = App.state.tracks || [];
    if (!tracks.length) {
      refs.trackList.innerHTML = '<div class="empty-state">当前乐谱没有可切换轨道。</div>';
      return;
    }
    if (!App.state.selectedTrackIndices.length) {
      App.state.selectedTrackIndices = Array.isArray(App.state.pkg?.viewerState?.visibleTrackIndices)
        ? App.state.pkg.viewerState.visibleTrackIndices.slice()
        : [0];
    }
    refs.trackList.innerHTML = tracks.map((track, index) => {
      const checked = App.state.selectedTrackIndices.includes(index) ? 'checked' : '';
      const name = escapeHtml(track.name || `轨道 ${index + 1}`);
      return `
        <label class="track-item">
          <input type="checkbox" data-track-index="${index}" ${checked} />
          <span>${name}</span>
        </label>`;
    }).join('');
    refs.trackList.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.addEventListener('change', () => {
        const idx = Number(input.dataset.trackIndex);
        if (input.checked) {
          if (!App.state.selectedTrackIndices.includes(idx)) App.state.selectedTrackIndices.push(idx);
        } else {
          App.state.selectedTrackIndices = App.state.selectedTrackIndices.filter((x) => x !== idx);
        }
        App.state.selectedTrackIndices.sort((a, b) => a - b);
        applyTrackSelection();
      });
    });
  }

  function syncTrackList() {
    App.refs.trackList.querySelectorAll('input[data-track-index]').forEach((input) => {
      input.checked = App.state.selectedTrackIndices.includes(Number(input.dataset.trackIndex));
    });
  }

  function applyTrackSelection() {
    const api = App.state.api;
    if (!api || !App.state.tracks.length) return;
    const indices = App.state.selectedTrackIndices.filter((x) => x >= 0 && x < App.state.tracks.length);
    if (!indices.length) {
      api.renderTracks([]);
      syncTrackList();
      return;
    }
    const tracks = indices.map((i) => App.state.tracks[i]);
    api.renderTracks(tracks);
    syncTrackList();
    applyTransposeToTracks();
  }

  function applyTempoFromDisplay(displayTempo) {
    const tempo = Math.max(40, Math.min(240, Number(displayTempo) || App.state.originalTempo));
    App.state.playbackSpeed = tempo / Math.max(1, App.state.originalTempo);
    if (App.state.api) {
      App.state.api.playbackSpeed = App.state.playbackSpeed;
      if (App.state.api.player) {
        App.state.api.player.playbackSpeed = App.state.playbackSpeed;
      }
    }
    updateTempoUI();
  }

  function setTranspose(value) {
    App.state.transpose = Math.max(-12, Math.min(12, Number(value) || 0));
    applyTransposeToTracks();
    updateTransposeUI();
  }

  function applyTransposeToTracks() {
    const api = App.state.api;
    if (!api || !App.state.tracks.length) return;
    if (!App.state.selectedTrackIndices.length) return;
    const tracks = App.state.selectedTrackIndices.map((i) => App.state.tracks[i]).filter(Boolean);
    if (tracks.length) {
      api.changeTrackTranspositionPitch(tracks, App.state.transpose);
    }
  }

  function setNotation(mode) {
    if (!['staff', 'jianpu'].includes(mode)) return;
    App.state.notationMode = mode;
    const api = App.state.api;
    if (api) {
      api.settings.display.showStandardNotation = mode === 'staff';
      api.settings.display.showNumberedNotation = mode === 'jianpu';
      api.updateSettings();
      api.render();
    }
    updateNotationUI();
    closePanels();
  }

  function setContentMode(mode, silent) {
    App.state.currentMode = mode === 'lyrics' ? 'lyrics' : 'score';
    App.refs.scoreView.classList.toggle('hidden', App.state.currentMode !== 'score');
    App.refs.lyricsView.classList.toggle('hidden', App.state.currentMode !== 'lyrics');
    App.refs.panelMode.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === App.state.currentMode);
    });
    App.refs.btnMode.textContent = App.state.currentMode === 'score' ? '吉' : '词';
    if (!silent) closePanels();
  }

  function setFontSize(value) {
    App.state.fontSizePx = Math.max(18, Math.min(54, Number(value) || 30));
    document.documentElement.style.setProperty('--lyrics-font-size', `${App.state.fontSizePx}px`);
    const host = App.refs.alphaTabHost;
    host.style.fontSize = `${App.state.fontSizePx}px`;
    updateTextUI();
  }

  function setSpacing(value) {
    App.state.spacingFactor = Math.max(1.0, Math.min(3.5, Math.round((Number(value) || 2.0) * 10) / 10));
    document.documentElement.style.setProperty('--lyrics-spacing', String(App.state.spacingFactor));
    App.refs.lyricsContent.style.lineHeight = `${App.state.spacingFactor}`;
    updateTextUI();
  }

  function setLanguage(lang) {
    App.state.language = ['zh-cn', 'zh-hant', 'en'].includes(lang) ? lang : 'zh-cn';
    updateLabels();
    renderPureLyrics();
    updateLanguageUI();
    closePanels();
  }

  function updateTempoUI() {
    const displayTempo = Math.round(App.state.originalTempo * App.state.playbackSpeed);
    App.refs.btnTempo.textContent = String(displayTempo);
    App.refs.tempoRange.value = String(displayTempo);
    App.refs.tempoValueLabel.textContent = String(displayTempo);
  }

  function updateTransposeUI() {
    App.refs.transposeValueLabel.textContent = App.state.transpose > 0 ? `+${App.state.transpose}` : String(App.state.transpose);
    App.refs.btnKey.textContent = transposeKeyName(App.state.originalKeyName, App.state.transpose);
  }

  function updateTextUI() {
    App.refs.fontValueLabel.textContent = String(App.state.fontSizePx);
    App.refs.spacingValueLabel.textContent = `${App.state.spacingFactor.toFixed(1)}x`;
    document.documentElement.style.setProperty('--lyrics-font-size', `${App.state.fontSizePx}px`);
    document.documentElement.style.setProperty('--lyrics-spacing', String(App.state.spacingFactor));
  }

  function updateNotationUI() {
    App.refs.panelNotation.querySelectorAll('[data-notation]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.notation === App.state.notationMode);
    });
  }

  function updateLanguageUI() {
    App.refs.panelLang.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === App.state.language);
    });
  }

  function updateLabels() {
    const meta = App.state.meta || {};
    const main = localizeText(meta.big_title || '', App.state.language, { enFallback: meta.big_title || '' });
    const sub = localizeText(meta.title || meta.full_title || '', App.state.language, { enFallback: meta.title || meta.full_title || '' });
    App.refs.mainTitle.textContent = main || `第 ${App.state.no} 首`;
    App.refs.subTitle.textContent = sub;
    document.title = `${main || '乐谱'} - 召会诗歌吉他谱`;
    App.refs.btnCapo.textContent = `CP${App.state.capo}`;
  }

  async function loadLyricsForCurrentSong() {
    const catalog = await loadLyricsCatalog(App.state.book);
    const song = catalog.find((x) => Number(x.no) === Number(App.state.no)) || null;
    App.state.lyricsData = song;
  }

  function renderPureLyrics() {
    const refs = App.refs;
    const song = App.state.lyricsData;
    if (!song || !Array.isArray(song.lyrics)) {
      refs.lyricsContent.innerHTML = '<div class="empty-state">没有找到纯文本歌词。</div>';
      return;
    }
    const html = song.lyrics.map((section) => {
      const sectionNo = escapeHtml(localizeText(section.section_no || '', App.state.language));
      const lines = Array.isArray(section.lines) ? section.lines : [];
      const lineHtml = lines.map((line) => `<p class="lyrics-line">${escapeHtml(localizeText(line, App.state.language))}</p>`).join('');
      return `
        <div class="lyrics-section">
          <div class="lyrics-section-no">${sectionNo ? sectionNo + '.' : ''}</div>
          ${lineHtml}
        </div>`;
    }).join('');
    refs.lyricsContent.innerHTML = html;
    refs.lyricsContent.style.fontSize = `${App.state.fontSizePx}px`;
    refs.lyricsContent.style.lineHeight = `${App.state.spacingFactor}`;
  }

  function togglePlay() {
    const api = App.state.api;
    if (!api) return;
    try {
      api.playPause();
    } catch (err) {
      showError(err?.message || String(err));
    }
  }

  function stopPlayback() {
    const api = App.state.api;
    if (!api) return;
    try {
      api.pause();
    } catch (_) {}
    App.refs.btnPlay.textContent = '▶';
    App.refs.progressRange.value = 0;
    App.refs.timeLabel.textContent = '00:00';
    updateProgressStyle(App.refs.progressRange);
  }

  function seekToProgress(pct) {
    const api = App.state.api;
    if (!api || !App.state.durationMs) return;
    const target = App.state.durationMs * pct;
    if (api.player) {
      api.player.timePosition = target;
    }
  }

  function togglePanel(id) {
    const target = App.refs[id];
    if (!target) return;
    const willShow = target.classList.contains('hidden');
    closePanels();
    if (willShow) target.classList.remove('hidden');
  }

  function closePanels() {
    ['panelTempo', 'panelTranspose', 'panelMode', 'panelText', 'panelTracks', 'panelNotation', 'panelLang', 'panelSearch']
      .forEach((id) => App.refs[id]?.classList.add('hidden'));
  }

  function showError(msg) {
    const box = App.refs.errorBox;
    if (!box) return;
    if (!msg) {
      box.classList.add('hidden');
      box.textContent = '';
      return;
    }
    box.textContent = msg;
    box.classList.remove('hidden');
  }

  function showFatalError(err) {
    const msg = err?.message || String(err);
    const box = document.getElementById('errorBox');
    if (box) {
      box.textContent = msg;
      box.classList.remove('hidden');
    } else {
      alert(msg);
    }
  }

  function updateProgressStyle(range) {
    const pct = `${(Number(range.value) / Number(range.max || 1000)) * 100}%`;
    range.style.setProperty('--progress', pct);
  }

  function bindBookToggle(btnC, btnTs, initialBook, onChange) {
    btnC.classList.toggle('active', initialBook === 'c');
    btnTs.classList.toggle('active', initialBook === 'ts');
    btnC.addEventListener('click', async () => {
      btnC.classList.add('active');
      btnTs.classList.remove('active');
      await onChange('c');
    });
    btnTs.addEventListener('click', async () => {
      btnTs.classList.add('active');
      btnC.classList.remove('active');
      await onChange('ts');
    });
  }

  function setSearchBookUI(book) {
    ['songBookC', 'homeBookC'].forEach((id) => App.refs[id]?.classList.toggle('active', book === 'c'));
    ['songBookTs', 'homeBookTs'].forEach((id) => App.refs[id]?.classList.toggle('active', book === 'ts'));
  }

  function getSongQueryInfo() {
    const book = normalizeBook(QUERY.get('book')) || 'c';
    const no = Number(QUERY.get('no') || 1);
    const file = QUERY.get('file') || buildGtzFileName(book, no);
    return { book, no, file };
  }

  function updateUrl(book, no, file, replace) {
    const url = `song.html?book=${book}&no=${no}&file=${encodeURIComponent(file)}`;
    if (replace) history.replaceState({}, '', url);
  }

  async function loadLyricsCatalog(book) {
    const key = `lyrics:${book}`;
    if (App.state.lyricsCache.has(key)) return App.state.lyricsCache.get(key);
    const chunks = book === 'c'
      ? ['./assets/c_text/c_1_100.json', './assets/c_text/c_101_200.json']
      : ['./assets/ts_text/ts_1_100.json', './assets/ts_text/ts_101_200.json'];
    const loaded = await Promise.all(chunks.map(loadJson));
    const merged = loaded.flat().filter(Boolean);
    App.state.lyricsCache.set(key, merged);
    return merged;
  }

  function filterSongs(songs, keyword) {
    if (!keyword) return songs;
    const normalized = keyword.toLowerCase();
    return songs.filter((song) => {
      return [song.no, song.no_label, song.big_title, song.title, song.full_title, song.raw_header_line]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(normalized));
    });
  }

  function findBestSong(songs, keyword) {
    if (!keyword) return null;
    const no = Number(keyword);
    if (!Number.isNaN(no)) {
      return songs.find((song) => Number(song.no) === no) || null;
    }
    const filtered = filterSongs(songs, keyword);
    return filtered[0] || null;
  }

  function buildGtzFileName(book, no) {
    return `${book}${String(no).padStart(4, '0')}_cn_g.gtz`;
  }

  function normalizeBook(value) {
    return value === 'ts' ? 'ts' : value === 'c' ? 'c' : null;
  }

  async function loadJson(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`读取失败: ${path}`);
    return await res.json();
  }

  function decodeBase64Utf8(b64) {
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  }

  function localizeText(text, lang, opts) {
    const raw = text == null ? '' : String(text);
    if (!raw) return '';
    if (lang === 'en') {
      return (opts && opts.enFallback) ? opts.enFallback : raw;
    }
    if (lang === 'zh-hant') {
      return toTraditionalApprox(raw);
    }
    return raw;
  }

  function toTraditionalApprox(text) {
    const map = {
      '体': '體', '灵': '靈', '并': '並', '归': '歸', '圣': '聖', '创': '創', '画': '畫', '广': '廣', '为': '為',
      '启': '啟', '众': '眾', '对': '對', '将': '將', '敌': '敵', '带': '帶', '赞': '讚', '爱': '愛', '你': '你',
      '们': '們', '这': '這', '计划': '計畫', '计划': '計畫', '颂': '頌', '祂的计划': '祂的計畫', '荣耀': '榮耀',
      '欢': '歡', '旧': '舊', '后': '後', '乐': '樂', '谱': '譜', '简': '簡', '词': '詞', '号': '號', '变': '變',
      '调': '調', '线': '線', '复': '復', '灭': '滅', '开': '開', '闭': '閉', '满': '滿', '点': '點', '页': '頁',
      '汉': '漢', '气': '氣', '龙': '龍', '风': '風', '头': '頭', '话': '話', '间': '間', '广': '廣', '门': '門',
      '边': '邊', '东': '東', '听': '聽', '专': '專', '书': '書', '云': '雲', '国': '國', '亲': '親', '诗': '詩'
    };
    let out = text;
    const phraseMap = [['计划', '計畫'], ['荣耀', '榮耀'], ['颂赞', '頌讚'], ['归于', '歸於'], ['圣灵', '聖靈'], ['圣父', '聖父'], ['圣子', '聖子']];
    phraseMap.forEach(([a, b]) => { out = out.split(a).join(b); });
    return Array.from(out).map((ch) => map[ch] || ch).join('');
  }

  function transposeKeyName(keyName, semitones) {
    const idx = KEY_NAMES.indexOf(keyName);
    if (idx < 0) return keyName;
    const next = (idx + semitones % 12 + 12) % 12;
    return KEY_NAMES[next];
  }

  function formatMs(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
