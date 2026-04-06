(function(){
  const BUILD = 'V15_FULL_SCHEME_REWORK';
  const SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const INDEX = {C:0,'B#':0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,Fb:4,F:5,'E#':5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11,Cb:11};
  const FLAT_KEYS = new Set(['F','Bb','Eb','Ab','Db','Gb','Cb']);
  const CANONICAL_FAMILY = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const OPEN_PRIORITY = ['G','C','D','A','E','F','Bb','Eb','Ab','Db','B','Gb'];
  const DIATONIC_INTERVALS = [0,2,4,5,7,9,11];
  const TRIAD_QUALITIES = ['', 'm', 'm', '', '', 'm', 'dim'];
  const SEVENTH_QUALITIES = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'];

  function idx(name){ return INDEX[String(name || '').trim()] ?? null; }
  function prefersFlatsFromKeyName(keyName){
    const s = String(keyName || '').trim();
    if(FLAT_KEYS.has(s)) return true;
    if(s.includes('b')) return true;
    if(s.includes('#')) return false;
    return false;
  }
  function noteNameFromIndex(i, preferFlats){
    const n = ((i % 12) + 12) % 12;
    return (preferFlats ? FLAT : SHARP)[n];
  }
  function canonicalFamilyNameFromIndex(i){
    return CANONICAL_FAMILY[((i % 12) + 12) % 12];
  }
  function normalizeNote(note, preferFlats){
    const i = idx(note);
    return i == null ? String(note || '') : noteNameFromIndex(i, preferFlats);
  }
  function add(note, semis, preferFlats){
    const i = idx(note);
    return i == null ? String(note || '') : noteNameFromIndex(i + semis, preferFlats);
  }
  function parseChord(symbol){
    const raw = String(symbol || '').trim();
    const m = raw.match(/^([A-G](?:#|b)?)([^/]*?)(?:\/([A-G](?:#|b)?))?$/);
    if(!m) return null;
    return { raw, root:m[1], quality:m[2] || '', bass:m[3] || '' };
  }
  function formatChord(parts){
    return parts ? String(parts.root || '') + String(parts.quality || '') + (parts.bass ? '/' + parts.bass : '') : '';
  }
  function shiftChord(symbol, semitones, preferFlats){
    const p = parseChord(symbol);
    if(!p) return String(symbol || '');
    return formatChord({
      root: add(p.root, semitones, preferFlats),
      quality: p.quality,
      bass: p.bass ? add(p.bass, semitones, preferFlats) : ''
    });
  }
  function respellChordForKey(symbol, keyName){
    const p = parseChord(symbol);
    if(!p) return String(symbol || '');
    const preferFlats = prefersFlatsFromKeyName(keyName);
    return formatChord({
      root: normalizeNote(p.root, preferFlats),
      quality: p.quality,
      bass: p.bass ? normalizeNote(p.bass, preferFlats) : ''
    });
  }
  function uniqueChordSymbols(chords){
    const out=[]; const seen=new Set();
    (chords || []).forEach((c)=>{
      const s = String(c || '').trim();
      if(s && !seen.has(s)){ seen.add(s); out.push(s); }
    });
    return out;
  }
  function qualityGroup(q){
    const s = String(q || '');
    if(/^m7$/i.test(s)) return 'm7';
    if(/^maj7$/i.test(s)) return 'maj7';
    if(/^7$/i.test(s)) return '7';
    if(/^m$/i.test(s)) return 'm';
    if(/^dim$/i.test(s)) return 'dim';
    if(/^m7b5$/i.test(s)) return 'm7b5';
    return '';
  }
  function buildFamilyPanelChords(familyRoot){
    const preferFlats = prefersFlatsFromKeyName(familyRoot);
    const fourth = add(familyRoot, 5, preferFlats);
    const fifth = add(familyRoot, 7, preferFlats);
    return [familyRoot, fourth, fifth, fifth + '7'];
  }
  function buildDiatonicChordMap(targetKey, familyRoot){
    const targetIdx = idx(targetKey);
    const familyIdx = idx(familyRoot);
    if(targetIdx == null || familyIdx == null) return {};
    const map = {};
    const targetPreferFlats = prefersFlatsFromKeyName(targetKey);
    const familyPreferFlats = prefersFlatsFromKeyName(familyRoot);
    DIATONIC_INTERVALS.forEach((semi, i)=>{
      const targetRoot = noteNameFromIndex(targetIdx + semi, targetPreferFlats);
      const familyNote = noteNameFromIndex(familyIdx + semi, familyPreferFlats);
      const triadConcert = targetRoot + TRIAD_QUALITIES[i];
      const triadFamily = familyNote + TRIAD_QUALITIES[i];
      const seventhConcert = targetRoot + SEVENTH_QUALITIES[i];
      const seventhFamily = familyNote + SEVENTH_QUALITIES[i];
      map[respellChordForKey(triadConcert, targetKey)] = triadFamily;
      map[respellChordForKey(seventhConcert, targetKey)] = seventhFamily;
      map[shiftChord(triadConcert, 0, false)] = triadFamily;
      map[shiftChord(seventhConcert, 0, false)] = seventhFamily;
    });
    return map;
  }
  function penaltyForChord(ch){
    if(!ch) return 1.5;
    const q = qualityGroup(ch.quality);
    if(q === '7' || q === 'maj7' || q === 'm7') return 0.8;
    if(q === 'm' || q === '') return 0.1;
    if(q === 'dim' || q === 'm7b5') return 1.3;
    return 1.5;
  }
  function buildScheme(opts){
    const { familyRoot, targetConcertKey, originalChords } = opts;
    const targetIdx = idx(targetConcertKey);
    const familyIdx = idx(familyRoot);
    if(targetIdx == null || familyIdx == null) return null;
    const capo = (targetIdx - familyIdx + 12) % 12;
    const chordMap = {};
    const diatonicMap = buildDiatonicChordMap(targetConcertKey, familyRoot);
    const familyPreferFlats = prefersFlatsFromKeyName(familyRoot);

    uniqueChordSymbols(originalChords).forEach((symbol)=>{
      const concert = respellChordForKey(symbol, targetConcertKey);
      let mapped = diatonicMap[concert] || diatonicMap[shiftChord(concert, 0, false)];
      if(!mapped){
        mapped = shiftChord(concert, -capo, familyPreferFlats);
      }
      chordMap[symbol] = mapped;
    });

    const displayChords = buildFamilyPanelChords(familyRoot).map((c)=>respellChordForKey(c, familyRoot));
    let score = Math.abs(capo - 2);
    if(capo > 4) score += 1.5;
    if(capo === 0) score += 0.4;
    score += OPEN_PRIORITY.indexOf(familyRoot) >= 0 ? OPEN_PRIORITY.indexOf(familyRoot) * 0.03 : 0.6;
    uniqueChordSymbols(originalChords).forEach((sym)=>{ score += penaltyForChord(parseChord(chordMap[sym] || sym)); });

    return {
      family: familyRoot,
      familyRoot,
      familyDisplay: familyRoot,
      capo,
      targetConcertKey,
      chordMap,
      displayChords,
      summary: `${familyRoot}组 / CP${capo}`,
      score: Math.round(score * 100) / 100
    };
  }
  function generateSchemes(ctx){
    const targetConcertKey = String(ctx.displayedKey || ctx.targetKey || ctx.originalKey || 'C').trim() || 'C';
    const targetIdx = idx(targetConcertKey);
    if(targetIdx == null) return [];
    const originalChords = uniqueChordSymbols(ctx.originalChords || []);
    const out = [];
    for(let capo = 0; capo <= 6; capo++){
      const familyIdx = ((targetIdx - capo) % 12 + 12) % 12;
      const familyRoot = canonicalFamilyNameFromIndex(familyIdx);
      const scheme = buildScheme({ familyRoot, targetConcertKey, originalChords });
      if(scheme) out.push(scheme);
    }
    out.sort((a,b)=>a.score - b.score);
    return out.slice(0, 3);
  }
  window.prefersFlatsFromKeyName = window.prefersFlatsFromKeyName || prefersFlatsFromKeyName;
  window.SchemeEngine = {
    BUILD,
    parseChord,
    shiftChord,
    respellChordForKey,
    generateSchemes,
    buildScheme,
    uniqueChordSymbols,
    FAMILY_ROOTS: CANONICAL_FAMILY
  };
})();
