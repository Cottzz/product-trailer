# product-trailer 项目计划（审核修订版 v2）

> 状态：**执行中** —— M0 / M1 / M1.5 / M2′（内置模型）/ M3′（web-scroll）/ M4′（MP4 导出 + 双范例 44 项门）已完成并推送 main；Gallery 三范例双方向物料已渲染；剩余 M5-lite / M6 与 CC0 模型非阻塞采购
> 日期：2026-09-04（计划创建）；状态持续更新
> 对标项目：[video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft)

## 1. 项目定位

**product-trailer** 是一个「产品 3D 电影感预告片」生成引擎：给定任意带屏幕的 GLB 3D 模型 + 任意屏幕内容，自动生成一条 30 秒电影感运镜短片，双轨交付——

- **单文件 HTML**：零依赖、双击 `file://` 即播（three.js r128 经典非模块全局构建，规避 ES module 的 file:// CORS 限制）；
- **MP4 视频**：无头 Chrome 确定性逐帧渲染 + ffmpeg 合成，竖屏 1080×1920 / 横屏 1920×1080 @ 30fps。

以 GitHub 开源项目形态发布（非单纯 skill），根目录 `SKILL.md` 同时被 Claude Code / Codex / Trae 等 Agent 通过 skills CLI 发现安装。

## 2. 已锁定决策

| 项 | 决策 |
|---|---|
| 成片形态 | 单 HTML 放映 + MP4 导出，**双轨一等公民** |
| v0.1 范围 | 通用引擎 + SellerScope 1 范例 + terminal / web-scroll 2 内容模板 |
| 主许可证 | **Apache-2.0** |
| 模型资产 | CC0 通用模型探索采购（非阻塞）+ **程序化内置设备模型兜底** |
| 仓库 | `github.com/Cottzz/product-trailer`（gh 已登录 Cottzz） |
| Gallery | Pages 预览墙首发（M5-lite），完整 playground 延后 v0.2 |
| 文档 | 英文主 README + 中文副 README |
| 分发 | 根 `SKILL.md` 多 Agent 通吃 + `npx skills add Cottzz/product-trailer -a trae` |
| 音频 | 合成音效 + 1-2 首 CC0 BGM（FreePD / Freesound CC0 / OpenGameArt CC0） |
| 角标 | 结尾可选 "Made with product-trailer" |

## 3. 审核结论：致命问题与修订（F 项）

