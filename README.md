# GTZ 响应式测试站

## 说明
- 入口页：`index.html`
- 乐谱页：`song.html?file=./assets/c0001_cn_g.gtz`
- 当前版本重点完成：
  - 按路径读取 `.gtz`
  - 解析 `songpack-gtz`
  - 从 `score.data` / `scoreBase64` 解出 MusicXML
  - 交给 alphaTab 渲染
  - 响应式顶部工具栏
  - **“谱”按钮：五线谱 / 简谱切换，只切记谱显示，不新增轨道**

## 目录
- `assets/c0001_cn_g.gtz`：示例 GTZ
- `index.html`
- `song.html`
- `styles.css`
- `app.js`

## 关键点
1. `song.html` 用 `?file=` 读取 GTZ 路径。
2. 解析 GTZ 的 `viewerState/state`，恢复默认显示状态。
3. “谱”按钮只修改：
   - `showStandardNotation`
   - `showNumberedNotation`
   其余如 TAB / 和弦 / 歌词仍保持显示。
4. 当前 alphaTab 资源走 CDN。若你之后要本地化，可把 `song.html` 里的：
   - `alphaTab.js`
   - `ALPHATAB_ROOT`
   - `ALPHATAB_FONT`
   - `scriptFile`
   - `fontDirectory`
   改成本地路径即可。

## 建议测试方式
不要直接双击 html。
建议开一个本地静态服务器，例如：
- VS Code Live Server
- `python -m http.server 8000`

然后访问：
- `http://127.0.0.1:8000/index.html`
- `http://127.0.0.1:8000/song.html?file=./assets/c0001_cn_g.gtz`
