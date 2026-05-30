# 📖 WordMaster — 智能背单词平台

面向大学生的全栈背单词网站，覆盖 **8 大词库、4 种学习模式**，搭载 SM-2 改良间隔复习算法，帮助高效记忆单词。

---

## ✨ 功能特性

### 📚 词库
- **CET-4** / **CET-6** — 大学英语四六级
- **考研** — 研究生入学考试
- **IELTS** / **TOEFL** / **GRE** — 出国留学考试
- **计算机** — 计算机专业英语（含 AI/云计算/区块链/大数据）
- **电子信息** — 电子信息工程专业词汇

### 🎯 四种学习模式
| 模式 | 说明 |
|------|------|
| 📖 浏览模式 | 翻页查看单词完整信息（音标/释义/例句） |
| 🃏 卡片翻转 | 看英文猜中文，自评记忆程度 |
| ✅ 选择题 | 四选一，强化辨析能力 |
| ✍️ 拼写模式 | 看中文写英文，深度掌握拼写 |

### 🧠 智能算法
- **SM-2 改良间隔复习** — 基于艾宾浩斯遗忘曲线，自动安排复习计划
- **答题时间加权** — 秒答加分，犹豫减分
- **模式权重** — 拼写正确比选择正确更有说服力
- **弹性复习窗口** — 逾期自适应调整

### 🎮 游戏化激励
- 🔥 连续打卡天数
- 🏆 成就徽章解锁
- ⭐ 经验值与等级系统

### 📊 数据追踪
- 词汇量动态评估与成长曲线
- 各模式正确率统计
- 错题本自动归集

---

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| 数据库 | PostgreSQL (生产) / SQLite (本地开发) |
| ORM | Prisma |
| 样式 | Tailwind CSS |
| 认证 | JWT + bcrypt |

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 9+

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/CHHHHHH081/MyProjects.git
cd MyProjects

# 安装依赖
npm install

# 初始化数据库（SQLite）
npx prisma db push

# 导入种子数据（需要 dict 词库 ZIP 文件）
npx tsx prisma/import-dict.ts

# 启动开发服务器
npm run dev
```

打开 http://localhost:3000 即可使用。

### 生产部署

```bash
# 设置环境变量（指向 PostgreSQL）
export DATABASE_URL="postgresql://..."
export JWT_SECRET="your-secret"

# 构建并启动
npm run build
npm start
```

---

## 📁 项目结构

```
├── prisma/
│   ├── schema.prisma      # 数据模型
│   ├── import-dict.ts     # 从 ZIP 导入完整词库
│   ├── seed-pg.ts         # PostgreSQL 种子数据
│   └── import-computer.ts # 计算机词汇导入
├── src/
│   ├── app/               # Next.js App Router 页面
│   │   ├── page.tsx       # 首页仪表盘
│   │   ├── auth/          # 登录/注册/设置
│   │   ├── study/         # 学习模块（浏览/卡片/选择/拼写）
│   │   ├── review/        # 复习中心
│   │   ├── words/         # 词库管理
│   │   ├── stats/         # 学习统计
│   │   ├── wrong-book/    # 错题本
│   │   └── api/           # API 路由
│   ├── components/        # 可复用组件
│   └── lib/               # 工具函数 & 算法
│       ├── spaced-repetition.ts  # SM-2 改良算法
│       ├── quiz-generator.ts     # 题型生成引擎
│       ├── vocab-assessment.ts   # 词汇量评估
│       ├── gamification.ts       # 游戏化系统
│       └── auth.ts              # JWT 认证
└── docs/
    └── superpowers/       # 设计文档 & 实现计划
```

---

## 🌐 部署

### Render（推荐）

1. Fork 本仓库
2. 在 [Render](https://dashboard.render.com) 创建 Blueprint
3. 设置环境变量 `DATABASE_URL`（Neon PostgreSQL 连接字符串）
4. 自动部署

### Vercel

```bash
npx vercel --env DATABASE_URL="postgresql://..."
```

---

## 📄 License

MIT

---

**Made with ❤️ for students who want to master English vocabulary.**
