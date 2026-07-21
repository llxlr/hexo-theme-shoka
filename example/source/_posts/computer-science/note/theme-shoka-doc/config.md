---
title: Step.2 基本配置
date: 2020/08/13 20:56:48
categories:
- [计算机科学, 二进制杂谈, Theme Shoka Documentation]
tags:
- Hexo
- 教程
valine:
  placeholder: "1. 提问前请先仔细阅读本文档⚡\n2. 页面显示问题💥，请提供控制台截图📸或者您的测试网址\n3. 其他任何报错💣，请提供详细描述和截图📸，祝食用愉快💪"
audio:
  - https://music.163.com/song?id=1387098940
---

:::primary
[:rocket:快速开始](/computer-science/note/theme-shoka-doc/) - [:love_letter:依赖插件](/computer-science/note/theme-shoka-doc/dependents/) - [**:pushpin:基本配置**](/computer-science/note/theme-shoka-doc/config/) - [:rainbow:界面显示](/computer-science/note/theme-shoka-doc/display/) - [:unicorn:特殊功能](/computer-science/note/theme-shoka-doc/special/) - [**:sparkles:魔改功能**](/computer-science/note/theme-shoka-doc/custom/)
:::


# 站点别称
```yml
alternate: Yume Shoka
```
这里设置的名称代替Logo，显示在页面顶部，以及页尾:copyright:处

# 静态文件目录
```yml
statics: / #//cdn.jsdelivr.net/gh/amehime/shoka@latest/
```
默认值是`/`，指使用本地静态文件
可以修改成`//cdn.jsdelivr.net/gh/您的github用户名/您的项目名@latest/`这种形式，以使用jsDelivr进行加速。
PS：jsDelivr并不是实时更新，重新生成文件后需要耐心等待

```yml
css: css
js: js
images: images
```
静态文件所处目录的实际目录名，这些一般不改。

# 夜间模式
```yml
darkmode: # true
```
默认情况下，是否开启夜间模式取决于（优先级从高到低）：
1. 访客点击页面头部切换按钮的自行选择
2. 访客切换了浏览设备的主题色调
3. 您的`darkmode`配置项

# 自动定位
```yml
auto_scroll: # false
```
默认情况下，再次打开页面时，会自动滚动到上次浏览的位置。
这个选项设为`false`时将停用此功能。

# 加载动画
```yml
# 是否显示页面加载动画loading-cat
loader:
  start: true # 当初次打开页面时，显示加载动画
  switch: true # tab切换到其他页面时，显示加载动画
```

tab切换后只是显示loading动画，实际并未重新加载页面

# 页面特效
单击页面的烟花效果配置如下

```yml
fireworks:
  enable: true # 是否启用
  color: # 烟花颜色
    - "rgba(255,182,185,.9)"
    - "rgba(250,227,217,.9)"
    - "rgba(187,222,214,.9)"
    - "rgba(138,198,209,.9)"
```

# 加载谷歌字体
```yml
font:
  enable: true
  # Font options:
  # `external: true` will load this font family from `host` above.
  # `family: Times New Roman`. Without any quotes.
  # `size: x.x`. Use `em` as unit. Default: 1 (16px)

  # Global font settings used for all elements inside <body>.
  global:
    external: true
    family: Mulish
    size:

  # Font settings for alternate title.
  logo:
    external: true
    family: Fredericka the Great
    size: 3.5

  # Font settings for site title.
  title:
    external: true
    family: Noto Serif JP
    size: 2.5

  # Font settings for headlines (<h1> to <h6>).
  headings:
    external: true
    family: Noto Serif SC
    size:

  # Font settings for posts.
  posts:
    external: true
    family:

  # Font settings for <code> and code blocks.
  codes:
    external: true
    family: Inconsolata
```

此功能基本参考NexT。
加粗标题的字体总是使用`Noto Serif`，为了正确友好的显示日文中的汉字，会先后加载`headings`和`title`的字体设置。

> llxlr 魔改版已将 Google Fonts CDN 从 `fonts.googleapis.com` 切换为 `fonts.geekzu.com`（国内镜像），提升中文字体加载速度。