| # | 问题 | 证据 | 修订 |
|---|---|---|---|
| F1 | orbitTarget 默认包围盒中心会摧毁全部现有镜头构图 | 现有 9 个相机关键帧全部围绕屏幕中心标定；`rotationY` 施加晚于屏幕中心计算，存在坐标空间缺口 | storyboard 增加 `orbitTarget`，**默认 `"screenCenter"`**，在归一化+旋转后的世界空间求值；删除 `(0,1.3,0)` 魔数兜底 |
| F2 | MP4「virtual-time 驱动 rAF 逐帧」确定性不成立 | SwiftShader 异步光栅化、CSS transition/光标 blink 走墙钟、WebAudio 墙钟调度脱钩；现有 `shoot.sh` 已内置"截图 <40KB 重试 3 次"黑帧兜底（不确定性实证） | 引擎暴露 `window.__PT.seek(t)`，导出器经 CDP 按 t=0,1/30… 步进截图；`pt-export` class 下禁用所有 CSS 动画、光标改时间轴驱动；音频走 `OfflineAudioContext`；保留 `preserveDrawingBuffer:true` |
| F3 | M1「逐帧 1:1 像素一致」硬门不可达成且卡死串行路径 | 独立 GPU vs SwiftShader 光栅差异、系统字体差异、墙钟动画污染 | 改四重务实门：同 SwiftShader 环境 **SSIM≥0.97** + 同 storyboard 连渲两次 PNG **逐字节一致** + 终端事件流 buildState 输出 **严格 diff** + M1.5 harness **仅通过三契约驱动**（契约外验） |
| F4 | 现有 MacBook 模型许可证是 **Sketchfab Standard，非 CC0** | 已下载模型 `license.txt` 原文为 "SKETCHFAB Standard"，禁止模型文件再分发；Sketchfab 的 CC0 为上传者自报、下载需登录、商标不受 CC0 覆盖 | 该模型**绝不入公开仓库**；程序化内置设备模型（three.js 代码生成风格化笔记本/手机，许可干净）兜底；CC0 采购降级非阻塞，逐模型核验 License 字段 + `models/ATTRIBUTION.md` |
| F5 | Mixkit 免费许可禁止素材独立再分发 | 不能照搬 shotcraft 音频入仓；Kevin MacLeod 是 CC-BY 非 CC0 | BGM 改用 FreePD / Freesound CC0 / OpenGameArt CC0，1-2 首，逐首 ATTRIBUTION；或脚本按需下载不入 git |
| F6 | Gallery/playground 撞 Pages 体积墙 | base64 内联内存峰值 5-7x，Pages 站点限 1GB | playground 上传限 ≤10-15MB 预检；预览用 Blob URL（零膨胀），导出才内联；支持 GLB 外置同目录模式 |
| F7（补充计划） | 品牌/第三方设备模型（如 **MacBook** GLB）许可证禁止再分发，但需要出现在项目视频里 | Sketchfab Standard 等许可证仅授予下载方个人使用；商标形象不受 CC0 覆盖 | **渲染可用、源文件禁入仓**：MacBook 等模型可作为背景/道具/演示案例出现在渲染成片（MP4/poster 可发布），但 GLB 源文件与内联该 GLB 的自包含 HTML **绝不提交仓库、绝不随产物分发**；统一放 git-ignored 的 `models/local/`，引用它的工程放私有未跟踪目录（如 `examples-local/`）；`examples/` 内一切范例必须仅依赖 `builtin:` / CC0 资产；详见 `models/ATTRIBUTION.md` 的「Local-only models」 |

> 事实勘误：参考关键帧实际为 **5 张** PNG（非早期计划文案所写 6 张），M1 验收以实际文件为准。

## 4. 三契约（含审核补强）

### 4.1 `model.manifest.json`
模型归一化与屏幕标定：模型来源（内联 base64 / 外置 glb 路径 / `builtin:laptop`|`builtin:phone`）、归一化尺寸、`rotationY`、屏幕 mesh 标识（mesh 名/正则，**manifest 驱动，删除硬编码材质名哈希 `/HlQwFCAPWzetDQy/i`**）、`flipY`、屏幕物理宽高比与分辨率、内容模板引用、品牌字段、材质数组正确处理（修复 false negative）。

### 4.2 `storyboard.json`
镜头时序：`duration`、竖/横屏 `fov`、相机关键帧 `[{t, az, el, d}]` 球坐标、`orbitTarget: "screenCenter"|"bboxCenter"|[x,y,z]`（默认 screenCenter，世界空间求值）、`fades` 淡化时序（单一来源，删除引擎硬编码 24.5/27.5/28.6）、`shots` 验帧表。

### 4.3 PTContent 内容模板接口
- `meta`：模板元信息（id、名称、默认屏幕分辨率、默认时长）；
- `buildState(t)`：**纯函数**，时间 → 屏幕/终端状态（确定性根基）；
- `drawScreen(ctx, state, w, h)`：每帧绘制屏幕 canvas；
- `theme`：主题段（配色 CSS 变量，替代 `:root` 硬编码）；
- `startHtml` / `endHtml`：开场覆盖层 / 结尾帧全槽位（品牌名、tagline、署名、状态栏均由内容提供）；
- `mountOverlay(root)` / `updateOverlay(t, state)`：替代每帧 `innerHTML` 全量重建；
- `scheduleAudio(ctx, duration, gain)`：音频契约，必须同时活在实时 `AudioContext` 与 `OfflineAudioContext`；**禁用 `Math.random`/`setTimeout`/直接访问私有事件数组**，时间全部由参数 t 驱动。

