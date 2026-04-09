(function () {
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const INDEX = { C: 0, 'B#': 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, Fb: 4, F: 5, 'E#': 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11 };
const FAMILY_ROOTS = ['G', 'C', 'D', 'A', 'E', 'F'];
const FAMILY_CHORDS = {
G: ['G', 'Am', 'Bm', 'C', 'D', 'Em'],
C: ['C', 'Dm', 'Em', 'F', 'G', 'Am'],
D: ['D', 'Em', 'F#m', 'G', 'A', 'Bm'],
A: ['A', 'Bm', 'C#m', 'D', 'E', 'F#m'],
E: ['E', 'F#m', 'G#m', 'A', 'B', 'C#m'],
F: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm']
};
const DEFAULT_SHAPES = {
C: ['x', 3, 2, 0, 1, 0], D: ['x', 'x', 0, 2, 3, 2], E: [0, 2, 2, 1, 0, 0], F: [1, 3, 3, 2, 1, 1], G: [3, 2, 0, 0, 0, 3], A: ['x', 0, 2, 2, 2, 0], B: ['x', 2, 4, 4, 4, 2],
Am: ['x', 0, 2, 2, 1, 0], Bm: ['x', 2, 4, 4, 3, 2], Cm: ['x', 3, 5, 5, 4, 3], Dm: ['x', 'x', 0, 2, 3, 1], Em: [0, 2, 2, 0, 0, 0], Fm: [1, 3, 3, 1, 1, 1], 'F#m': [2, 4, 4, 2, 2, 2], Gm: [3, 5, 5, 3, 3, 3], 'G#m': [4, 6, 6, 4, 4, 4], 'C#m': ['x', 4, 6, 6, 5, 4],
'A7': ['x', 0, 2, 0, 2, 0], 'B7': ['x', 2, 1, 2, 0, 2], 'C7': ['x', 3, 2, 3, 1, 0], 'D7': ['x', 'x', 0, 2, 1, 2], 'E7': [0, 2, 0, 1, 0, 0], 'F7': [1, 3, 1, 2, 1, 1], 'G7': [3, 2, 0, 0, 0, 1],
'Amaj7': ['x', 0, 2, 1, 2, 0], 'Cmaj7': ['x', 3, 2, 0, 0, 0], 'Dmaj7': ['x', 'x', 0, 2, 2, 2], 'Emaj7': [0, 2, 1, 1, 0, 0], 'Fmaj7': [1, 3, 2, 2, 1, 0], 'Gmaj7': [3, 2, 0, 0, 0, 2],
'Am7': ['x', 0, 2, 0, 1, 0], 'Bm7': ['x', 2, 4, 2, 3, 2], 'Cm7': ['x', 3, 5, 3, 4, 3], 'Dm7': ['x', 'x', 0, 2, 1, 1], 'Em7': [0, 2, 2, 0, 3, 0], 'Fm7': [1, 3, 1, 1, 1, 1], 'Gm7': [3, 5, 3, 3, 3, 3], 'C#m7': ['x', 4, 6, 4, 5, 4], 'F#m7': [2, 4, 2, 2, 2, 2], 'G#m7': [4, 6, 4, 4, 4, 4],
'Asus4': ['x', 0, 2, 2, 3, 0], 'Dsus4': ['x', 'x', 0, 2, 3, 3], 'Esus4': [0, 2, 2, 2, 0, 0], 'Gsus4': [3, 3, 0, 0, 1, 3], 'Csus4': ['x', 3, 3, 0, 1, 1], 'Fsus4': [1, 3, 3, 3, 1, 1]
};
function idx(name) { return INDEX[name] ?? null; }
function normalizeNote(note, preferFlats) {
const i = idx(note);
if (i == null)
return note;
return (preferFlats ? FLAT : SHARP)[i];
}
function add(note, semis, preferFlats) {
const i = idx(note);
if (i == null)
return note;
const n = (i + (semis % 12) + 12) % 12;
return (preferFlats ? FLAT : SHARP)[n];
}
function normalizeEnharmonicKeyName(name) {
const raw = String(name || '').trim();
const map = { 'G#': 'Ab', 'D#': 'Eb', 'A#': 'Bb', 'C#': 'Db', 'F#': 'Gb', 'Cb': 'B', 'E#': 'F', 'B#': 'C' };
return map[raw] || raw;
}
function isFlatKeyName(name) {
const n = normalizeEnharmonicKeyName(name);
return ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'].includes(n);
}
function normalizeChordForKey(symbol, keyName) {
const useFlats = isFlatKeyName(keyName);
const p = parseChord(symbol);
if (!p)
return String(symbol || '');
return formatChord({
root: normalizeNote(p.root, useFlats),
quality: p.quality,
bass: p.bass ? normalizeNote(p.bass, useFlats) : ''
});
}
function parseChord(symbol) {
const raw = String(symbol || '').trim();
const m = raw.match(/^([A-G](?:#|b)?)([^/]*?)(?:\/([A-G](?:#|b)?))?$/);
if (!m)
return null;
return { raw, root: m[1], quality: m[2] || '', bass: m[3] || '' };
}
function formatChord(parts) {
if (!parts)
return '';
return parts.root + (parts.quality || '') + (parts.bass ? '/' + parts.bass : '');
}
function shiftChord(symbol, semitones, preferFlats) {
const p = parseChord(symbol);
if (!p)
return String(symbol || '');
return formatChord({ root: add(p.root, semitones, preferFlats), quality: p.quality, bass: p.bass ? add(p.bass, semitones, preferFlats) : '' });
}
function penaltyForChord(ch) {
if (!ch)
return 2;
const q = ch.quality || '';
if (/dim|aug|add9|sus2|6|9|11|13/i.test(q))
return 2.2;
if (/sus4|maj7|m7|7/i.test(q))
return 1.1;
return 0.2;
}
function buildShapeMap(chords, displayDelta, preferFlats) {
const map = {};
chords.forEach((symbol) => {
const shifted = shiftChord(symbol, displayDelta, preferFlats);
const p = parseChord(shifted);
if (!p)
return;
const key = formatChord({ root: normalizeNote(p.root, preferFlats), quality: p.quality, bass: '' });
const shape = DEFAULT_SHAPES[key] || DEFAULT_SHAPES[normalizeNote(p.root, preferFlats)] || null;
if (shape)
map[symbol] = { displayChord: shifted, shape };
});
return map;
}
function uniqueChordSymbols(chords) {
const out = [];
const seen = new Set();
(chords || []).forEach((c) => { const s = String(c || '').trim(); if (s && !seen.has(s)) {
seen.add(s);
out.push(s);
} });
return out;
}
function buildScheme(opts) {
const { family, capo, originalChords, songCapo, autoTranspose, preferFlats, targetConcertKey } = opts;
const displayDelta = (autoTranspose || 0) - capo;
const shapeMap = buildShapeMap(originalChords, displayDelta, preferFlats);
const chordMap = {};
originalChords.forEach((symbol) => {
chordMap[symbol] = normalizeChordForKey(shapeMap[symbol]?.displayChord || shiftChord(symbol, displayDelta, preferFlats), targetConcertKey);
});
let score = Math.abs(capo - 2);
if (capo > 4)
score += 1.2;
if (capo === 0)
score += 0.5;
score += (FAMILY_ROOTS.indexOf(family) * 0.05);
originalChords.forEach((sym) => { score += penaltyForChord(parseChord(chordMap[sym] || sym)); });
return {
family,
capo,
score: Math.round(score * 100) / 100,
targetConcertKey,
displayDelta,
chordMap,
shapeMap,
summary: `${family}组 / CP${capo}`
};
}
function generateSchemes(ctx) {
const preferFlats = !!ctx.preferFlats;
const originalKey = normalizeEnharmonicKeyName(ctx.originalKey || 'C');
const targetConcertKey = normalizeEnharmonicKeyName(add(originalKey, ctx.transpose || 0, preferFlats));
const targetIdx = idx(targetConcertKey);
if (targetIdx == null)
return [];
const originalChords = uniqueChordSymbols(ctx.originalChords);
const out = [];
FAMILY_ROOTS.forEach((family) => {
const familyIdx = idx(family);
if (familyIdx == null)
return;
const capo = (targetIdx - familyIdx + 12) % 12;
if (capo < 0 || capo > 6)
return;
out.push(buildScheme({
family,
capo,
originalChords,
songCapo: 0,
autoTranspose: ctx.transpose || 0,
preferFlats,
targetConcertKey
}));
});
out.sort((a, b) => a.score - b.score);
return out.slice(0, 3);
}
window.SchemeEngine = { parseChord, shiftChord, generateSchemes, buildScheme, uniqueChordSymbols, FAMILY_ROOTS, normalizeEnharmonicKeyName, isFlatKeyName, normalizeChordForKey };
})();