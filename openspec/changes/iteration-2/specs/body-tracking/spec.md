## ADDED Requirements

### Requirement: 录入身体数据
用户 SHALL 能录入一条身体数据，包含日期、体重（必填）和体脂率（选填），数据以 kg 落库到 `body_records`。

#### Scenario: 新建并保存
- **WHEN** 用户在新建身体数据页填写体重并点击保存
- **THEN** 系统经 `unit.js` 将体重转换为 kg，调用 `db.saveLocalFirst('body_records', ...)` 本地先落并入队同步，列表立即出现该记录

#### Scenario: 体脂选填
- **WHEN** 用户只填体重、不填体脂
- **THEN** 记录正常保存，体脂字段为空，趋势曲线中体脂线在该点断开

#### Scenario: 体重必填校验
- **WHEN** 用户未填体重就点保存
- **THEN** 系统提示「请输入体重」且不保存

### Requirement: 身体数据列表
用户 SHALL 能在身体 Tab 看到所有身体数据，按日期倒序排列。

#### Scenario: 列表展示
- **WHEN** 用户进入身体 Tab
- **THEN** 页面先用 `db.getCache('body_records')` 同步渲染，再 `refresh` 拉云端更新，每行显示日期、体重、体脂（按当前单位）

### Requirement: 查看、编辑与删除身体数据
用户 SHALL 能查看单条身体数据详情，并对其编辑或删除。

#### Scenario: 编辑
- **WHEN** 用户在详情页修改体重并保存
- **THEN** 系统经 `db.updateLocalFirst` 更新记录，列表与曲线同步反映新值

#### Scenario: 删除
- **WHEN** 用户在详情页删除记录并确认
- **THEN** 系统经 `db.removeLocalFirst` 移除记录，列表与曲线不再包含该点

### Requirement: 首页趋势曲线接入
首页曲线 SHALL 用 `body_records` 数据绘制体重与体脂两条趋势线，随时间范围切换。

#### Scenario: 体重/体脂曲线
- **WHEN** 用户在曲线首页选择某时间范围（1M/3M/6M/ALL）
- **THEN** 系统用 `chart.js` 绘制该范围内的体重（近黑）与体脂（灰）趋势线，缺值点断开而非补零
