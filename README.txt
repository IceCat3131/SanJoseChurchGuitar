
召会诗歌吉他谱网站（前端框架版）
===============================

本压缩包是一个“空框架”：
- 已经包含首页、乐谱页、CSS、JS 逻辑
- **不包含任何 SVG / 歌词 JSON 文件**
- 你只需要把自己的乐谱和歌词文件按规则放到 assets 目录下即可使用

目录结构
--------

index.html        首页：列表 + 搜索
song.html         乐谱 / 歌词页
style.css         公共样式
assets/c/         大本诗歌吉他谱 SVG（例如 c0001_cn_g.svg）
assets/ts/        小本诗歌吉他谱 SVG（例如 ts0001_cn_g.svg）
assets/c_text/    大本诗歌歌词 JSON（例如 c_1_100.json、c_101_200.json ...）
assets/ts_text/   小本诗歌歌词 JSON（例如 ts_1_100.json、ts_101_200.json ...）

文件命名规则
------------

1. 乐谱 SVG
   - 大本：assets/c/c0001_cn_g.svg, c0002_cn_g.svg, ...
     * c = 大本（Chinese）
     * 0001 = 第 1 首，0002 = 第 2 首，以此类推
     * cn = 中文
   - 小本：assets/ts/ts0001_cn_g.svg, ts0002_cn_g.svg, ...

2. 歌词 JSON（每 100 首一个文件）
   - 大本：
       assets/c_text/c_1_100.json      // 1-100 首
       assets/c_text/c_101_200.json    // 101-200 首
       assets/c_text/c_201_300.json    // 201-300 首
       ... 以此类推
   - 小本：
       assets/ts_text/ts_1_100.json
       assets/ts_text/ts_101_200.json
       ...

   JSON 结构示例（数组）：
   [
     {
       "no": 1,
       "title": "开口赞美",
       "full_title": "补充本第1首 开口赞美 （英1095）",
       "lyrics": [
         {
           "section_no": "1",
           "lines": [
             "第一节第一行",
             "第一节第二行"
           ]
         },
         {
           "section_no": "2",
           "lines": [
             "第二节第一行",
             "第二节第二行"
           ]
         }
       ]
     },
     ...
   ]

访问方式
--------

用浏览器直接打开 index.html 即可预览本地版本。

部署到 GitHub Pages
-------------------

假设你的仓库名为：SanJoseChurchGuitar

1. 把本压缩包解压后的所有文件复制到仓库根目录：
   - index.html
   - song.html
   - style.css
   - README.txt
   - assets/（包含 c, ts, c_text, ts_text 目录）

2. 把你自己的 SVG / JSON 文件放到对应目录：

   - SVG：
       assets/c/c0001_cn_g.svg
       assets/c/c0002_cn_g.svg
       ...
       assets/ts/ts0001_cn_g.svg
       assets/ts/ts0002_cn_g.svg
       ...

   - 歌词 JSON：
       assets/c_text/c_1_100.json
       assets/c_text/c_101_200.json
       ...
       assets/ts_text/ts_1_100.json
       assets/ts_text/ts_101_200.json
       ...

3. 提交并推送到 GitHub。

4. 打开 GitHub 仓库的 Settings -> Pages：
   - Source 选择 "Deploy from a branch"
   - Branch 选择 main 分支，目录选择 / (root)
   - 保存

5. GitHub Pages 部署成功后，访问地址类似：
   https://你的用户名.github.io/你的仓库名/index.html

URL 规则
--------

- 首页列表： index.html
- 指定某首诗歌： song.html?book=c&no=3
  * book=c  表示大本
  * book=ts 表示小本
  * no 为 JSON 里的 "no" 字段

功能说明（简要）
----------------

首页
  - 顶部标题固定为 “召会诗歌吉他谱”
  - 搜索框：
      * 左侧 “大本 / 小本”：切换搜索范围 + 列表数据
      * 输入编号：输入数字（如 31）
      * 点击放大镜：在当前册中跳转至对应编号的乐谱页
  - 列表：
      * 自动读取多个 JSON（1-100、101-200、201-300...），按 no 排序显示
      * 行文字示例：大本诗歌 第 1 首 (c0001)

乐谱页
  - 顶部：
      * 左箭头：返回 index.html
      * < / >：上一首 / 下一首（自动读取对应 JSON）
      * 标题：使用 JSON 中的 "title" 字段；如果没有则显示 “大本诗歌 第 N 首”
  - 搜索框：与首页逻辑一致
  - 控制条：
      * “+ / -”：调节歌词字体大小
      * “吉他 / 歌词”：切换显示 SVG 乐谱或歌词文本
      * “简 / 繁”：一个按钮，默认歌词为简体，按钮显示“繁”；
         - 点击后：歌词切换为繁体，按钮变为“简”
         - 再次点击：切回简体，按钮变回“繁”
  - 内容区域：
      * 吉他模式：加载 SVG 文件，例如：
          大本：assets/c/c0001_cn_g.svg
          小本：assets/ts/ts0001_cn_g.svg
      * 歌词模式：按 JSON 结构渲染段落，左边显示段落号（1,2,3...），右边是多行歌词。
