# Vocab Book - Web 单词本

一个基于 Web 的个人单词本应用，支持单词管理、艾宾浩斯复习、测试测验、学习统计，并提供开放 API 供第三方调用。

## 功能特性

- 📝 **单词管理** - 手动录入、批量导入、分组管理
- 🔄 **艾宾浩斯复习** - 基于 SM-2 算法的间隔重复
- ✍️ **测试模式** - 选择题、拼写测试
- 📊 **学习统计** - 掌握率、学习趋势、复习日历
- 🔌 **开放 API** - 供第三方应用调用

## 技术栈

- **前端**: Next.js 14 (App Router) + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: SQLite (better-sqlite3)
- **部署**: 支持 Vercel / Cloudflare Pages

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

## 项目结构

```
vocab-book/
├── db/                    # 数据库 Schema
├── src/
│   ├── app/
│   │   ├── api/          # API 路由
│   │   ├── words/        # 单词管理页面
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

使用 API Key 认证，通过 Header 传递：

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
| GET | /api/review | 获取待复习单词 |
| POST | /api/review | 提交复习结果 |
| GET | /api/stats | 获取学习统计 |
| POST | /api/import | 批量导入 |
| POST | /api/v1/words | 第三方添加单词 |
| POST | /api/v1/words/batch | 第三方批量添加 |

## 许可证

MIT
