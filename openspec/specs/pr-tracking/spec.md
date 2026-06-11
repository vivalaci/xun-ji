# pr-tracking Specification

## Purpose

个人记录（PR）自动识别与标记。PR 不落库，在读取侧按 `exerciseId` 扫描历史现算（`util.buildPRMap`），编辑历史后自动重算。在训练列表、训练详情、动作详情页可见。

## Requirements

### Requirement: 个人记录（PR）识别
系统 SHALL 在某动作的主力工作组重量超过该动作此前所有历史时，将该次训练标记为 PR。

#### Scenario: 创新高
- **WHEN** 某次训练某动作的主力工作组重量高于该 exerciseId 的历史最高
- **THEN** 系统将该次该动作标记为 PR

#### Scenario: 未创新高
- **WHEN** 主力工作组重量未超过历史最高
- **THEN** 不标记 PR

### Requirement: PR 标记展示
PR 标记 SHALL 在训练列表、训练详情与动作详情页可见。

#### Scenario: 列表与详情显示标记
- **WHEN** 用户查看含 PR 的训练记录或动作详情
- **THEN** 对应条目显示 PR 标记（如徽标或图标）