### 4.4 引擎约束
- three.js **r128 钉死不升级**（预 r152 全局构建，`sRGBEncoding`/`outputEncoding`）；r128 不支持 Draco/KTX2/meshopt，文档声明仅吃未压缩 GLB，检测到 `KHR_draco_*` 等扩展时报错并提示 gltf-pipeline；
- `preserveDrawingBuffer: true` 必须保留（截图命根子）；
- 确定性：`window.__PT = { seek(t), get duration() }`；`pt-export` class 下禁用 CSS transition/animation，DOM 光标由时间轴驱动（`Math.floor(t*1.8)%2`），`pointer-events:none`。

## 5. 开源合规清单

- `LICENSE`（Apache-2.0）
- `NOTICE`
- `THIRD_PARTY_NOTICES`：three.js r128 / GLTFLoader r128 均 **MIT**，Copyright © 2010-2021 three.js authors（MIT→Apache 单向兼容须保留版权声明）
- `models/ATTRIBUTION.md`（逐模型：来源 URL、作者、License 字段截图/原文、商标声明）
- `assets/audio/ATTRIBUTION.md`（逐音频 CC0 来源）
- `.claude-plugin/plugin.json`（`"skills":"./"`）
- `agents/openai.yaml`
- `SKILL.md` frontmatter：name（小写连字符）+ 富含触发词的 description（3D trailer / product promo / GLB / 产品宣传 / 运镜 …）
- `.gitignore`、`CHANGELOG.md`、Issue/PR 模板、`CONTRIBUTING.md`

## 6. 媒体与冷启动

- 预览 GIF/MP4 **不入 git**（单文件 100MB 限制），走 GitHub **Release 资产**（单文件 2GiB、无总带宽限制，对标 shotcraft 的 `gallery-media` release）；
- README 顶部内嵌 **YouTube/Bilibili 成片**（短视频是此类项目第一转化钩子）；
- **用 product-trailer 自产发布预告片**（meta dogfooding，最强能力证明）；
- GitHub Pages：站点限 1GB，playground 上传预检 ≤10-15MB。

## 7. 里程碑（审核重排）

| 里程碑 | 内容 | 验收 |
|---|---|---|
| **M0** | 本地骨架 → `gh repo create Cottzz/product-trailer --public`；LICENSE/NOTICE/THIRD_PARTY_NOTICES、.claude-plugin/plugin.json、agents/openai.yaml、.gitignore、CI/Pages 配置一次推齐 | 仓库可访问，CI 骨架绿 |
| **M1** | stage.html 槽位化 + terminal.js 抽出 + 三契约定稿（含全部 F/S 修订）+ `pt_build.py` 参数化（6 占位符）；three r128 钉死 | 四重务实门（SSIM≥0.97 / 连渲字节一致 / 事件流 diff / 契约外验） |
| **M1.5**（新增） | **浏览器交互标定页**：加载 GLB → mesh 下拉选屏幕面 → 贴纹理预览 → 导出 manifest JSON。一题三吃：M2 标定工具 / M1 契约 dogfooding harness / M5 playground 内核 | 能用页面为内置/外置模型产出 manifest 并被引擎消费 |
| **M2′** | ✅ 内置模型完成（builtin laptop/phone，零外部资产出片）；CC0 模型采购转探索性非阻塞（Sketchfab 人工核验 License 字段） | 内置模型零外部资产出片 |
| **M3′** | ✅ web-scroll 内容模板（beta）：mock 浏览器窗口自动滚动落地页 + 光标滑翔/点击波纹 + 终帧 DOM overlay；landing 范例；`ci_export.py` 门扩展为双范例×双方向 44 项 | 模板出片（5 帧视觉验收 + 44/44 门 PASS） |
| **M4′** | ✅ MP4 导出：`__PT.seek` 步进 + CDP 截图 + OfflineAudio 音轨 + ffmpeg；竖 1080×1920 / 横 1920×1080@30；`pt_render_materials.sh` 物料渲染（dogfood/sellerscope/landing × 双方向 + posters） | 确定性出片，连渲字节一致（门 PASS） |
| **M5-lite** | GH Pages 预览墙（CI 出物料、媒体走 Release 资产）+ beta playground 挂出 | 预览墙上线 |
| **M6** | 中英 README（内嵌成片）、SKILL.md、references 镜头卡、CI 冒烟、**自产发布预告片**、`v0.1.0` tag + Release | v0.1.0 发布 |

