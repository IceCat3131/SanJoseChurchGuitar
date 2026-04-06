(function(){
  const SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const INDEX = {C:0,'B#':0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,Fb:4,F:5,'E#':5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11,Cb:11};

  // 12 个 pitch class 的代表名。避免同时放入等音重复项（如 F# 和 Gb）。
  const FAMILY_ROOTS = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const OPEN_FAMILY_PRIORITY = ['G','C','D','A','E','F','Bb','Eb','Ab','Db','B','Gb'];

  const DEFAULT_SHAPES = {
    C:['x',3,2,0,1,0], D:['x','x',0,2,3,2], E:[0,2,2,1,0,0], F:[1,3,3,2,1,1], G:[3,2,0,0,0,3], A:['x',0,2,2,2,0], B:['x',2,4,4,4,2],
    Am:['x',0,2,2,1,0], Bm:['x',2,4,4,3,2], Cm:['x',3,5,5,4,3], Dm:['x','x',0,2,3,1], Em:[0,2,2,0,0,0], Fm:[1,3,3,1,1,1], 'F#m':[2,4,4,2,2,2], Gm:[3,5,5,3,3,3], 'G#m':[4,6,6,4,4,4], 'C#m':['x',4,6,6,5,4],
    'A7':['x',0,2,0,2,0], 'B7':['x',2,1,2,0,2], 'C7':['x',3,2,3,1,0], 'D7':['x','x',0,2,1,2], 'E7':[0,2,0,1,0,0], 'F7':[1,3,1,2,1,1], 'G7':[3,2,0,0,0,1],
    'Amaj7':['x',0,2,1,2,0], 'Cmaj7':['x',3,2,0,0,0], 'Dmaj7':['x','x',0,2,2,2], 'Emaj7':[0,2,1,1,0,0], 'Fmaj7':[1,3,2,2,1,0], 'Gmaj7':[3,2,0,0,0,2],
    'Am7':['x',0,2,0,1,0], 'Bm7':['x',2,4,2,3,2], 'Cm7':['x',3,5,3,4,3], 'Dm7':['x','x',0,2,1,1], 'Em7':[0,2,2,0,3,0], 'Fm7':[1,3,1,1,1,1], 'Gm7':[3,5,3,3,3,3], 'C#m7':['x',4,6,4,5,4], 'F#m7':[2,4,2,2,2,2], 'G#m7':[4,6,4,4,4,4],
    'Asus4':['x',0,2,2,3,0], 'Dsus4':['x','x',0,2,3,3], 'Esus4':[0,2,2,2,0,0], 'Gsus4':[3,3,0,0,1,3], 'Csus4':['x',3,3,0,1,1], 'Fsus4':[1,3,3,3,1,1]
  };

  function idx(name){ return INDEX[name] ?? null; }
  function prefersFlatsFromKeyName(keyName){
    const i = idx(String(keyName || '').trim());
    if(i == null) return true;
    return new Set([1,3,5,6,8,10,11]).has(i); // Db Eb F Gb Ab Bb B/Cb side
  }
  function normalizeNote(note, preferFlats){
    const i = idx(note);
    if(i == null) return note;
    return (preferFlats ? FLAT : SHARP)[i];
  }
  function add(note, semis, preferFlats){
    const i = idx(note); if(i == null) return note;
    const n = (i + (semis % 12) + 12) % 12;
    return (preferFlats ? FLAT : SHARP)[n];
  }
  function parseChord(symbol){
    const raw = String(symbol || '').trim();
    const m = raw.match(/^([A-G](?:#|b)?)([^/]*?)(?:\/([A-G](?:#|b)?))?$/);
    if(!m) return null;
    return { raw, root:m[1], quality:m[2] || '', bass:m[3] || '' };
  }
  function formatChord(parts){
    if(!parts) return '';
    return parts.root + (parts.quality || '') + (parts.bass ? '/' + parts.bass : '');
  }
  function shiftChord(symbol, semitones, preferFlats){
    const p = parseChord(symbol); if(!p) return String(symbol || '');
    return formatChord({ root:add(p.root,semitones,preferFlats), quality:p.quality, bass:p.bass ? add(p.bass,semitones,preferFlats) : '' });
  }
  function respellChord(symbol, preferFlats){
    const p = parseChord(symbol); if(!p) return String(symbol || '');
    return formatChord({ root:normalizeNote(p.root, preferFlats), quality:p.quality, bass:p.bass ? normalizeNote(p.bass, preferFlats) : '' });
  }
  function respellChordForKey(symbol, keyName){
    return respellChord(symbol, prefersFlatsFromKeyName(keyName));
  }
  function respellChordListForKey(chords, keyName){
    return (chords || []).map((c)=>respellChordForKey(c, keyName));
  }
  function penaltyForChord(ch){
    if(!ch) return 2;
    const q = ch.quality || '';
    if(/dim|aug|add9|sus2|6|9|11|13/i.test(q)) return 2.2;
    if(/sus4|maj7|m7|7/i.test(q)) return 1.1;
    return 0.2;
  }
  function uniqueChordSymbols(chords){
    const out=[]; const seen=new Set();
    (chords||[]).forEach((c)=>{ const s=String(c||'').trim(); if(s && !seen.has(s)){ seen.add(s); out.push(s); } });
    return out;
  }
  function enharmonicSymbol(symbol){
    const p = parseChord(symbol); if(!p) return symbol;
    return formatChord({
      root: respellChord(p.root, !prefersFlatsFromKeyName(p.root)),
      quality: p.quality,
      bass: p.bass ? respellChord(p.bass, !prefersFlatsFromKeyName(p.bass)) : ''
    });
  }
  function findShapeForChord(symbol, preferFlats){
    const p = parseChord(symbol); if(!p) return null;
    const normalized = formatChord({ root:normalizeNote(p.root, preferFlats), quality:p.quality, bass:'' });
    const alt = formatChord({ root:normalizeNote(p.root, !preferFlats), quality:p.quality, bass:'' });
    return DEFAULT_SHAPES[normalized] || DEFAULT_SHAPES[alt] || DEFAULT_SHAPES[normalizeNote(p.root, preferFlats)] || DEFAULT_SHAPES[normalizeNote(p.root, !preferFlats)] || null;
  }

  function buildFamilyChords(family, preferFlats){
    if(family === 'Gb') return ['Gb','Cb','Db','Db7'];
    if(family === 'Cb') return ['Cb','Fb','Gb','Gb7'];
    const base = [family, add(family, 5, preferFlats), add(family, 7, preferFlats)]; // I IV V
    const v7 = add(family, 7, preferFlats) + '7';
    return [...base, v7];
  }

  function buildShapeMap(chords, displayDelta, targetKey){
    const preferFlats = prefersFlatsFromKeyName(targetKey);
    const map = {};
    (chords || []).forEach((symbol) => {
      const shifted = respellChordForKey(shiftChord(symbol, displayDelta, preferFlats), targetKey);
      const shape = findShapeForChord(shifted, preferFlats);
      map[symbol] = { displayChord: shifted, shape };
    });
    return map;
  }

  function familyPriorityScore(family){
    const i = OPEN_FAMILY_PRIORITY.indexOf(family);
    return i === -1 ? 1.5 : i * 0.08;
  }

  function buildScheme(opts){
    const { family, capo, originalChords, targetConcertKey } = opts;
    const preferFlats = prefersFlatsFromKeyName(targetConcertKey);
    const displayDelta = -capo;
    const familyDisplay = normalizeNote(family, preferFlats);
    const shapeMap = buildShapeMap(originalChords, displayDelta, targetConcertKey);
    const chordMap = {};
    (originalChords || []).forEach((symbol)=>{
      chordMap[symbol] = shapeMap[symbol]?.displayChord || respellChordForKey(shiftChord(symbol, displayDelta, preferFlats), targetConcertKey);
    });
    const familyChords = buildFamilyChords(familyDisplay, preferFlats);
    const previewChords = familyChords.slice();
    const capoBaseScore = {2:0,3:0.2,4:0.4,1:0.8,5:1.0,0:1.3,6:1.5};
    let score = capoBaseScore.hasOwnProperty(capo) ? capoBaseScore[capo] : Math.abs(capo - 2);
    return {
      family: familyDisplay,
      familyInternal: family,
      capo,
      score: Math.round(score * 100) / 100,
      targetConcertKey,
      displayDelta,
      chordMap,
      shapeMap,
      familyChords,
      previewChords,
      summary: `${familyDisplay}组 / CP${capo}`
    };
  }

  function generateSchemes(ctx){
    const originalKey = ctx.originalKey || 'C';
    const targetConcertKey = add(originalKey, ctx.transpose || 0, prefersFlatsFromKeyName(originalKey));
    const targetIdx = idx(targetConcertKey);
    if(targetIdx == null) return [];
    const originalChords = uniqueChordSymbols(ctx.originalChords);
    const out=[];
    for(let capo=0; capo<=6; capo++){
      const family = normalizeNote(add(targetConcertKey, -capo, prefersFlatsFromKeyName(targetConcertKey)), prefersFlatsFromKeyName(targetConcertKey));
      out.push(buildScheme({ family, capo, originalChords, targetConcertKey }));
    }
    out.sort((a,b)=>a.score-b.score);
    return out.slice(0,3);
  }

  window.prefersFlatsFromKeyName = window.prefersFlatsFromKeyName || prefersFlatsFromKeyName;
  window.SchemeEngine = {
    parseChord,
    shiftChord,
    respellChord,
    respellChordForKey,
    respellChordListForKey,
    prefersFlatsFromKeyName,
    generateSchemes,
    buildScheme,
    uniqueChordSymbols,
    FAMILY_ROOTS
  };
})();
