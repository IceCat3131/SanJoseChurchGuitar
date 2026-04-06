(function(){
  const SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const INDEX = {
    C:0,'B#':0,
    'C#':1,Db:1,
    D:2,
    'D#':3,Eb:3,
    E:4,Fb:4,
    F:5,'E#':5,
    'F#':6,Gb:6,
    G:7,
    'G#':8,Ab:8,
    A:9,
    'A#':10,Bb:10,
    B:11,Cb:11
  };

  const OPEN_FAMILY_ROOTS = ['G','C','D','A','E','F','Bb','Eb','Ab','Db'];
  const FAMILY_ROOTS = ['C','G','D','A','E','F','Bb','Eb','Ab','Db','B','Gb'];
  const FAMILY_CHORDS = {
    C:['C','Dm','Em','F','G','Am','Bdim'],
    G:['G','Am','Bm','C','D','Em','F#dim'],
    D:['D','Em','F#m','G','A','Bm','C#dim'],
    A:['A','Bm','C#m','D','E','F#m','G#dim'],
    E:['E','F#m','G#m','A','B','C#m','D#dim'],
    F:['F','Gm','Am','Bb','C','Dm','Edim'],
    Bb:['Bb','Cm','Dm','Eb','F','Gm','Adim'],
    Eb:['Eb','Fm','Gm','Ab','Bb','Cm','Ddim'],
    Ab:['Ab','Bbm','Cm','Db','Eb','Fm','Gdim'],
    Db:['Db','Ebm','Fm','Gb','Ab','Bbm','Cdim'],
    B:['B','C#m','D#m','E','F#','G#m','A#dim'],
    Gb:['Gb','Abm','Bbm','Cb','Db','Ebm','Fdim']
  };

  const DEFAULT_SHAPES = {
    C:['x',3,2,0,1,0], D:['x','x',0,2,3,2], E:[0,2,2,1,0,0], F:[1,3,3,2,1,1], G:[3,2,0,0,0,3], A:['x',0,2,2,2,0], B:['x',2,4,4,4,2],
    Am:['x',0,2,2,1,0], Bm:['x',2,4,4,3,2], Cm:['x',3,5,5,4,3], Dm:['x','x',0,2,3,1], Em:[0,2,2,0,0,0], Fm:[1,3,3,1,1,1], 'F#m':[2,4,4,2,2,2], Gm:[3,5,5,3,3,3], 'G#m':[4,6,6,4,4,4], 'C#m':['x',4,6,6,5,4], 'D#m':['x',6,8,8,7,6],
    'A7':['x',0,2,0,2,0], 'B7':['x',2,1,2,0,2], 'C7':['x',3,2,3,1,0], 'D7':['x','x',0,2,1,2], 'E7':[0,2,0,1,0,0], 'F7':[1,3,1,2,1,1], 'G7':[3,2,0,0,0,1],
    'Amaj7':['x',0,2,1,2,0], 'Bmaj7':['x',2,4,3,4,2], 'Cmaj7':['x',3,2,0,0,0], 'Dmaj7':['x','x',0,2,2,2], 'Emaj7':[0,2,1,1,0,0], 'Fmaj7':[1,3,2,2,1,0], 'Gmaj7':[3,2,0,0,0,2],
    'Am7':['x',0,2,0,1,0], 'Bm7':['x',2,4,2,3,2], 'Cm7':['x',3,5,3,4,3], 'Dm7':['x','x',0,2,1,1], 'Em7':[0,2,2,0,3,0], 'Fm7':[1,3,1,1,1,1], 'Gm7':[3,5,3,3,3,3], 'C#m7':['x',4,6,4,5,4], 'D#m7':['x',6,8,6,7,6], 'F#m7':[2,4,2,2,2,2], 'G#m7':[4,6,4,4,4,4],
    'Asus4':['x',0,2,2,3,0], 'Dsus4':['x','x',0,2,3,3], 'Esus4':[0,2,2,2,0,0], 'Gsus4':[3,3,0,0,1,3], 'Csus4':['x',3,3,0,1,1], 'Fsus4':[1,3,3,3,1,1]
  };

  const FLAT_KEYS = new Set(['F','Bb','Eb','Ab','Db','Gb','Cb']);
  const SHARP_KEYS = new Set(['G','D','A','E','B','F#','C#']);
  const ENHARMONIC_ROOTS = {
    'C#':['Db'],'Db':['C#'],
    'D#':['Eb'],'Eb':['D#'],
    'F#':['Gb'],'Gb':['F#'],
    'G#':['Ab'],'Ab':['G#'],
    'A#':['Bb'],'Bb':['A#'],
    'B':['Cb'],'Cb':['B'],
    'E':['Fb'],'Fb':['E'],
    'F':['E#'],'E#':['F'],
    'C':['B#'],'B#':['C']
  };

  function idx(name){ return INDEX[String(name || '').trim()] ?? null; }

  function normalizeKeyName(keyName){
    let s = String(keyName || '').trim();
    if(!s) return 'C';
    s = s.replace(/^([b#])([A-Ga-g])$/, (_, accidental, letter) => letter.toUpperCase() + accidental);
    s = s.replace(/^([A-Ga-g])([b#])$/, (_, letter, accidental) => letter.toUpperCase() + accidental);
    s = s.replace(/^([A-Ga-g])$/, (_, letter) => letter.toUpperCase());
    s = s.replace(/^([A-Ga-g])m$/, (_, letter) => letter.toUpperCase() + 'm');
    s = s.replace(/^([A-Ga-g])([b#])m$/, (_, letter, accidental) => letter.toUpperCase() + accidental + 'm');
    return s;
  }

  function keyUsesFlats(keyName){
    const normalized = normalizeKeyName(keyName).replace(/m$/, '');
    if(FLAT_KEYS.has(normalized)) return true;
    if(SHARP_KEYS.has(normalized)) return false;
    if(normalized.includes('b')) return true;
    if(normalized.includes('#')) return false;
    return false;
  }

  function noteNameForIndex(index, keyName, preferFlats){
    const n = ((index % 12) + 12) % 12;
    const useFlats = typeof preferFlats === 'boolean' ? preferFlats : keyUsesFlats(keyName);
    return (useFlats ? FLAT : SHARP)[n];
  }

  function normalizeNote(note, preferFlats, keyName){
    const i = idx(note);
    if(i == null) return String(note || '');
    return noteNameForIndex(i, keyName, preferFlats);
  }

  function add(note, semis, preferFlats, keyName){
    const i = idx(note);
    if(i == null) return String(note || '');
    return noteNameForIndex(i + semis, keyName, preferFlats);
  }

  function parseChord(symbol){
    const raw = String(symbol || '').trim();
    const m = raw.match(/^([A-G](?:#|b)?)([^/]*?)(?:\/([A-G](?:#|b)?))?$/);
    if(!m) return null;
    return { raw, root:m[1], quality:m[2] || '', bass:m[3] || '' };
  }

  function formatChord(parts){
    if(!parts) return '';
    return String(parts.root || '') + String(parts.quality || '') + (parts.bass ? '/' + parts.bass : '');
  }

  function shiftChord(symbol, semitones, preferFlats, keyName){
    const p = parseChord(symbol);
    if(!p) return String(symbol || '');
    return formatChord({
      root: add(p.root, semitones, preferFlats, keyName),
      quality: p.quality,
      bass: p.bass ? add(p.bass, semitones, preferFlats, keyName) : ''
    });
  }

  function respellChord(symbol, preferFlats, keyName){
    const p = parseChord(symbol);
    if(!p) return String(symbol || '');
    return formatChord({
      root: normalizeNote(p.root, preferFlats, keyName),
      quality: p.quality,
      bass: p.bass ? normalizeNote(p.bass, preferFlats, keyName) : ''
    });
  }

  function respellChordForKey(symbol, keyName){
    return respellChord(symbol, keyUsesFlats(keyName), keyName);
  }

  function respellChordListForKey(chords, keyName){
    return (chords || []).map((symbol) => respellChordForKey(symbol, keyName));
  }

  function chordAliases(symbol, keyName){
    const p = parseChord(symbol);
    if(!p) return [String(symbol || '')];
    const out = new Set();
    const roots = [p.root].concat(ENHARMONIC_ROOTS[p.root] || []);
    const basses = p.bass ? [p.bass].concat(ENHARMONIC_ROOTS[p.bass] || []) : [''];
    roots.forEach((root) => {
      basses.forEach((bass) => {
        out.add(formatChord({ root, quality:p.quality, bass }));
      });
    });
    out.add(respellChordForKey(symbol, keyName));
    return Array.from(out);
  }

  function buildShapeDictionary(){
    const out = { ...DEFAULT_SHAPES };
    Object.keys(DEFAULT_SHAPES).forEach((symbol) => {
      const shape = DEFAULT_SHAPES[symbol];
      chordAliases(symbol).forEach((alias) => {
        if(!out[alias]) out[alias] = shape;
      });
    });
    return out;
  }

  const SHAPE_DICTIONARY = buildShapeDictionary();

  function findShapeForChord(symbol, keyName){
    const aliases = chordAliases(symbol, keyName);
    for(const alias of aliases){
      if(SHAPE_DICTIONARY[alias]) return SHAPE_DICTIONARY[alias];
      const parsed = parseChord(alias);
      if(parsed && SHAPE_DICTIONARY[parsed.root]) return SHAPE_DICTIONARY[parsed.root];
    }
    return null;
  }

  function penaltyForChord(ch){
    if(!ch) return 2;
    const q = ch.quality || '';
    if(/dim|aug|add9|sus2|6|9|11|13/i.test(q)) return 2.2;
    if(/sus4|maj7|m7|7/i.test(q)) return 1.1;
    return 0.2;
  }

  function familyWeight(root){
    if(OPEN_FAMILY_ROOTS.includes(root)) return OPEN_FAMILY_ROOTS.indexOf(root) * 0.06;
    return 1.4 + (FAMILY_ROOTS.indexOf(root) * 0.04);
  }

  function uniqueChordSymbols(chords){
    const out = [];
    const seen = new Set();
    (chords || []).forEach((ch) => {
      const respelled = String(ch || '').trim();
      if(respelled && !seen.has(respelled)){
        seen.add(respelled);
        out.push(respelled);
      }
    });
    return out;
  }

  function familyRootList(family){
    return (FAMILY_CHORDS[family] || []).map((symbol) => parseChord(symbol)?.root).filter(Boolean);
  }

  function detectDegreeIndex(root, keyName){
    const family = normalizeKeyName(keyName).replace(/m$/, '');
    const scale = familyRootList(family);
    if(!scale.length) return -1;
    const rootIdx = idx(root);
    for(let i = 0; i < scale.length; i++){
      if(idx(scale[i]) === rootIdx) return i;
    }
    return -1;
  }

  function respellChordForFamily(symbol, family){
    const p = parseChord(symbol);
    if(!p) return String(symbol || '');
    return formatChord({
      root: normalizeNote(p.root, keyUsesFlats(family), family),
      quality: p.quality,
      bass: p.bass ? normalizeNote(p.bass, keyUsesFlats(family), family) : ''
    });
  }

  function buildFamilyChordFromDegree(symbol, family, targetConcertKey, capo){
    const parsed = parseChord(symbol);
    if(!parsed) return respellChordForFamily(shiftChord(symbol, -capo, null, family), family);
    const degreeIndex = detectDegreeIndex(parsed.root, targetConcertKey);
    if(degreeIndex < 0){
      return respellChordForFamily(shiftChord(symbol, -capo, null, family), family);
    }
    const familyScale = FAMILY_CHORDS[family] || [];
    const familyDegree = parseChord(familyScale[degreeIndex] || '');
    if(!familyDegree) return respellChordForFamily(shiftChord(symbol, -capo, null, family), family);

    let bass = '';
    if(parsed.bass){
      const bassDegree = detectDegreeIndex(parsed.bass, targetConcertKey);
      if(bassDegree >= 0 && familyScale[bassDegree]) bass = parseChord(familyScale[bassDegree]).root;
      else bass = normalizeNote(add(parsed.bass, -capo, null, family), keyUsesFlats(family), family);
    }
    return formatChord({
      root: familyDegree.root,
      quality: parsed.quality,
      bass
    });
  }

  function buildShapeMap(chords, family, targetConcertKey, capo){
    const map = {};
    (chords || []).forEach((symbol) => {
      const displayChord = buildFamilyChordFromDegree(symbol, family, targetConcertKey, capo);
      const shape = findShapeForChord(displayChord, family);
      if(shape) map[symbol] = { displayChord, shape };
      else map[symbol] = { displayChord, shape:null };
    });
    return map;
  }

  function buildScheme(opts){
    const { family, capo, originalChords, targetConcertKey } = opts;
    const shapeMap = buildShapeMap(originalChords, family, targetConcertKey, capo);
    const chordMap = {};
    originalChords.forEach((symbol) => {
      chordMap[symbol] = shapeMap[symbol]?.displayChord || buildFamilyChordFromDegree(symbol, family, targetConcertKey, capo);
    });

    let score = Math.abs(capo - 2);
    if(capo > 4) score += 1.2;
    if(capo === 0) score += 0.5;
    score += familyWeight(family);
    originalChords.forEach((sym) => {
      score += penaltyForChord(parseChord(chordMap[sym] || sym));
    });

    return {
      family,
      familyRoot: family,
      capo,
      score: Math.round(score * 100) / 100,
      targetConcertKey: normalizeKeyName(targetConcertKey),
      displayDelta: -capo,
      chordMap,
      shapeMap,
      summary: `${family}组 / CP${capo}`
    };
  }

  function generateSchemes(ctx){
    const originalKey = normalizeKeyName(ctx.originalKey || 'C').replace(/m$/, '');
    const targetConcertKey = add(originalKey, ctx.transpose || 0, null, originalKey);
    const targetIdx = idx(targetConcertKey);
    if(targetIdx == null) return [];
    const originalChords = uniqueChordSymbols(respellChordListForKey(ctx.originalChords, targetConcertKey));
    const out = [];
    FAMILY_ROOTS.forEach((family) => {
      const familyIdx = idx(family);
      if(familyIdx == null) return;
      const capo = (targetIdx - familyIdx + 12) % 12;
      if(capo < 0 || capo > 6) return;
      out.push(buildScheme({
        family,
        capo,
        originalChords,
        targetConcertKey
      }));
    });
    out.sort((a, b) => a.score - b.score);
    return out.slice(0, 3);
  }

  window.SchemeEngine = {
    parseChord,
    formatChord,
    shiftChord,
    respellChord,
    respellChordForKey,
    respellChordListForKey,
    respellChordForFamily,
    generateSchemes,
    buildScheme,
    uniqueChordSymbols,
    FAMILY_ROOTS,
    FAMILY_CHORDS,
    findShapeForChord,
    normalizeKeyName,
    keyUsesFlats,
    detectDegreeIndex,
    buildFamilyChordFromDegree
  };
})();
