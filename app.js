(function () {
  "use strict";

  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  const state = {
    api: null,
    gtz: null,
    xmlBlobUrl: null,
    currentNotation: "staff",
    currentMode: "score",
    originalTempo: 95,
    currentTempo: 95,
    fontSizePx: 30,
    spacingFactor: 2.0,
    visibleTrackIndices: [0],
    notationTrackIndices: [],
    currentPath: "./assets/c0001_cn_g.gtz",
    scoreLoaded: false
  };

  const el = {
    songTitle: qs("#songTitle"),
    songSubtitle: qs("#songSubtitle"),
    scoreLoading: qs("#scoreLoading"),
    scoreError: qs("#scoreError"),
    lyricsPlaceholder: qs("#lyricsPlaceholder"),
    alphaTabHost: qs("#alphaTabHost"),
    pathInput: qs("#pathInput"),
    reloadBtn: qs("#reloadBtn"),
    tempoValue: qs("#tempoValue"),
    tempoRange: qs("#tempoRange"),
    tempoBtn: qs("#tempoBtn"),
    tempoResetBtn: qs("#tempoResetBtn"),
    keyBtn: qs("#keyBtn"),
    keyValue: qs("#keyValue"),
    capoBtn: qs("#capoBtn"),
    fontSizeValue: qs("#fontSizeValue"),
    spacingValue: qs("#spacingValue"),
    fontMinusBtn: qs("#fontMinusBtn"),
    fontPlusBtn: qs("#fontPlusBtn"),
    spacingMinusBtn: qs("#spacingMinusBtn"),
    spacingPlusBtn: qs("#spacingPlusBtn"),
    trackList: qs("#trackList"),
    timeLabel: qs("#timeLabel"),
    playBtn: qs("#playBtn"),
    prevBtn: qs("#prevBtn"),
    nextBtn: qs("#nextBtn"),
    homeBtn: qs("#homeBtn"),
    searchBtn: qs("#searchBtn"),
    notationBtn: qs("#notationBtn"),
    staffOption: qs("#staffOption"),
    jianpuOption: qs("#jianpuOption"),
    modeBtn: qs("#modeBtn")
  };

  function getQueryInfo() {
    const params = new URLSearchParams(window.location.search);
    return {
      book: (params.get("book") || "c").trim(),
      no: (params.get("no") || "1").trim(),
      file: (params.get("file") || "").trim()
    };
  }

  function buildPathFromQuery() {
    const { book, no, file } = getQueryInfo();

    if (file) {
      if (/^(https?:)?\/\//i.test(file)) return file;
      if (file.startsWith("./") || file.startsWith("/")) return file;
      if (file.startsWith("assets/")) return `./${file}`;
      return `./assets/${book}/${file}`;
    }

    const n = Math.max(1, parseInt(no, 10) || 1);
    const p = String(n).padStart(4, "0");
    return book === "ts"
      ? `./assets/ts/ts${p}_cn_g.gtz`
      : `./assets/c/c${p}_cn_g.gtz`;
  }

  function showError(message) {
    el.scoreError.textContent = message;
    el.scoreError.classList.remove("hidden");
    el.scoreLoading.classList.add("hidden");
  }

  function clearError() {
    el.scoreError.textContent = "";
    el.scoreError.classList.add("hidden");
  }

  function setLoading(message) {
    el.scoreLoading.textContent = message || "正在加载...";
    el.scoreLoading.classList.remove("hidden");
  }

  function hideLoading() {
    el.scoreLoading.classList.add("hidden");
  }

  function revokeBlobUrl() {
    if (state.xmlBlobUrl) {
      URL.revokeObjectURL(state.xmlBlobUrl);
      state.xmlBlobUrl = null;
    }
  }

  function destroyApi() {
    if (state.api) {
      try {
        state.api.destroy();
      } catch (_) {}
      state.api = null;
    }
    revokeBlobUrl();
    el.alphaTabHost.innerHTML = "";
    state.scoreLoaded = false;
  }

  function decodeBase64ToBlobUrl(base64Data) {
    const binary = atob(base64Data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], {
      type: "application/vnd.recordare.musicxml+xml"
    });
    state.xmlBlobUrl = URL.createObjectURL(blob);
    return state.xmlBlobUrl;
  }

  function getPackageScoreData(pkg) {
    return pkg?.score?.data || pkg?.scoreBase64 || "";
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

    state.currentNotation = showNumberedNotation && !showStandardNotation ? "jianpu" : "staff";
  }

  function updateMetaUi(pkg) {
    const meta = pkg.meta || {};
    const bigTitle = meta.big_title || meta.full_title || meta.title || "未命名歌曲";
    const subTitle = meta.title || meta.full_title || "";

    el.songTitle.textContent = bigTitle;
    el.songSubtitle.textContent = subTitle;
    document.title = `${bigTitle} - GTZ 乐谱 v8`;

    state.originalTempo = Number(meta.tempo || 95);
    state.currentTempo = state.originalTempo;

    el.tempoBtn.textContent = String(state.currentTempo);
    el.tempoValue.textContent = String(state.currentTempo);
    el.tempoRange.value = String(state.currentTempo);

    const keyName = meta.key_name || "C";
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
    closeMenus();
    const menu = document.getElementById(menuId);
    if (!menu) return;
    menu.classList.remove("hidden");
    if (anchorButton) {
      const maxLeft = window.innerWidth - Math.min(menu.offsetWidth || 320, window.innerWidth - 20) - 10;
      menu.style.left = `${Math.min(menuButtonLeft(anchorButton), maxLeft)}px`;
    }
  }

  function closeMenus() {
    qsa(".dropdown-menu").forEach((m) => m.classList.add("hidden"));
  }

  function syncNotationUi() {
    const isStaff = state.currentNotation === "staff";
    el.staffOption.classList.toggle("selected", isStaff);
    el.jianpuOption.classList.toggle("selected", !isStaff);
    el.notationBtn.classList.toggle("active", true);
    el.alphaTabHost.classList.toggle("jianpu-mode", !isStaff);
  }

  function syncModeUi() {
    qsa("[data-mode-option]").forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.modeOption === state.currentMode);
    });
    const lyricsMode = state.currentMode === "lyrics";
    el.lyricsPlaceholder.classList.toggle("hidden", !lyricsMode);
    el.alphaTabHost.classList.toggle("hidden", lyricsMode);
  }

  function resetSvgFixes(svg) {
  svg.querySelectorAll('[data-jianpu-hidden="1"]').forEach((node) => {
    node.style.display = "";
    node.removeAttribute("data-jianpu-hidden");
  });

  svg.querySelectorAll('[data-lyric-shift="1"]').forEach((node) => {
    const orig = node.getAttribute("data-orig-transform");
    if (orig === null || orig === "") {
      node.removeAttribute("transform");
    } else {
      node.setAttribute("transform", orig);
    }
    node.removeAttribute("data-lyric-shift");
    node.removeAttribute("data-orig-transform");
  });
}

  function staffLooksLikeTab(staff) {
    return (
      String(staff?.clef ?? "").toLowerCase() === "tab" ||
      Number(staff?.stringTuning?.tunings?.length || staff?.stringCount || 0) >= 6 ||
      Number(staff?.staffLines || 0) === 6
    );
  }

  function trackLooksLikeMelody(track) {
    if (!track || !Array.isArray(track.staves)) return false;
    const hasNonTab = track.staves.some((s) => !staffLooksLikeTab(s));
    const hasTab = track.staves.some((s) => staffLooksLikeTab(s));
    return hasNonTab && !hasTab;
  }

  function detectNotationTrackIndices(score) {
    if (!score || !Array.isArray(score.tracks) || !score.tracks.length) return [0];

    const melodyOnly = [];
    score.tracks.forEach((track, index) => {
      if (trackLooksLikeMelody(track)) melodyOnly.push(index);
    });
    if (melodyOnly.length) return [melodyOnly[0]];

    const firstNonTab = [];
    score.tracks.forEach((track, index) => {
      if (!track || !Array.isArray(track.staves)) return;
      if (track.staves.some((s) => !staffLooksLikeTab(s))) firstNonTab.push(index);
    });

    return firstNonTab.length ? [firstNonTab[0]] : [0];
  }

  function applyNotationToScore(score) {
    if (!score || !Array.isArray(score.tracks)) return;

    const notationTrackIndices = detectNotationTrackIndices(score);
    state.notationTrackIndices = notationTrackIndices;
    const jianpuMode = state.currentNotation === "jianpu";

    score.tracks.forEach((track, trackIndex) => {
      if (!track || !Array.isArray(track.staves)) return;

      const isNotationTrack = notationTrackIndices.includes(trackIndex);

      track.staves.forEach((staff) => {
        if (!staff) return;

        const isTab = staffLooksLikeTab(staff);

        if (isTab) {
          if ("showNumbered" in staff) staff.showNumbered = false;
          if ("showStandardNotation" in staff) staff.showStandardNotation = false;
          return;
        }

        if (isNotationTrack) {
          if ("showNumbered" in staff) staff.showNumbered = jianpuMode;
          if ("showStandardNotation" in staff) staff.showStandardNotation = !jianpuMode;
          if (jianpuMode && "showKeySignature" in staff) {
            staff.showKeySignature = false;
          }
        } else {
          if ("showNumbered" in staff) staff.showNumbered = false;
          if ("showStandardNotation" in staff) staff.showStandardNotation = true;
        }
      });
    });
  }

  function renderVisibleTracks() {
    if (!state.api || !state.api.score || !state.api.score.tracks) return;

    const indices = state.visibleTrackIndices.length ? state.visibleTrackIndices : [0];
    const tracks = indices.map((i) => state.api.score.tracks[i]).filter(Boolean);

    if (tracks.length) {
      state.api.renderTracks(tracks);
    } else {
      state.api.renderScore(state.api.score);
    }
  }

  function updateDisplaySettings() {
    if (!state.api || !state.api.score) return;
    applyNotationToScore(state.api.score);
    renderVisibleTracks();
    syncNotationUi();

    setTimeout(fixRenderedSvg, 40);
    setTimeout(fixRenderedSvg, 120);
    setTimeout(fixRenderedSvg, 260);
    setTimeout(fixRenderedSvg, 420);
  }

  function trackDisplayName(track, index) {
    return track?.name || track?.shortName || `轨道 ${index + 1}`;
  }

  function updateTrackList() {
    el.trackList.innerHTML = "";

    if (!state.api || !state.api.score || !state.api.score.tracks) {
      el.trackList.innerHTML = "暂无轨道信息";
      return;
    }

    state.api.score.tracks.forEach((track, index) => {
      const row = document.createElement("label");
      row.className = "track-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = state.visibleTrackIndices.includes(index);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          if (!state.visibleTrackIndices.includes(index)) {
            state.visibleTrackIndices.push(index);
            state.visibleTrackIndices.sort((a, b) => a - b);
          }
        } else {
          state.visibleTrackIndices = state.visibleTrackIndices.filter((x) => x !== index);
          if (!state.visibleTrackIndices.length) {
            state.visibleTrackIndices = [index];
            checkbox.checked = true;
          }
        }
        updateDisplaySettings();
      });

      const text = document.createElement("span");
      text.textContent = trackDisplayName(track, index);

      row.appendChild(checkbox);
      row.appendChild(text);
      el.trackList.appendChild(row);
    });
  }

  async function fetchPackage(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`GTZ 读取失败：${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  function createAlphaTab(blobUrl) {
    const scriptFile = absoluteUrl("./assets/alphatab/alphaTab.js");

    state.api = new alphaTab.AlphaTabApi(el.alphaTabHost, {
      file: blobUrl,
      core: {
        useWorkers: false,
        scriptFile
      }
    });

    state.api.scoreLoaded.on((score) => {
      state.scoreLoaded = true;
      applyNotationToScore(score);
      hideLoading();
      updateTrackList();
      renderVisibleTracks();
      syncNotationUi();
      syncModeUi();

      setTimeout(fixRenderedSvg, 50);
      setTimeout(fixRenderedSvg, 160);
      setTimeout(fixRenderedSvg, 320);
      setTimeout(fixRenderedSvg, 520);
    });

    state.api.renderFinished.on(() => {
      setTimeout(fixRenderedSvg, 20);
      setTimeout(fixRenderedSvg, 90);
      setTimeout(fixRenderedSvg, 180);
    });

    state.api.error.on((error) => {
      console.error(error);
      showError(error?.message || String(error));
    });
  }

  async function loadScore() {
    try {
      clearError();
      setLoading("正在加载 GTZ 与乐谱... v8");

      destroyApi();

      state.currentPath = el.pathInput.value.trim() || buildPathFromQuery();
      el.pathInput.value = state.currentPath;

      const pkg = await fetchPackage(state.currentPath);
      state.gtz = pkg;

      readViewerState(pkg);
      updateMetaUi(pkg);

      const scoreBase64 = getPackageScoreData(pkg);
      if (!scoreBase64) {
        throw new Error("GTZ 中未找到 score.data / scoreBase64");
      }

      const blobUrl = decodeBase64ToBlobUrl(scoreBase64);
      createAlphaTab(blobUrl);
    } catch (err) {
      console.error(err);
      showError(err?.message || String(err));
    }
  }

  function syncFontSpacingUi() {
    el.fontSizeValue.textContent = String(state.fontSizePx);
    el.spacingValue.textContent = state.spacingFactor.toFixed(1);
  }

  function applyHostVisualScale() {
    const scale = Math.max(0.6, state.fontSizePx / 30);
    el.alphaTabHost.style.setProperty("--score-scale", String(scale));
    el.alphaTabHost.style.setProperty("--score-gap", String(state.spacingFactor));
  }

  function bindMenus() {
    qs("#tempoBtn").addEventListener("click", (e) => openMenu("tempoMenu", e.currentTarget));
    qs("#keyBtn").addEventListener("click", (e) => openMenu("keyMenu", e.currentTarget));
    qs("#modeBtn").addEventListener("click", (e) => openMenu("modeMenu", e.currentTarget));
    qs("#fontBtn").addEventListener("click", (e) => openMenu("fontMenu", e.currentTarget));
    qs("#trackBtn").addEventListener("click", (e) => openMenu("trackMenu", e.currentTarget));
    qs("#notationBtn").addEventListener("click", (e) => openMenu("notationMenu", e.currentTarget));
    qs("#capoBtn").addEventListener("click", (e) => openMenu("langMenu", e.currentTarget));

    document.addEventListener("click", (e) => {
      const inMenu = e.target.closest(".dropdown-menu");
      const inToolBtn = e.target.closest(".tool-btn");
      if (!inMenu && !inToolBtn) closeMenus();
    });
  }

  function bindEvents() {
    bindMenus();

    el.reloadBtn.addEventListener("click", loadScore);

    el.staffOption.addEventListener("click", () => {
      state.currentNotation = "staff";
      updateDisplaySettings();
      closeMenus();
    });

    el.jianpuOption.addEventListener("click", () => {
      state.currentNotation = "jianpu";
      updateDisplaySettings();
      closeMenus();
    });

    qsa("[data-mode-option]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.currentMode = btn.dataset.modeOption;
        syncModeUi();
        closeMenus();
      });
    });

    el.tempoRange.addEventListener("input", () => {
      state.currentTempo = Number(el.tempoRange.value || state.originalTempo);
      el.tempoValue.textContent = String(state.currentTempo);
      el.tempoBtn.textContent = String(state.currentTempo);
      if (state.api) {
        try {
          state.api.playbackSpeed = state.currentTempo / Math.max(1, state.originalTempo);
        } catch (_) {}
      }
    });

    el.tempoResetBtn.addEventListener("click", () => {
      state.currentTempo = state.originalTempo;
      el.tempoRange.value = String(state.originalTempo);
      el.tempoValue.textContent = String(state.originalTempo);
      el.tempoBtn.textContent = String(state.originalTempo);
      if (state.api) {
        try {
          state.api.playbackSpeed = 1;
        } catch (_) {}
      }
    });

    el.fontMinusBtn.addEventListener("click", () => {
      state.fontSizePx = Math.max(16, state.fontSizePx - 2);
      syncFontSpacingUi();
      applyHostVisualScale();
    });

    el.fontPlusBtn.addEventListener("click", () => {
      state.fontSizePx = Math.min(60, state.fontSizePx + 2);
      syncFontSpacingUi();
      applyHostVisualScale();
    });

    el.spacingMinusBtn.addEventListener("click", () => {
      state.spacingFactor = Math.max(0.8, +(state.spacingFactor - 0.1).toFixed(1));
      syncFontSpacingUi();
      applyHostVisualScale();
    });

    el.spacingPlusBtn.addEventListener("click", () => {
      state.spacingFactor = Math.min(4.0, +(state.spacingFactor + 0.1).toFixed(1));
      syncFontSpacingUi();
      applyHostVisualScale();
    });

    el.playBtn.addEventListener("click", () => {
      if (!state.api) return;
      try {
        state.api.playPause();
      } catch (_) {}
    });

    el.prevBtn.addEventListener("click", () => {});
    el.nextBtn.addEventListener("click", () => {});

    el.homeBtn.addEventListener("click", () => {
      window.location.href = "./index.html";
    });

    el.searchBtn.addEventListener("click", () => {
      window.location.href = "./index.html";
    });
  }

function hideNodeAndUsefulParent(node) {
  if (!node) return null;

  const p1 = node.parentElement;
  const p2 = p1 ? p1.parentElement : null;

  if (p2 && p2.tagName && p2.tagName.toLowerCase() === "g") {
    p2.style.display = "none";
    p2.setAttribute("data-jianpu-hidden", "1");
    return p2;
  }

  if (p1 && p1.tagName && p1.tagName.toLowerCase() === "g") {
    p1.style.display = "none";
    p1.setAttribute("data-jianpu-hidden", "1");
    return p1;
  }

  node.style.display = "none";
  node.setAttribute("data-jianpu-hidden", "1");
  return node;
}

  function collectTopLeftHeaderTokens(svg) {
  const textNodes = Array.from(svg.querySelectorAll("text"));
  const tokens = [];

  for (const node of textNodes) {
    const raw = (node.textContent || "").trim();
    if (!raw) continue;

    let box;
    try {
      box = node.getBBox();
    } catch (_) {
      continue;
    }
    if (!box || box.width <= 0 || box.height <= 0) continue;

    // 只看首行左上角区域
    if (box.x > 260 || box.y > 140) continue;

    const text = raw
      .replace(/\s+/g, "")
      .replace(/♭/g, "b")
      .replace(/♯/g, "#");

    tokens.push({ node, box, raw, text });
  }

  return tokens;
}
  function hideTopLeftJianpuHeader(svg) {
  if (!svg || state.currentNotation !== "jianpu") return 0;

  const tokens = collectTopLeftHeaderTokens(svg);
  if (!tokens.length) return 0;

  let hiddenCount = 0;

  // 先找“1=A / 1=G / 1=C / 1=#F / 1=bA”这一类主 token
  const tonicTokens = tokens.filter(t =>
    /^1=[#b]?[A-G]m?$/.test(t.text) ||
    /^1=[A-G]m?$/.test(t.text)
  );

  // 再找单独 accidental token：♭ / ♯ / b / #
  const accidentalTokens = tokens.filter(t =>
    t.text === "b" || t.text === "#" || t.raw === "♭" || t.raw === "♯"
  );

  // 先隐藏 1=A 这种主 token
  tonicTokens.forEach(t => {
    if (t.box.x < 180 && t.box.y < 80) {
      hideNodeAndUsefulParent(t.node);
      hiddenCount++;
    }
  });

  // 只隐藏“贴着主 token”的那个 accidental
  tonicTokens.forEach(tonic => {
    accidentalTokens.forEach(acc => {
      const nearLeftHeader =
        acc.box.x >= tonic.box.x - 28 &&
        acc.box.x <= tonic.box.x + tonic.box.width + 22 &&
        Math.abs(acc.box.y - tonic.box.y) <= 18;

      if (nearLeftHeader) {
        hideNodeAndUsefulParent(acc.node);
      }
    });
  });

  return hiddenCount;
}

  function shiftFirstSystemLyrics(svg) {
    if (state.currentNotation !== "jianpu") return;

    const texts = Array.from(svg.querySelectorAll("text"));
    const lyricNodes = [];

    for (const node of texts) {
      const raw = (node.textContent || "").trim();
      if (!raw) continue;
      if (!/[\u3400-\u9FFF]/.test(raw)) continue;
      if (raw.length > 12) continue;

      let box;
      try {
        box = node.getBBox();
      } catch (_) {
        continue;
      }
      if (!box || box.width <= 0 || box.height <= 0) continue;
      if (box.x < 40 || box.x > 1500) continue;
      if (box.y < 120 || box.y > 320) continue;

      lyricNodes.push({ node, box });
    }

    if (!lyricNodes.length) return;

    const topMin = Math.min(...lyricNodes.map((x) => x.box.y));
    const firstLine = lyricNodes.filter((x) => Math.abs(x.box.y - topMin) < 12);

    for (const item of firstLine) {
      const node = item.node;
      const orig = node.getAttribute("transform");
      node.setAttribute("data-orig-transform", orig === null ? "" : orig);
      node.setAttribute("transform", `${orig ? `${orig} ` : ""}translate(0,18)`);
      node.setAttribute("data-lyric-shift", "1");
    }
  }

  function fixRenderedSvg() {
  const svg = el.alphaTabHost.querySelector("svg");
  if (!svg) return;

  resetSvgFixes(svg);

  if (state.currentNotation === "jianpu") {
    hideTopLeftJianpuHeader(svg);
    shiftFirstSystemLyrics(svg);
  }
}

  function init() {
    el.pathInput.value = buildPathFromQuery();
    syncFontSpacingUi();
    applyHostVisualScale();
    syncNotationUi();
    syncModeUi();
    bindEvents();
    loadScore();

    window.addEventListener("beforeunload", () => {
      destroyApi();
    });
  }

  init();
})();