/* global alphaTab */
const $ = (id) => document.getElementById(id);
const els = {
  q: $('q'), btnSearch: $('btnSearch'),
  btnPrev: $('btnPrev'), btnNext: $('btnNext'), btnPlay: $('btnPlay'),
  list: $('list'), pages: $('pages'),
  songTitle: $('songTitle'), songFile: $('songFile'),
  fontSize: $('fontSize'), fontSizeVal: $('fontSizeVal'),
  spacing: $('spacing'), spacingVal: $('spacingVal'),
  zoom: $('zoom'), zoomVal: $('zoomVal'),
  measureHost: $('measureHost'), playerHost: $('playerHost')
};

const A4 = { w: 794, h: 1123, pad: 36, safeBottom: 60 };

let songs = [];
let currentIndex = -1;

let playApi = null;
let playReady = false;
let soundFontReady = false;
let currentScoreBytes = null;
let currentState = null;

function norm(q){ return (q||'').trim().toUpperCase().replace(/\.GTZ$/,''); }

function base64ToU8(b64){
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

function debounce(fn, ms){
  let t=null;
  return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); };
}

async function loadIndex(){
  const res = await fetch('./songs/index.json', {cache:'no-store'});
  songs = await res.json();
  renderList();
}

function renderList(){
  els.list.innerHTML = '';
  songs.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'item' + (i===currentIndex ? ' active' : '');
    div.innerHTML = `<div class="id">${s.id}</div><div class="title">${s.title || s.file}</div>`;
    div.addEventListener('click', () => loadSongByIndex(i));
    els.list.appendChild(div);
  });
}

function setActiveIndex(i){
  currentIndex = i;
  [...els.list.children].forEach((c, idx)=>c.classList.toggle('active', idx===currentIndex));
}

function findSong(q){
  const key = norm(q);
  if(!key) return null;
  const idx = songs.findIndex(s => norm(s.id)===key || norm(s.file)===key);
  if(idx<0) return null;
  return { idx, song: songs[idx] };
}

function updateSliderLabels(){
  els.fontSizeVal.textContent = String(els.fontSize.value);
  els.spacingVal.textContent = (Number(els.spacing.value)/100).toFixed(2)+'×';
  els.zoomVal.textContent = String(els.zoom.value)+'%';
}

function applyStateToUI(state){
  const fontSizePx = state?.lyrics?.fontSizePx ?? state?.fontSizePx ?? 24;
  const spacingFactor = state?.lyrics?.spacingFactor ?? state?.spacingFactor ?? 1.0;
  const zoom = state?.view?.zoom ?? state?.zoom ?? 1.0;

  els.fontSize.value = String(Math.max(12, Math.min(48, Math.round(fontSizePx))));
  els.spacing.value = String(Math.max(50, Math.min(400, Math.round(spacingFactor*100))));
  els.zoom.value = String(Math.max(60, Math.min(140, Math.round(zoom*100))));
  updateSliderLabels();
}

function buildStateFromUI(){
  const fontSizePx = Number(els.fontSize.value);
  const spacingFactor = Number(els.spacing.value)/100;
  const zoom = Number(els.zoom.value)/100;

  const st = currentState ? structuredClone(currentState) : {};
  st.version = st.version ?? 1;
  st.view = st.view ?? {};
  st.view.layout = 'a4';
  st.view.page = {w:A4.w,h:A4.h,pad:A4.pad};
  st.view.zoom = zoom;

  st.lyrics = st.lyrics ?? {};
  st.lyrics.fontSizePx = fontSizePx;
  st.lyrics.spacingFactor = spacingFactor;

  st.tracks = st.tracks ?? {};
  st.tracks.selected = st.tracks.selected ?? (st.visibleTrackIndices ?? null);
  return st;
}

function buildAlphaTabSettingsForPage(state, startBar, barCount, forFirstPage){
  const st = state || {};
  const fontSizePx = st.lyrics?.fontSizePx ?? st.fontSizePx ?? 24;
  const spacingFactor = st.lyrics?.spacingFactor ?? st.spacingFactor ?? 1.0;
  const zoom = st.view?.zoom ?? st.zoom ?? 1.0;

  const selectedTracks = st.tracks?.selected ?? st.visibleTrackIndices ?? null;
  const paddingBetween = Math.max(0, Math.round((spacingFactor - 1) * 12));

  const s = {
    core: { logLevel: alphaTab.LogLevel.Error },
    display: {
      layoutMode: alphaTab.LayoutMode.Page,
      startBar,
      barCount,
      lyricLinesPaddingBetween: paddingBetween,
      resources: {}
    },
    player: { enablePlayer: false }
  };

  if (!forFirstPage) {
    s.display.hideElements = [
      'ScoreTitle','ScoreSubTitle','ScoreArtist','ScoreAlbum','ScoreWords',
      'ScoreMusic','ScoreCopyright','GuitarTuning','ChordDiagram','ChordDiagrams'
    ];
  }

  return { settings: s, selectedTracks, fontSizePx, zoom };
}

