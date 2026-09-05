# product-trailer 项目计划（审核修订版 v2）

> 状态：**v0.1.0 已发布（beta）**。M0 / M1 / M1.5 / M2′（内置模型）/ M3′（web-scroll）/ M4′（MP4 导出 + 双范例 44 项验收门）/ M5-lite（Pages 预览墙 + gallery-media Release 托管）/ M6（中英 README、SKILL.md、镜头卡、自产预告片、v0.1.0 tag+Release）均已完成；补充计划 F1–F10 均已落地（F8：README 免责声明节 + 视频片尾双注入点商标声明，模板默认改为**通用**第三方商标声明，MacBook/Apple 专属英文声明经 dogfood-macbook manifest 的 `brand.disclaimer` 注入；F9：核心展示片改用本地真实 MacBook 模型渲染，配英文免责声明；F10：全量文档中英双语文案校对）。F11（gallery 网页中英双语化与文案校对）、F13（全部宣传图比例核查与修正）已完成；F12（gallery 图片替换为 AI 生成素材）因当前环境未提供 AI 文生图工具而受阻，采用 MacBook 电影感横屏帧作宣传图兜底。**F14（补充计划）**：gallery 整体商业级重设计（电影感艺术方向、特色字体、hero/三契约/作品/流程/CTA 版式重构、加载与滚动动效），AI 主视觉/海报改为「本地 `gallery/assets/` 图片位 + `onerror` 回退 Release 渲帧」机制，并交付成体系中英提示词文档（`gallery/assets/README.md`）由用户用 ChatGPT 生成图片放入即生效（用户已放入 hero + 三张海报）。**F15（补充计划）**：gallery 页 Google SEO 优化——关键词 title/description、canonical、Twitter Card、JSON-LD 结构化数据（SoftwareApplication + 三条 VideoObject，争取视频轮播）、作品区 `<noscript>` 静态兜底与海报 alt、`robots.txt` + `sitemap.xml`，并顺带修复 hero 按钮 `calibrate/` 相对路径错误。**F16（补充计划）**：为 GPT-6 Astra 类「Agent 直连 Blender 全自主建模」新特性做适配——三契约中门槛最高的「带屏 GLB 模型」输入从此可由 AI agent 在 Blender 中程序化建模并导出，新增面向 agent 执行的建模指南 `docs/agent-blender-modeling.md` 与无头导出/校验脚本 `tools/pt_export_glb.py`，并在双语 README / SKILL.md / CHANGELOG 登记这条「自然语言 → Blender 模型 → GLB → 预告片」新通路。**F17（补充计划）**：公开发布落地物——v0.1.0 功能与 gallery 商业级页面均已就绪，缺的是发布日可直接复制的英文发布文案包：新增 `docs/launch-kit.md`，含 Product Hunt 全套字段（tagline/description/maker comment/素材顺序）、Show HN 标题与正文、X 发布线程、Reddit 候选板块与文案、D-7→D+7 发布日历、可直接复制的素材链接清单，以及延续 F7/F8 的商标免责口径（dogfood 成片含 MacBook 渲染，公开帖须标注与 Apple 无关联）。README 顶部视频区在 F9/F13 已就绪，CHANGELOG 不登记纯营销物料。剩余非阻塞项：CC0 模型采购（M2′，v0.2 候选）、ci.yml 补推（待 `gh auth refresh --scopes workflow`）、v0.2 完整 playground、Google Search Console 提交 sitemap（需用户在 GSC 验证 github.io 站点）。
> 日期：2026-09-04（计划创建）；状态持续更新
> 对标项目：[video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft)

## 1. 项目定位

**product-trailer** 是一个「产品 3D 电影感预告片」生成引擎：给定任意带屏幕的 GLB 3D 模型 + 任意屏幕内容，自动生成一条 30 秒电影感运镜短片，双轨交付——

- **单文件 HTML**：零依赖、双击 `file://` 即播（three.js r128 经典非模块全局构建，规避 ES module 在 file:// 下的 CORS 限制）；

