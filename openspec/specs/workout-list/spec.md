# workout-list Specification

## Purpose

训练记录列表页（`pages/workout/list`）的展示规则。列表按日期倒序、增量分页渲染（见 data-pagination）；本规格承载列表的展示语义，当前为「今日记录高亮」。

## Requirements

### Requirement: 训练列表高亮今日记录

训练记录列表（`pages/workout/list`）SHALL 对 `date` 等于今天（`util.formatDate()`）的记录卡片在**左侧显示一条强调色竖条**，使用户进入训练页即可一眼定位今日训练。判定 SHALL 在渲染层完成（`decorate` 给卡片加 `isToday` 标记），SHALL NOT 落库。当天有多条记录时 SHALL 全部高亮；当天无记录时 SHALL NOT 高亮任何卡片。高亮 SHALL NOT 改变记录的排序、分页或卡片其余内容。

#### Scenario: 今日单条高亮
- **WHEN** 用户进入训练页，列表中有一条 `date` 为今天的记录
- **THEN** 该记录卡片左侧显示强调色竖条，其余卡片无竖条

#### Scenario: 今日多条全部高亮
- **WHEN** 当天记录有多条（如上午、下午各一）
- **THEN** 这些记录卡片均显示左侧竖条

#### Scenario: 今日无记录不高亮
- **WHEN** 当天没有任何训练记录
- **THEN** 列表照常展示，无任何卡片显示竖条

#### Scenario: 不影响排序与分页
- **WHEN** 列表渲染并高亮今日记录
- **THEN** 记录顺序仍按日期倒序、分页/增量渲染行为不变，仅多出竖条样式
