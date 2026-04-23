
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

  const GP_IMPORTED_LIBRARY = {
    '2/4': [
  {
    "id": "gp_24_01",
    "name": "GP 2/4 #01",
    "source": "guitar_pro",
    "time_signature": "2/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          5,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_24_02",
    "name": "GP 2/4 #02",
    "source": "guitar_pro",
    "time_signature": "2/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.25,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_24_03",
    "name": "GP 2/4 #03",
    "source": "guitar_pro",
    "time_signature": "2/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.25,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_24_04",
    "name": "GP 2/4 #04",
    "source": "guitar_pro",
    "time_signature": "2/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.25,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_24_05",
    "name": "GP 2/4 #05",
    "source": "guitar_pro",
    "time_signature": "2/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_24_06",
    "name": "GP 2/4 #06",
    "source": "guitar_pro",
    "time_signature": "2/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_24_07",
    "name": "GP 2/4 #07",
    "source": "guitar_pro",
    "time_signature": "2/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.25,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_24_08",
    "name": "GP 2/4 #08",
    "source": "guitar_pro",
    "time_signature": "2/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.25,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_24_09",
    "name": "GP 2/4 #09",
    "source": "guitar_pro",
    "time_signature": "2/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_24_10",
    "name": "GP 2/4 #10",
    "source": "guitar_pro",
    "time_signature": "2/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          5,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_24_11",
    "name": "GP 2/4 #11",
    "source": "guitar_pro",
    "time_signature": "2/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_24_12",
    "name": "GP 2/4 #12",
    "source": "guitar_pro",
    "time_signature": "2/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.3333,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 0.3333,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 0.6667,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 1.0,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 1.3333,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 1.6667,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": true
      }
    ]
  },
  {
    "id": "gp_24_13",
    "name": "GP 2/4 #13",
    "source": "guitar_pro",
    "time_signature": "2/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  }
],
    '3/4': [
  {
    "id": "gp_34_01",
    "name": "GP 3/4 #01",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_02",
    "name": "GP 3/4 #02",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 1.0,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 1.0,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 1.0,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_03",
    "name": "GP 3/4 #03",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_04",
    "name": "GP 3/4 #04",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_05",
    "name": "GP 3/4 #05",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          6
        ],
        "stringHint": 6,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_06",
    "name": "GP 3/4 #06",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_07",
    "name": "GP 3/4 #07",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 1.0,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 1.0,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 1.0,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_08",
    "name": "GP 3/4 #08",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_09",
    "name": "GP 3/4 #09",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_10",
    "name": "GP 3/4 #10",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_11",
    "name": "GP 3/4 #11",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_12",
    "name": "GP 3/4 #12",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_13",
    "name": "GP 3/4 #13",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_14",
    "name": "GP 3/4 #14",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_15",
    "name": "GP 3/4 #15",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_16",
    "name": "GP 3/4 #16",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_17",
    "name": "GP 3/4 #17",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_18",
    "name": "GP 3/4 #18",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 1.0,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.75,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": true,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.75,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": true,
        "tuplet": false
      },
      {
        "beat": 2.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_19",
    "name": "GP 3/4 #19",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.75,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": true,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_20",
    "name": "GP 3/4 #20",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_21",
    "name": "GP 3/4 #21",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_22",
    "name": "GP 3/4 #22",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.75,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": true,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.75,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": true,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.75,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": true,
        "tuplet": false
      },
      {
        "beat": 2.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_23",
    "name": "GP 3/4 #23",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_24",
    "name": "GP 3/4 #24",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_25",
    "name": "GP 3/4 #25",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 1.0,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_26",
    "name": "GP 3/4 #26",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_27",
    "name": "GP 3/4 #27",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.75,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": true,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.75,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": true,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.75,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": true,
        "tuplet": false
      },
      {
        "beat": 2.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_28",
    "name": "GP 3/4 #28",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_29",
    "name": "GP 3/4 #29",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_30",
    "name": "GP 3/4 #30",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_31",
    "name": "GP 3/4 #31",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.75,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": true,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_32",
    "name": "GP 3/4 #32",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_33",
    "name": "GP 3/4 #33",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 1.0,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_34",
    "name": "GP 3/4 #34",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 1.0,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_35",
    "name": "GP 3/4 #35",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_34_36",
    "name": "GP 3/4 #36",
    "source": "guitar_pro",
    "time_signature": "3/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  }
],
    '4/4': [
  {
    "id": "gp_44_01",
    "name": "GP 4/4 #01",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 1.0,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 1.0,
        "role": "mid1",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_02",
    "name": "GP 4/4 #02",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          6
        ],
        "stringHint": 6,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          6
        ],
        "stringHint": 6,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_03",
    "name": "GP 4/4 #03",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_04",
    "name": "GP 4/4 #04",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_05",
    "name": "GP 4/4 #05",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 1.0,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 1.0,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_06",
    "name": "GP 4/4 #06",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          5,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_07",
    "name": "GP 4/4 #07",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_08",
    "name": "GP 4/4 #08",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 1.0,
        "role": "strum",
        "stringHints": [
          5,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 1.0,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_09",
    "name": "GP 4/4 #09",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_10",
    "name": "GP 4/4 #10",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_11",
    "name": "GP 4/4 #11",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_12",
    "name": "GP 4/4 #12",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          6
        ],
        "stringHint": 6,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_13",
    "name": "GP 4/4 #13",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_14",
    "name": "GP 4/4 #14",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_15",
    "name": "GP 4/4 #15",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          6
        ],
        "stringHint": 6,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_16",
    "name": "GP 4/4 #16",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.3333,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 0.3333,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 0.6667,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 1.0,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 1.3333,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 1.6667,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 2.0,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 2.3333,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 2.6667,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 3.0,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 3.3333,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": true
      },
      {
        "beat": 3.6667,
        "dur": 0.3333,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": true
      }
    ]
  },
  {
    "id": "gp_44_17",
    "name": "GP 4/4 #17",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.75,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": true,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.75,
        "role": "mid1",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": true,
        "tuplet": false
      },
      {
        "beat": 2.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_18",
    "name": "GP 4/4 #18",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_19",
    "name": "GP 4/4 #19",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_20",
    "name": "GP 4/4 #20",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 1.0,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 1.0,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 1.0,
        "role": "strum",
        "stringHints": [
          3,
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_21",
    "name": "GP 4/4 #21",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_22",
    "name": "GP 4/4 #22",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          5,
          2
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_23",
    "name": "GP 4/4 #23",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_24",
    "name": "GP 4/4 #24",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_25",
    "name": "GP 4/4 #25",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_26",
    "name": "GP 4/4 #26",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 1.0,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_27",
    "name": "GP 4/4 #27",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_28",
    "name": "GP 4/4 #28",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "strum",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.75,
        "role": "strum",
        "stringHints": [
          5,
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": true,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.25,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "strum",
        "stringHints": [
          2,
          1
        ],
        "stringHint": null,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_29",
    "name": "GP 4/4 #29",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_30",
    "name": "GP 4/4 #30",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_31",
    "name": "GP 4/4 #31",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          4
        ],
        "stringHint": 4,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.5,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  },
  {
    "id": "gp_44_32",
    "name": "GP 4/4 #32",
    "source": "guitar_pro",
    "time_signature": "4/4",
    "subdivision": 16,
    "feel": "arpeggio",
    "events": [
      {
        "beat": 0.0,
        "dur": 0.5,
        "role": "bass",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 0.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.0,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 1.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.0,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 2.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.0,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          5
        ],
        "stringHint": 5,
        "accent": true,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.25,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          1
        ],
        "stringHint": 1,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.5,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          3
        ],
        "stringHint": 3,
        "accent": false,
        "dotted": false,
        "tuplet": false
      },
      {
        "beat": 3.75,
        "dur": 0.25,
        "role": "mid1",
        "stringHints": [
          2
        ],
        "stringHint": 2,
        "accent": false,
        "dotted": false,
        "tuplet": false
      }
    ]
  }
]
  };

  Object.keys(GP_IMPORTED_LIBRARY).forEach((meter) => {
    const extra = Array.isArray(GP_IMPORTED_LIBRARY[meter]) ? GP_IMPORTED_LIBRARY[meter] : [];
    if (!RHYTHM_LIBRARY[meter]) RHYTHM_LIBRARY[meter] = [];
    RHYTHM_LIBRARY[meter] = RHYTHM_LIBRARY[meter].concat(extra);
  });

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
