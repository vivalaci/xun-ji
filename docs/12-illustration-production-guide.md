# 12 · 动作插画 AI 产出指南

> **用途**：用 AI 把缺图动作补成与 Everkinetic 一致的线稿插画。
> **状态**：**基本备用**——自 2026-09-14 改用 [workout-guide](https://github.com/bryllim/workout-guide) 后，100 个动作已全覆盖（见 [11](11-exercise-media-plan.md)），**本指南目前无待补动作**。仅在将来新增库里没有的动作、或想替换 7 个「近似」项为精确图时才用。
> **姿势底图**：原 `assets/pose-ref/`（free-exercise-db 公有领域照片）已从本地删除，需要时按 free-exercise-db 重新下载。
> **当前待补**：`seal_row` 海豹划船（迭代二十新增内置动作，workout-guide 无对应素材，暂无示意图）。补图后放 `assets/exercise-media/seal_row/0|1|2.svg`，重跑 `tools/media` 出图并上传，再把 id 加入 `config/exerciseMedia.js` 的有图清单。
> **最后更新**：2026-09-14

---

## 一、核心思路

**公有领域照片定姿势 + everkinetic 线稿风格上色。**

AI 仿线稿画风不难，难在「画对动作姿势/器械」。因此：
- **姿势来源**：free-exercise-db 真人照片（Unlicense 公有领域，姿势准确）→ 已存 `assets/pose-ref/<id>/0.jpg、1.jpg`。
- **风格来源**：everkinetic 线稿 → 已存 `assets/exercise-media/<id>/0.png、1.png`（37 个样例）。
- **产物**：把照片"重绘成"线稿风格，姿势不变、风格统一。

> 每个动作出 **2 帧**（起始位 `0` / 收缩位 `1`），分别用对应的两张照片做输入 → 保证两帧人物一致。

---

## 二、风格规格（Style Spec）

从源图提炼，喂 AI 时固定这些特征：

- **纯黑墨线稿**：统一粗细的黑色描边（ink line-art）。
- **不填色、不打阴影、无灰阶、无颜色**（内部留白）。
- **肌肉用细线条勾勒**（thin interior contour lines）。
- **人物 + 器械同一线性画法**。
- **纯白 / 透明背景**。
- **全身入画**，侧面或四分之三视角。
- **人物比例统一**（成年肌肉男性，写实比例）。
- 画布约 **600px 高**，输出透明底。

---

## 三、管线 A：图像编辑模型（最省事，先试这个）

适合零训练、单张快速产出。

1. 选「指令式图像编辑」模型：**Flux Kontext / Qwen-Image-Edit / Gemini 图像编辑(nano-banana)** 等。
2. 输入：某动作的 `assets/pose-ref/<id>/0.jpg`（姿势底图）+ 1~2 张 `assets/exercise-media/*/0.png`（风格样例，few-shot）。
3. 提示词模板（英文效果更稳）：

   > Redraw this exercise photo as a **black ink line-art anatomy illustration**. Clean uniform black outlines, **no shading, no fill, no color, no grayscale**. Muscles drawn as thin interior contour lines. Equipment in the same line style. **Pure white background**. Full-body, side view. Match the line-art style of the attached reference. Keep the exact pose and equipment from the photo.

4. 对 `1.jpg`（收缩位）重复，得到第二帧。

---

## 四、管线 B：风格 LoRA + ControlNet（规模化最稳）

适合一次性批量补全 50+ 动作、追求最高一致性。

1. **训练风格 LoRA**：素材用 `assets/exercise-media/` 37 个（或源库全部 69 张线稿）。
   - 底模：**Flux.1-dev** 或 SDXL；工具：**kohya_ss** 或 **ai-toolkit**。
   - 风格 LoRA 几十张即可；统一触发词如 `evk_lineart`。
2. **锁姿势**：用 fedb 照片过 **ControlNet（lineart / canny / openpose）** 提取结构。
3. **生成**：ControlNet 结构 + 风格 LoRA + 上面的提示词 → 出线稿。
4. 在 ComfyUI（本地）或 Replicate / fal.ai（云端）跑。

---

## 五、出图后两步收尾

1. **矢量化**：线稿 PNG → SVG，得到和源库一致的干净矢量、文件极小、可无损缩放。
   - 工具：Illustrator **Image Trace**、**Vectorizer.ai**、或开源 **potrace**（黑白线稿效果好）。
2. **规格归一**：透明底、~600px 高、同视角、同线宽，命名 `<id>/0` `<id>/1`，放回 `assets/exercise-media/<id>/`。

---

## 六、一致性检查清单（每张产出过一遍）

- [ ] 纯黑线、线宽与源库一致
- [ ] 无阴影 / 无填色 / 无颜色
- [ ] 透明（或纯白）背景
- [ ] 全身入画、同一朝向
- [ ] 人物比例与源库统一
- [ ] 器械为同款线性画法
- [ ] 2 帧（起始 / 收缩）人物一致
- [ ] 尺寸 ~600px、命名规范

---

## 七、优先级

按 [11-exercise-media-plan.md](11-exercise-media-plan.md) 的 **P0 清单**（二分化/三分化高频动作：硬拉、RDL、高位下拉、划船、肩推、腿举/腿弯举/腿屈伸、提踵等）先产出，再做 P1。

---

## 八、素材与映射位置

| 内容 | 位置 |
|--|--|
| 姿势底图（fedb 照片，公有领域） | `assets/pose-ref/<id>/0.jpg、1.jpg` |
| 风格样例（everkinetic 线稿） | `assets/exercise-media/<id>/0.png、1.png` |
| 姿势映射（id→fedb 名 + 路径） | [exercise-pose-ref-map.json](exercise-pose-ref-map.json) |
| 风格映射（id→OpenTraining 名） | [exercise-media-map.json](exercise-media-map.json) |

> 两个 `assets/` 子目录均已在 `project.config.json` 的 `packOptions.ignore` 中排除，**不进小程序包**。

---

## 九、版权

- 风格本身不受版权保护，"仿风格"产新图可行。
- 训练素材 everkinetic 为 CC BY-SA 3.0：稳妥起见**产出标 CC BY-SA + 署名**；姿势源用公有领域 fedb 照片，进一步降低衍生争议。
- 成品发布时在「关于/致谢」页保留 Everkinetic 署名。
