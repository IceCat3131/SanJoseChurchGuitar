(() => {
  "use strict";

  let api = null;
  let gtzData = null;
  let currentNotation = "staff";
  let currentObjectUrl = null;

  const els = {
    score: document.getElementById("score"),
    statusText: document.getElementById("statusText"),
    songMeta: document.getElementById("songMeta"),
    btnStaff: document.getElementById("btnStaff"),
    btnJianpu: document.getElementById("btnJianpu"),
    btnReload: document.getElementById("btnReload"),
  };

  function setStatus(text, isError = false) {
    els.statusText.textContent = text;
    els.statusText.classList.toggle("error", !!isError);
  }

  function setMeta(text) {
    els.songMeta.textContent = text || "";
  }

  function getQueryParams() {
    const url = new URL(window.location.href);
    return {
      book: (url.searchParams.get("book") || "c").trim(),
      no: (url.searchParams.get("no") || "1").trim(),
      file: (url.searchParams.get("file") || "").trim(),
    };
  }

  function padNo(no) {
    const n = parseInt(no, 10);
    if (Number.isNaN(n) || n < 1) return "0001";
    return String(n).padStart(4, "0");
  }

  function buildDefaultGtzPath() {
    const { book, no, file } = getQueryParams();
    if (file) {
      if (file.startsWith("./") || file.startsWith("/") || file.startsWith("assets/")) {
        return file.startsWith("./") || file.startsWith("/") ? file : `./${file}`;
      }
      return `./assets/${book}/${file}`;
    }

    const p = padNo(no);
    if (book === "ts") {
      return `./assets/ts/ts${p}_cn_g.gtz`;
    }
    return `./assets/c/c${p}_cn_g.gtz`;
  }

  function decodeBase64Utf8(base64) {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  }

  async function fetchText(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`读取失败: ${res.status} ${res.statusText}`);
    }
    return await res.text();
  }

  async function loadGtz() {
    const gtzPath = buildDefaultGtzPath();
    setStatus(`正在读取 GTZ：${gtzPath}`);
    const raw = await fetchText(gtzPath);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`GTZ JSON 解析失败: ${err.message}`);
    }

    const scoreBase64 =
      parsed?.score?.data ||
      parsed?.scoreBase64 ||
      "";

    if (!scoreBase64) {
      throw new Error("GTZ 中未找到 score.data 或 scoreBase64");
    }

    let xml;
    try {
      xml = decodeBase64Utf8(scoreBase64);
    } catch (err) {
      throw new Error(`GTZ 内乐谱 base64 解码失败: ${err.message}`);
    }

    if (!xml.includes("<score-partwise") && !xml.includes("<score-timewise")) {
      throw new Error("解码后的内容不像 MusicXML");
    }

    gtzData = parsed;

    const title =
      parsed?.meta?.title ||
      parsed?.meta?.fullTitle ||
      parsed?.state?.title ||
      "未命名乐谱";

    const subtitle =
      parsed?.meta?.subtitle ||
      "";

    setMeta(subtitle ? `${title} · ${subtitle}` : title);

    return xml;
  }

  function revokeOldObjectUrl() {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
  }

  function makeXmlObjectUrl(xmlText) {
    revokeOldObjectUrl();
    const blob = new Blob([xmlText], { type: "application/vnd.recordare.musicxml+xml;charset=utf-8" });
    currentObjectUrl = URL.createObjectURL(blob);
    return currentObjectUrl;
  }

  function destroyApi() {
    if (api) {
      try {
        api.destroy();
      } catch (_) {}
      api = null;
    }
    revokeOldObjectUrl();
    els.score.innerHTML = "";
  }

  function getTracks(score) {
    return Array.isArray(score?.tracks) ? score.tracks : [];
  }

  function getStaves(track) {
    return Array.isArray(track?.staves) ? track.staves : [];
  }

  function isTabStaff(staff) {
    return !!(
      staff?.isTabStaff ||
      staff?.showTab ||
      staff?.standardNotationOnly === false && staff?.showStandardNotation === false
    );
  }

  function isPercussionTrack(track) {
    return !!track?.isPercussion;
  }

  function detectMelodyTrackIndex(score) {
    const tracks = getTracks(score);

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      if (isPercussionTrack(track)) continue;

      const staves = getStaves(track);
      const hasNonTab = staves.some(staff => !isTabStaff(staff));
      const hasTab = staves.some(staff => isTabStaff(staff));

      if (hasNonTab && !hasTab) {
        return i;
      }
    }

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      if (isPercussionTrack(track)) continue;

      const staves = getStaves(track);
      if (staves.some(staff => !isTabStaff(staff))) {
        return i;
      }
    }

    return 0;
  }

  function applyNotationToScore(score, mode) {
    const tracks = getTracks(score);
    const melodyTrackIndex = detectMelodyTrackIndex(score);

    tracks.forEach((track, trackIndex) => {
      const staves = getStaves(track);

      staves.forEach((staff) => {
        if (isTabStaff(staff)) {
          return;
        }

        if (trackIndex === melodyTrackIndex) {
          staff.showStandardNotation = (mode === "staff");
          staff.showNumbered = (mode === "jianpu");

          if (mode === "jianpu") {
            if ("showKeySignature" in staff) {
              staff.showKeySignature = false;
            }
          }
        } else {
          staff.showStandardNotation = true;
          staff.showNumbered = false;
        }
      });
    });
  }

  function renderByCurrentMode() {
    if (!api || !api.score) return;
    applyNotationToScore(api.score, currentNotation);
    api.render();
  }

  function matchesTopLeftJianpuHeaderText(text) {
    const s = (text || "").replace(/\s+/g, "").trim();
    if (!s) return false;

    return /^1[=#b♭♯]?[A-G]$/.test(s) ||
           /^1[=#b♭♯]?[A-G]m$/.test(s) ||
           /^1=[A-G]$/.test(s) ||
           /^1=[#b♭♯]?[A-G]$/.test(s);
  }

  function hideTopLeftJianpuHeader(svg) {
    if (!svg) return;

    const textNodes = Array.from(svg.querySelectorAll("text"));
    const svgBox = svg.getBoundingClientRect();
    if (!svgBox || !svgBox.width || !svgBox.height) return;

    let hiddenAny = false;

    for (const node of textNodes) {
      const text = (node.textContent || "").trim();
      if (!matchesTopLeftJianpuHeaderText(text)) continue;

      const box = node.getBoundingClientRect();
      if (!box.width && !box.height) continue;

      const relLeft = box.left - svgBox.left;
      const relTop = box.top - svgBox.top;

      const inTopLeft =
        relLeft >= 0 &&
        relTop >= 0 &&
        relLeft < 260 &&
        relTop < 140;

      if (!inTopLeft) continue;

      const parent = node.closest("g");
      if (parent) {
        parent.style.display = "none";
      } else {
        node.style.display = "none";
      }
      hiddenAny = true;
    }

    if (hiddenAny) {
      svg.dataset.jianpuHeaderHidden = "1";
    }
  }

  function nudgeFirstLyricLineDown(svg) {
    if (!svg) return;

    const textNodes = Array.from(svg.querySelectorAll("text"));
    const svgBox = svg.getBoundingClientRect();
    if (!svgBox || !svgBox.height) return;

    const lyricCandidates = [];

    for (const node of textNodes) {
      const txt = (node.textContent || "").trim();
      if (!txt) continue;
      if (txt.length > 8) continue;

      const box = node.getBoundingClientRect();
      if (!box.width && !box.height) continue;

      const relTop = box.top - svgBox.top;
      const relLeft = box.left - svgBox.left;

      const hasChinese = /[\u4e00-\u9fff]/.test(txt);
      if (!hasChinese) continue;

      if (relTop > 40 && relTop < 260 && relLeft > 10) {
        lyricCandidates.push({ node, top: relTop });
      }
    }

    if (!lyricCandidates.length) return;

    const firstBandTop = Math.min(...lyricCandidates.map(x => x.top));
    const firstLine = lyricCandidates.filter(x => Math.abs(x.top - firstBandTop) < 14);

    firstLine.forEach(({ node }) => {
      const parent = node.closest("g");
      const target = parent || node;

      const oldTransform = target.getAttribute("transform") || "";
      if (oldTransform.includes("translate(") && target.dataset.lyricNudged !== "1") {
        target.setAttribute("transform", `${oldTransform} translate(0,10)`);
      } else if (target.dataset.lyricNudged !== "1") {
        target.setAttribute("transform", `translate(0,10)`);
      }
      target.dataset.lyricNudged = "1";
    });
  }

  function postFixRenderedSvg() {
    if (currentNotation !== "jianpu") return;

    const svg = els.score.querySelector("svg");
    if (!svg) return;

    hideTopLeftJianpuHeader(svg);
    nudgeFirstLyricLineDown(svg);
  }

  function bindUi() {
    els.btnStaff.addEventListener("click", () => {
      currentNotation = "staff";
      renderByCurrentMode();
      updateButtons();
      setTimeout(postFixRenderedSvg, 60);
      setTimeout(postFixRenderedSvg, 180);
    });

    els.btnJianpu.addEventListener("click", () => {
      currentNotation = "jianpu";
      renderByCurrentMode();
      updateButtons();
      setTimeout(postFixRenderedSvg, 60);
      setTimeout(postFixRenderedSvg, 180);
      setTimeout(postFixRenderedSvg, 360);
    });

    els.btnReload.addEventListener("click", async () => {
      await boot();
    });
  }

  function updateButtons() {
    els.btnStaff.classList.toggle("active", currentNotation === "staff");
    els.btnJianpu.classList.toggle("active", currentNotation === "jianpu");
  }

  async function createAlphaTab(xmlText) {
    destroyApi();

    const fileUrl = makeXmlObjectUrl(xmlText);
    setStatus("正在初始化 alphaTab...");

    const scriptUrl = new URL("./assets/alphatab/alphaTab.js", window.location.href).toString();

    api = new alphaTab.AlphaTabApi(els.score, {
      file: fileUrl,
      core: {
        useWorkers: false,
        scriptFile: scriptUrl
      }
    });

    api.scoreLoaded.on((score) => {
      try {
        applyNotationToScore(score, currentNotation);
      } catch (err) {
        console.error(err);
      }
      setStatus("乐谱加载成功");
      updateButtons();

      setTimeout(postFixRenderedSvg, 60);
      setTimeout(postFixRenderedSvg, 180);
      setTimeout(postFixRenderedSvg, 360);
    });

    api.renderFinished.on(() => {
      setTimeout(postFixRenderedSvg, 30);
      setTimeout(postFixRenderedSvg, 120);
    });

    api.error.on((err) => {
      console.error(err);
      setStatus(`alphaTab 错误：${err?.message || err}`, true);
    });
  }

  async function boot() {
    try {
      setStatus("正在加载 GTZ 与乐谱...");
      const xmlText = await loadGtz();
      await createAlphaTab(xmlText);
    } catch (err) {
      console.error(err);
      setStatus(err.message || String(err), true);
    }
  }

  bindUi();
  updateButtons();
  boot();

  window.addEventListener("beforeunload", () => {
    destroyApi();
  });
})();