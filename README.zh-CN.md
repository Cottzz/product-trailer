# product-trailer

> 任意带屏 GLB 模型 + 任意屏幕内容 → 电影感 3D 产品预告片，单文件 HTML 放映 + 确定性 MP4 双轨交付。

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![CI](https://github.com/Cottzz/product-trailer/actions/workflows/ci.yml/badge.svg)](https://github.com/Cottzz/product-trailer/actions)

**product-trailer** 接收一个带屏幕的 3D 产品模型（笔记本、手机等）与屏幕内容（终端会话、滚动网页等），
自动生成约 30 秒电影感运镜短片：侧面亮相 → 转正 → 推近 → 屏幕交叉淡化全屏 → 品牌结尾帧。
竖屏 9:16 / 横屏 16:9 自适应。

- **双轨交付**：零依赖单 HTML（双击即播）与确定性 MP4（无头 Chrome 逐帧步进 + ffmpeg）。
- **三契约**：`model.manifest.json`、`storyboard.json`、`PTContent` 内容模板，三者可独立替换。
- **Agent 就绪**：可作为 Claude Code / Codex / Trae 的 skill 安装。

> 🚧 早期开发中。完整路线图见 [`docs/PLAN.md`](docs/PLAN.md)，发布预告片与 Gallery 随 v0.1.0 上线。

## 安装为 Agent 技能

```bash
npx skills add Cottzz/product-trailer
```

## 许可证

[Apache-2.0](LICENSE)。内联的 three.js r128 / GLTFLoader 为 MIT，详见
[THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES)。