# `iconfont`图标
主题没有直接使用Font Awesome，是因为用不到那么多icon感觉非常浪费，因此在Iconfont上重新建立了一个项目。
`font-family`设为`ic`，所有字体样式前缀为`i-`，具体参见`<root>/themes/shoka/source/css/_iconfont.styl`。

```yml
# project of https://www.iconfont.cn/
# //at.alicdn.com/t/font_1832207_c8i9n1ulxlt.css => 1832207_c8i9n1ulxlt
iconfont: "1832207_c8i9n1ulxlt"
```

如果需要添加或修改，请留言告诉我您的[Iconfont](https://www.iconfont.cn/)用户名，我将把您添加到目前的[项目](https://www.iconfont.cn/manage/index?manage_type=myprojects&projectId=1832207)中。

添加权限为`只读`，此后您可以任意全选，批量保存到购物车中，添加至您自己的项目里，并将主题配置文件中的`iconfont`值改为您的项目。

注意，您的项目应设置`FontClass/Symbol 前缀`为`i-`。

在`<root>/source/_data/`目录新建文件`iconfont.styl`，把新增或修改的图标样式复制到这个文件中。

> 自定义`iconfont.styl`文件将覆盖主题默认样式，为了避免出错，请保证原有样式名均存在，在原有样式基础上进行增删改。

# 菜单与社交按钮

```yml
menu:
  home: / || home
  about: /about/ || user
  posts:
    default: / || feather
    archives: /archives/ || list-alt
    categories: /categories/ || th
    tags: /tags/ || tags
  # friends: /friends/ || heart
  # links: /links/ || magic

social:
  github: https://github.com/yourname || github || "#191717"
  #google: https://plus.google.com/yourname || google
  twitter: https://twitter.com/yourname || twitter || "#00aff0"
  zhihu: https://www.zhihu.com/people/yourname || zhihu || "#1e88e5"
  music: https://music.163.com/#/user/home?id=yourid || cloud-music || "#e60026"
  weibo: https://weibo.com/yourname || weibo || "#ea716e"
  about: https://about.me/yourname || address-card || "#3b5998"
  #email: mailto:yourname@mail.com || envelope || "#55acd5"
  #facebook: https://www.facebook.com/yourname || facebook
  #stackoverflow: https://stackoverflow.com/yourname || stack-overflow
  #youtube: https://youtube.com/yourname || youtube
  #instagram: https://instagram.com/yourname || instagram
  #skype: skype:yourname?call|chat || skype
  #douban: https://www.douban.com/people/yourname/ || douban
```
如上，使用`||`作为分隔符，依次为 `链接 || 图标 || 颜色`。
注意，只需要写图标名称，如`github`，则会自动转换为`ic i-github`。
十六进制颜色码需要`""`包绕。

`menu` 支持一级子目录，子目录设置中的第一项必须为`default`，用来定义父级按钮的样式。

菜单显示文字可以在语言包中定义，[具体请戳这里](../display/#自定义语言包)


# 边栏配置

边栏可以选择在左侧，或右侧
修改头像文件的地址，相对于静态文件目录`images`中配置的路径。

```yml
sidebar:
  # Sidebar Position.
  position: left
  #position: right
  # Replace the default avatar image and set the url here.
  avatar: avatar.jpg
```

可以将自己的图片放在`<root>/source/_data/images/`目录，甚至以同名覆盖主题内默认的头像图片，[具体请戳这里](../display/#自定义主题图片)

# 底部widgets
目前页面底部可以显示两个小部件，即`随机文章`和`最近评论`。

```yml
widgets:
  random_posts: true # 显示随机文章
  recent_comments: true # 显示最近评论
```

# 字数及阅读时间统计

安装好`hexo-symbols-count-time`插件后，不需要修改站点配置文件，直接使用插件默认配置就行。

需要修改主题配置文件，找到两处`cout`，修改为`true`：

```yml
# 页尾全站统计
footer:
  since: 2010
  count: true

# 文章界面统计
post:
  count: true
```

# 文章评论

llxlr 魔改版支持 **Twikoo** 和 **Valine** 双评论系统，通过 `twikoo.enable` 开关切换。

## Twikoo（推荐）

自部署评论系统，支持邮件通知、反垃圾、管理面板。详见 [Shoka 主题添加 Twikoo 评论系统](/computer-science/hexo/shoka/twikoo/)。

```yml
twikoo:
  enable: true              # 启用 Twikoo（设为 false 则回退 Valine）
  mode: vercel               # 部署模式：vercel 或 tencent
  envId: https://your-domain.com/twikoo/backend
  region: "none"
  tagMeta:                   # 评论者身份标签（与 Valine 共用字段格式）
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

## Valine（回退方案）

当 `twikoo.enable: false` 时生效。[如何获取LeanCloud的appId和appKey](https://valine.js.org/quickstart.html)。

```yml
valine:
  appId: #Your_appId
  appKey: #Your_appkey
  placeholder: ヽ(○´∀`)ﾉ♪ # Comment box placeholder
  avatar: mp # Gravatar style : mp, identicon, monsterid, wavatar, robohash, retro
  pageSize: 10 # Pagination size
  lang: zh-CN
  visitor: true # 文章访问量统计
  NoRecordIP: false # 不记录IP
  serverURLs: # When the custom domain name is enabled, fill it in here
  powerMode: true # 默认打开评论框输入特效
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
    friend:
      # - hash of friend@email.com
    investor:
      # - hash of investor1@email.com
```

tag标签显示在评论者名字的后面，默认是`tagMeta.visitor`对应的值。
在`tagMeta`和`tagColor`中，除了`visitor`这个key不能修改外，其他key都可以换一换，但需要保证一致性。

```yml 举个栗子
  tagMeta:
    visitor: 游客
    admin: 管理员
    waifu: 我老婆
  tagColor:
    visitor: "#855194"
    admin: "#a77c59"
    waifu: "#ed6ea0"
  tagMember:
    admin:
      # - hash of admin@email.com
    waifu:
      # - hash of waifu@email.com
```

在文章Front Matter中也可以配置上述参数（Valine 和 Twikoo 均支持），访问该文章页面时，将覆盖全局配置。
尤其可以用来配置一个特殊的placeholder。

```yml
valine:
  placeholder: "1. 提问前请先仔细阅读本文档⚡\n2. 页面显示问题💥，请提供控制台截图📸或者您的测试网址\n3. 其他任何报错💣，请提供详细描述和截图📸，祝食用愉快💪"
---
```

对于 Valine，评论通知与管理工具建议使用这个[Valine-Admin](https://github.com/DesertsP/Valine-Admin)。
注意`SITE_URL`需要以`/`结尾。

如果某一篇文章需要关闭评论功能，则在文章Front Matter中配置：

```yml
---
title: 关闭评论
comment: false
---
```

# 背景音乐
在主题配置文件中，设置全局播放列表。
在文章的 Front Matter 中，设置文章专有播放列表，访问该文章页面时，将覆盖全局配置。

```yml 单列表
audio:
  - https://music.163.com/song?id=1387098940
  - https://music.163.com/#/playlist?id=2088001742
  - https://www.xiami.com/collect/250830668
  - https://y.qq.com/n/yqq/playsquare/3535982902.html
```
如上，可以直接使用网易云、虾米、QQ音乐的播放列表、单曲，可以同时填写多个。

```yml 多列表
audio:
  - title: 列表1
    list:
      - https://music.163.com/#/playlist?id=2943811283
      - https://music.163.com/#/playlist?id=2297706586
  - title: 列表2
    list:
      - https://music.163.com/#/playlist?id=2031842656
```

如果需要自定义媒体文件，可以按照以下格式填写：

```yml 单列表
audio:
  - name: "曲目1"
    url: "播放地址"
    artist: "艺术家"
    cover: "封面"
    lrc: "歌词"
  - name: "曲目2"
    url: "播放地址"
    artist: "艺术家"
    cover: "封面"
    lrc: "歌词"
```

```yml 多列表
audio:
    - title: 列表1
      list:
        - name: "曲目1"
          url: "播放地址"
          artist: "艺术家"
          cover: "封面"
          lrc: "歌词"
        - name: "曲目2"
          url: "播放地址"
          artist: "艺术家"
          cover: "封面"
          lrc: "歌词"
    - title: 列表2
      list:
        - https://music.163.com/#/playlist?id=2031842656
```

如果要关闭当前页面的背景音乐播放器，则在文章Front Matter中配置：

```yml
---
title: 关闭背景音乐
audio: false
---
```

# 随机图库
- 默认的图片列表位于`<root>/themes/shoka/_images.yml`中。
  使用了渣浪图库，使用一些上传工具，比如[这里](https://pic.gimhoy.com/)
  上传后图片的链接是`http://wx4.sinaimg.cn/large/6833939bly1gicmnywqgpj20zk0m8dwx.jpg`。
  只需要新一行写上`- 6833939bly1gicmnywqgpj20zk0m8dwx.jpg`。

  如果想要自定义，则在`<root>/source/_data/`目录新建一个`images.yml`文件，这个文件中的图片至少6枚，将完全覆盖默认的图片列表。

- 也可以直接在图片列表yml文件中，写上任意外链图片地址
```yml
- https://i.loli.net/2020/10/30/qAMYEFXxJcKRsiG.gif
- https://i.loli.net/2020/10/30/rjdhcSgEN8COBPA.jpg
- https://i.loli.net/2020/10/30/HKyzSd7NI3mlBpt.jpg
- https://i.loli.net/2020/10/30/Y1CBXqgeokEs457.jpg
- https://i.loli.net/2020/10/30/Z5W6r2BSoiThHG1.jpg
```

- 也可以在主题配置文件中，设置图床API：
```yml 比如
image_server: "https://acg.xydwz.cn/api/api.php"
```

# Meting API

llxlr 魔改版将音乐播放器的 Meting API 地址改为可配置项。

```yml
meting_api: https://api.i-meto.com/meting/api
```

# 魔改功能快速参考

以下为 llxlr 魔改版新增的配置项简要参考，详细用法见 [:sparkles:魔改功能](custom/)。

```yml
# AI 摘要（需配合 hexo-ai-summary-liushen）
ai_summary:
  enable: true
  title: AI 摘要

# 文章时效性检查
isOutdated:
  enable: true
  days: 30

# 不蒜子访问统计
footer:
  busuanzi: true

# ICP / 公安备案
footer:
  beian:
    icp:
      enable: true
      text: 苏ICP备XXXXXXXX号-X
      link: https://beian.miit.gov.cn/

# 自定义版权
creative_commons:
  license: by-nc-sa
  language: deed.zh

# 本地搜索（博客 _config.yml）
local_search:
  enable: true
  per_page: 10

# 表格分页 + 图表自动编号
typesetting:
  enable: true
  table:
    pageSize: 5
```

# 加载第三方组件
```yml
vendors:
  css:
    # 略略略
  js:
    # 略略略
```
包括

--|--|--
`pace` | 加载进度条|全局
`pjax` | 页面无刷新加载|全局
`anime` | js动画效果|全局
`algolia` `instantsearch`| 基于algolia的站内搜索|全局
`lazyload` | 图片懒加载|全局
`quicklink` | 链接资源预加载|全局
`fetch` | 获取播放列表|全局
`busuanzi` | 不蒜子访问量统计|全局
`heti` | 赫蹏中文排版优化|按需
`katex` `copy_tex`|数学公式显示及复制|按需
`fancybox` | 图片放大显示及排列|按需
`twikoo` | 基于Twikoo的评论系统及文章阅读次数统计|按需
`valine` | 基于LeanCloud的评论系统及文章阅读次数统计（回退方案）|按需
`chart` | 图表显示|按需

以上文件加载全部基于jsDelivr，并对全局加载的组件进行了文件合并。
如果不明白啥意思，则不要轻易修改。

:::danger
主题版本升级的时候，可能会修改这里。
如果修改过主题默认`_config.yml`，记得更新主题时，末尾的`vendors`也要及时修改。
:::