function applyLyricsFont(api, fontSizePx){
  const s = api.settings;
  s.display.resources = s.display.resources || {};
  if (!s.display.resources.elementFonts) s.display.resources.elementFonts = new Map();
  const Font = alphaTab.model?.Font;
  if (!Font) return;

  const font = new Font('Microsoft YaHei', fontSizePx,
    alphaTab.model.FontStyle?.Regular ?? 0,
    alphaTab.model.FontWeight?.Normal ?? 400
  );
  font.families = ['Microsoft YaHei','PingFang SC','Arial','sans-serif'];

  const NE = alphaTab.NotationElement;
  if (NE && NE.EffectLyrics != null) s.display.resources.elementFonts.set(NE.EffectLyrics, font);
}

function clearPages(){ els.pages.innerHTML=''; }

function makePageShell(pageNo){
  const page = document.createElement('div');
  page.className='page';
  const inner = document.createElement('div');
  inner.className='inner';
  page.appendChild(inner);
  els.pages.appendChild(page);
  return inner;
}

function waitForRender(api){
  return new Promise((resolve)=>{
    let done=false;
    const finish=()=>{
      if(done) return;
      done=true;
      requestAnimationFrame(()=>requestAnimationFrame(resolve));
    };
    api.renderFinished.on(finish);
    setTimeout(finish, 1500);
  });
}

function removeAlphaTabWatermark(root){
  const texts = root.querySelectorAll('text');
  for (const t of texts){
    const s = (t.textContent||'').trim().toLowerCase();
    if (s.includes('rendered by alphatab')) t.remove();
  }
}

async function measureHeight(scoreBytes, state, startBar, barCount, forFirstPage){
  els.measureHost.innerHTML='';
  const { settings, selectedTracks, fontSizePx, zoom } = buildAlphaTabSettingsForPage(state, startBar, barCount, forFirstPage);

  const holder = document.createElement('div');
  holder.style.width = `${A4.w - A4.pad*2}px`;
  holder.style.transformOrigin='top left';
  holder.style.transform = `scale(${zoom})`;
  els.measureHost.appendChild(holder);

  const api = new alphaTab.AlphaTabApi(holder, settings);
  applyLyricsFont(api, fontSizePx);

  await api.load(scoreBytes);
  const score = api.score;

  if (selectedTracks && Array.isArray(selectedTracks) && selectedTracks.length) api.renderScore(score, selectedTracks);
  else api.render();

  await waitForRender(api);
  const h = holder.scrollHeight || holder.getBoundingClientRect().height || 0;
  api.destroy();
  return h;
}

async function renderPageInto(innerEl, scoreBytes, state, startBar, barCount, forFirstPage){
  innerEl.innerHTML='';
  const { settings, selectedTracks, fontSizePx, zoom } = buildAlphaTabSettingsForPage(state, startBar, barCount, forFirstPage);

  const holder = document.createElement('div');
  holder.style.width = `${A4.w - A4.pad*2}px`;
  holder.style.transformOrigin='top left';
  holder.style.transform = `scale(${zoom})`;
  innerEl.appendChild(holder);

  const api = new alphaTab.AlphaTabApi(holder, settings);
  applyLyricsFont(api, fontSizePx);

  await api.load(scoreBytes);
  const score = api.score;

  if (selectedTracks && Array.isArray(selectedTracks) && selectedTracks.length) api.renderScore(score, selectedTracks);
  else api.render();

  await waitForRender(api);
  removeAlphaTabWatermark(holder);
  api.destroy();
}

async function ensurePlayApiLoaded(scoreBytes){
  if(!playApi){
    const settings = {
      core:{ logLevel: alphaTab.LogLevel.Error },
      player:{
        enablePlayer:true,
        soundFont:"https://cdn.jsdelivr.net/npm/@coderline/alphatab@latest/dist/soundfont/sonivox.sf2"
      },
      display:{ layoutMode: alphaTab.LayoutMode.Page }
    };
    playApi = new alphaTab.AlphaTabApi(els.playerHost, settings);
  }
  if(currentScoreBytes !== scoreBytes){
    currentScoreBytes = scoreBytes;
    await playApi.load(scoreBytes);
  }
  playReady = true;
}