### v0.1 最小可发布集合
通用引擎 + 三契约 + SellerScope 范例（公开版用内置模型/可外置私有 GLB）+ terminal/web-scroll 两模板 + 程序化设备模型 + 单 HTML/MP4 双轨 + 标定页 + Pages 预览墙 + SKILL 分发。

### v0.2 延后清单
CC0 模型库扩充、完整 playground（浏览器内注入下载）、镜头卡库精修、Draco 支持 / three.js 升级评估、更多内容模板、移动端浏览器适配增强。

## 8. 仓库结构（目标）

```
product-trailer/
├── SKILL.md                      # 多 Agent 入口（skills CLI 发现）
├── .claude-plugin/plugin.json
├── agents/openai.yaml
├── LICENSE / NOTICE / THIRD_PARTY_NOTICES
├── README.md / README.zh-CN.md / CHANGELOG.md / CONTRIBUTING.md
├── .gitignore
├── .github/
│   ├── workflows/ci.yml          # Playwright + SwiftShader 冒烟渲染 N 帧断言非全黑
│   └── ISSUE_TEMPLATE/ ...
├── engine/
│   ├── stage.html                # 槽位化引擎模板（6 占位符）
│   ├── engine.js                 # three 场景/相机/时间轴/__PT.seek
│   ├── content-terminal.js       # terminal 内容模板
│   └── vendor/three.r128.min.js, GLTFLoader.r128.js
├── content/
│   ├── terminal/                 # 终端模板
│   └── web-scroll/               # 网页滚动模板
├── models/
│   ├── builtin/                  # 程序化笔记本/手机（代码生成，可再分发）
│   ├── local/                    # 【git-ignored】MacBook 等第三方模型，仅本地渲染（F7）
│   └── ATTRIBUTION.md            # CC0 模型 + Local-only 模型策略
├── examples-local/               # 【git-ignored，可选】引用 models/local 的私有渲染工程
├── assets/audio/                 # CC0 BGM + ATTRIBUTION.md
├── tools/
│   ├── pt_build.py               # 单 HTML 打包（占位符替换/Blob 拼装）
│   ├── pt_export_mp4.py          # CDP 逐帧 + OfflineAudio + ffmpeg
│   └── pt_render_materials.sh    # Gallery GIF/MP4 物料
├── calibrate/                    # M1.5 浏览器标定 harness（静态页）
├── examples/sellerscope/         # 范例 manifest/storyboard/content
├── gallery/                      # GH Pages 预览墙
├── references/                   # 镜头卡/审美规则/音乐卡点/声音设计
└── docs/PLAN.md                  # 本文档
```

## 9. CI 要点

- Playwright 预装 chromium，启动参数 `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`；
- 冒烟：渲染 N 帧断言非全黑（黑帧阈值兜底）；
- ffmpeg 在 GH Actions runner 预装；
- file:// 非模块方案在文档中说明 rationale。

## 10. 风险登记

| 风险 | 等级 | 缓解 |
|---|---|---|
| CC0 模型采购不确定（关键路径彩票） | 高 | 程序化内置模型兜底，采购移出关键路径 |
| MP4 确定性回归 | 高 | `__PT.seek` + 连渲字节一致门 |
| Gallery 体积/带宽 | 中 | Blob URL 预览、Release 资产托管、上传预检 |
| three r128 老旧 | 中 | v0.1 钉死，升级评估放 v0.2 |
| 合规遗漏 | 中 | NOTICE/THIRD_PARTY_NOTICES/双 ATTRIBUTION 评审 |
