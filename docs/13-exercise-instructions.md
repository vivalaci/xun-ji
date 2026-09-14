# 13 · 动作说明（中文分步要领）资源

> **用途**：动作要领的**来源参考**（中文分步说明原始数据，MIT）。
> **状态**：**已接入（迭代二十 `exercise-media-instructions`），但未直接采用本数据**——核查发现 4 条缺失、5 条错配为另一个动作（如单臂哑铃划船配成直立划船、哑铃颈后臂屈伸配成下斜凳仰卧臂屈伸）、87/89 条带「重复所需的重复次数」机翻套话、术语误译（sled 译成「雪橇机」），故 94 条要领已按统一格式与用词**全部重写**为 `config/exerciseInstructions.js`（以它为准）。本文件与 `exercise-instructions-map.json` 仅作来源参考与许可留档。
> **最后更新**：2026-09-14

---

## 一、来源与授权

- **来源**：[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)（数据源自 ExerciseDB v1）
- **授权**：动作**数据/多语言说明**为 **MIT**（可商用）。见仓库 [NOTICE.md](https://github.com/hasaneyldrm/exercises-dataset/blob/main/NOTICE.md)：
  > "The exercise data (names, categories, ... and multilingual instructions) ... is released under the MIT License."
- **仅取文本**：我们**只用了 MIT 的中文说明文本**，**未取任何 Gym visual 媒体**（GIF/缩略图，那部分需另行付费授权，见文末）。
- **署名义务**：MIT 需保留版权/许可声明。发布时在「关于/致谢」页注明数据来源与 MIT 许可。

---

## 二、覆盖情况

- **89 / 93** 力量动作已获中文分步说明（有氧不含）。
- **4 个留空待自写**（数据集无对应或匹配不可靠）：`face_pull`、`nordic_curl`、`hip_thrust`、`cable_kickback`。
- 说明为**机器翻译**（ExerciseDB 英文原文自动译），抽查质量通顺可用，但**发布前建议逐条快速校对**，尤其专有名词。

---

## 三、数据文件

[exercise-instructions-map.json](exercise-instructions-map.json)：`{ _source, _license, map: { [id]: { exdbName, zh, en } } }`
- `zh`：中文分步说明（主用）；`en`：英文原文（备用/搜索）。
- 留空项 `zh` 为空串。

---

## 四、接入建议（下个会话）

1. **放置**：把 `zh` 抽成 `config/exercise-instructions.js`（或独立 json），**按我们的 id 键**；新字段/新文件**可缺省**——无说明时详情页不显示该区块、不报错（架构铁律 6）。
2. **展示**：动作详情页曲线/示意图下方加「动作要领」区块，逐步渲染（可按句号/换行分点）。
3. **体量**：仅中文约 30–50KB，可进包；也可放云端。
4. **补齐**：4 个留空项自写中文；顺带校对机翻。

---

## 五、附：如何合规使用 Gym visual 动画

若将来想用 Gym visual 的现成动画（本项目**未**使用）：

- **克隆仓库 ≠ 授权**。NOTICE 明确："cloning this repo is not a license."
- **合规路径**：去 [gymvisual.com](https://gymvisual.com/) 购买 **N-CRFL（非独占商业免版税许可）**，一次付费、永久、全球有效，**允许用于 App 等电子媒介**。
- **限制**：不得转售媒体本身、不得上传到素材站/AI 平台、不得做 NFT。用时保留署名 `© Gym visual — https://gymvisual.com/`。
- 许可细则：https://gymvisual.com/content/9-license ；条款：https://gymvisual.com/content/3-terms-and-conditions-of-use
- 拿的是高清无水印版 + 你名下的许可（仓库那份 180×180 只是"经许可转载"给仓库，不外延给你）。
