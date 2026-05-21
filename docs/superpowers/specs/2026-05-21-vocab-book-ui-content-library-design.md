# Vocab Book UI 与内容库设计

## 背景

当前项目已经具备单词管理、复习、测验、统计和第三方 API。现有数据模型以 `words` 为中心，每个单词只有一个 `example` 字段，适合保存单条例句，但不适合沉淀用户从阅读、视频、资料中摘录的句子或段落。

本次设计的目标是把应用从「单词列表工具」推进到「可持续学习工作台」：用户可以快速添加单词，也可以粘贴句子或短内容，并把内容与单词关联起来，用真实语境辅助复习。

## 目标

- 优化整体 UI，使首页、导航、列表、录入页更像高频使用的学习工具。
- 新增内容库，支持保存句子、短段落、来源、备注和标签。
- 支持内容与单词关联，让单词详情和复习页能看到真实语境。
- 保留现有单词、复习、测验和第三方 API 的兼容性。
- 第一阶段只做可靠的手动能力，不引入 AI 自动提取。

## 非目标

- 不做全文阅读器、划词翻译或复杂标注系统。
- 不做 AI 自动生成释义、自动抽词或自动批改。
- 不重写 SM-2 复习算法。
- 不改变现有第三方单词 API 的必填字段和认证方式。

## 推荐方案

采用「内容库 + 关联表」方案。

内容独立存放在 `content_items` 表中，单词仍存放在 `words` 表中。两者通过 `content_word_links` 建立多对多关系。这样一句话可以关联多个单词，一个单词也可以出现在多条真实语境中。

这个方案比直接扩展 `words.example` 更稳：它不破坏现有单词接口，也为后续从内容中提取生词、按来源复习、按上下文做测验留下空间。

## 用户流程

### 快速添加单词

用户从首页或导航进入「添加」。页面保留现有单词字段，并强化录入体验：

- 必填：单词、释义。
- 可选：音标、例句、标签。
- 提交成功后默认跳转到单词详情页，方便继续补充例句、标签或查看关联内容。

### 添加内容

用户进入「内容」页面，粘贴一句话或一小段内容：

- 内容正文为必填。
- 来源、备注、标签为可选。
- 页面提供「关联已有单词」入口，可通过搜索选择单词。
- 如果内容中包含尚未录入的词，第一阶段不自动建词，只允许用户手动添加。

### 从单词查看语境

单词详情页展示：

- 单词基本信息。
- 原有例句。
- 关联内容列表，按最新关联时间排序。
- 每条内容展示正文、来源、备注和标签。

### 复习时使用语境

复习页仍以单词为主，但在显示答案后补充「相关语境」区域：

- 最多展示 2 条关联内容。
- 没有关联内容时保持原有行为。
- 语境作为辅助材料，不影响复习评分和间隔计算。

## UI 设计

### 导航

将导航从 emoji 文本导航调整为工具型导航：

- 使用 `lucide-react` 图标。
- 增加当前页面选中态。
- 顶部保留品牌和主要入口。
- 移动端沿用顶部横向滚动导航，但优化间距、选中态和触控尺寸。

建议入口：

- 首页
- 单词
- 内容
- 复习
- 测验
- 统计
- 设置

### 首页

首页改成学习工作台，首屏突出当天行动：

- 今日待复习数量和「开始复习」按钮。
- 快速添加区：添加单词、添加内容、批量导入。
- 学习概览：总单词数、学习中、已掌握、连续学习。
- 最近内容或最近单词，用于让用户回到最近添加的材料。

### 单词列表

单词列表保留搜索、状态筛选和分页，同时优化卡片密度：

- 单词、音标、状态、释义保持在主区域。
- 例句和标签作为次级信息。
- 每条卡片展示关联内容数量。API 通过聚合查询返回数量，避免前端逐条请求。

### 内容列表

新增内容列表页：

- 顶部提供搜索和「添加内容」按钮。
- 卡片展示正文摘要、来源、标签、关联单词数量和创建时间。
- 支持进入详情页编辑内容与关联单词。

## 数据设计

### 新增表：content_items

```sql
CREATE TABLE IF NOT EXISTS content_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  body TEXT NOT NULL,
  source TEXT,
  note TEXT,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 新增表：content_word_links

```sql
CREATE TABLE IF NOT EXISTS content_word_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
  UNIQUE(content_id, word_id)
);
```

### 新增索引

```sql
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON content_items(created_at);
CREATE INDEX IF NOT EXISTS idx_content_word_links_content ON content_word_links(content_id);
CREATE INDEX IF NOT EXISTS idx_content_word_links_word ON content_word_links(word_id);
```

## API 设计

新增内部管理 API，沿用现有 `requireAdmin` 鉴权：

- `GET /api/content`：分页查询内容，支持 `search`。
- `POST /api/content`：创建内容，可携带 `word_ids`。
- `GET /api/content/:id`：获取内容详情和关联单词。
- `PUT /api/content/:id`：更新正文、来源、备注、标签和关联单词。
- `DELETE /api/content/:id`：删除内容。

扩展现有单词详情 API：

- `GET /api/words/:id` 返回 `contents` 数组，最多返回最近 10 条关联内容。

扩展复习 API：

- `GET /api/review` 返回待复习单词时，为每个单词附带最多 2 条关联内容。

第一阶段不扩展 `/api/v1/*` 第三方开放 API，避免外部契约过早膨胀。

## 错误处理

- 内容正文为空时返回 `VALIDATION_ERROR`。
- 关联不存在的单词 ID 时返回 `VALIDATION_ERROR`。
- 内容不存在时返回 `CONTENT_NOT_FOUND`。
- 重复关联由数据库唯一约束兜底，接口层应去重后写入。
- 页面保存失败时展示明确错误，不只依赖 `console.error`。

## 测试与验证

### 代码验证

- `npm run lint`
- `npm run build`

### 手动验证

- 创建一条内容并关联已有单词。
- 在内容详情页编辑正文、来源、备注、标签和关联单词。
- 在单词详情页看到关联内容。
- 在复习页显示答案后看到相关语境。
- 删除内容后，关联记录同步删除，单词仍保留。
- 删除单词后，内容仍保留，关联记录同步删除。

## 实施顺序

1. 新增 D1 迁移和 TypeScript 类型。
2. 新增内容 API。
3. 新增内容列表、添加页和详情页。
4. 扩展单词详情 API 和页面。
5. 扩展复习 API 和页面。
6. 优化导航、首页和基础视觉样式。
7. 更新 README 的功能说明和接口说明。

## 第一阶段验收标准

- 用户能从 UI 添加一条句子或短内容。
- 用户能把内容关联到已有单词。
- 单词详情能展示关联内容。
- 复习时显示答案后能看到相关语境。
- 现有单词新增、导入、复习、测验、统计功能不回退。
- `npm run lint` 和 `npm run build` 通过。
