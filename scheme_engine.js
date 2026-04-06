(function(){
  const BUILD = 'V14_FULL_REBUILD_SCHEME_ENGINE';
  const SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const INDEX = {C:0,'B#':0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,Fb:4,F:5,'E#':5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11,Cb:11};
  const FLAT_KEYS = new Set(['F','Bb','Eb','Ab','Db','Gb','Cb']);
  const FAMILY_ROOTS = ['C','G','D','A','E','F','Bb','Eb','Ab','Db','Gb','B'];
  const FAMILY_CHORDS = {
    C:['C','F','G','G7'],
    G:['G','C','D','D7'],
    D:['D','G','A','A7'],
    A:['A','D','E','E7'],
    E:['E','A','B','B7'],
    F:['F','Bb','C','C7'],
    Bb:['Bb','Eb','F','F7'],
    Eb:['Eb','Ab','Bb','Bb7'],
    Ab:['Ab','Db','Eb','Eb7'],
    Db:['Db','Gb','Ab','Ab7'],
    Gb:['Gb','Cb','Db','Db7'],
    B:['B','E','F#','F#7']
  };
  const DEFAULT_SHAPES = {
    C:['x',3,2,0,1,0], D:['x','x',0,2,3,2], E:[0,2,2,1,0,0], F:[1,3,3,2,1,1], G:[3,2,0,0,0,3], A:['x',0,2,2,2,0], B:['x',2,4,4,4,2],
    Am:['x',0,2,2,1,0], Bm:['x',2,4,4,3,2], Cm:['x',3,5,5,4,3], Dm:['x','x',0,2,3,1], Em:[0,2,2,0,0,0], Fm:[1,3,3,1,1,1], 'F#m':[2,4,4,2,2,2], Gm:[3,5,5,3,3,3], 'G#m':[4,6,6,4,4,4], 'C#m':['x',4,6,6,5,4],
    'A7':['x',0,2,0,2,0], 'B7':['x',2,1,2,0,2], 'C7':['x',3,2,3,1,0], 'D7':['x','x',0,2,1,2], 'E7':[0,2,0,1,0,0], 'F7':[1,3,1,2,1,1], 'G7':[3,2,0,0,0,1],
    'Amaj7':['x',0,2,1,2,0], 'Cmaj7':['x',3,2,0,0,0], 'Dmaj7':['x','x',0,2,2,2], 'Emaj7':[0,2,1,1,0,0], 'Fmaj7':[1,3,2,2,1,0], 'Gmaj7':[3,2,0,0,0,2],
    'Am7':['x',0,2,0,1,0], 'Bm7':['x',2,4,2,3,2], 'Cm7':['x',3,5,3,4,3], 'Dm7':['x','x',0,2,1,1], 'Em7':[0,2,2,0,3,0], 'Fm7':[1,3,1,1,1,1], 'Gm7':[3,5,3,3,3,3], 'C#m7':['x',4,6,4,5,4], 'F#m7':[2,4,2,2,2,2], 'G#m7':[4,6,4,4,4,4],
    'Asus4':['x',0,2,2,3,0], 'Dsus4':['x','x',0,2,3,3], 'Esus4':[0,2,2,2,0,0], 'Gsus4':[3,3,0,0,1,3], 'Csus4':['x',3,3,0,1,1], 'Fsus4':[1,3,3,3,1,1]
  };

  function idx(name){ return INDEX[name] ?? null; }
  function prefersFlatsFromKeyName(keyName){ return FLAT_KEYS.has(String(keyName || 'C')); }
  function noteNameFromIndex(i, preferFlats){ return (preferFlats ? FLAT : SHARP)[((i % 12) + 12) % 12]; }
  function normalizeNote(note, preferFlats){ const i = idx(note); return i == null ? note : noteNameFromIndex(i, preferFlats); }
  function add(note, semis, preferFlats){ const i = idx(note); return i == null ? note : noteNameFromIndex(i + semis, preferFlats); }
  function parseChord(symbol){
    const raw = String(symbol || '').trim();
    const m = raw.match(/^([A-G](?:#|b)?)([^/]*?)(?:\/([A-G](?:#|b)?))?$/);
    if(!m) return null;
    return { raw, root:m[1], quality:m[2] || '', bass:m[3] || '' };
  }
  function formatChord(parts){ return parts ? parts.root + (parts.quality || '') + (parts.bass ? '/' + parts.bass : '') : ''; }
  function shiftChord(symbol, semitones, preferFlats){
    const p = parseChord(symbol); if(!p) return String(symbol || '');
    return formatChord({ root:add(p.root, semitones, preferFlats), quality:p.quality, bass:p.bass ? add(p.bass, semitones, preferFlats) : '' });
  }
  function respellChordForKey(symbol, keyName){
    return shiftChord(symbol, 0, prefersFlatsFromKeyName(keyName));
  }
  function qualityGroup(q){
    const s = String(q || '');
    if(/^m7$/i.test(s)) return 'm7';
    if(/^maj7$/i.test(s)) return 'maj7';
    if(/^7$/i.test(s)) return '7';
    if(/^m$/i.test(s)) return 'm';
    if(/^dim$/i.test(s)) return 'dim';
    return '';
  }
  function uniqueChordSymbols(chords){
    const out=[]; const seen=new Set();
    (chords||[]).forEach((c)=>{ const s=String(c||'').trim(); if(s && !seen.has(s)){ seen.add(s); out.push(s); } });
    return out;
  }
  function diatonicChordMap(targetKey, familyRoot){
    const preferTargetFlats = prefersFlatsFromKeyName(targetKey);
    const preferFamilyFlats = prefersFlatsFromKeyName(familyRoot);
    const t = idx(targetKey);
    const f = idx(familyRoot);
    if(t == null || f == null) return {};
    const capo = (t - f + 12) % 12;
    const map = {};
    const degrees = [0,2,4,5,7,9,11];
    const triads = ['', 'm', 'm', '', '', 'm', 'dim'];
    const sevenths = ['maj7','m7','m7','maj7','7','m7','m7b5'];
    degrees.forEach((semi, i)=>{
      const concertRoot = noteNameFromIndex(t + semi, preferTargetFlats);
      const familyRootName = noteNameFromIndex(f + semi, preferFamilyFlats);
      const triadConcert = concertRoot + triads[i];
      const triadFamily = familyRootName + triads[i];
      const seventhConcert = concertRoot + sevenths[i];
      const seventhFamily = familyRootName + sevenths[i];
      map[respellChordForKey(triadConcert, targetKey)] = triadFamily;
      map[respellChordForKey(seventhConcert, targetKey)] = seventhFamily;
      map[shiftChord(triadConcert, 0, false)] = triadFamily;
      map[shiftChord(seventhConcert, 0, false)] = seventhFamily;
    });
    map[respellChordForKey(targetKey + '7', targetKey)] = FAMILY_CHORDS[familyRoot][3];
    return { map, capo };
  }
  function penaltyForChord(ch){
    if(!ch) return 2;
    const q = qualityGroup(ch.quality);
    if(q === '7' || q === 'maj7' || q === 'm7') return 0.8;
    if(q === 'm' || q === '') return 0.1;
    return 1.6;
  }
  function buildScheme(opts){
    const { familyRoot, targetConcertKey, originalChords } = opts;
    const familyChords = FAMILY_CHORDS[familyRoot] || [];
    const preferTargetFlats = prefersFlatsFromKeyName(targetConcertKey);
    const { map: diatonicMap, capo } = diatonicChordMap(targetConcertKey, familyRoot);
    const chordMap = {};
    uniqueChordSymbols(originalChords).forEach((symbol)=>{
      const normalizedInput = respellChordForKey(symbol, targetConcertKey);
      let mapped = diatonicMap[normalizedInput] || diatonicMap[shiftChord(normalizedInput, 0, false)];
      if(!mapped){
        mapped = shiftChord(normalizedInput, -capo, prefersFlatsFromKeyName(familyRoot));
      }
      chordMap[symbol] = mapped;
    });
    let score = Math.abs(capo - 2);
    if(capo > 4) score += 1.5;
    if(capo === 0) score += 0.4;
    if(['C','G','D','A','E','F'].includes(familyRoot)) score -= 0.2;
    uniqueChordSymbols(originalChords).forEach((sym)=>{ score += penaltyForChord(parseChord(chordMap[sym] || sym)); });
    return {
      family: familyRoot,
      familyRoot,
      familyDisplay: familyRoot,
      capo,
      targetConcertKey,
      score: Math.round(score * 100) / 100,
      chordMap,
      previewChords: familyChords.slice(),
      summary: `${familyRoot}组 / CP${capo}`,
      build: BUILD
    };
  }
  function generateSchemes(ctx){
    const originalKey = ctx.originalKey || 'C';
    const targetConcertKey = add(originalKey, ctx.transpose || 0, prefersFlatsFromKeyName(originalKey));
    const originalChords = uniqueChordSymbols(ctx.originalChords || []);
    const out = FAMILY_ROOTS.map((familyRoot)=>buildScheme({ familyRoot, targetConcertKey, originalChords }))
      .filter((s)=>s.capo >=0 && s.capo <= 6)
      .sort((a,b)=>a.score - b.score)
      .slice(0,3);
    return out;
  }
  window.SchemeEngine = { BUILD, parseChord, shiftChord, respellChordForKey, generateSchemes, buildScheme, uniqueChordSymbols, FAMILY_ROOTS, FAMILY_CHORDS, prefersFlatsFromKeyName };
})();
