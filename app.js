(function () {
  "use strict";

  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  const state = {
    api: null,
    gtz: null,
    xmlBlobUrl: null,
    currentNotation: "jianpu", // ⭐ 默认打开就是简谱
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
    notationBtn: qs("#notationBtn"),
    staffOption: qs("#staffOption"),
    jianpuOption: qs("#jianpuOption")
  };

  function buildPathFromQuery() {
    const p = new URLSearchParams(location.search);
    const book = p.get("book") || "c";
    const no = String(parseInt(p.get("no") || "1", 10)).padStart(4, "0");
    return book === "ts"
      ? `./assets/ts/ts${no}_cn_g.gtz`
      : `./assets/c/c${no}_cn_g.gtz`;
  }

  function decodeBase64ToBlobUrl(base64Data) {
    const binary = atob(base64Data);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/vnd.recordare.musicxml+xml" });
    state.xmlBlobUrl = URL.createObjectURL(blob);
    return state.xmlBlobUrl;
  }

  function destroyApi() {
    if (state.api) {
      try { state.api.destroy(); } catch {}
      state.api = null;
    }
    if (state.xmlBlobUrl) {
      URL.revokeObjectURL(state.xmlBlobUrl);
      state.xmlBlobUrl = null;
    }
    el.alphaTabHost.innerHTML = "";
  }

  function staffLooksLikeTab(staff) {
    return (
      String(staff?.clef).toLowerCase() === "tab" ||
      staff?.stringCount >= 6 ||
      staff?.staffLines === 6
    );
  }

  function detectNotationTrackIndices(score) {
    for (let i = 0; i < score.tracks.length; i++) {
      const t = score.tracks[i];
      const hasTab = t.staves.some(s => staffLooksLikeTab(s));
      const hasStd = t.staves.some(s => !staffLooksLikeTab(s));
      if (hasStd && !hasTab) return [i];
    }
    return [0];
  }

  function applyNotationToScore(score) {
    const idxs = detectNotationTrackIndices(score);
    const jianpu = state.currentNotation === "jianpu";

    score.tracks.forEach((track, i) => {
      track.staves.forEach(staff => {

        if (staffLooksLikeTab(staff)) {
          staff.showNumbered = false;
          staff.showStandardNotation = false;
          return;
        }

        if (idxs.includes(i)) {
          staff.showNumbered = jianpu;
          staff.showStandardNotation = !jianpu;

          if (jianpu && "showKeySignature" in staff) {
            staff.showKeySignature = false;
          }
        } else {
          staff.showNumbered = false;
          staff.showStandardNotation = true;
        }
      });
    });
  }

  function hideNode(node) {
    const g = node.closest("g");
    (g || node).style.display = "none";
    (g || node).setAttribute("data-jianpu-hidden", "1");
  }

  function hideTopLeftJianpuHeader(svg) {
    if (state.currentNotation !== "jianpu") return;

    const texts = [...svg.querySelectorAll("text")];

    // 找 1=A
    const tonic = texts.find(n => {
      const t = (n.textContent || "").replace(/\s/g, "");
      if (!/^1=[#b]?[A-G]$/.test(t)) return false;
      const b = n.getBBox();
      return b.x < 180 && b.y < 80;
    });

    if (!tonic) return;

    const tbox = tonic.getBBox();
    hideNode(tonic);

    // 找旁边 ♭
    const ats = [...svg.querySelectorAll("g.at")];

    ats.forEach(g => {
      const txt = (g.textContent || "").trim();
      if (txt !== "♭" && txt !== "♯") return;

      const b = g.getBBox();

      const near =
        b.x > tbox.x - 30 &&
        b.x < tbox.x + 60 &&
        Math.abs(b.y - tbox.y) < 20;

      if (near) hideNode(g);
    });
  }

  function shiftLyrics(svg) {
    if (state.currentNotation !== "jianpu") return;

    const nodes = [...svg.querySelectorAll("text")]
      .map(n => ({ n, b: n.getBBox() }))
      .filter(x =>
        /[\u4e00-\u9fff]/.test(x.n.textContent) &&
        x.b.y < 300 && x.b.y > 120
      );

    if (!nodes.length) return;

    const minY = Math.min(...nodes.map(x => x.b.y));

    nodes
      .filter(x => Math.abs(x.b.y - minY) < 10)
      .forEach(x => {
        const t = x.n.getAttribute("transform") || "";
        x.n.setAttribute("transform", `${t} translate(0,18)`);
      });
  }

  function fixRenderedSvg() {
    const svg = el.alphaTabHost.querySelector("svg");
    if (!svg) return;

    svg.querySelectorAll('[data-jianpu-hidden]').forEach(n => {
      n.style.display = "";
      n.removeAttribute("data-jianpu-hidden");
    });

    hideTopLeftJianpuHeader(svg);
    shiftLyrics(svg);
  }

  function render() {
    if (!state.api) return;
    applyNotationToScore(state.api.score);
    state.api.render();
    setTimeout(fixRenderedSvg, 100);
  }

  async function load() {
    destroyApi();

    const path = buildPathFromQuery();
    const pkg = await fetch(path).then(r => r.json());

    const blob = decodeBase64ToBlobUrl(pkg.score.data);

    state.api = new alphaTab.AlphaTabApi(el.alphaTabHost, {
      file: blob,
      core: { useWorkers: false }
    });

    state.api.scoreLoaded.on(() => {
      render();
    });

    state.api.renderFinished.on(() => {
      fixRenderedSvg();
    });
  }

  el.staffOption.onclick = () => {
    state.currentNotation = "staff";
    render();
  };

  el.jianpuOption.onclick = () => {
    state.currentNotation = "jianpu";
    render();
  };

  load();

})();