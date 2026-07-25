---
title: Step.5 llxlr 魔改功能
date: 2026-07-21 00:00:00
updated: 2026-07-21
categories:
- [计算机科学, 二进制杂谈, Theme Shoka Documentation]
tags:
- Hexo
- 教程
- Shoka
---

:::primary
[:rocket:快速开始](/computer-science/note/theme-shoka-doc/) - [:love_letter:依赖插件](/computer-science/note/theme-shoka-doc/dependents/) - [:pushpin:基本配置](/computer-science/note/theme-shoka-doc/config/) - [:rainbow:界面显示](/computer-science/note/theme-shoka-doc/display/) - [:unicorn:特殊功能](/computer-science/note/theme-shoka-doc/special/) - [**:sparkles:魔改功能**](/computer-science/note/theme-shoka-doc/custom/)
:::

:::info
本文档记录自 2022 年 8 月 fork [amehime/hexo-theme-shoka](https://github.com/amehime/hexo-theme-shoka) 以来，llxlr (James Yang) 添加的**全新功能**（原版完全不存在）。对已有功能的修改调整已分散融入前四篇文档。

配套渲染器已从 `hexo-renderer-multi-markdown-it` 迁移至自 fork 的 [`@llxlr/hexo-mdit`](https://github.com/llxlr/hexo-mdit)。
:::

# 评论系统：Twikoo

将评论系统从 MiniValine（LeanCloud 后端）替换为自部署的 [Twikoo](https://twikoo.js.org/)。

**依赖**：`twikoo`（通过主题 vendor 加载，版本 1.7.7，使用 `twikoo.nocss.js`）

**配置**（`_config.shoka.yml`）：

```yml
twikoo:
  enable: true              # 启用 Twikoo（设为 false 则回退 Valine）
  mode: vercel               # vercel 或 tencent
  envId: https://your-domain.com/twikoo/backend
  region: "none"
  tagMeta:
    visitor: 新朋友
    master: 主人
    friend: 小伙伴
    investor: 金主粑粑
  tagColor:
    master: "var(--color-orange)"
    friend: "var(--color-aqua)"
    investor: "var(--color-pink)"
  tagMember:
    master:
      # - hash of master@email.com
```

:::warning
Twikoo 使用 `nocss` 版本，所有样式由主题 `twikoo.styl`（2063 行）完全控制，支持暗黑模式。
:::

**核心文件**：

| 文件 | 作用 |
|------|------|
| `themes/shoka/source/css/_common/components/third-party/twikoo.styl` | Twikoo 完整样式（Element UI 组件 + OwO 表情 + 暗黑模式） |
| `themes/shoka/layout/_macro/comment.njk` | 评论区域 Nunjucks 模板 |
| `themes/shoka/source/js/_app/pjax.js` | Pjax 下 Twikoo 初始化 + 最近评论渲染 |
| `themes/shoka/source/js/_app/page.js` | 评论区懒加载 |

**设计要点**：

- 与 Valine 共存：`twikoo.enable: true` 时使用 Twikoo，`false` 时回退 Valine
- Pjax 兼容：`twikoo.init()` 必须在 `twikoo.getRecentComments()` 之前调用；`.twikoo` 容器由 JS 动态创建，不应出现在 Pjax selectors 中
- 最近评论通过 `twikoo.getRecentComments()` API 异步获取，在 `pjax.js:siteRefresh()` 中统一处理

详细迁移过程见 [Shoka 主题添加 Twikoo 评论系统](/computer-science/hexo/shoka/twikoo/)。

## Twikoo 标签功能

在评论中实现自定义标签颜色和徽章，支持根据评论者邮箱哈希分配不同身份标签（主人/小伙伴/金主粑粑/访客）。

**实现**：`pjax.js` 中 `applyTagColors()` 通过 CSS 自定义属性注入标签颜色，`addTwikooTags()` 为已知访客注入 `.tk-tag-*` 元素。使用 `MutationObserver` 监听评论渲染（异步 DOM），`setTimeout` 兜底。

# 搜索增强：本地搜索

新增纯前端本地搜索功能，与 Algolia 形成双模式互补。

**依赖**：无外部依赖，纯前端实现

**配置**（博客 `_config.yml`）：

```yml
local_search:
  enable: true               # 启用本地搜索
  path: /search.json         # 搜索数据文件路径
  top_n_per_article: 1       # 每篇文章最多展示匹配片段数
  unescape: false            # HTML 反转义
  preload: false             # 页面加载时预取搜索数据
  per_page: 10               # 每页结果数
```

**核心文件**：

| 文件 | 作用 |
|------|------|
| `themes/shoka/scripts/generaters/search-data.js` | Hexo generator，构建时生成 `search.json` |
| `themes/shoka/source/js/_app/local-search.js` | `LocalSearch` 类（435 行），搜索引擎核心 |
| `themes/shoka/source/js/_app/page.js` | `searchController()` 统一搜索入口，双模式切换 |
| `themes/shoka/source/css/_common/components/third-party/search.styl` | 搜索样式 + 关键词高亮 |

**设计要点**：

- 双模式标签：仅当 Algolia 和本地搜索均可用时显示切换标签
- 预加载/懒加载：`preload: false` 时仅在用户首次打开搜索弹窗时 fetch `search.json`
- 关键词高亮：搜索结果页 URL 携带 `?highlight=`，文章页通过 TreeWalker 定位并高亮
- Pjax 兼容：监听 `pjax:success` 自动对新页面执行关键词高亮

详细实现见 [Shoka 主题添加本地搜索功能](/computer-science/hexo/shoka/local-search/)。

# AI 摘要

通过 DeepSeek R1 / SiliconFlow API 自动生成文章摘要，显示在文章标题下方，带打字机效果动画。

**依赖**：[`hexo-ai-summary-liushen`](https://www.npmjs.com/package/hexo-ai-summary-liushen)

**配置**（`_config.shoka.yml`）：

```yml
ai_summary:
  enable: true
  title: AI 摘要
  loadingText: AI 正在绞尽脑汁想思路 ING···
  modelName: DeepSeek R1
```

**核心文件**：

- `themes/shoka/layout/_partials/post/ai-summary.njk` — 摘要卡片模板（macOS 风格三色圆点 + "关于 AI" 链接）
- `themes/shoka/source/css/_common/components/post/ai-summary.styl` — 样式（含夜间模式配色）
- `themes/shoka/source/js/_app/summary.js` — 打字机效果（`typeTextMachineStyle` / `typeText` / `renderAISummary`）

文章摘要来自 front-matter 的 `summary` 字段（由 `hexo-ai-summary-liushen` 在构建时注入），主题仅负责展示。

# 代码块增强

## 浏览器内运行代码

在代码块右上角添加 `▶ Run` 按钮，支持 JavaScript、Python、Lua、Silq、R、Fortran 六种语言在浏览器内直接运行。

**依赖**：PrismJS toolbar 插件，各语言对应 WASM/CDN 运行时。

### 配置

主题 `_config.yml` 中通过 `runner` 节统一管理：

```yml
runner:
  enable: true
  languages:
    javascript:
      enable: true
    python:
      enable: true
      cdn: "https://cdn.jsdelivr.net/pyodide/v314.0.0/full/pyodide.js"
      packages:
        - numpy
        - pandas
        - scipy
        - sympy
        - matplotlib
        - requests
        - beautifulsoup4
        - lxml
        - scikit-learn
        - biopython
      micropip_packages:
        - "/dist/simpleaudio-1.0.4-cp314-cp314-emscripten_5_0_3_wasm32.whl"
    r:
      enable: false
      cdn: "https://webr.r-wasm.org/latest/webr.mjs"
    lua:
      enable: false
      cdn: "https://cdn.jsdelivr.net/npm/wasmoon@1.16.0/dist/index.js"
    silq:
      enable: false
      cdn: "https://cdn.jsdelivr.net/npm/@llxlr/silq/silq.js"
    fortran:
      enable: false
      cdn: "https://dev.lfortran.org/lfortran.js"
      wasm_cdn: "https://dev.lfortran.org/"
```

| 字段 | 说明 |
|------|------|
| `runner.enable` | 总开关，`false` 时完全不加载 runner 脚本 |
| `runner.preload_grace_ms` | 页面加载后延迟多少毫秒开始后台预加载 WASM（默认 `5000`） |
| `runner.preload_gap_ms` | 多个运行时预加载之间的间隔毫秒（默认 `3000`） |
| `languages.<lang>.enable` | 单个语言的运行时开关，关闭后代码块不显示 Run 按钮 |
| `languages.<lang>.cdn` | 覆盖该语言运行时的 CDN 地址（缺失时使用内置默认值） |
| `languages.python.packages` | Pyodide 预装的 Python 包列表 |
| `languages.python.micropip_packages` | 通过 micropip 额外安装的 `.whl` 包 |
| `languages.fortran.wasm_cdn` | LFortran WASM 文件的基础路径 |

### 单块强制启用

在代码块信息中加上 `runnable:true` 参数，即使该语言未在 `languages` 中启用也会显示 Run 按钮：

~~~raw
```javascript runnable:true
console.log("Hello Shoka!");
```
~~~

### Front-matter 按页面覆盖

```yml
# 整页禁用所有运行按钮
runner: false

# 按语言覆盖（本页关闭 Python，开启 R）
runner:
  languages:
    python:
      enable: false
    r:
      enable: true
```

### 核心文件

| 文件 | 作用 |
|------|------|
| `themes/shoka/source/js/runner.js` | 多语言运行时引擎（JS Worker、Pyodide、WebR、Wasmoon、Silq WASM、LFortran） |
| `themes/shoka/source/js/_app/page.js` | `runnerBtn` 在 `.operation` 工具栏渲染运行按钮 |
| `node_modules/@llxlr/hexo-mdit/lib/renderer/markdown-it-prism/index.js` | 解析 `runnable:true` 参数，设置 `data-runnable` 属性 |

### 运行时

| 语言 | 运行时 | 说明 |
|------|--------|------|
| JavaScript | Web Worker 沙箱 | 独立线程执行，可真正中断 |
| Python | Pyodide | 含 numpy、pandas、scipy、matplotlib 等科学计算栈 |
| R | WebR | 支持图形输出 |
| Lua | Wasmoon | WASM 编译的 Lua 5.4 |
| Silq | WASM | 量子计算模拟 |
| Fortran | LFortran | WASM 编译执行 |

- Python 支持 matplotlib 图表输出和 `to_jshtml()` 动画
- 页面含对应语言代码块时，后台自动预加载 WASM 运行时
- 运行中图标切换为暂停，可随时中断

## 命令行提示符

为代码块添加命令行提示符（如 `$` 和 `#`），区分用户输入和系统输出：

~~~raw
```bash command:("[root@localhost] $":1,9-10||"[admin@remotehost] #":4-6)
pwd
/usr/home/chris/bin
ls -la
...
```
~~~

## 文件引入

从文件系统引入代码文件，支持行范围选择：

~~~raw
```javascript file:src/example.js from:1 to:20 mark:5,10 first_line:1
```
~~~

参数：`file:路径`（相对于 `source/_code/`）、`from:起始行`、`to:结束行`、`mark:高亮行`、`first_line:起始行号`。

## Silq 语言支持

在 PrismJS 中新增 Silq 量子计算语言高亮支持。通过构建脚本 `utils/lib/` 中的自定义 prism.js 构建注入到 `node_modules/prismjs/`。同时预加载 `diff` 语言定义，消除 Diff Highlight 插件的控制台警告。

# 图表自动编号与表格分页

## 图表自动编号

实现基于 CSS counter 的图表自动编号（"图 X-Y" / "表 X-Y"），支持 i18n。

**依赖**：无外部依赖，纯 CSS + JS 实现

**配置**：自动生效，多语言标签在 `themes/shoka/languages/` 中定义：

```yml
typesetting:
  table: 表
  figure: 图
```

**核心文件**：

| 文件 | 作用 |
|------|------|
| `themes/shoka/source/css/_common/components/third-party/typesetting.styl` | CSS counter 定义（section、table、figure） |
| `themes/shoka/source/css/_common/scaffolding/tables.styl` | `table{counter-increment:table}` + `caption::before` |
| `themes/shoka/source/css/_common/components/post/expand.styl` | `.image-info::before` 的 `counter-increment:figure` |
| `themes/shoka/source/js/_app/typesetting.js` | `TablePaginationManager` + `FigureLabelManager` |
| `themes/shoka/source/js/_app/page.js:108` | `postFancybox()` 创建 `.image-info` 时直接设 `data-type` |

**设计要点**：

- 所有三个计数器（section、table、figure）定义在 `h2` 元素上
- `counter-set: table 0` 替代 `counter-reset: table`——避免 CSS 压缩器（clean-css）合并同名属性
- `counter-increment: section` 在 `h2` 自身而非 `::before`（兼容性）
- `counter-increment: table` 在 `table` 上（确保无 `<caption>` 时也递增）
- `FigureLabelManager` 补设异步创建的 `.image-info` 的 `data-type`

## 表格分页

长表格自动分页，每页 N 行（默认 5 行），支持翻页导航。

**配置**（`_config.shoka.yml`）：

```yml
typesetting:
  table:
    enable: true
    pageSize: 5
    pageInfo: '第 ${current} 页，共 ${total} 页'
```

**实现**：`TablePaginationManager`（`typesetting.js`）自动检测表格行数，超过阈值时注入分页 DOM（上一页/下一页按钮、页码、页信息）。通过 `pjax.js:siteRefresh()` 在每次导航后重新初始化。

# 文章时效性检查

自动检测文章是否过时，在正文顶部显示警告框。

**配置**（`_config.shoka.yml`）：

```yml
isOutdated:
  enable: true
  days: 30                # 超过 N 天未更新则显示警告
```

单篇文章可通过 Front Matter 控制：

```yml
---
isOutdated: false           # 关闭单篇文章的时效性检查
---
```

**实现**：`global.js` 中 `isOutdated()` 函数读取页面 `<time>` 元素的发布日期和更新日期，计算与当前时间的天数差，超过阈值则在 `.body.md` 开头插入警告模板。i18n 模板定义在 `languages/*.yml` 的 `outime.template` 键中。

详细说明见 [Shoka 主题添加检查文章时效性](/computer-science/hexo/shoka/is-outdated/)。

# 不蒜子访问统计

纯前端访问量统计，无需后端。

**配置**（`_config.shoka.yml`）：

```yml
footer:
  busuanzi: true
```

**实现**：`scripts/injectors/head.js` 注入不蒜子 JS 脚本，`layout/_partials/footer.njk` 渲染站点 PV/UV 容器。

# ICP + 公安备案

支持中国大陆 ICP 备案号、公安备案号和萌备案号显示。

**配置**（`_config.shoka.yml`）：

```yml
footer:
  beian:
    icp:
      enable: true
      text: 苏ICP备XXXXXXXX号-X
      link: https://beian.miit.gov.cn/
    police:
      enable: true
      text: 苏公网安备 XXXXXXXXXXXX号
      link: https://www.beian.gov.cn/
    moe:
      enable: true
      text: 萌ICP备20251312号
      link: https://icp.gov.moe/
```

**实现**：`layout/_partials/footer.njk` 渲染备案信息，使用 SVG 图标（`#i-icp`、`#i-police`、`#i-moe`）。样式在 `footer.styl` 中。

# 自定义版权声明

在文章底部显示版权信息，支持 Creative Commons 许可和禁止转载模式。

**配置**（`_config.shoka.yml`）：

```yml
creative_commons:
  license: by-nc-sa
  language: deed.zh
```

文章 Front Matter 控制：

```yml
---
copyright: true           # 禁止转载模式
copyright: false          # 隐藏版权块
---
```

**实现**：`layout/_partials/post/copyright.njk` 模板渲染，`page.js` 中 copy 事件处理程序在复制时向剪贴板追加版权信息。

# 赫蹏排版

引入[赫蹏](https://github.com/sivan/heti)（heti）中文字体排版优化，自动处理中西文间距、标点挤压等。

**依赖**：`heti`（通过主题 vendor 加载，CDN：`npm/heti/umd/heti.min.css` + `heti-addon.min.js`）

**配置**：文章 Front Matter 中 `heti: true` 启用。

**实现**：`pjax.js:siteRefresh()` 中通过 `vendorJs` / `vendorCss` 按需加载。

# 单词拼读

为英文单词添加点击发音功能，支持拼读、整词、混合三种模式。

**语法**：

```raw
[hello]{.pronounce}
[hello]{.pronounce data-mode=word}
[hello]{.pronounce data-lang=ja-JP data-rate=0.6}
```

**参数**：

| 属性 | 说明 | 默认值 |
|------|------|--------|
| `data-mode` | `spell`（逐字母）/ `word`（整词）/ `full`（词→拼→词） | `spell` |
| `data-lang` | 发音语言（如 `en-US`、`ja-JP`） | `en-US` |
| `data-rate` | 语速 | `0.8` |

**依赖**：Web Speech API（浏览器原生）

**核心文件**：

- `scripts/filters/pronounce.js` — 过滤器，将 `.pronounce` span 转换为带 data 属性的交互元素
- `source/assets/js/pronounce.js` — 前端发音引擎
- `themes/shoka/source/css/_common/components/post/pronounce.styl` — 样式

# 自动夜间模式

根据浏览器/系统的 `prefers-color-scheme` 媒体查询自动切换夜间模式。

**配置**：

```yml
darkmode: true
```

优先级：用户手动切换 > 浏览器主题 > 配置项。实现于 `global.js` 的 `autoDarkmode` 函数。

# Live2D 看板娘控制

添加看板娘显示/隐藏切换按钮，支持多个 Live2D 元素。

**实现**：`global.js` 中切换按钮逻辑，通过 `requestIdleCallback` 加载 Live2D 挂件（`cdn1.white-album.top/live2d/autoload.js`）。

# 页面下拉箭头

页面顶部下滚指示箭头，引导访客下滑浏览。实现于侧边栏按钮组。

# 手机浏览器顶栏颜色沉浸

`<meta name="theme-color">` 配置，使手机浏览器顶栏颜色与主题色匹配。

```yml
theme_color: "#e9546b"
```

# QQ 卡片链接

支持 QQ 聊天链接（`tencent://message/?uin=`），在文章中可添加 QQ 联系卡片。

# Cloudflare CDN 节点信息

自动获取 Cloudflare CDN 边缘节点信息（`colo`、`loc`），在页脚显示访问者连接的 CDN 节点位置。

**实现**：`global.js` 中 `getCDNinfo()` 函数从 CF 元数据端点获取并渲染。

# Google Analytics

通过 `gtag.js` 集成 Google Analytics 4。

**配置**：

```yml
google_analytics:
  enable: true
  id: G-XXXXXXXXXX
```

# 新标签插件

以下是原版完全不存在的全新 Hexo 标签插件。

## pan 网盘标签

多网盘分享链接卡片，支持自动复制提取码、多列自适应布局。

**语法**：

```raw
&#123;% pan type:baidu title:文件名 size:1.2GB link:https://pan.baidu.com/s/xxx code:1234 %&#125;
```

**参数**：`type`（网盘类型）、`title`（文件名）、`size`（文件大小）、`link`（分享链接）、`code`（提取码）、`logo`（自定义图标）。

点击后等待 3 秒，自动复制提取码到剪贴板，然后打开链接。网盘列表配置在 `<root>/source/_data/pan.yml`（支持 15 种网盘：baidu、aliyun、lanzou、onedrive、123、quark 等）。

相邻网盘卡片通过 `.pan-row` 容器实现多列自适应布局。

## GK (游戏知识) 标签

游戏/物品信息卡片，支持字段映射和描述渲染。

**语法**：

```raw
&#123;% gk "figure" %&#125;
- title: 初音未来
  manufacturer: Good Smile Company
  price: ¥4,800
  release: 2023-03
&#123;% endgk %&#125;
```

字段定义在 `<root>/source/_data/gk.yml`，支持 `figure`、`desktop`、`doll`、`ukulele`、`radio` 等分类。也可通过 `&#123;% gkfile "path" "section" %&#125;` 从数据文件加载。

## moequote 引用标签

带渐变文字的样式化引用块。

**语法**：

```raw
&#123;% moequote "出处" %&#125;
渐变色引用文字内容
&#123;% endmoequote %&#125;
```

**实现**：`scripts/tags/moequote.js`，渲染 `<figure class="moequote">` 含动画容器。

## media 黑胶唱片封面

为音频播放器新增 `disc=` 参数，支持为每张专辑指定自定义黑胶盘面图像。

**语法**：

```raw
&#123;% media audio disc=/images/vinyl/O1.png %&#125;
- title: 专辑名
  list:
    - https://music.163.com/#/playlist?id=xxx
&#123;% endmedia %&#125;
```

**数据流**：`media.js`（tag 解析 `disc=` → `data-disc` HTML 属性）→ `player.js`（读取 `data-disc` → 设置 `--disc-image` CSS 变量）→ `player.styl`（`var(--disc-image, url(play_disc.png))` 带 fallback）。

还扩展支持更多音乐平台（酷狗、酷我等），优化数据获取逻辑和容错处理。

详细说明见 [Shoka 主题自定义黑胶唱片封面](/computer-science/hexo/shoka/custom-disc/)。

## summary / abstract 摘要标签

在文章中插入可折叠摘要块。

**语法**：

```raw
&#123;% summary 点击展开摘要 %&#125;
这里是摘要内容
&#123;% endsummary %&#125;
```

`abstract` 标签用法类似，渲染 `<fieldset><legend>` 包裹的样式化摘要框。

## DogeCloud 视频标签

嵌入 DogeCloud（多吉云）视频播放器。

**语法**：

```raw
&#123;% dogecloud userId:12345 vcode:abc123 pic:/cover.jpg autoPlay:false %&#125;
```

**依赖**：DogeCloud Player SDK（通过标签自动注入 `<head>`）。

## quiz 选项随机打乱

在 `.quiz` 标签中加入 `.shuffle` 即可随机打乱选项顺序：

```raw
2. 题目内容  {.quiz .multi .shuffle}
    - 选项A {.correct}
    - 选项B
{.options}
```

使用 Fisher-Yates 算法在 `page.js:shuffleQuizOptions()` 中实现。

## 算法题排版

支持算法题（Algorithm Problem）的特定排版样式，题型标签（choice/multiple/true_false/essay/gap_fill/explan/brief/soln/proof/algorithm）的 i18n 定义在 `languages/*.yml` 的 `quiz.*` 键中。

## 检查列表彩色

检查列表支持主题色：

```raw
- [ ] 未完成
- [x] 完成
{.primary}
```

# 渲染器：@llxlr/hexo-mdit

fork 自 `hexo-renderer-multi-markdown-it`，仓库地址 [llxlr/hexo-mdit](https://github.com/llxlr/hexo-mdit)。

## 新增插件

相比原版，新增以下 markdown-it 插件：

| 插件 | 功能 |
|------|------|
| `markdown-it-pangu` | 中英文自动空格 |
| `markdown-it-chart` | Frappe Charts 图表渲染 |
| `markdown-it-graphviz` | Graphviz 流程图渲染 |
| `markdown-it-excerpt` | 文章摘要提取 |
| `markdown-it-images` | 图片尺寸/懒加载增强 |

## Bug 修复

### markdown-it-attrs：表格 colspan 计算

修复 `tables tbody calculate` 模式中 colspan 计算的 bug：当表格行中唯一单元格的 colspan 覆盖所有列时，原公式产生负索引回绕导致该单元格被错误隐藏（`<tr></tr>` 空行）。修复用 `off + real` 替代有问题的公式，并添加边界检查。补丁目标：`node_modules/markdown-it-attrs/patterns.js`。

### markdown-it-furigana：贪心匹配

修复 `ruby.js` 中 `parse()` 函数对 `{...^...}` 语法的贪心匹配 bug：在找到 `^` 之前遇到 `}`（如 `{.pronounce}` 属性块）时，原实现会继续向后扫描直到下一个 `^`，将中间文本错误合并为 ruby body。修复后遇到未匹配的 `}` 时立即返回 `null`。补丁目标：`node_modules/@llxlr/hexo-mdit/lib/renderer/markdown-it-furigana/lib/ruby.js`。

### prismjs：Silq 语言 + diff 预加载

通过构建脚本将自定义 prism.js（含 Silq 量子计算语言支持）注入 `node_modules/prismjs/`，并预加载 `diff` 语言定义消除 Diff Highlight 控制台警告。

## CSS 压缩器

内置 clean-css 5.3.3 压缩输出 CSS，默认 `level: 1`。

> **注意**：同名 CSS 属性会被合并。图表自动编号使用 `counter-set: table 0` 而非第二个 `counter-reset: table`，正是因为 `counter-set` 和 `counter-reset` 是不同的属性名，压缩器不会合并。

## 补丁管理

所有对 `node_modules/` 的修改均通过 `utils/lib/` 中的补丁文件管理，由 `utils/build.bat`（Windows）在构建前自动应用。**永远不要直接编辑 `node_modules/`。**

> 例外：`node_modules/hexo-shoka-swiper/index.js` 已直接修改以修复轮播图 Pjax 兼容性。`pnpm install` 后会丢失此修改，需重新应用。

# 部署插件

## hexo-deployer-wrangler

通过 Wrangler CLI (v4+) 将 Hexo 站点部署到 Cloudflare Pages 或 Workers。支持三种认证方式（API Token / OAuth / Global API Key），配置优先级为命令行 > `_config.yml` > `wrangler.toml`。详见 [hexo-deployer-wrangler 部署指南](/computer-science/hexo/shoka/wrangler-deployer/)。

## hexo-shoka-swiper

为 Shoka 主题定制的 Swiper 轮播图插件，支持首页推广轮播（`swiper_index` front-matter）和文章内轮播（`swiper` / `slide` 标签），完整适配 Pjax。详见 [hexo-shoka-swiper 使用指南](/computer-science/hexo/shoka/swiper/)。

# Pjax 通用适配

Shoka 主题深度使用 Pjax 实现无刷新导航。我们总结了一套**三层适配架构**和两个隐蔽陷阱（`getScript` 同步/异步不对称、JavaScript 静态快照）。详见 [Shoka 主题 Pjax 通用适配指南](/computer-science/hexo/shoka/pjax-universal-adaptation/)。

# 相关文章

- [Shoka 主题添加 Twikoo 评论系统](/computer-science/hexo/shoka/twikoo/)
- [Shoka 主题添加本地搜索功能](/computer-science/hexo/shoka/local-search/)
- [Shoka 主题添加检查文章时效性](/computer-science/hexo/shoka/is-outdated/)
- [Shoka 主题自定义黑胶唱片封面](/computer-science/hexo/shoka/custom-disc/)
- [Shoka 主题 Pjax 通用适配指南](/computer-science/hexo/shoka/pjax-universal-adaptation/)
- [hexo-deployer-wrangler 部署指南](/computer-science/hexo/shoka/wrangler-deployer/)
- [hexo-shoka-swiper 使用指南](/computer-science/hexo/shoka/swiper/)
