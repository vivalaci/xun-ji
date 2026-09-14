# 动作示意图素材 · 署名与来源

- **来源**：[bryllim/workout-guide](https://github.com/bryllim/workout-guide)
- **画风原作**：[Everkinetic](https://github.com/everkinetic/data)
- **许可证**：素材 **CC BY-SA 4.0**（代码 MIT）
- **署名要求**：应用内「使用说明 → 致谢」注明
  `示意图改编自 Bryl Lim（workout-guide）与 Everkinetic，已重新着色，CC BY-SA 4.0`
  并附许可链接 https://creativecommons.org/licenses/by-sa/4.0/ 。
- **注意：本项目展示的 PNG 属于改编作品**（线稿由白色重新着色为 `#1F2937`），CC BY-SA 4.0 要求：署名 + **注明已修改** + 改编作品以同协议（CC BY-SA 4.0）共享。

## 目录说明

- 子目录名 = 本项目动作 `id`（`config/exercises.js`）。
- 每动作文件：
  - `0.svg`/`1.svg`/`2.svg`：512×512 透明底**矢量母版**（原始 `fill="#fff"`）——**进 git**。
  - `0.png`/`1.png`/`2.png`：512×512 透明底、重新着色 `#1F2937`、调色板压缩——详情页/放大层循环播放。
  - `thumb.png`：160px 静态缩略图（取第 1 帧，直接从 SVG 栅格化）——列表用。
  - PNG 均由脚本生成、上传微信云存储 `exercise-media/<id>/`（取图前缀见 `config/exerciseMedia.js` 的 `PREFIX`），**不进 git**（`.gitignore`）。
- **100 个动作全覆盖**（93 精确 + 7 近似）。id→slug 映射见 [docs/exercise-media-map.json](../../docs/exercise-media-map.json)。

## 用途与注意

- **不进小程序包**（`project.config.json` 的 `packOptions.ignore` 已排除本目录与 `tools`）；小程序经云存储 fileID 取图。
- **重新出图**：`cd tools/media && npm install && node build.js`（可加 `--only=bench,squat`、`--thumb-frame=1`、`--thumb-size=160`）。脚本把 SVG 的 `fill="#fff"` 替换为 `#1F2937` 后经 `sharp` 渲染；若改用深色背景，改脚本里的 `INK` 重跑并重新上传即可。
- 接入与取图规则见 `config/exerciseMedia.js`、`utils/exerciseMedia.js`（迭代二十 `exercise-media-instructions`）。