- **MP4 视频**：无头 Chrome 确定性逐帧渲染 + ffmpeg 合成，竖屏 1080×1920 / 横屏 1920×1080 @ 30fps。

以 GitHub 开源项目的形态发布（不只是一个 skill），根目录 `SKILL.md` 同时供 Claude Code / Codex / Trae 等 Agent 通过 skills CLI 发现和安装。

## 2. 已锁定决策

| 项       | 决策                                                                        |
| ------- | ------------------------------------------------------------------------- |
| 成片形态    | 单 HTML 播放 + MP4 导出，**一份剪片，两种成片**                                           |
| v0.1 范围 | 通用引擎 + SellerScope 1 范例 + terminal / web-scroll 2 内容模板                    |
| 主许可证    | **Apache-2.0**                                                            |
| 模型资产    | CC0 通用模型探索采购（非阻塞）+ **程序化内置设备模型兜底**                                        |
| 仓库      | `github.com/Cottzz/product-trailer`（gh 已登录 Cottzz）                        |
| Gallery | Pages 预览墙首发（M5-lite），完整 playground 延后 v0.2                                |
| 文档      | 英文主 README + 中文副 README                                                   |
| 分发      | 根 `SKILL.md` 适配所有 Agent + `npx skills add Cottzz/product-trailer -a trae` |
| 音频      | 合成音效 + 1-2 首 CC0 BGM（FreePD / Freesound CC0 / OpenGameArt CC0）            |
| 角标      | 结尾可选 "Made with product-trailer"                                          |

## 3. 审核结论：致命问题与修订（F 项）

