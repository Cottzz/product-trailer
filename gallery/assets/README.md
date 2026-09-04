# gallery/assets — AI 视觉素材提示词手册 / AI Visual Asset Prompt Kit

本目录存放 gallery 页（`https://cottzz.github.io/product-trailer/gallery/`）使用的**本地图片素材**。
页面引用本目录下的固定文件名；文件**不存在或加载失败时自动回退**到 GitHub Release 上的渲染帧，所以页面永远可用。
当你用 ChatGPT（GPT-4o / DALL·E / 任意文生图工具）按下方提示词生成图片后，**按精确文件名放入本目录**，提交推送即生效，无需改动任何代码。

This folder holds the **local images** used by the gallery page. The page references the exact
filenames below; if a file is missing or fails to load, it **automatically falls back** to rendered
frames hosted on GitHub Releases, so the page always works. Generate the images with ChatGPT
(GPT-4o / DALL·E / any text-to-image tool) using the prompts below, **save them with the exact
filenames into this folder**, commit, push — and the site updates itself.

---

## 1. 统一风格基调（所有图片共用） / Shared art direction

| 项 | 要求 |
| --- | --- |
| 整体氛围 | 电影「深夜放映厅 / title sequence」：近黑深蓝背景、体积光、薄雾、胶片颗粒、暗角 |
| 配色 | 背景近黑（#08090D ~ #0B0E15）；主点缀**琥珀金**（#E8B04B 系）+ 辅点缀**电光青**（#57C7E8 系）；**禁止紫色渐变白底的通用 AI 风格** |
| 质感 | cinematic, moody, premium, dramatic rim lighting, shallow depth of field, anamorphic feel, film grain, subtle haze, teal-and-amber grade |
| 设备 | 一台**无品牌标识**的现代轻薄笔记本（generic sleek laptop，dark aluminium，**no logo, no Apple mark, no readable brand text**），屏幕发光 |
| 屏幕内容 | 屏幕上可以是发光的终端窗口 / 网页 / 抽象 UI 光效，但**不要出现可读的具体品牌名、真实 logo 或错别字文字**（AI 生成文字易乱码，让文字虚化或抽象化） |
| 构图留白 | hero 横幅：主体偏右或偏左，**对侧留出大面积暗部空间**（网页文字叠在暗部上）；海报：主体居中偏上，下方暗部留暗 |
| 禁忌 | 不要紫色/粉色霓虹赛博朋克、不要白底、不要卡通、不要水印、不要真实品牌 logo、不要乱码大字 |

Negative prompt（可直接附上）:
`purple gradient background, white background, cartoon, watermark, text artifacts, gibberish text, brand logos, Apple logo, stock photo look, flat lighting, low contrast, cluttered, oversaturated neon cyberpunk`

---

## 2. 素材清单 / Asset manifest

| 文件名（精确） | 像素尺寸 | 比例 | 用途 | 是否必需 |
| --- | --- | --- | --- | --- |
| `hero-cinematic.jpg` | **2400 × 1350** | 16:9 | 首页全幅 hero 主视觉（文字叠在左侧/暗部） | 必需 |
| `poster-dogfood.jpg` | **1080 × 1920** | 9:16 | 作品卡 1 海报（终端 + 电影感） | 推荐 |
| `poster-sellerscope.jpg` | **1080 × 1920** | 9:16 | 作品卡 2 海报（数据/电商分析氛围） | 推荐 |
| `poster-landing.jpg` | **1080 × 1920** | 9:16 | 作品卡 3 海报（网页/浏览器窗口氛围） | 推荐 |
| `og-card.jpg` | **1200 × 630** | 1.91:1 | 社交分享缩略图（可选） | 可选 |

> ChatGPT 生成后若尺寸不符：hero 可让它「wider, 16:9」重出；海报务必竖版 9:16；也可自行裁剪缩放后再放入。
> 格式统一用 **JPG（quality ~85%）**，单张建议 < 600KB；海报 < 400KB。

---

## 3. 逐图提示词 / Per-image prompts

### 3.1 `hero-cinematic.jpg` — 2400×1350 · 16:9 主视觉

**中文提示词：**

> 电影级商业网站主视觉横幅，16:9 超宽构图。深夜暗调空间里，一台无品牌标识的现代轻薄深色金属笔记本悬浮/静置在反光桌面上，屏幕发出暖琥珀色与冷青色交织的光，屏幕上是虚化发光的电影感终端界面（文字抽象不可读）。背景为近黑深蓝，带有薄雾、体积光束、柔和暗角与细腻胶片颗粒；青橙电影调色（teal and amber），浅景深，镜头光晕克制。笔记本位于画面**右侧约三分之一处**，**左侧保留大面积近黑暗部**用于叠加网页标题文字。高级、克制、电影海报质感，无任何品牌 logo 与可读文字。

**English prompt:**

