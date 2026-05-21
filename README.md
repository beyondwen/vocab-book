# Vocab Book - Web 单词本

一个基于 Web 的个人单词本应用，支持单词管理、艾宾浩斯复习、测试测验、学习统计，并提供开放 API 供第三方调用。

## 功能特性

- 📝 **单词管理** - 手动录入、批量导入、分组管理
- 🧩 **内容库** - 保存句子、短段落和摘录，并关联到单词
- 🔄 **艾宾浩斯复习** - 基于 SM-2 算法的间隔重复
- ✍️ **测试模式** - 选择题、拼写测试
- 📊 **学习统计** - 掌握率、学习趋势、复习日历
- 🔌 **开放 API** - 供第三方应用调用

## 技术栈

- **前端**: Next.js 16 (App Router) + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Cloudflare D1
- **部署**: Cloudflare Workers（OpenNext）

## 快速开始

```bash
# 安装依赖
npm ci

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 生产环境管理令牌

生产环境必须配置 `VOCAB_BOOK_ADMIN_TOKEN`。内部管理接口会校验：

```
X-Admin-Token: your-admin-token
# 或
Authorization: Bearer your-admin-token
```

网页访问会先进入 `/login`，登录成功后服务端会写入 httpOnly Cookie。开发环境未配置该变量时，会自动跳过管理接口校验，方便本地个人使用；第三方 API 仍然使用 `vb_xxx` API Key。

### Cloudflare 部署

项目通过 OpenNext 部署到 Cloudflare Workers，并使用 D1 持久化数据。

```bash
# 创建 D1 数据库后，把 database_id 写入 wrangler.jsonc
npx wrangler d1 create vocab-book-db

# 应用远程 D1 迁移
npm run db:migrate

# 设置生产管理令牌
npx wrangler secret put VOCAB_BOOK_ADMIN_TOKEN

# 构建并部署
npm run cf:deploy
```

## 项目结构

```
vocab-book/
├── db/                    # 数据库 Schema
├── src/
│   ├── app/
│   │   ├── api/          # API 路由
│   │   ├── words/        # 单词管理页面
│   │   ├── content/      # 内容库页面
│   │   ├── review/       # 复习页面
│   │   ├── quiz/         # 测试页面
│   │   ├── stats/        # 统计页面
│   │   ├── import/       # 导入页面
│   │   └── settings/     # 设置页面
│   └── lib/              # 工具库
│       ├── db.ts         # 数据库连接
│       └── sm2.ts        # SM-2 算法
└── data/                 # SQLite 数据文件
```

## API 文档

### 认证

`/api/v1/*` 是第三方开放 API，使用 API Key 认证，通过 Header 传递：

```
Authorization: Bearer vb_xxx...
# 或
X-API-Key: vb_xxx...
```

### 接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/words | 查询单词列表 |
| POST | /api/words | 添加单词 |
| GET | /api/words/:id | 获取单词详情 |
| PUT | /api/words/:id | 更新单词 |
| DELETE | /api/words/:id | 删除单词 |
| GET | /api/content | 查询内容列表 |
| POST | /api/content | 添加内容 |
| GET | /api/content/:id | 获取内容详情 |
| PUT | /api/content/:id | 更新内容 |
| DELETE | /api/content/:id | 删除内容 |
| GET | /api/review | 获取待复习单词 |
| POST | /api/review | 提交复习结果 |
| GET | /api/stats | 获取学习统计 |
| POST | /api/import | 批量导入 |
| POST | /api/v1/words | 第三方添加单词 |
| POST | /api/v1/words/batch | 第三方批量添加 |
| GET | /api/v1/content | 第三方查询内容 |
| POST | /api/v1/content | 第三方添加内容 |
| GET | /api/v1/content/:id | 第三方获取内容详情 |
| DELETE | /api/v1/content/:id | 第三方删除内容 |
| POST | /api/v1/content/batch | 第三方批量添加内容 |

内部页面使用的 `/api/words`、`/api/review`、`/api/stats`、`/api/import`、`/api/settings/api-keys` 在生产环境需要管理令牌。

## 许可证

MIT
