## 1. 数据层：扩充动作库与元数据（config/exercises.js）

- [x] 1.1 确定细化分类集合与顺序（CATEGORIES），在文件顶部注释记录旧→新分类映射
- [x] 1.2 扩充 EXERCISES 至约 120 个：原 27 个 id/name/isMainLift 不变，仅可重挂更细 category；新动作用语义化英文蛇形 id
- [x] 1.3 为动作补充可缺省元数据字段：equipment / primaryMuscle / secondaryMuscles / pattern / aliases（取值用统一枚举）
- [x] 1.4 为自重动作标 loadType:'bodyweight'（引体/双杠/俯卧撑/凳上臂屈伸/山羊挺身/GHR/北欧腿弯举及核心类等）；其余缺省为 weighted
- [x] 1.5 自检：所有动作 id 唯一，MAIN_LIFTS 仍为 ['bench','squat','deadlift']

## 2. 合并查询层（utils/exerciseLib.js）

- [x] 2.1 allExercises/getExercise 透传新元数据字段（自建动作缺字段时安全回退）
- [x] 2.2 新增纯函数 searchExercises(keyword)：按 name + aliases 大小写无关模糊匹配；空关键词表示不过滤
- [x] 2.3 确认 byCategory 正确吸收扩充后的 CATEGORIES 与自建动作分类

## 3. 单元测试（tests/algo.test.js）

- [x] 3.1 id 稳定性回归：断言原 27 个 id 全部存在、MAIN_LIFTS 不变
- [x] 3.2 searchExercises 用例：名称命中、别名命中、大小写无关、空关键词、无命中
- [x] 3.3 元数据缺省回退用例：缺字段动作仍能 getExercise/getName，不报错
- [x] 3.4 运行 node tests/algo.test.js 全绿

## 4. 自重负重显示（纯函数 + 录入/展示）

- [x] 4.1 新增纯函数 formatLoad(weight, loadType, unit)：bodyweight→「自重」(0)/「自重 +X」(>0)，weighted→现状；<0 保留「辅助 −X」防御分支；放 util 或 unit 层并补单测
- [x] 4.2 workout/edit 录入：bodyweight 动作的 weight 输入提示「额外负重(空=自重)」，默认 0；沿用 type="digit"，本迭代不放开负值（辅助）
- [x] 4.3 训练详情/历史/列表等展示重量处改用 formatLoad（确认曲线/PR 仍按落库 weight，不变）
- [x] 4.4 exercise/detail 纯自重空状态文案改为「纯自重，进步看次数」（曲线/PR 复用既有 mww 跳过 0 机制，不另加排除逻辑）

## 5. 页面：动作选择面板加搜索（pages/workout/edit、pages/template/edit）

- [x] 5.1 edit.js 动作面板数据源由 EXERCISES 改走 exerciseLib（覆盖自建动作）
- [x] 5.2 面板顶部加搜索框：有输入→调用 searchExercises 显示扁平命中列表（标注分类）；清空→恢复分类 tab 分组
- [x] 5.3 template/edit 同步同样的搜索交互
- [x] 5.4 wxml/wxss 搜索框与结果列表样式

## 6. 页面：动作库管理页搜索（pages/exercise/library）

- [x] 6.1 library 顶部加搜索框，复用 searchExercises，命中以扁平列表展示（保留删除入口仅对自建动作）
- [x] 6.2 清空关键词恢复 byCategory 分组展示

## 7. 验证与收尾

- [x] 7.1 语法检查：Get-ChildItem -Recurse -Filter *.js | node --check
- [x] 7.2 算法单测补 formatLoad 用例（自重/负重/辅助/普通）并 node tests/algo.test.js 全绿
- [x] 7.3 模拟器走查通过（用户）
- [x] 7.4 真机走查通过（用户，2026-06-14）
- [x] 7.5 更新 README 进度区 + docs/00-overview.md 阶段表
- [x] 7.6 /opsx:sync + /opsx:archive 并打 tag
