
(function(){
  function makeEvent(beat, dur, role, stringHint, accent){
    return { beat, dur, role, stringHint: stringHint == null ? null : Number(stringHint), accent: !!accent };
  }

  function convertLegacyPatternToTemplate(pattern, timeSig, type){
    const meter = String(timeSig || '4/4');
    const parts = meter.split('/');
    const beats = parseInt(parts[0] || '4', 10) || 4;
    const beatUnit = parseInt(parts[1] || '4', 10) || 4;
    const raw = Array.isArray(pattern?.steps) ? pattern.steps.slice() : [];
    if (!raw.length) return { ...(pattern||{}), time_signature: meter, subdivision: 8, events: [] };

    const stepCount = raw.length;
    const barBeats = beats * (4 / beatUnit);
    const dur = +(barBeats / stepCount).toFixed(4);

    const events = raw.map((step, idx) => {
      let role = 'mid1';
      const isDigit = /^\d+$/.test(String(step));
      if (type === 'arpeggio') {
        if (idx === 0 || String(step).toUpperCase() === 'R') role = 'bass';
        else if (idx % 4 === 1) role = 'mid1';
        else if (idx % 4 === 2) role = 'mid2';
        else if (idx % 4 === 3) role = 'mid3';
        else role = 'high';
      } else {
        role = 'strum';
      }
      return makeEvent(+(idx * dur).toFixed(4), dur, role, isDigit ? Number(step) : null, idx === 0);
    });

    return {
      ...(pattern || {}),
      time_signature: meter,
      subdivision: 8,
      events
    };
  }

  const RHYTHM_LIBRARY = {
    '4/4': [
      convertLegacyPatternToTemplate({ id:'arp_53231323', name:'分解 53231323', type:'arpeggio', steps:['5','3','2','3','1','3','2','3'], difficulty:1 }, '4/4', 'arpeggio'),
      convertLegacyPatternToTemplate({ id:'arp_53212323', name:'分解 53212323', type:'arpeggio', steps:['5','3','2','1','2','3','2','3'], difficulty:1 }, '4/4', 'arpeggio'),
      convertLegacyPatternToTemplate({ id:'strum_basic_44', name:'扫弦 基础', type:'strum', steps:['↓','↓','↑','↑','↓','↑'], difficulty:1 }, '4/4', 'strum'),
      convertLegacyPatternToTemplate({ id:'strum_pop_44', name:'扫弦 流行', type:'strum', steps:['↓','-','↓↑','-','↑↓↑'], difficulty:2 }, '4/4', 'strum')
    ],
    '3/4': [
      convertLegacyPatternToTemplate({ id:'arp_531531', name:'分解 531531', type:'arpeggio', steps:['5','3','1','5','3','1'], difficulty:1 }, '3/4', 'arpeggio'),
      convertLegacyPatternToTemplate({ id:'strum_waltz_34', name:'扫弦 华尔兹', type:'strum', steps:['↓','↓','↑'], difficulty:1 }, '3/4', 'strum')
    ],
    '2/4': [
      convertLegacyPatternToTemplate({ id:'arp_5315', name:'分解 5315', type:'arpeggio', steps:['5','3','1','5'], difficulty:1 }, '2/4', 'arpeggio'),
      convertLegacyPatternToTemplate({ id:'strum_basic_24', name:'扫弦 基础 2/4', type:'strum', steps:['↓','↑'], difficulty:1 }, '2/4', 'strum')
    ],
    '6/8': [
      convertLegacyPatternToTemplate({ id:'arp_654321', name:'分解 654321', type:'arpeggio', steps:['6','5','4','3','2','1'], difficulty:1 }, '6/8', 'arpeggio'),
      convertLegacyPatternToTemplate({ id:'strum_68', name:'扫弦 6/8', type:'strum', steps:['↓','↓↑','↓↑'], difficulty:1 }, '6/8', 'strum')
    ]
  };

  function normalizeMeter(meter){
    const raw = String(meter || '4/4').trim();
    if (RHYTHM_LIBRARY[raw]) return raw;
    const remap = {
      '3/2':'3/4',
      '4/2':'4/4',
      '6/4':'3/4',
      '9/4':'3/4'
    };
    return remap[raw] || '4/4';
  }

  function getPatternsForMeter(meter){ return RHYTHM_LIBRARY[normalizeMeter(meter)] || RHYTHM_LIBRARY['4/4']; }
  function getDefaultPattern(meter){ return getPatternsForMeter(meter)[0]; }

  window.RhythmEngine = { RHYTHM_LIBRARY, normalizeMeter, convertLegacyPatternToTemplate, getPatternsForMeter, getDefaultPattern };
})();