async function ensureSoundFontReady(){
  if(!playReady || soundFontReady) return;
  try{
    playApi.loadSoundFontFromUrl(
      "https://cdn.jsdelivr.net/npm/@coderline/alphatab@latest/dist/soundfont/sonivox.sf2",
      false
    );
    soundFontReady = true;
  }catch(e){
    console.warn('SoundFont load failed', e);
  }
}

async function renderPagedA4(scoreBytes, state){
  clearPages();
  if(!scoreBytes) return;

  await ensurePlayApiLoaded(scoreBytes);
  const totalBars = playApi?.score?.masterBars?.length ?? null;

  if(!totalBars || totalBars<=0){
    const inner = makePageShell(1);
    await renderPageInto(inner, scoreBytes, state, 0, -1, true);
    return;
  }

  const maxContentH = A4.h - (A4.pad*2) - A4.safeBottom;
  let startBar=0;
  let pageNo=1;

  while(startBar < totalBars){
    let lo=1, hi=totalBars-startBar, best=1;
    while(lo<=hi){
      const mid=Math.floor((lo+hi)/2);
      const h=await measureHeight(scoreBytes, state, startBar, mid, pageNo===1);
      if(h<=maxContentH){ best=mid; lo=mid+1; }
      else hi=mid-1;
    }
    const inner = makePageShell(pageNo);
    await renderPageInto(inner, scoreBytes, state, startBar, best, pageNo===1);
    startBar += best;
    pageNo += 1;
    if(best<=0) break;
  }
}

async function loadSongByIndex(i){
  const s=songs[i];
  if(!s) return;
  setActiveIndex(i);
  els.songTitle.textContent = s.title || s.id;
  els.songFile.textContent = s.file;

  const res = await fetch(`./songs/${s.file}`, {cache:'no-store'});
  const gtz = await res.json();

  const gpBase64 = gtz.gpBase64 || gtz.gp || gtz.scoreBase64 || gtz.data;
  const state = gtz.state || gtz.view || gtz.settings || {};
  if(!gpBase64){ alert('GTZ 里找不到 gpBase64 字段'); return; }

  currentState = state;
  applyStateToUI(state);

  const bytes = base64ToU8(gpBase64);

  await renderPagedA4(bytes, buildStateFromUI());
  await ensurePlayApiLoaded(bytes);

  els.btnPlay.textContent='▶︎';
}

async function doSearch(){
  const found=findSong(els.q.value);
  if(!found){ alert('没找到：请确认 songs/index.json 里存在这个 id/file'); return; }
  await loadSongByIndex(found.idx);
}

async function nextSong(){
  if(!songs.length) return;
  await loadSongByIndex((currentIndex+1)%songs.length);
}
async function prevSong(){
  if(!songs.length) return;
  await loadSongByIndex((currentIndex-1+songs.length)%songs.length);
}

async function togglePlay(){
  if(!playApi) return;
  await ensureSoundFontReady();
  const player = playApi.player;
  if(!player){ alert('player 未初始化（检查 alphaTab 版本/设置）'); return; }

  if(player.isPlaying){ player.pause(); els.btnPlay.textContent='▶︎'; }
  else { player.play(); els.btnPlay.textContent='⏸'; }
}

const rerenderDebounced = debounce(async ()=>{
  if(!currentScoreBytes) return;
  await renderPagedA4(currentScoreBytes, buildStateFromUI());
}, 250);

function wireUI(){
  updateSliderLabels();
  els.btnSearch.addEventListener('click', doSearch);
  els.q.addEventListener('keydown', (e)=>{ if(e.key==='Enter') doSearch(); });
  els.btnNext.addEventListener('click', nextSong);
  els.btnPrev.addEventListener('click', prevSong);
  els.btnPlay.addEventListener('click', togglePlay);

  els.fontSize.addEventListener('input', ()=>{ updateSliderLabels(); rerenderDebounced(); });
  els.spacing.addEventListener('input', ()=>{ updateSliderLabels(); rerenderDebounced(); });
  els.zoom.addEventListener('input', ()=>{ updateSliderLabels(); rerenderDebounced(); });
}

(async function main(){
  if(!window.alphaTab){ alert('alphaTab 未加载（请检查网络/CDN）'); return; }
  wireUI();
  await loadIndex();
  if(songs.length) await loadSongByIndex(0);
})();
