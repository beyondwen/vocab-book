# Vocab Book UI 与内容库实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 实现内容库、内容与单词关联、复习语境展示，并优化主要 UI。

**架构：** 新增 `content_items` 与 `content_word_links` 两张 D1 表，内部管理 API 通过 `requireAdmin` 读写内容与关联关系。前端新增内容列表、添加、详情页，并扩展首页、导航、单词列表、单词详情和复习页。

**技术栈：** Next.js App Router、React、Tailwind CSS、Cloudflare D1、Node 内置测试。

---

## 文件结构

- 创建：`migrations/0002_content_library.sql`，新增内容库表和索引。
- 修改：`db/schema.sql`，同步完整数据库结构。
- 修改：`src/lib/db.ts`，新增内容相关类型。
- 创建：`src/lib/content-utils.js`，提供可被 Node 测试和 Next.js 代码复用的内容校验、标签解析、ID 去重工具。
- 创建：`test/content-utils.test.mjs`，覆盖内容正文校验、标签解析、关联 ID 去重。
- 创建：`src/app/api/content/route.ts`，实现内容分页查询和创建。
- 创建：`src/app/api/content/[id]/route.ts`，实现内容详情、更新、删除。
- 修改：`src/app/api/words/route.ts`，单词列表返回关联内容数量。
- 修改：`src/app/api/words/[id]/route.ts`，单词详情返回关联内容。
- 修改：`src/app/api/review/route.ts`，待复习单词返回最多 2 条语境。
- 创建：`src/app/content/page.tsx`，内容列表页。
- 创建：`src/app/content/new/page.tsx`，内容添加页。
- 创建：`src/app/content/[id]/page.tsx`，内容详情和编辑页。
- 修改：`src/app/components/AppNav.tsx`，改为图标导航并增加内容入口和选中态。
- 修改：`src/app/page.tsx`，改为学习工作台。
- 修改：`src/app/words/page.tsx`，展示关联内容数量并优化卡片。
- 修改：`src/app/words/[id]/page.tsx`，展示关联内容。
- 修改：`src/app/review/page.tsx`，答案显示后展示相关语境。
- 修改：`README.md`，补充内容库功能。

## 任务 1：内容工具与红灯测试

- [ ] 编写 `test/content-utils.test.mjs`，测试 `normalizeContentBody`、`parseTags`、`normalizeWordIds` 的期望行为。
- [ ] 运行 `rtk node --test test/content-utils.test.mjs`，预期因为 `src/lib/content-utils.js` 不存在而失败。
- [ ] 创建 `src/lib/content-utils.js`，实现最少逻辑让测试通过。
- [ ] 重新运行 `rtk node --test test/content-utils.test.mjs`，预期通过。

## 任务 2：数据库和类型

- [ ] 创建 `migrations/0002_content_library.sql`。
- [ ] 更新 `db/schema.sql`。
- [ ] 更新 `src/lib/db.ts` 类型。

## 任务 3：内容 API

- [ ] 实现 `src/app/api/content/route.ts` 的 GET/POST。
- [ ] 实现 `src/app/api/content/[id]/route.ts` 的 GET/PUT/DELETE。
- [ ] 使用内容工具校验正文、解析标签、去重关联单词 ID。

## 任务 4：扩展现有 API

- [ ] 修改单词列表 API，返回 `content_count`。
- [ ] 修改单词详情 API，返回 `contents`。
- [ ] 修改复习 API，为每个待复习单词返回最多 2 条 `contents`。

## 任务 5：内容页面

- [ ] 新增内容列表页，支持搜索、分页入口和添加入口。
- [ ] 新增内容添加页，支持正文、来源、备注、标签、关联单词。
- [ ] 新增内容详情页，支持编辑和删除。

## 任务 6：UI 优化和语境展示

- [ ] 优化导航为 lucide 图标导航，增加内容入口和当前态。
- [ ] 优化首页为学习工作台。
- [ ] 单词列表展示关联内容数量。
- [ ] 单词详情展示关联内容。
- [ ] 复习页显示答案后展示相关语境。
- [ ] 更新 README。

## 验证

- [ ] `rtk node --test test/content-utils.test.mjs`
- [ ] `rtk npm run lint`
- [ ] `rtk npm run build`
- [ ] 启动本地开发服务，提供可访问 URL。
