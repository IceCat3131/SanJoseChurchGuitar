
(function(){
  const RHYTHM_LIBRARY = {
    '4/4': [
      { id:'arp_53231323', name:'分解 53231323', type:'arpeggio', steps:['5','3','2','3','1','3','2','3'], difficulty:1 },
      { id:'arp_53212323', name:'分解 53212323', type:'arpeggio', steps:['5','3','2','1','2','3','2','3'], difficulty:1 },
      { id:'strum_basic_44', name:'扫弦 基础', type:'strum', steps:['↓','↓','↑','↑','↓','↑'], difficulty:1 },
      { id:'strum_pop_44', name:'扫弦 流行', type:'strum', steps:['↓','-','↓↑','-','↑↓↑'], difficulty:2 }
    ],
    '3/4': [
      { id:'arp_531531', name:'分解 531531', type:'arpeggio', steps:['5','3','1','5','3','1'], difficulty:1 },
      { id:'strum_waltz_34', name:'扫弦 华尔兹', type:'strum', steps:['↓','↓','↑'], difficulty:1 }
    ],
    '6/8': [
      { id:'arp_654321', name:'分解 654321', type:'arpeggio', steps:['6','5','4','3','2','1'], difficulty:1 },
      { id:'strum_68', name:'扫弦 6/8', type:'strum', steps:['↓','↓↑','↓↑'], difficulty:1 }
    ]
  };
  function getPatternsForMeter(meter){ return RHYTHM_LIBRARY[meter] || RHYTHM_LIBRARY['4/4']; }
  function getDefaultPattern(meter){ return getPatternsForMeter(meter)[0]; }
  window.RhythmEngine = { RHYTHM_LIBRARY, getPatternsForMeter, getDefaultPattern };
})();
