# product-trailer

> 任意带屏 GLB 3D 模型 → 电影感产品预告片。双轨交付：自包含 HTML 播放器 +
> 确定性 MP4。GLB 进，成片出。

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

[**🎬 打开 Gallery 预览墙**](https://cottzz.github.io/product-trailer/gallery/) · [快速开始](#快速开始) · [English](README.md)

[![product-trailer 示例：3D 笔记本上的电影感终端预告片](https://github.com/Cottzz/product-trailer/releases/download/gallery-media/dogfood-poster-1.jpg)](https://cottzz.github.io/product-trailer/gallery/)

<video controls muted preload="none" width="480" poster="https://github.com/Cottzz/product-trailer/releases/download/gallery-media/dogfood-poster-1.jpg">
  <source src="https://github.com/Cottzz/product-trailer/releases/download/gallery-media/dogfood-vertical.mp4" type="video/mp4">
  [▶ 观看竖屏预告片](https://github.com/Cottzz/product-trailer/releases/download/gallery-media/dogfood-vertical.mp4)
</video>

给它一个带屏幕的 3D 模型（笔记本、手机、一体机、电视……）和屏幕内容（终端
会话、自动滚动的落地页、任何能画到 canvas 上的东西），它产出约 30 秒电影感
宣传片：侧面揭示 → 转正 → 推进 → 屏幕交叉淡入 → 品牌终帧。竖屏 9:16 与横屏
16:9 出自同一剪片。

## 为什么做

工具类产品的发布视频制作慢、且永远追不上产品迭代。product-trailer 把
「3D 模型 + 屏幕内容脚本」变成可复现的构建产物——每次发版重新渲染预告片，
逐字节一致，零人工剪辑。

## 特性

- **双轨一等公民** —— 零依赖**单 HTML 文件**（three.js r128 内联，双击
  `file://` 即播）与**确定性 MP4**（无头 Chrome 经 `__PT.seek(t)` 逐帧步进 +
  OfflineAudio 混音 + ffmpeg）。同一剪片连渲两次，逐字节一致。
- **三契约可独立替换** —— `model.manifest.json`（模型来源、屏幕 mesh、归一化）、
  `storyboard.json`（相机关键帧、fov、淡变）、`PTContent` 内容模板（纯函数
  `buildState(t)` + `drawScreen()`）。
- **开箱即用** —— 程序化内置笔记本/手机模型（零外部资产、零许可风险）、两个
  内容模板（`terminal` 终端、`web-scroll` 网页滚动）、浏览器**标定 playground**
  为任意 GLB 指定屏幕面。
- **Agent 就绪** —— 可作为 skill 安装到 Claude Code / Codex / Trae；根目录
  `SKILL.md` 是多 Agent 入口。

## 快速开始

依赖：Python 3、[Playwright](https://playwright.dev/python/) Chromium
（`pip install playwright && playwright install chromium`）、PATH 中的 ffmpeg。

```bash
git clone https://github.com/Cottzz/product-trailer && cd product-trailer

# 1. 构建单文件 HTML 播放器
python3 tools/pt_build.py \
  --manifest examples/dogfood/model.manifest.json \
  --storyboard examples/dogfood/storyboard.json \
  --content content/terminal/content.js \
  --title "product-trailer · self demo" \
  --out trailer.html
# → 双击打开 trailer.html 即可播放，零安装。

# 2. 导出确定性 MP4（竖屏 1080x1920 / 横屏 1920x1080）
python3 tools/pt_export_mp4.py --html trailer.html \
  --orientation vertical  --out trailer-vertical.mp4
python3 tools/pt_export_mp4.py --html trailer.html \
  --orientation horizontal --out trailer-horizontal.mp4
```

`web-scroll` 模板需要把范例配置放在模板**之前**（pt_build 按顺序拼接
`--content` 文件）：

```bash
python3 tools/pt_build.py \
  --manifest examples/landing/model.manifest.json \
  --storyboard examples/landing/storyboard.json \
  --content examples/landing/content.js content/web-scroll/content.js \
  --out landing.html
```

自带 GLB：打开[标定 playground](https://cottzz.github.io/product-trailer/calibrate/)，
加载模型、点选屏幕 mesh、导出 `model.manifest.json`，再交给 `pt_build.py`。
GLB 必须是**未压缩** glTF（three r128 不支持 Draco/KTX2；如需请先过
gltf-pipeline）。

## 三契约

1. **模型契约 `model.manifest.json`**：模型来源（`builtin:laptop` |
   `builtin:phone` | 内联 base64 | 外置 `.glb` 路径）、归一化尺寸、
   `rotationY`、屏幕 mesh（名称/正则）、物理宽高比与分辨率、品牌字段。
2. **分镜契约 `storyboard.json`**：`duration`、分朝向 `fov`、球坐标相机关键帧
   `{t, az, el, d}`、`orbitTarget`（默认 `screenCenter`）、`fades` 淡变时序、
   验帧表。
3. **内容契约 `PTContent`**：`meta`（屏幕分辨率）、`buildState(t)`（**纯函数**，
   确定性根基）、`drawScreen(ctx,state,w,h,t)`、`theme`（CSS 变量）、
   `mountOverlay/updateOverlay`（DOM overlay 动画）、`startHtml/endHtml`
   （开场/终帧）、`scheduleAudio(ctx,startTime,duration,gain)`（必须在实时
   `AudioContext` 与 `OfflineAudioContext` 上行为一致）。参考实现：
   `content/terminal/content.js`、`content/web-scroll/content.js`。

## 确定性

MP4 导出不依赖任何墙钟动画：引擎暴露 `window.__PT.seek(t)`，导出器在无头
Chromium（SwiftShader）下按 1/30 秒步进逐帧抓 canvas，音频走
`OfflineAudioContext`；中点帧双渲探针断言 PNG 逐字节一致——
`tools/ci_export.py` 对两个模板×两个朝向共 44 项检查强制执行该门。

## 安装为 Agent skill

```bash
npx skills add Cottzz/product-trailer          # 所有检测到的 Agent
npx skills add Cottzz/product-trailer -a trae  # 仅 Trae
```

## 范例与 Gallery

三个范例（自产 dogfooding、SellerScope、落地页滚动）的双方向成片、海报帧与
自包含 HTML 剪片都在 [Gallery 预览墙](https://cottzz.github.io/product-trailer/gallery/)。
媒体托管在 [GitHub Release 资产](https://github.com/Cottzz/product-trailer/releases/tag/gallery-media)
（绝不入 git）；用 `tools/pt_render_materials.sh` 可全量重渲染。

> **模型许可说明：** 本仓库只再分发 CC0 / 公有领域 / 程序化生成的模型。第三方或
> 品牌模型（例如 Sketchfab Standard 许可下的 MacBook GLB）**仅可用于本地渲染**
> ——可以出现在你导出的视频中——但其源文件绝不可提交仓库或随产物再分发。请放入
> git 忽略的 `models/local/`，详见 [`models/ATTRIBUTION.md`](models/ATTRIBUTION.md)。

## 路线图

审核修订版计划见 [`docs/PLAN.md`](docs/PLAN.md)。v0.2 规划完整浏览器
playground（拖入 GLB → 页内出片）、CC0 模型库与更多内容模板。

## 许可证

[Apache-2.0](LICENSE)。内置 three.js r128 / GLTFLoader r128 为 MIT，版权声明见
[THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES)。