| #        | 问题                                                | 证据                                                                                                           | 修订                                                                                                                                                                                                                                                                              |
| -------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1       | orbitTarget 默认取包围盒中心，会破坏所有现有镜头构图                    | 现有 9 个相机关键帧全部围绕屏幕中心标定；`rotationY` 的施加晚于屏幕中心计算，两处坐标空间不一致                                                        | storyboard 增加 `orbitTarget`，**默认 `"screenCenter"`**，在归一化并旋转后的世界空间求值；删除 `(0,1.3,0)` 魔数兜底                                                                                                                                                                                     |
| F2       | MP4「virtual-time 驱动 rAF 逐帧」确定性不成立                 | SwiftShader 异步光栅化、CSS transition/光标 blink 走墙钟、WebAudio 墙钟调度脱钩；现有 `shoot.sh` 已内置「截图 <40KB 重试 3 次」黑帧兜底（不确定性实证） | 引擎暴露 `window.__PT.seek(t)`，导出器经 CDP 按 t=0,1/30… 步进截图；`pt-export` class 下禁用所有 CSS 动画、光标改时间轴驱动；音频走 `OfflineAudioContext`；保留 `preserveDrawingBuffer:true`                                                                                                                          |
| F3       | M1「逐帧 1:1 像素一致」硬门无法达成，且会阻塞串行路径                      | 独立 GPU vs SwiftShader 光栅差异、系统字体差异、墙钟动画污染                                                                     | 改为四重务实验收门：同一 SwiftShader 环境下 **SSIM≥0.97** + 同一份 storyboard 连渲两次 PNG **逐字节一致** + 终端事件流与 buildState 输出**严格 diff 为空** + M1.5 harness **只通过三契约驱动验证**（契约之外的实现一律不测）                                                                                                                                     |
| F4       | 现有 MacBook 模型许可证是 **Sketchfab Standard，而非 CC0**    | 已下载模型 `license.txt` 原文为 "SKETCHFAB Standard"，禁止模型文件再分发；Sketchfab 的 CC0 为上传者自报、下载需登录、商标不受 CC0 覆盖              | 该模型**绝不放入公开仓库**；以程序化内置设备模型兜底（three.js 代码生成的风格化笔记本/手机，许可无风险）；CC0 采购降级为非阻塞项，逐模型核验 License 字段，并记录在 `models/ATTRIBUTION.md`                                                                                                                                                                  |
| F5       | Mixkit 免费许可禁止素材独立再分发                              | 不能照搬 shotcraft 音频入仓；Kevin MacLeod 是 CC-BY 非 CC0                                                              | BGM 改用 FreePD / Freesound CC0 / OpenGameArt CC0，1-2 首，逐首 ATTRIBUTION；或脚本按需下载不入 git                                                                                                                                                                                              |
| F6       | Gallery/playground 撞上 Pages 的体积上限                    | base64 内联内存峰值 5-7x，Pages 站点限 1GB                                                                             | playground 上传做预检，大小限 ≤10-15MB；预览用 Blob URL（零膨胀），导出时才内联；支持 GLB 外置同目录模式                                                                                                                                                                                                               |
| F7（补充计划） | 品牌/第三方设备模型（如 **MacBook** GLB）许可证禁止再分发，但需要出现在项目渲染的视频中 | Sketchfab Standard 等许可证仅授予下载方个人使用；商标形象不受 CC0 覆盖                                                              | **渲染可用、源文件禁入仓**：MacBook 等模型可作为背景/道具/演示案例出现在渲染成片中（MP4/poster 可发布），但 GLB 源文件与内联该 GLB 的自包含 HTML **绝不提交仓库、绝不随产物分发**；统一放在被 git 忽略的 `models/local/`，引用它的工程放在私有未跟踪目录（如 `examples-local/`）；`examples/` 内一切范例必须仅依赖 `builtin:` / CC0 资产；详见 `models/ATTRIBUTION.md` 的「Local-only models」 |
| F8（补充计划） | 品牌模型出现在演示视频中，需明确商标归属与「无官方关联/背书」声明 | Apple《Guidelines for Using Apple Trademarks and Copyrights》要求第三方使用其商标时清晰标注归属与非背书关系；用户逐字中文文本：「本项目的视频演示中使用的 3D 模型仅用于功能展示。MacBook 及其工业设计、商标所有权均归 Apple Inc. 所有，本项目与其无任何官方关联或背书关系。」（参考：[apple.com.cn](https://www.apple.com.cn/legal/intellectual-property/guidelinesfor3rdparties.html)、[apple.com](https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html)） | **README + 视频双落点**：① `README.md` / `README.zh-CN.md` 新增 Disclaimer / 免责声明节（中英双语 + Apple 法律链接）；② 两个内容模板（terminal / web-scroll）在片尾 finale overlay（24.5s 起，poster-4 可捕获）与 endHtml 结束卡（28.6s 定格帧）**双注入点**渲染免责声明；模板内置 `DEFAULT_DISCLAIMER` 为**通用**第三方商标声明（适用于内置程序化/虚构模型），品牌专属声明（如 MacBook/Apple）经 `brand.disclaimer`（manifest）/ `cfg.disclaimer`（范例配置）按渲染作业覆盖注入，`false` 可关闭；`models/ATTRIBUTION.md` 记录机制与链接；无需改动引擎（复用 `fn(BRAND, M.brand||{})` 双参数调用） |
| F9（补充计划） | 线上的素材图与成片仍是内置程序化笔记本渲染的，还没换成真实 **MacBook 模型** 渲染的画面 | 真实 MacBook GLB 一直放在仓库外的工作目录（`../macbook-pro-14-inch-m5/source/macbook_pro_14_inch_M5.glb`，Apple 官方账号发布于 Sketchfab，Sketchfab Standard 许可：允许本地/商用渲染与衍生作品，禁止再分发源文件），从未接入渲染管线；F7 只定了策略，F8 重渲染时仍用 `builtin:laptop` | **核心展示用 MacBook，配英文免责声明**：把 GLB 复制到被 git 忽略的 `models/local/`，在私有未跟踪的 `examples-local/dogfood-macbook/` 建三契约（external `.glb` 引用、经无头校准定位屏幕 mesh、配 `storyboard.json` + terminal 内容），渲染出 dogfood 的竖屏/横屏 MP4 与 4 张海报，并做 poster 视觉 QA；这些**成片/海报**（不含 GLB、不含内联 GLB 的自包含 HTML）发布到 `gallery-media` 与 `v0.1.0` Release 覆盖 dogfood 资产；MacBook/Apple **英文**免责声明经该私有 manifest 的 `brand.disclaimer` 注入（模板默认为通用声明）。sellerscope / landing 仍用内置模型。校准参考 `calibrate/` 与 `tools/ci_calibrate.py` |
| F10（补充计划） | 项目文档的中英文文案存在不自然的翻译腔、语法/词汇/标点问题 | 现有 README/PLAN 等多为直译，中英文都有生硬表达（如 “Dual first-class outputs”“Batteries included” 直译堆叠、中文长句破折号过多） | **全量文档语言校对**：对仓库内全部面向读者的 Markdown（`README.md`、`README.zh-CN.md`、`CONTRIBUTING.md`、`SKILL.md`、`CHANGELOG.md`、`docs/PLAN.md`、`models/ATTRIBUTION.md`、`assets/audio/ATTRIBUTION.md`、`references/shot-cards.md`）逐一做语法、词汇、标点检查并改为**自然地道**的英文/中文：英文遵循技术文档惯用表达（简洁主动、避免自造术语堆叠），中文避免翻译腔与破折号滥用、专有名词与中英文间距规范；不改代码与命令 |
| F11（补充计划） | 项目所属网页（`https://cottzz.github.io/product-trailer/gallery/`）为纯英文页，缺少中文；部分文案需语法润色 | `gallery/index.html` 原本只有英文（hero/卡片/playground/footer），dogfood 卡片描述仍写过时的 “procedural built-in laptop”，且 Live HTML 链接指向已删除的旧内置笔记本 HTML，与 MacBook 成片身份矛盾 | **gallery 中英双语化 + 文案校对**：页面加语言切换按钮（EN/中文，`localStorage` 记忆、默认按浏览器语言），hero/kicker/标题/副标题/按钮、三张卡片（标题+描述+链接）、playground、footer 全部提供地道中英双语文案；根 `index.html` 跳转页提示语双语化；dogfood 卡片描述改为真实 14 英寸 MacBook Pro 渲染、模型仅用于渲染不再分发，并隐藏其 Live HTML 链接（F7）；润色 “hover to preview”“Live HTML cut” 等措辞 |
| F12（补充计划） | gallery 图片素材需替换为 **AI 生成**的素材图 | gallery 卡片 poster / README 头图此前为旧内置笔记本渲染帧 | **【受阻，已兜底】** 目标是用 AI 文生图替换素材，但当前执行环境的 Seedream 插件仅指示调用 `GenerateImage` 工具，该工具与对应 MCP 服务在本环境均未注册（Skill 加载报 not found）。**兜底方案已落地**：核心宣传图改用本地真实 MacBook 模型渲染的电影感横屏帧（`dogfood-banner.jpg`，16:9），竖版海报用 MacBook 成片 9:16 抽帧；这同时满足了 F9「素材图更新为 MacBook 渲染图」的要求。待环境提供 AI 文生图能力后，可再补生成原创海报/缩略图 |
| F13（补充计划） | 项目所有文档的相关宣传图**比例**不当 | README 全宽头图原用 9:16 竖海报（页面里过高）；gallery 卡片媒体容器原 `aspect-ratio:16/10` + `object-position:center 22%`，会裁切 9:16 竖视频 | **宣传图比例修正**：① README 中英双语版的全宽头图由 9:16 竖海报改为 16:9 横幅（`dogfood-banner.jpg`），文中内嵌的 `<video width=480>` 竖版保持固定宽、比例自适应；② gallery 卡片媒体容器改为 `aspect-ratio:9/16` + `object-fit:cover; object-position:center`，与 9:16 竖视频一致，不再错误裁切；③ 全仓扫描确认宣传图仅出现在两个 README 与 gallery（`SKILL.md`/`CONTRIBUTING.md`/`PLAN.md`/ATTRIBUTION 等均无内嵌图），比例问题已全覆盖 |
| F14（补充计划） | gallery 网页**设计与图片均不符商业级商业网站标准**（用户逐字反馈） | 页面为通用深色三卡片布局：系统字体栈、居中模板化排版、无品牌感与版式层级；宣传图是原始 3D 渲帧（如 `dogfood-banner.jpg` 笔记本占画面小、上下大面积空黑、屏幕文字不可读），不具营销主视觉品质。本环境仍无 AI 文生图工具（F12 结论不变） | **商业级重设计 + AI 素材提示词交接**：① `gallery/index.html` 整体重做为电影感艺术方向（深夜放映厅：近黑底 + 琥珀金/电光青点缀 + 胶片 grain），特色字体（display Fraunces + 正文 Instrument Sans + 等宽 JetBrains Mono，配 Noto Serif SC 中文衬线，均 Google Fonts CDN + 本地字体栈兜底）；板块重构为 nav / hero（全幅主视觉 + 数据带）/ marquee / 三契约特性 / 作品展示卡 / 四步流程 / CTA / footer，含 stagger 加载与 scroll reveal 动效、响应式、保留中英双语切换与悬停播放机制；② AI 图片改为**本地入仓**机制：页面引用 `gallery/assets/` 下本地图，`onerror` 自动回退 Release 渲帧（当前状态即可发布）；③ 交付 `gallery/assets/README.md`：每张图的精确文件名、像素尺寸、放置目录、统一电影感风格与逐图中英双语 ChatGPT 提示词（hero 主视觉 2400×1350、三张 9:16 作品海报 1080×1920、可选社交分享卡 1200×630），用户生成放入后自动生效；④ 视频 MP4 仍走 Release 不入 git |
| F15（补充计划） | gallery 页需做 Google SEO 优化（用户补充思路） | 盘点缺口：`<title>` 无关键词（仅 "product-trailer — gallery"）；description 中英混排在 Google 英文 SERP 不利；无 canonical、无 og:url/type、无 Twitter Card；作品卡与跑马灯纯 JS 渲染、无 `<noscript>` 静态兜底；无 JSON-LD 结构化数据（视频内容拿不到 Google 视频轮播/富结果）；海报 `<img alt="">` 为空；站点根无 robots.txt / sitemap.xml；另发现 hero 按钮 `href="calibrate/"` 在 /gallery/ 路径下解析为 /gallery/calibrate/ 的死链 | **SEO 优化包**：① head 强化——关键词 title（"Turn Any 3D Model into a Cinematic 30-Second Trailer · product-trailer"）、纯英文 description（≤155 字符、含 open source / Three.js / GLB / MP4）、canonical 指向 gallery 规范 URL、补 og:url/og:type/og:site_name、Twitter `summary_large_image`（og 图切到已入仓的本地 `assets/hero-cinematic.jpg`）；② JSON-LD：`@graph` 含 SoftwareApplication（Apache-2.0、free、GitHub/官网 URL、applicationCategory DeveloperApplication）+ 三条 VideoObject（name/description/contentUrl/thumbnailUrl/datePublished 2026-09-04/duration PT30S/uploadDate）；③ 作品区 `<noscript>` 静态中英文案与视频直链兜底，海报 alt 改为描述性英文文本；④ 根目录新增 `robots.txt`（Allow 全站 + Sitemap 声明）与 `sitemap.xml`（收录 /gallery/ 与 /calibrate/，根页为 meta-refresh 跳转不收录）；⑤ 修复 hero calibrate 相对路径为 `../calibrate/`；⑥ GSC 提交 sitemap 为用户侧动作（github.io 站点需在 Search Console 验证） |
| F16（补充计划） | GPT-6 Astra（2026-09-03 发布）已能通过 Blender Python API 全自主程序化建模、渲染中间帧视觉自修正、隔夜无人值守（参考 [aiposthub 报道](https://www.aiposthub.com/gpt-6-astra-blender-palace-of-fine-arts/)）；三契约中门槛最高的「带屏 GLB」输入从此可由 agent 自动产出，但仓库目前只有面向人类用户的 README/SKILL 说明，没有面向 agent 的建模/导出契约与可执行工具链 | agent 直接在 Blender 里建出模型后：①不知道屏幕 mesh 必须命名可选择；②默认 glTF 导出可能带 Draco/形态键等 r128 不支持的特性；③不知道 flipY/比例/CC0 与商标红线（F4/F7/F8 经验未对新工作流失效）；④缺少「Blender 工程 → 合规 GLB」的无头一步导出与校验命令 | **Agent 建模通路适配（纯文档+工具，不改引擎）**：① 新增 `docs/agent-blender-modeling.md`（英文，面向执行的 agent）：端到端五步管线、硬约束清单（屏幕 mesh 命名 `screen`、无压缩 glTF、Y-up 导出注意、面向 +X/-X 时的 flipY、屏幕比例、材质/开合同盖角度等）、Blender Python 导出片段、`tools/pt_export_glb.py` 用法、校准与 external manifest 模板、CC0/商标红线（引用 F7/F8）、交付前检查表；② 新增 `tools/pt_export_glb.py` 双模式脚本：在 Blender 内无头执行（`--export` 调 `bpy.ops.export_scene.gltf`，export_draco/动画/形态键全关，导出后列出全部 mesh 并高亮含 "screen" 的候选）；无 Blender 时纯 Python 校验模式（`--check` 解析 GLB JSON chunk，发现 `KHR_draco_mesh_compression`/`KHR_texture_basisu`/`EXT_meshopt_compression` 等即报错退出）；③ `README.md`「Bring your own GLB」处与 `README.zh-CN.md` 增加「No GLB? Let an agent build one in Blender」小段并链接指南；Highlights 的 agent 项补充「agents can now model the device in Blender and export it」；④ `SKILL.md` 增加带屏模型新来源（agent-authored Blender model）与指南指针；⑤ CHANGELOG Unreleased/Added 登记 F16 |
| F17（补充计划） | 引擎（F16 前）与商业级展示页（F14/F15）均已就绪，项目到了可以公开发布的节点，但仓库里没有任何「发布日」物料：Product Hunt 字段、Show HN 正文、社交文案都要现写，发布顺序/时间/素材链接没有成稿，容易错过发布黄金窗口或在多平台口径不一；dogfood 成片用 MacBook 渲染（F9），公开帖的商标口径也需要提前写好，避免发布时遗漏免责 | 仓库内无 launch/announcement 相关文档；可用素材已齐但分散：gallery-media Release 上三套竖/横 MP4 + 海报、`gallery/assets/` 下 og-card（1200×630）与 4 张海报、gallery 在线页、calibrate 在线 playground、v0.1.0 Release；README 顶部视频区 F9/F13 已就位（横幅头图 + 480px 竖屏播放器），无需再改 | **发布文案包（一份英文文档，零代码改动）**：新增 `docs/launch-kit.md`：① Product Hunt 全套——名称、tagline（≤60 字符）、短描述（≤260）、topics、maker comment（首发留言，讲为什么做+怎么用+求反馈）、gallery 素材上传顺序（og-card/竖屏视频/横屏/海报）、首日评论应答要点；② Show HN——标题、正文（Ask HN 风格：解决什么、怎么工作、技术亮点「确定性 MP4/三契约/单文件」、demo 链接、源码链接、求反馈点）；③ X 发布线程（5 条：hook + 30 秒视频、三契约、agent+Blender 通路、确定性 MP4 技术、CTA）与 LinkedIn 长帖；④ Reddit 候选（r/SideProject、r/programming、r/webdev、r/gamedev 边界说明）与各自风格提示；⑤ D-7→D+7 发布日历（准备物料/预约 hunters 时间 00:01 PST、HN 工作日早间、发帖后应答节奏）；⑥ 素材链接清单（全部用已存在的 Release/Pages 绝对 URL，逐条标注用途）；⑦ 商标免责提醒（dogfood 帖/PH gallery 含 MacBook 渲染时的通用免责句，沿用 F8 口径）。README/CHANGELOG 不动（视频区已有、纯营销物料不入 CHANGELOG） |

> 事实勘误：用于验帧的参考关键帧实际为 **5 张** PNG（并非早期计划文案所写的 6 张），M1 验收以实际文件为准。

## 4. 三契约（含审核补强）

### 4.1 `model.manifest.json`

模型归一化与屏幕标定：模型来源（内联 base64 / 外置 glb 路径 / `builtin:laptop`|`builtin:phone`）、归一化尺寸、`rotationY`、屏幕 mesh 标识（mesh 名/正则，**由 manifest 驱动，删除硬编码材质名哈希 `/HlQwFCAPWzetDQy/i`**）、`flipY`、屏幕物理宽高比与分辨率、内容模板引用、品牌字段、材质数组的正确处理（修复 false negative）。

### 4.2 `storyboard.json`

镜头时序：`duration`、竖屏/横屏 `fov`、球坐标相机关键帧 `[{t, az, el, d}]`、`orbitTarget: "screenCenter"|"bboxCenter"|[x,y,z]`（默认 screenCenter，在世界空间求值）、`fades` 淡入淡出时序（以此为唯一来源，删除引擎硬编码的 24.5/27.5/28.6）、`shots` 验帧表。

### 4.3 PTContent 内容模板接口

- `meta`：模板元信息（id、名称、默认屏幕分辨率、默认时长）；

- `buildState(t)`：**纯函数**，时间 → 屏幕/终端状态（确定性根基）；

- `drawScreen(ctx, state, w, h, t)`：每帧绘制屏幕 canvas；

- `theme`：主题（配色 CSS 变量，替代 `:root` 硬编码）；

- `startHtml(brand, brandCfg)` / `endHtml(brand, brandCfg)`：开场覆盖层 / 结尾帧的全部内容（品牌名、tagline、署名、状态栏均由内容模板提供）；

- `mountOverlay(root, brand, brandCfg)` / `updateOverlay(t, state)`：替代每帧 `innerHTML` 全量重建；

- `scheduleAudio(ctx, startTime, duration, gain)`：音频契约，必须同时适用于实时 `AudioContext` 与 `OfflineAudioContext`；**禁止使用 `Math.random`/`setTimeout`，也禁止直接访问私有事件数组**，时间全部由参数 t 驱动。

### 4.4 引擎约束

- three.js **r128 钉死不升级**（r152 之前的全局构建，使用 `sRGBEncoding`/`outputEncoding`）；r128 不支持 Draco/KTX2/meshopt，文档明确仅接受未压缩 GLB；检测到 `KHR_draco_*` 等扩展时报错，并提示使用 gltf-pipeline 处理；

- `preserveDrawingBuffer: true` 必须保留（逐帧截图依赖该标志）；

- 确定性：`window.__PT = { seek(t), get duration() }`；`pt-export` class 下禁用 CSS transition/animation，DOM 光标由时间轴驱动（`Math.floor(t*1.8)%2`），`pointer-events:none`。

## 5. 开源合规清单

- `LICENSE`（Apache-2.0）

- `NOTICE`

- `THIRD_PARTY_NOTICES`：three.js r128 / GLTFLoader r128 均 **MIT**，Copyright © 2010-2021 three.js authors（MIT→Apache 单向兼容须保留版权声明）

- `models/ATTRIBUTION.md`（逐模型：来源 URL、作者、License 字段截图/原文、商标声明）

- `assets/audio/ATTRIBUTION.md`（逐音频 CC0 来源）

- `.claude-plugin/plugin.json`（`"skills":"./"`）

- `agents/openai.yaml`

- `SKILL.md` frontmatter：name（小写连字符）+ 包含丰富触发词的 description（3D trailer / product promo / GLB / 产品宣传 / 运镜 …）

- `.gitignore`、`CHANGELOG.md`、Issue/PR 模板、`CONTRIBUTING.md`

## 6. 媒体与冷启动

- 预览 GIF/MP4 **不入 git**（单文件 100MB 限制），走 GitHub **Release 资产**（单文件 2GiB、无总带宽限制，对标 shotcraft 的 `gallery-media` release）；

- README 顶部内嵌 **YouTube/Bilibili 成片**（短视频是这类项目最首要的转化抓手）；

- **用 product-trailer 自产发布预告片**（元 dogfooding，最有说服力的能力证明）；

- GitHub Pages：站点限 1GB，playground 上传预检 ≤10-15MB。

## 7. 里程碑（审核重排）

| 里程碑          | 内容                                                                                                                                                                    | 验收                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **M0**       | 本地骨架 → `gh repo create Cottzz/product-trailer --public`；LICENSE/NOTICE/THIRD\_PARTY\_NOTICES、.claude-plugin/plugin.json、agents/openai.yaml、.gitignore、CI/Pages 配置一次推齐 | 仓库可访问，CI 骨架绿                                |
| **M1**       | stage.html 槽位化 + terminal.js 抽出 + 三契约定稿（含全部 F/S 修订）+ `pt_build.py` 参数化（6 占位符）；three r128 钉死                                                                           | 四重务实验收门（SSIM≥0.97 / 连渲字节一致 / 事件流 diff 为空 / 仅经三契约验证） |
| **M1.5**（新增） | **浏览器交互标定页**：加载 GLB → mesh 下拉选屏幕面 → 贴纹理预览 → 导出 manifest JSON。一举三得：M2 标定工具 / M1 契约的 dogfooding 验证 / M5 playground 内核                                               | 能用页面为内置/外置模型产出 manifest 并被引擎消费              |
| **M2′**      | ✅ 内置模型完成（builtin laptop/phone，零外部资产出片）；CC0 模型采购转探索性非阻塞（Sketchfab 人工核验 License 字段）                                                                                     | 内置模型零外部资产出片                                 |
| **M3′**      | ✅ web-scroll 内容模板（beta）：mock 浏览器窗口自动滚动落地页 + 光标滑翔/点击波纹 + 终帧 DOM overlay；landing 范例；`ci_export.py` 验收门扩展为双范例×双朝向 44 项                                                     | 模板出片（5 帧视觉验收 + 44/44 门 PASS）                |
| **M4′**      | ✅ MP4 导出：`__PT.seek` 步进 + CDP 截图 + OfflineAudio 音轨 + ffmpeg；竖 1080×1920 / 横 1920×1080\@30；`pt_render_materials.sh` 物料渲染（dogfood/sellerscope/landing × 双朝向 + posters）  | 确定性出片，连渲字节一致（门 PASS）                        |
| **M5-lite**  | GH Pages 预览墙（CI 出物料、媒体走 Release 资产）+ beta playground 挂出                                                                                                               | 预览墙上线                                       |
| **M6**       | 中英 README（内嵌成片）、SKILL.md、references 镜头卡、CI 冒烟、**自产发布预告片**、`v0.1.0` tag + Release                                                                                      | v0.1.0 发布                                   |

### v0.1 最小可发布集合

通用引擎 + 三契约 + SellerScope 范例（公开版用内置模型/可外置私有 GLB）+ terminal/web-scroll 两模板 + 程序化设备模型 + 单 HTML/MP4 双轨 + 标定页 + Pages 预览墙 + SKILL 分发。

### v0.2 延后清单

CC0 模型库扩充、完整 playground（在浏览器内完成 GLB 加载与成片导出）、镜头卡库精修、Draco 支持 / three.js 升级评估、更多内容模板、移动端浏览器适配增强。

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

- file:// 非模块方案的选型理由需在文档中说明。

## 10. 风险登记

| 风险                  | 等级 | 缓解                                            |
| ------------------- | -- | --------------------------------------------- |
| CC0 模型采购结果不确定（关键路径变数） | 高  | 程序化内置模型兜底，采购移出关键路径                            |
| MP4 确定性回归           | 高  | `__PT.seek` + 连渲字节一致门                         |
| Gallery 体积/带宽       | 中  | Blob URL 预览、Release 资产托管、上传预检                 |
| three r128 老旧       | 中  | v0.1 钉死，升级评估放 v0.2                            |
| 合规遗漏                | 中  | NOTICE/THIRD\_PARTY\_NOTICES/双 ATTRIBUTION 评审 |

