# 背单词平台 — 设计文档

> **日期:** 2026-05-30  
> **项目路径:** D:\WordsPlatform  
> **状态:** 设计完成，待审核  

---

## 1. 项目概述

为大学生打造的一站式背单词网站，覆盖四六级、考研、雅思、托福、GRE、计算机、电子信息 8 大词库，提供 4 种学习模式 + 智能间隔复习 + 词汇量评估 + 游戏化激励。

### 1.1 核心目标

- 提供从"浏览初识"到"拼写掌握"的渐进式学习路径
- 用改良的 SM-2 算法自动安排复习，对抗遗忘
- 词汇量动态追踪 + 游戏化设计，保持学习动力
- 为 V2/V3 阶段接入 AI 能力预留架构空间

### 1.2 目标用户

大学生（非英语专业和专业均可），有明确的考试备考或专业词汇积累需求。

---

## 2. 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | Next.js 15 (App Router) | 前后端一体化，Server Actions + API Routes |
| 语言 | TypeScript | 全栈类型安全 |
| ORM | Prisma | 类型安全数据库操作 |
| 数据库 | SQLite | 零配置，文件即数据库；生产可切 PostgreSQL |
| 样式 | Tailwind CSS | 快速出 UI |
| 认证 | NextAuth.js / JWT | 用户登录注册 |
| AI | Claude API / OpenAI API (V2) | 兴趣场景例句生成 |

### 2.2 项目目录结构

```
D:\WordsPlatform\
├── .vscode/              VSCode 配置
├── prisma/
│   ├── schema.prisma     数据模型定义
│   └── migrations/       数据库迁移文件
├── src/
│   ├── app/              Next.js App Router 页面
│   │   ├── layout.tsx    根布局（导航 + 侧边栏）
│   │   ├── page.tsx      首页仪表盘
│   │   ├── auth/         登录/注册/设置
│   │   ├── study/        学习模块（浏览/卡片/选择/拼写）
│   │   ├── review/       复习中心
│   │   ├── words/        词库管理（总词库 + 分词库）
│   │   ├── stats/        学习统计
│   │   ├── wrong-book/   错题本
│   │   └── api/          API 路由
│   ├── components/       可复用 UI 组件
│   ├── lib/              工具函数 & 业务逻辑
│   │   ├── spaced-repetition.ts   SM-2 改良算法
│   │   ├── quiz-generator.ts      题型生成引擎
│   │   ├── vocab-assessment.ts    词汇量评估算法
│   │   └── db.ts                  Prisma 客户端单例
│   └── types/             TypeScript 类型定义
├── public/               静态资源
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 3. 数据模型

### 3.1 ER 图

```
User ──has many──▶ UserWordProgress ◀──belongs to── Word
                                        │
                     WordBank ──has many── Word
                     User ──has many── StudySession
                     Word ──has many── ReviewLog
```

### 3.2 表结构

#### User
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int (PK) | 自增主键 |
| email | String (unique) | 邮箱 |
| username | String | 用户名 |
| passwordHash | String | 密码哈希 |
| interests | String? | 兴趣标签（用于 AI 例句生成） |
| createdAt | DateTime | 注册时间 |

#### WordBank
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int (PK) | 自增主键 |
| name | String | CET-4, CET-6, 考研, IELTS, TOEFL, GRE, 计算机, 电子信息 |
| description | String | 词库描述 |
| wordCount | Int | 单词总数 |

#### Word
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int (PK) | 自增主键 |
| wordBankId | Int (FK) | 所属词库 |
| word | String | 英文单词 |
| phonetic | String | 音标 |
| partOfSpeech | String | 词性 |
| definition | String | 中文释义 |
| exampleSentence | String | 例句 |

#### UserWordProgress
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int (PK) | 自增主键 |
| userId | Int (FK) | 用户 ID |
| wordId | Int (FK) | 单词 ID |
| stage | Enum | new / learning / review / mastered |
| easeFactor | Float | 难度系数（默认 2.5，范围 1.3-3.0） |
| intervalDays | Int | 当前复习间隔（天） |
| repetitions | Int | 连续正确次数 |
| nextReviewAt | DateTime | 下次复习时间 |
| correctCount | Int | 累计正确次数 |
| incorrectCount | Int | 累计错误次数 |
| lastReviewedAt | DateTime | 上次复习时间 |

> userId + wordId 联合唯一索引

#### StudySession
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int (PK) | 自增主键 |
| userId | Int (FK) | 用户 ID |
| wordBankId | Int (FK) | 词库 ID |
| mode | Enum | browse / flashcard / choice / spelling |
| startedAt | DateTime | 开始时间 |
| endedAt | DateTime? | 结束时间 |
| wordsStudied | Int | 学习单词数 |
| correctCount | Int | 正确数 |

#### ReviewLog
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int (PK) | 自增主键 |
| userId | Int (FK) | 用户 ID |
| wordId | Int (FK) | 单词 ID |
| mode | Enum | flashcard / choice / spelling |
| isCorrect | Boolean | 是否正确 |
| quality | Int | 质量评分（0-5） |
| timeSpentMs | Int | 答题耗时（毫秒） |
| answeredAt | DateTime | 答题时间 |

---

## 4. 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页仪表盘 | 今日任务、学习统计、打卡日历、快速开始 |
| `/auth/login` | 登录 | 邮箱 + 密码登录 |
| `/auth/register` | 注册 | 邮箱 + 用户名 + 密码注册 |
| `/auth/settings` | 设置 | 兴趣标签、密码修改 |
| `/study` | 学习首页 | 选词库 + 选模式 |
| `/study/browse` | 浏览模式 | 单词列表翻页浏览 |
| `/study/flashcard` | 卡片翻转 | 正面英文→翻转中文 |
| `/study/choice` | 选择题 | 四选一 |
| `/study/spelling` | 拼写模式 | 看中文写英文 |
| `/review` | 复习中心 | 到期单词复习 |
| `/words` | 词库首页 | 总词库表格 + 词库卡片 |
| `/words/[id]` | 分词库 | 单词列表 + 学习入口 |
| `/stats` | 学习统计 | 词汇量曲线、正确率、时长 |
| `/wrong-book` | 错题本 | 错词列表 + 分类筛选 |

---

## 5. 四种学习模式

### 5.1 浏览模式（📖）
- 每页展示一个单词的完整信息（音标、释义、例句、同义词）
- 上一页 / 下一页自由翻页
- 可播放发音
- 不产生答题记录，适合初次接触新词库
- 标记为 "已浏览"，计入学习进度

### 5.2 卡片翻转（🃏）
- 正面：英文单词 + 音标 + 发音按钮
- 点击翻转：中文释义 + 例句
- 自评按钮：认识 / 不确定 / 不认识
- 映射质量评分：认识→4, 不确定→2, 不认识→0

### 5.3 选择题（✅）
- 题干：英文单词（或中文释义）
- 4 个选项，1 个正确答案
- 干扰项：从同词库随机抽取
- 答对/答错即时反馈
- 映射：答对→按答题时间给 3-5，答错→0-2

### 5.4 拼写模式（✍️）
- 看中文释义 + 可选听发音
- 输入英文拼写
- 实时字母级反馈（绿色正确 / 红色错误）
- 答对权重最高（EF 增长 ×1.2）

### 5.5 渐进式学习流程

新词建议路径：**浏览（初识）→ 卡片（自测）→ 选择（辨析）→ 拼写（掌握）**

已学单词可选任意模式复习，系统根据历史数据智能推荐模式。

---

## 6. 间隔复习算法（SM-2 改良）

### 6.1 质量评分

| 分数 | 含义 |
|------|------|
| 5 | 完美，秒答 |
| 4 | 正确，稍作思考 |
| 3 | 正确，明显犹豫 |
| 2 | 错误，看到答案后记得 |
| 1 | 错误，看到答案也模糊 |
| 0 | 完全不记得 |

### 6.2 算法逻辑

```
1. 如果 q < 3（答错）：
   → repetitions = 0, interval = 1 天, 重置