> Cinematic hero banner for a premium tech product website, ultra-wide 16:9 composition. In a dark, moody, late-night space, a generic unbranded slim dark-aluminium laptop floats or rests on a reflective desk; its screen glows with warm amber and cool cyan light showing an abstract, out-of-focus cinematic terminal interface (no readable text). Near-black deep-blue background with thin haze, volumetric light beams, soft vignette and fine film grain; teal-and-amber color grade, shallow depth of field, restrained anamorphic lens flare. Place the laptop around the **right third** of the frame and keep the **left side as large near-black negative space** for overlaying a headline. Premium, restrained, theatrical key-art quality; no brand logos, no readable text, no watermark.

### 3.2 `poster-dogfood.jpg` — 1080×1920 · 9:16 作品海报（终端模板）

**中文提示词：**

> 竖版 9:16 电影海报。深夜桌面上一台无品牌深色轻薄笔记本的近景，屏幕上是发光的绿色/琥珀色终端窗口，命令行文字抽象虚化、像电影里的黑客镜头，光映在键盘和桌面。近黑背景、薄雾、胶片颗粒、暗角，青橙调色，浅景深，戏剧化边缘光。画面下方三分之一压暗留空。无品牌 logo、无可读乱码文字、无水印。

**English prompt:**

> Vertical 9:16 cinematic movie poster. Close shot of a generic unbranded slim dark laptop on a desk at night; its screen shows a glowing green-and-amber terminal window, command-line text abstract and blurred like a hacker scene in a film, light reflecting on the keyboard and desk. Near-black background, haze, film grain, vignette, teal-and-amber grade, shallow depth of field, dramatic rim light; bottom third of the frame darkened as negative space. No brand logos, no readable or gibberish text, no watermark.

### 3.3 `poster-sellerscope.jpg` — 1080×1920 · 9:16 作品海报（数据/选品分析）

**中文提示词：**

> 竖版 9:16 电影海报。一台无品牌深色轻薄笔记本，屏幕发出青色与琥珀色光，屏幕上是抽象的数据仪表盘：发光的折线图、柱状图、排名榜单与地图光点（数字与标签虚化不可读），像高端商业分析软件的电影化特写。周围有悬浮的全息数据光粒，近黑深蓝背景、薄雾、体积光、胶片颗粒、暗角，青橙调色，浅景深。下方三分之一压暗留空。无品牌 logo、无可读文字、无水印。

**English prompt:**

> Vertical 9:16 cinematic movie poster. A generic unbranded slim dark laptop, screen glowing cyan and amber, displaying an abstract analytics dashboard: luminous line charts, bar graphs, ranking lists and map heat-points (numbers and labels blurred, unreadable), like a cinematic close-up of high-end business intelligence software. Floating holographic data particles around it; near-black deep-blue background, haze, volumetric light, film grain, vignette, teal-and-amber grade, shallow depth of field; bottom third darkened as negative space. No brand logos, no readable text, no watermark.

### 3.4 `poster-landing.jpg` — 1080×1920 · 9:16 作品海报（网页/浏览器）

**中文提示词：**

> 竖版 9:16 电影海报。一台无品牌深色轻薄笔记本，屏幕上是一个抽象的现代产品官网落地页：大标题区、产品截图块、按钮与滚动光带（文字全部虚化不可读、排版整齐优雅），一个发光的鼠标光标正悬停在按钮上，带细微点击涟漪光效。近黑背景，屏幕光以暖琥珀为主、边缘冷青，薄雾、胶片颗粒、暗角，浅景深，电影调色。下方三分之一压暗留空。无品牌 logo、无可读文字、无水印。

**English prompt:**

> Vertical 9:16 cinematic movie poster. A generic unbranded slim dark laptop displaying an abstract modern product landing page: a large hero area, product image blocks, buttons and a glowing scroll band (all text blurred and unreadable, layout clean and elegant); a luminous cursor hovers over a button with a subtle click-ripple glow. Near-black background, screen light mainly warm amber with cool cyan edges, haze, film grain, vignette, shallow depth of field, cinematic grade; bottom third darkened as negative space. No brand logos, no readable text, no watermark.

### 3.5 `og-card.jpg` — 1200×630 · 社交分享卡（可选）

**中文提示词：**

> 1200×630 横版社交分享缩略图，电影感科技风。近黑深蓝背景，中央偏右一台发光的无品牌轻薄笔记本（屏幕琥珀+青色光、抽象终端界面），左侧大面积暗部，带薄雾、体积光、胶片颗粒与青橙调色；构图简洁高级，像一张电影海报缩略图。无任何 logo、无可读文字、无水印。

**English prompt:**

> 1200×630 horizontal social share card, cinematic tech style. Near-black deep-blue background; a glowing generic unbranded slim laptop slightly right of center (amber + cyan screen light, abstract terminal UI), large dark negative space on the left, haze, volumetric light, film grain, teal-and-amber grade; clean, premium composition like a compressed movie poster. No logos, no readable text, no watermark.

---

## 4. 放入后检查 / After dropping files in

1. 文件名与上表**完全一致**（小写、连字符、`.jpg`），放在本目录 `gallery/assets/`。
2. 提交推送后，打开 gallery 页硬刷新（Cmd/Ctrl+Shift+R）即可看到新图。
3. 若某张图不满意，直接替换同名文件即可；缺哪张就回退哪张，互不影响。
4. 视频（MP4）仍托管在 GitHub Release（`gallery-media`），**不要**放入本目录。
