
// === 简繁体同步到谱面歌词（AlphaTab） ===

// 简单版转换（如果你后面要接 OpenCC，可以替换这里）
function toTraditional(text){
    // 这里只做示例，可后续换 opencc
    return window.OpenCC ? OpenCC.Converter({from:'cn',to:'tw'})(text) : text;
}
function toSimplified(text){
    return window.OpenCC ? OpenCC.Converter({from:'tw',to:'cn'})(text) : text;
}

function convertScoreLyrics(mode){
    const root = document.querySelector('#alphaTab');
    if(!root) return;

    const nodes = root.querySelectorAll('text, tspan');

    nodes.forEach(el=>{
        const txt = el.textContent;
        if(!txt) return;

        // 只处理包含中文的
        if(!/[\u4e00-\u9fa5]/.test(txt)) return;

        if(!el.dataset.originalText){
            el.dataset.originalText = txt;
        }

        let newText = el.dataset.originalText;
        if(mode === 'trad'){
            newText = toTraditional(newText);
        }else{
            newText = toSimplified(newText);
        }

        el.textContent = newText;
    });
}

// 在切换按钮时调用
window.applyScriptToScore = function(mode){
    convertScoreLyrics(mode);
};

// 在每次谱面加载后自动应用
document.addEventListener('alphaTabRenderFinished', ()=>{
    if(window.currentScriptMode){
        convertScoreLyrics(window.currentScriptMode);
    }
});