2. 更新 Ease Factor：
   → EF += 0.1 - (5-q) × (0.08 + (5-q) × 0.02)
   → EF 下限 1.3，不设上限

3. 计算间隔：
   → n=0: interval = 1 天
   → n=1: interval = 6 天
   → n≥2: interval = prev_interval × EF

4. 记录下次复习时间：
   → nextReviewAt = now + interval 天
```

### 6.3 改良点

1. **答题时间加权** — <3s 秒答 EF +0.1，>10s 犹豫 EF -0.1
2. **模式权重** — 选择答对 EF ×0.8，拼写答对 EF ×1.2
3. **弹性复习窗口** — 到期当天优先展示；提前复习不惩罚；逾期 1-3 天 EF ×0.95；逾期 >7 天重置间隔

### 6.4 标准间隔序列（EF=2.5）

1 → 6 → 15 → 37 → 90 → 225 → ... 天

---

## 7. 创新功能

### 7.1 自适应学习引擎（MVP）
- **智能模式推荐** — 分析各题型正确率，自动推荐当前单词最适合的练习模式
- **动态间隔调整** — 根据答题时长和错误模式动态调整复习计划
- **关联词推送** — 学一词推近义词/反义词/搭配词

### 7.2 词汇量动态评估（MVP）
- **入学测试** — 30-50 词采样测试估算当前词汇量，精准定位起点
- **实时追踪** — 每次学习后动态更新词汇量估值
- **成长曲线** — 可视化展示词汇量变化趋势

### 7.3 游戏化系统（MVP）
- 连续打卡天数统计
- 词库完成度成就徽章
- 经验值 (XP) 与等级系统，升级解锁功能

### 7.4 AI 个性化记忆辅助（V2）
- **兴趣场景例句** — 根据用户兴趣标签，AI 生成贴近生活的例句
- **专业场景延伸** — 计算机词汇配代码场景，电子信息词汇配技术文档场景

### 7.5 错题智能关联（V3）
- 薄弱模式诊断 — 发现用户的错误规律
- 智能错题本 — 自动归类（拼写/释义/混淆），分类攻克

---

## 8. 版本规划

| 阶段 | 内容 |
|------|------|
| **MVP** | 用户系统 + 8词库 + 4种模式 + 艾宾浩斯复习 + 自适应引擎 + 词汇量评估 + 游戏化 |
| **V2** | AI 兴趣场景例句 + AI 专业场景延伸 |
| **V3** | 错题智能关联 + 薄弱点诊断 |

---

## 9. 非功能需求

- **AI/IDE 友好** — 标准 Next.js 目录结构，单一职责文件，TypeScript 类型清晰，注释标注算法逻辑
- **本地运行** — SQLite 零配置，`npm run dev` 一键启动
- **可扩展** — 数据库切 PostgreSQL 只需改 Prisma 配置，AI 模块独立可用开关控制
- **响应式** — 支持桌面端和移动端浏览器

---

## 10. 设计约束与假设

- MVP 阶段不接入外部 AI API，所有智能功能用纯算法实现
- 词库数据手动录入或通过脚本导入，暂不涉及用户自定义词库
- 首版仅支持 Web 端，基于浏览器的响应式设计
- 单用户场景优先，暂不考虑社交功能
