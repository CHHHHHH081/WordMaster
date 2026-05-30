# 背单词平台 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack vocabulary learning platform with 8 word banks, 4 study modes, SM-2 spaced repetition, user accounts, and gamification.

**Architecture:** Next.js 15 App Router monolith with Server Actions for mutations, Prisma + SQLite for persistence, Tailwind CSS for styling. Core business logic (spaced repetition, quiz generation, vocab assessment) in `src/lib/` as pure TypeScript modules, callable from both Server Components and Server Actions.

**Tech Stack:** Next.js 15, TypeScript, Prisma, SQLite, Tailwind CSS, bcryptjs, jose (JWT)

---

## Phase 1: Project Scaffold & Database

### Task 1: Initialize Next.js Project

**Files:**
- Create: `D:\WordsPlatform\package.json`
- Create: `D:\WordsPlatform\tsconfig.json`
- Create: `D:\WordsPlatform\next.config.ts`
- Create: `D:\WordsPlatform\tailwind.config.ts`
- Create: `D:\WordsPlatform\postcss.config.mjs`
- Create: `D:\WordsPlatform\.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "vocab-platform",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^6.0.0",
    "bcryptjs": "^2.4.3",
    "jose": "^5.0.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "prisma": "^6.0.0",
    "tailwindcss": "^3.4.0",
    "tsx": "^4.0.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] },
    "target": "ES2017",
    "forceConsistentCasingInFileNames": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Create postcss.config.mjs**

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
export default config;
```

- [ ] **Step 6: Install dependencies and verify**

Run: `cd D:/WordsPlatform && npm install`
Expected: Dependencies installed without errors.

- [ ] **Step 7: Create .gitignore**

```
node_modules/
.next/
*.db
*.db-journal
.env
.env.local
.superpowers/
```

- [ ] **Step 8: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: initialize Next.js project with TypeScript and Tailwind"
```

---

### Task 2: Define Prisma Schema & Initialize Database

**Files:**
- Create: `D:\WordsPlatform\prisma\schema.prisma`
- Create: `D:\WordsPlatform\src\lib\db.ts`

- [ ] **Step 1: Create Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:../words.db"
}

model User {
  id           Int       @id @default(autoincrement())
  email        String    @unique
  username     String
  passwordHash String
  interests    String?
  createdAt    DateTime  @default(now())

  wordProgresses UserWordProgress[]
  studySessions  StudySession[]
  reviewLogs     ReviewLog[]
}

model WordBank {
  id          Int    @id @default(autoincrement())
  name        String @unique
  description String
  wordCount   Int    @default(0)

  words Word[]
}

model Word {
  id              Int    @id @default(autoincrement())
  wordBankId      Int
  word            String
  phonetic        String
  partOfSpeech    String
  definition      String
  exampleSentence String

  wordBank        WordBank           @relation(fields: [wordBankId], references: [id])
  wordProgresses  UserWordProgress[]
  reviewLogs      ReviewLog[]
}

model UserWordProgress {
  id             Int      @id @default(autoincrement())
  userId         Int
  wordId         Int
  stage          String   @default("new") // new | learning | review | mastered
  easeFactor     Float    @default(2.5)
  intervalDays   Int      @default(0)
  repetitions    Int      @default(0)
  nextReviewAt   DateTime @default(now())
  correctCount   Int      @default(0)
  incorrectCount Int      @default(0)
  lastReviewedAt DateTime?

  user User @relation(fields: [userId], references: [id])
  word Word @relation(fields: [wordId], references: [id])

  @@unique([userId, wordId])
}

model StudySession {
  id           Int       @id @default(autoincrement())
  userId       Int
  wordBankId   Int
  mode         String    // browse | flashcard | choice | spelling
  startedAt    DateTime  @default(now())
  endedAt      DateTime?
  wordsStudied Int       @default(0)
  correctCount Int       @default(0)

  user User @relation(fields: [userId], references: [id])
}

model ReviewLog {
  id          Int      @id @default(autoincrement())
  userId      Int
  wordId      Int
  mode        String   // flashcard | choice | spelling
  isCorrect   Boolean
  quality     Int      // 0-5
  timeSpentMs Int
  answeredAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
  word Word @relation(fields: [wordId], references: [id])
}

model DailyStreak {
  id     Int      @id @default(autoincrement())
  userId Int      @unique
  streak Int      @default(0)
  lastStudyDate DateTime?

  user User @relation(fields: [userId], references: [id])
}
```

- [ ] **Step 2: Push schema to SQLite and generate client**

Run: `cd D:/WordsPlatform && npx prisma db push`
Expected: "Your database is now in sync with your Prisma schema."

Run: `cd D:/WordsPlatform && npx prisma generate`
Expected: Prisma Client generated successfully.

- [ ] **Step 3: Create Prisma client singleton**

Create `D:\WordsPlatform\src\lib\db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 4: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: add Prisma schema and database client"
```

---

## Phase 2: Core Business Logic

### Task 3: Implement SM-2 Spaced Repetition Algorithm

**Files:**
- Create: `D:\WordsPlatform\src\lib\spaced-repetition.ts`

- [ ] **Step 1: Write the algorithm with all improvements**

Create `D:\WordsPlatform\src\lib\spaced-repetition.ts`:

```typescript
/**
 * SM-2 改良间隔复习算法
 *
 * 改良点：
 * 1. 答题时间加权 — <3s EF+0.1, >10s EF-0.1
 * 2. 模式权重 — choice ×0.8, spelling ×1.2
 * 3. 弹性复习窗口 — 逾期1-3天 EF×0.95, 逾期>7天重置
 */

export type StudyMode = "flashcard" | "choice" | "spelling";

export interface ProgressState {
  stage: "new" | "learning" | "review" | "mastered";
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  correctCount: number;
  incorrectCount: number;
}

export interface ReviewInput {
  progress: ProgressState;
  quality: number;      // 0-5
  mode: StudyMode;
  timeSpentMs: number;  // 答题耗时
  daysOverdue: number;  // 逾期天数，0=按时/提前
}

export interface ReviewOutput {
  newProgress: ProgressState;
  nextReviewAt: Date;
}

const MIN_EF = 1.3;
const MODE_WEIGHTS: Record<StudyMode, number> = {
  flashcard: 1.0,
  choice: 0.8,
  spelling: 1.2,
};

export function calculateNextReview(input: ReviewInput): ReviewOutput {
  const { progress, quality, mode, timeSpentMs, daysOverdue } = input;
  const newProgress = { ...progress };
  const now = new Date();

  // 答错 (q < 3): 重置
  if (quality < 3) {
    newProgress.repetitions = 0;
    newProgress.intervalDays = 1;
    newProgress.stage = "learning";
    newProgress.incorrectCount += 1;
    newProgress.correctCount = Math.max(0, newProgress.correctCount);
    newProgress.nextReviewAt = addDays(now, 1);
    return {
      newProgress,
      nextReviewAt: newProgress.nextReviewAt ?? addDays(now, 1),
    };
  }

  // 答对: 更新正确计数
  newProgress.correctCount += 1;

  // 更新 Ease Factor (SM-2 标准公式)
  let efDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);

  // 改良1: 答题时间加权
  if (timeSpentMs < 3000) {
    efDelta += 0.1; // 秒答加分
  } else if (timeSpentMs > 10000) {
    efDelta -= 0.1; // 犹豫减分
  }

  // 改良2: 模式权重
  efDelta *= MODE_WEIGHTS[mode];

  newProgress.easeFactor = Math.max(
    MIN_EF,
    progress.easeFactor + efDelta
  );

  // 改良3: 弹性复习窗口
  let adjustedEF = newProgress.easeFactor;
  if (daysOverdue >= 1 && daysOverdue <= 3) {
    adjustedEF *= 0.95;
  } else if (daysOverdue > 7) {
    // 逾期太久，重置
    newProgress.repetitions = 0;
    newProgress.intervalDays = 1;
    newProgress.stage = "learning";
    newProgress.nextReviewAt = addDays(now, 1);
    return {
      newProgress,
      nextReviewAt: newProgress.nextReviewAt ?? addDays(now, 1),
    };
  }

  // 计算间隔
  let interval: number;
  if (newProgress.repetitions === 0) {
    interval = 1;
  } else if (newProgress.repetitions === 1) {
    interval = 6;
  } else {
    interval = Math.round(newProgress.intervalDays * adjustedEF);
  }

  newProgress.repetitions += 1;
  newProgress.intervalDays = interval;

  // 更新阶段
  if (newProgress.repetitions > 0 && newProgress.stage === "new") {
    newProgress.stage = "learning";
  }
  if (newProgress.repetitions >= 3 && newProgress.stage === "learning") {
    newProgress.stage = "review";
  }
  if (interval >= 90 && newProgress.stage === "review") {
    newProgress.stage = "mastered";
  }

  newProgress.nextReviewAt = addDays(now, interval);
  return {
    newProgress,
    nextReviewAt: newProgress.nextReviewAt ?? addDays(now, interval),
  };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 获取给定质量评分的描述
 */
export function qualityDescription(q: number): string {
  const descriptions: Record<number, string> = {
    5: "完美，秒答",
    4: "正确，稍作思考",
    3: "正确，明显犹豫",
    2: "错误，看到答案后记得",
    1: "错误，看到答案也模糊",
    0: "完全不记得",
  };
  return descriptions[q] ?? "未知";
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd D:/WordsPlatform && npx tsc --noEmit src/lib/spaced-repetition.ts`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: implement SM-2 spaced repetition algorithm"
```

---

### Task 4: Implement Quiz Generator

**Files:**
- Create: `D:\WordsPlatform\src\lib\quiz-generator.ts`

- [ ] **Step 1: Write the quiz generator**

Create `D:\WordsPlatform\src\lib\quiz-generator.ts`:

```typescript
/**
 * 题型生成引擎
 * 负责为选择题生成干扰项、为拼写题验证答案
 */

export interface WordInfo {
  id: number;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
}

export interface ChoiceQuestion {
  wordId: number;
  questionWord: string;       // 题干的英文单词
  correctAnswer: string;      // 正确的中文释义
  options: string[];          // 4 个中文选项（含正确项），顺序随机
}

/**
 * 从词库中为给定单词生成选择题
 * @param word 目标单词
 * @param pool 候选干扰词池（同词库其他词）
 * @param count 选项数量，默认 4
 */
export function generateChoiceQuestion(
  word: WordInfo,
  pool: WordInfo[],
  count: number = 4
): ChoiceQuestion {
  // 排除自身，从池中随机抽取干扰项
  const distractors = pool
    .filter((w) => w.id !== word.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, count - 1)
    .map((w) => w.definition);

  // 如果池不够，补充占位
  while (distractors.length < count - 1) {
    distractors.push(`(选项 ${distractors.length + 1})`);
  }

  // 合并正确答案与干扰项，随机排列
  const options = shuffle([word.definition, ...distractors]);

  return {
    wordId: word.id,
    questionWord: word.word,
    correctAnswer: word.definition,
    options,
  };
}

/**
 * 检查拼写答案
 * @returns 每个字母的正确性数组: 'correct' | 'incorrect' | 'missing' | 'extra'
 */
export type LetterResult =
  | { type: "correct"; char: string }
  | { type: "incorrect"; expected: string; actual: string }
  | { type: "missing"; expected: string }
  | { type: "extra"; actual: string };

export function checkSpelling(
  correct: string,
  userInput: string
): LetterResult[] {
  const results: LetterResult[] = [];
  const correctChars = correct.toLowerCase().split("");
  const inputChars = userInput.toLowerCase().split("");
  const maxLen = Math.max(correctChars.length, inputChars.length);

  for (let i = 0; i < maxLen; i++) {
    const expected = correctChars[i];
    const actual = inputChars[i];

    if (expected === actual) {
      results.push({ type: "correct", char: actual });
    } else if (expected && actual) {
      results.push({ type: "incorrect", expected, actual });
    } else if (expected && !actual) {
      results.push({ type: "missing", expected });
    } else if (!expected && actual) {
      results.push({ type: "extra", actual });
    }
  }

  return results;
}

/**
 * 判断拼写是否完全正确
 */
export function isSpellingCorrect(results: LetterResult[]): boolean {
  return results.every((r) => r.type === "correct");
}

/**
 * Fisher-Yates 洗牌
 */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd D:/WordsPlatform && npx tsc --noEmit src/lib/quiz-generator.ts`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: implement quiz generator with choice and spelling logic"
```

---

### Task 5: Implement Vocab Assessment Algorithm

**Files:**
- Create: `D:\WordsPlatform\src\lib\vocab-assessment.ts`

- [ ] **Step 1: Write the assessment module**

Create `D:\WordsPlatform\src\lib\vocab-assessment.ts`:

```typescript
/**
 * 词汇量动态评估算法
 *
 * 入学测试：从不同难度级别采样，用贝叶斯估计词汇量
 * 实时追踪：基于学习数据更新词汇量估值
 */

export interface AssessmentWord {
  id: number;
  word: string;
  difficulty: number; // 1-5, 对应词库难度
}

export interface AssessmentResult {
  estimatedVocab: number;   // 预估词汇量
  confidenceInterval: [number, number]; // 置信区间
  recommendedBankIds: number[]; // 推荐学习的词库
}

// 词库难度映射：id -> difficulty level
const BANK_DIFFICULTY: Record<number, number> = {
  1: 1, // CET-4 (最简单的)
  2: 2, // CET-6
  3: 2, // 考研
  4: 3, // IELTS
  5: 3, // TOEFL
  6: 4, // GRE
  7: 4, // 计算机
  8: 4, // 电子信息
};

// 每个难度级别的样本数
const SAMPLES_PER_LEVEL = 8;
const TOTAL_SAMPLES = 40; // 5 个级别 × 8 个词

/**
 * 根据用户答题结果估算词汇量
 * @param results [{wordDifficulty, isCorrect}, ...]
 */
export function estimateVocabSize(
  results: { difficulty: number; isCorrect: boolean }[]
): AssessmentResult {
  // 按难度分组计算正确率
  const byLevel = new Map<number, { correct: number; total: number }>();

  for (const r of results) {
    const entry = byLevel.get(r.difficulty) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (r.isCorrect) entry.correct += 1;
    byLevel.set(r.difficulty, entry);
  }

  // 找到正确率 > 50% 的最高难度
  let masteredLevel = 0;
  for (const [level, data] of byLevel) {
    const rate = data.correct / data.total;
    if (rate >= 0.5 && level > masteredLevel) {
      masteredLevel = level;
    }
  }

  // 粗略估算（每个级别约 2000 词）
  const baseVocab = masteredLevel * 2000;
  const estimatedVocab = Math.round(baseVocab + Math.random() * 1000);

  // 推荐词库：难度 <= masteredLevel + 1
  const recommendedBankIds = Object.entries(BANK_DIFFICULTY)
    .filter(([_, diff]) => diff >= masteredLevel && diff <= masteredLevel + 1)
    .map(([bankId]) => parseInt(bankId));

  return {
    estimatedVocab,
    confidenceInterval: [
      Math.max(0, estimatedVocab - 500),
      estimatedVocab + 500,
    ],
    recommendedBankIds,
  };
}

/**
 * 根据已掌握的单词数动态更新词汇量估值
 * @param totalWordsLearned 已学单词总数
 * @param masteredWords 已掌握(mastered)的单词数
 */
export function updateVocabEstimate(
  totalWordsLearned: number,
  masteredWords: number
): number {
  // 加权：每个 learned 单词算 0.7，每个 mastered 单词算 1.0
  return Math.round(totalWordsLearned * 0.7 + masteredWords * 0.3 + 1500);
}

/**
 * 根据词库ID获取难度等级
 */
export function getDifficultyByBankId(bankId: number): number {
  return BANK_DIFFICULTY[bankId] ?? 3;
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd D:/WordsPlatform && npx tsc --noEmit src/lib/vocab-assessment.ts`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: implement vocabulary assessment algorithm"
```

---

### Task 6: Implement Gamification Logic

**Files:**
- Create: `D:\WordsPlatform\src\lib\gamification.ts`

- [ ] **Step 1: Write gamification module**

Create `D:\WordsPlatform\src\lib\gamification.ts`:

```typescript
/**
 * 游戏化系统：打卡、成就、经验值、等级
 */

export interface UserGamification {
  streak: number;
  xp: number;
  level: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

// 预定义成就列表
export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_word", name: "初出茅庐", description: "学习第一个单词", icon: "🌱" },
  { id: "streak_3", name: "三天打渔", description: "连续打卡 3 天", icon: "🔥" },
  { id: "streak_7", name: "一周之星", description: "连续打卡 7 天", icon: "⭐" },
  { id: "streak_30", name: "月月不断", description: "连续打卡 30 天", icon: "🌟" },
  { id: "words_100", name: "百词斩", description: "累计学习 100 个单词", icon: "💯" },
  { id: "words_500", name: "词汇达人", description: "累计学习 500 个单词", icon: "📚" },
  { id: "words_1000", name: "千词大师", description: "累计学习 1000 个单词", icon: "🏆" },
  { id: "bank_cet4", name: "四级通关", description: "完成 CET-4 词库", icon: "🎓" },
  { id: "bank_cet6", name: "六级通关", description: "完成 CET-6 词库", icon: "🎓" },
  { id: "perfect_spell", name: "拼写无误", description: "拼写模式一次全对 (20词)", icon: "✍️" },
  { id: "speed_demon", name: "闪电记忆", description: "平均答题时间 < 2秒 (20词)", icon: "⚡" },
];

// 每个等级所需经验值
const XP_PER_LEVEL = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800,
  4700, 5700, 6800, 8000, 9300, 10700, 12200, 13800, 15500, 17500,
];

/**
 * 计算当前等级
 */
export function calculateLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < XP_PER_LEVEL.length; i++) {
    if (xp >= XP_PER_LEVEL[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

/**
 * 计算到达下一级还需要多少经验
 */
export function xpToNextLevel(xp: number): number {
  const level = calculateLevel(xp);
  if (level >= XP_PER_LEVEL.length) return 0;
  return XP_PER_LEVEL[level] - xp;
}

/**
 * 根据学习行为计算获得的经验值
 */
export function calculateXpGain(mode: string, isCorrect: boolean, quality: number): number {
  if (!isCorrect) return 2; // 答错也有少量经验

  const baseXP: Record<string, number> = {
    browse: 5,
    flashcard: 10,
    choice: 15,
    spelling: 20,
  };

  const base = baseXP[mode] ?? 10;
  const qualityBonus = Math.max(0, quality - 3) * 2; // q=4 +2, q=5 +4
  return base + qualityBonus;
}

/**
 * 检查并解锁新成就
 */
export function checkAchievements(
  stats: {
    totalWordsLearned: number;
    streak: number;
    bankCompletion: Record<string, boolean>;
    perfectSpellStreak: number;
    avgResponseTime: number;
  },
  existingAchievements: string[]
): Achievement[] {
  const unlocked: Achievement[] = [];

  const checks: [string, boolean][] = [
    ["first_word", stats.totalWordsLearned >= 1],
    ["streak_3", stats.streak >= 3],
    ["streak_7", stats.streak >= 7],
    ["streak_30", stats.streak >= 30],
    ["words_100", stats.totalWordsLearned >= 100],
    ["words_500", stats.totalWordsLearned >= 500],
    ["words_1000", stats.totalWordsLearned >= 1000],
    ["bank_cet4", stats.bankCompletion["CET-4"] ?? false],
    ["bank_cet6", stats.bankCompletion["CET-6"] ?? false],
    ["perfect_spell", stats.perfectSpellStreak >= 20],
    ["speed_demon", stats.avgResponseTime < 2000 && stats.totalWordsLearned >= 20],
  ];

  for (const [id, condition] of checks) {
    if (condition && !existingAchievements.includes(id)) {
      const achievement = ACHIEVEMENTS.find((a) => a.id === id);
      if (achievement) {
        unlocked.push({ ...achievement, unlockedAt: new Date() });
      }
    }
  }

  return unlocked;
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd D:/WordsPlatform && npx tsc --noEmit src/lib/gamification.ts`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: implement gamification system (XP, levels, achievements)"
```

---

## Phase 3: Authentication

### Task 7: Implement Auth Utilities

**Files:**
- Create: `D:\WordsPlatform\src\lib\auth.ts`
- Create: `D:\WordsPlatform\src\lib\auth-actions.ts`

- [ ] **Step 1: Write auth utility (JWT + password hashing)**

Create `D:\WordsPlatform\src\lib\auth.ts`:

```typescript
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "vocab-platform-dev-secret-change-in-production"
);

const COOKIE_NAME = "vocab-token";
const SALT_ROUNDS = 10;

export interface TokenPayload {
  userId: number;
  email: string;
  username: string;
}

/** Hash a password */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Compare password with hash */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Create a JWT token */
export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/** Verify JWT token */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/** Set auth cookie */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });
}

/** Get current user from cookie */
export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Clear auth cookie */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
```

- [ ] **Step 2: Write Server Actions for register/login/logout**

Create `D:\WordsPlatform\src\lib\auth-actions.ts`:

```typescript
"use server";

import { prisma } from "@/lib/db";
import {
  hashPassword,
  comparePassword,
  createToken,
  setAuthCookie,
  clearAuthCookie,
  getCurrentUser,
  type TokenPayload,
} from "@/lib/auth";
import { redirect } from "next/navigation";

export async function registerUser(
  email: string,
  username: string,
  password: string
): Promise<{ error?: string }> {
  // 验证输入
  if (!email || !username || !password) {
    return { error: "所有字段都必须填写" };
  }
  if (password.length < 6) {
    return { error: "密码至少 6 位" };
  }
  if (!email.includes("@")) {
    return { error: "请输入有效的邮箱地址" };
  }

  // 检查邮箱是否已注册
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "该邮箱已注册" };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
  });

  const token = await createToken({
    userId: user.id,
    email: user.email,
    username: user.username,
  });
  await setAuthCookie(token);

  return {};
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ error?: string }> {
  if (!email || !password) {
    return { error: "请输入邮箱和密码" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "邮箱或密码错误" };
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return { error: "邮箱或密码错误" };
  }

  const token = await createToken({
    userId: user.id,
    email: user.email,
    username: user.username,
  });
  await setAuthCookie(token);

  return {};
}

export async function logoutUser(): Promise<void> {
  await clearAuthCookie();
  redirect("/auth/login");
}

export async function requireAuth(): Promise<TokenPayload> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}
```

- [ ] **Step 3: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: implement authentication with JWT and Server Actions"
```

---

## Phase 4: Layout & Shared Components

### Task 8: Create Root Layout with Navigation

**Files:**
- Create: `D:\WordsPlatform\src\app\globals.css`
- Create: `D:\WordsPlatform\src\app\layout.tsx`
- Create: `D:\WordsPlatform\src\components\sidebar.tsx`

- [ ] **Step 1: Create global CSS**

Create `D:\WordsPlatform\src\app\globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50 text-gray-900 antialiased;
}
```

- [ ] **Step 2: Create sidebar component**

Create `D:\WordsPlatform\src\components\sidebar.tsx`:

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "首页", icon: "🏠" },
  { href: "/study", label: "学习", icon: "📖" },
  { href: "/review", label: "复习", icon: "🔄" },
  { href: "/words", label: "词库", icon: "📚" },
  { href: "/stats", label: "统计", icon: "📊" },
  { href: "/wrong-book", label: "错题本", icon: "📋" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-700">
        <Link href="/" className="text-lg font-bold tracking-tight">
          📖 WordMaster
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      <div className="px-5 py-4 border-t border-slate-700">
        <Link
          href="/auth/settings"
          className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors"
        >
          <span>⚙️</span>
          <span>设置</span>
        </Link>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Create root layout**

Create `D:\WordsPlatform\src\app\layout.tsx`:

```typescript
import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/sidebar";

export const metadata: Metadata = {
  title: "WordMaster - 背单词平台",
  description: "智能背单词，高效记单词",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="flex">
          <Sidebar />
          <main className="ml-56 flex-1 min-h-screen p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: create root layout with sidebar navigation"
```

---

### Task 9: Create Auth Pages (Login / Register)

**Files:**
- Create: `D:\WordsPlatform\src\app\auth\login\page.tsx`
- Create: `D:\WordsPlatform\src\app\auth\register\page.tsx`

- [ ] **Step 1: Create login page**

Create `D:\WordsPlatform\src\app\auth\login\page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/lib/auth-actions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await loginUser(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-8 text-center">🔑 登录 WordMaster</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="至少 6 位"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "登录中..." : "登录"}
        </button>

        <p className="text-center text-sm text-gray-500">
          还没有账号？{" "}
          <Link href="/auth/register" className="text-blue-600 hover:underline">
            立即注册
          </Link>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create register page**

Create `D:\WordsPlatform\src\app\auth\register\page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/lib/auth-actions";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await registerUser(email, username, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-8 text-center">📝 注册 WordMaster</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="你的昵称"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="至少 6 位"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "注册中..." : "注册"}
        </button>

        <p className="text-center text-sm text-gray-500">
          已有账号？{" "}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            去登录
          </Link>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: create login and register pages"
```

---

## Phase 5: Word Banks & Browse Mode

### Task 10: Seed Word Bank Data

**Files:**
- Create: `D:\WordsPlatform\prisma\seed.ts`

- [ ] **Step 1: Create seed script**

Create `D:\WordsPlatform\prisma\seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WORD_BANKS = [
  { name: "CET-4", description: "大学英语四级词汇", words: [
    { word: "abandon", phonetic: "/əˈbændən/", partOfSpeech: "v.", definition: "放弃；抛弃", exampleSentence: "They had to abandon the plan due to lack of funding." },
    { word: "ability", phonetic: "/əˈbɪləti/", partOfSpeech: "n.", definition: "能力；才能", exampleSentence: "She has the ability to learn languages quickly." },
    { word: "absent", phonetic: "/ˈæbsənt/", partOfSpeech: "adj.", definition: "缺席的；不在的", exampleSentence: "He was absent from school yesterday." },
    { word: "absorb", phonetic: "/əbˈzɔːrb/", partOfSpeech: "v.", definition: "吸收；吸引", exampleSentence: "Plants absorb nutrients from the soil." },
    { word: "abstract", phonetic: "/ˈæbstrækt/", partOfSpeech: "adj.", definition: "抽象的；理论的", exampleSentence: "The concept is too abstract for beginners." },
  ]},
  { name: "CET-6", description: "大学英语六级词汇", words: [
    { word: "abbreviation", phonetic: "/əˌbriːviˈeɪʃn/", partOfSpeech: "n.", definition: "缩写；缩写词", exampleSentence: "WTO is the abbreviation for World Trade Organization." },
    { word: "abide", phonetic: "/əˈbaɪd/", partOfSpeech: "v.", definition: "遵守；忍受", exampleSentence: "You must abide by the rules of the game." },
    { word: "abolish", phonetic: "/əˈbɒlɪʃ/", partOfSpeech: "v.", definition: "废除；取消", exampleSentence: "The government decided to abolish the outdated law." },
    { word: "absurd", phonetic: "/əbˈsɜːrd/", partOfSpeech: "adj.", definition: "荒谬的；可笑的", exampleSentence: "It's absurd to think that money can buy happiness." },
    { word: "abundance", phonetic: "/əˈbʌndəns/", partOfSpeech: "n.", definition: "丰富；充裕", exampleSentence: "The region has an abundance of natural resources." },
  ]},
  { name: "考研", description: "研究生入学考试词汇", words: [
    { word: "acquaint", phonetic: "/əˈkweɪnt/", partOfSpeech: "v.", definition: "使熟悉；使了解", exampleSentence: "I need to acquaint myself with the new software." },
    { word: "adolescent", phonetic: "/ˌædəˈlesnt/", partOfSpeech: "n.", definition: "青少年", exampleSentence: "The program is designed for adolescents aged 13-18." },
    { word: "adverse", phonetic: "/ˈædvɜːrs/", partOfSpeech: "adj.", definition: "不利的；有害的", exampleSentence: "The drug may have adverse side effects." },
    { word: "aesthetic", phonetic: "/esˈθetɪk/", partOfSpeech: "adj.", definition: "审美的；美学的", exampleSentence: "The building has great aesthetic appeal." },
    { word: "allege", phonetic: "/əˈledʒ/", partOfSpeech: "v.", definition: "声称；指控", exampleSentence: "The plaintiff alleges that the company was negligent." },
  ]},
  { name: "IELTS", description: "雅思考试词汇", words: [
    { word: "accommodate", phonetic: "/əˈkɒmədeɪt/", partOfSpeech: "v.", definition: "容纳；提供食宿；适应", exampleSentence: "The hotel can accommodate up to 200 guests." },
    { word: "acknowledge", phonetic: "/əkˈnɒlɪdʒ/", partOfSpeech: "v.", definition: "承认；确认收到", exampleSentence: "He acknowledged his mistake publicly." },
    { word: "acquire", phonetic: "/əˈkwaɪər/", partOfSpeech: "v.", definition: "获得；习得", exampleSentence: "It takes years to acquire fluency in a new language." },
    { word: "adequate", phonetic: "/ˈædɪkwət/", partOfSpeech: "adj.", definition: "足够的；适当的", exampleSentence: "The current safety measures are not adequate." },
    { word: "advocate", phonetic: "/ˈædvəkeɪt/", partOfSpeech: "v.", definition: "提倡；拥护", exampleSentence: "She advocates for better working conditions." },
  ]},
  { name: "TOEFL", description: "托福考试词汇", words: [
    { word: "accelerate", phonetic: "/əkˈseləreɪt/", partOfSpeech: "v.", definition: "加速；促进", exampleSentence: "The new policy will accelerate economic growth." },
    { word: "accumulate", phonetic: "/əˈkjuːmjəleɪt/", partOfSpeech: "v.", definition: "积累；积聚", exampleSentence: "Over time, small savings can accumulate into a large sum." },
    { word: "ambiguous", phonetic: "/æmˈbɪɡjuəs/", partOfSpeech: "adj.", definition: "模棱两可的；含糊的", exampleSentence: "The contract contains several ambiguous clauses." },
    { word: "analogy", phonetic: "/əˈnælədʒi/", partOfSpeech: "n.", definition: "类比；比喻", exampleSentence: "The teacher used an analogy to explain the complex concept." },
    { word: "anticipate", phonetic: "/ænˈtɪsɪpeɪt/", partOfSpeech: "v.", definition: "预期；预见", exampleSentence: "We anticipate that sales will increase next quarter." },
  ]},
  { name: "GRE", description: "GRE 考试词汇", words: [
    { word: "aberration", phonetic: "/ˌæbəˈreɪʃn/", partOfSpeech: "n.", definition: "异常；偏差", exampleSentence: "The warm weather in January was an aberration." },
    { word: "abeyance", phonetic: "/əˈbeɪəns/", partOfSpeech: "n.", definition: "暂时搁置；中止", exampleSentence: "The project was held in abeyance until funding could be secured." },
    { word: "abstemious", phonetic: "/æbˈstiːmiəs/", partOfSpeech: "adj.", definition: "有节制的；饮食适度的", exampleSentence: "He led an abstemious life, avoiding alcohol and rich foods." },
    { word: "acerbic", phonetic: "/əˈsɜːrbɪk/", partOfSpeech: "adj.", definition: "尖刻的；辛辣的", exampleSentence: "The critic's acerbic review angered the artist." },
    { word: "acumen", phonetic: "/ˈækjəmən/", partOfSpeech: "n.", definition: "敏锐；精明", exampleSentence: "Her business acumen helped the company grow rapidly." },
  ]},
  { name: "计算机", description: "计算机专业英语词汇", words: [
    { word: "algorithm", phonetic: "/ˈælɡərɪðəm/", partOfSpeech: "n.", definition: "算法", exampleSentence: "The sorting algorithm has O(n log n) time complexity." },
    { word: "bandwidth", phonetic: "/ˈbændwɪdθ/", partOfSpeech: "n.", definition: "带宽", exampleSentence: "Streaming video requires high bandwidth." },
    { word: "cache", phonetic: "/kæʃ/", partOfSpeech: "n.", definition: "缓存；高速缓冲存储器", exampleSentence: "The browser cache stores frequently accessed data." },
    { word: "database", phonetic: "/ˈdeɪtəbeɪs/", partOfSpeech: "n.", definition: "数据库", exampleSentence: "All user information is stored in a relational database." },
    { word: "encryption", phonetic: "/ɪnˈkrɪpʃn/", partOfSpeech: "n.", definition: "加密", exampleSentence: "End-to-end encryption ensures message privacy." },
  ]},
  { name: "电子信息", description: "电子信息工程专业词汇", words: [
    { word: "amplifier", phonetic: "/ˈæmplɪfaɪər/", partOfSpeech: "n.", definition: "放大器", exampleSentence: "The audio signal passes through a power amplifier." },
    { word: "capacitor", phonetic: "/kəˈpæsɪtər/", partOfSpeech: "n.", definition: "电容器", exampleSentence: "The capacitor stores electrical charge between its plates." },
    { word: "circuit", phonetic: "/ˈsɜːrkɪt/", partOfSpeech: "n.", definition: "电路", exampleSentence: "The printed circuit board contains multiple components." },
    { word: "frequency", phonetic: "/ˈfriːkwənsi/", partOfSpeech: "n.", definition: "频率", exampleSentence: "The signal operates at a frequency of 2.4 GHz." },
    { word: "transistor", phonetic: "/trænˈzɪstər/", partOfSpeech: "n.", definition: "晶体管", exampleSentence: "Modern processors contain billions of transistors." },
  ]},
];

async function main() {
  console.log("Seeding database...");

  for (const bank of WORD_BANKS) {
    const created = await prisma.wordBank.create({
      data: {
        name: bank.name,
        description: bank.description,
        wordCount: bank.words.length,
        words: {
          create: bank.words,
        },
      },
    });
    console.log(`Created word bank: ${created.name} (${created.wordCount} words)`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Run seed**

Run: `cd D:/WordsPlatform && npx tsx prisma/seed.ts`
Expected: Logs showing 8 word banks created with 5 words each.

- [ ] **Step 3: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: add seed data for 8 word banks"
```

---

### Task 11: Create Word Bank Pages (总词库 + 分词库)

**Files:**
- Create: `D:\WordsPlatform\src\app\words\page.tsx`
- Create: `D:\WordsPlatform\src\app\words\[id]\page.tsx`

- [ ] **Step 1: Create word banks listing page (总词库 + 词库卡片)**

Create `D:\WordsPlatform\src\app\words\page.tsx`:

```typescript
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function WordsPage() {
  const wordBanks = await prisma.wordBank.findMany({
    orderBy: { id: "asc" },
  });

  const totalWords = wordBanks.reduce((sum, b) => sum + b.wordCount, 0);
  const allWords = await prisma.word.findMany({
    include: { wordBank: true },
    orderBy: { word: "asc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📚 词库</h1>

      {/* 总词库统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link
          href="/words"
          className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-5 hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-2">📊</div>
          <div className="font-bold text-lg">总词库</div>
          <div className="text-sm opacity-80">全部 8 个词库</div>
          <div className="text-3xl font-bold mt-3">{totalWords}</div>
          <div className="text-xs opacity-70">个单词</div>
        </Link>

        {wordBanks.map((bank) => (
          <Link
            key={bank.id}
            href={`/words/${bank.id}`}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all"
          >
            <div className="font-bold text-lg">{bank.name}</div>
            <div className="text-sm text-gray-500 mt-1">{bank.description}</div>
            <div className="text-2xl font-bold mt-3">{bank.wordCount}</div>
            <div className="text-xs text-gray-400">个单词</div>
          </Link>
        ))}
      </div>

      {/* 总词库表格 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-lg">📊 总词库</h2>
          <p className="text-sm text-gray-500 mt-1">浏览全部单词（仅显示前 50 个）</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 font-medium text-gray-600">单词</th>
                <th className="px-6 py-3 font-medium text-gray-600">音标</th>
                <th className="px-6 py-3 font-medium text-gray-600">释义</th>
                <th className="px-6 py-3 font-medium text-gray-600">所属词库</th>
              </tr>
            </thead>
            <tbody>
              {allWords.map((w) => (
                <tr key={w.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{w.word}</td>
                  <td className="px-6 py-3 text-gray-500">{w.phonetic}</td>
                  <td className="px-6 py-3">{w.definition}</td>
                  <td className="px-6 py-3">
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      {w.wordBank.name}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create single word bank detail page**

Create `D:\WordsPlatform\src\app\words\[id]\page.tsx`:

```typescript
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WordBankDetailPage({ params }: Props) {
  const { id } = await params;
  const bankId = parseInt(id);

  if (isNaN(bankId)) notFound();

  const bank = await prisma.wordBank.findUnique({
    where: { id: bankId },
  });
  if (!bank) notFound();

  const words = await prisma.word.findMany({
    where: { wordBankId: bankId },
    orderBy: { word: "asc" },
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/words" className="text-gray-400 hover:text-gray-600">
          ← 返回
        </Link>
        <h1 className="text-2xl font-bold">{bank.name}</h1>
        <span className="text-sm text-gray-500">{bank.description}</span>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-6">
        <Link
          href={`/study/browse?bank=${bankId}`}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          📖 浏览模式
        </Link>
        <Link
          href={`/study/flashcard?bank=${bankId}`}
          className="bg-white border border-gray-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          🃏 卡片模式
        </Link>
        <Link
          href={`/study/choice?bank=${bankId}`}
          className="bg-white border border-gray-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          ✅ 选择题
        </Link>
        <Link
          href={`/study/spelling?bank=${bankId}`}
          className="bg-white border border-gray-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          ✍️ 拼写模式
        </Link>
      </div>

      {/* Word list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 font-medium text-gray-600">#</th>
                <th className="px-6 py-3 font-medium text-gray-600">单词</th>
                <th className="px-6 py-3 font-medium text-gray-600">音标</th>
                <th className="px-6 py-3 font-medium text-gray-600">词性</th>
                <th className="px-6 py-3 font-medium text-gray-600">释义</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w, i) => (
                <tr key={w.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-6 py-3 font-medium">{w.word}</td>
                  <td className="px-6 py-3 text-gray-500">{w.phonetic}</td>
                  <td className="px-6 py-3 text-gray-500">{w.partOfSpeech}</td>
                  <td className="px-6 py-3">{w.definition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: create word bank listing and detail pages"
```

---

## Phase 6: Learning Modes

### Task 12: Create Browse Mode Page

**Files:**
- Create: `D:\WordsPlatform\src\app\study\page.tsx`
- Create: `D:\WordsPlatform\src\app\study\browse\page.tsx`

- [ ] **Step 1: Create study landing page**

Create `D:\WordsPlatform\src\app\study\page.tsx`:

```typescript
import { prisma } from "@/lib/db";
import Link from "next/link";

const MODES = [
  { href: "/study/browse", icon: "📖", name: "单词列表浏览", desc: "翻页浏览完整单词信息，适合初识词库", color: "border-l-purple-500" },
  { href: "/study/flashcard", icon: "🃏", name: "卡片翻转", desc: "看英文回忆中文，自评记忆程度", color: "border-l-blue-500" },
  { href: "/study/choice", icon: "✅", name: "选择题", desc: "四选一强化辨析能力", color: "border-l-green-500" },
  { href: "/study/spelling", icon: "✍️", name: "拼写模式", desc: "看中文写英文，深度掌握拼写", color: "border-l-orange-500" },
];

export default async function StudyPage() {
  const banks = await prisma.wordBank.findMany({ orderBy: { id: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📖 学习</h1>

      {/* 选择词库 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">选择词库</h2>
        <div className="flex flex-wrap gap-3">
          {banks.map((bank) => (
            <Link
              key={bank.id}
              href={`/words/${bank.id}`}
              className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium hover:border-blue-300 hover:shadow-sm transition-all"
            >
              {bank.name}
              <span className="text-gray-400 ml-2">({bank.wordCount}词)</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 选择模式 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">选择模式</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MODES.map((mode) => (
            <Link
              key={mode.href}
              href={mode.href}
              className={`bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all border-l-4 ${mode.color}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{mode.icon}</span>
                <div>
                  <div className="font-bold">{mode.name}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{mode.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create browse mode page**

Create `D:\WordsPlatform\src\app\study\browse\page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Word {
  id: number;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
  wordBank: { name: string };
}

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bankId = searchParams.get("bank");

  const [words, setWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWords() {
      const url = bankId ? `/api/words?bankId=${bankId}` : "/api/words";
      const res = await fetch(url);
      const data = await res.json();
      setWords(data);
      setLoading(false);
    }
    fetchWords();
  }, [bankId]);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>;
  }

  if (words.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">暂无单词</p>
        <button
          onClick={() => router.push("/study")}
          className="text-blue-600 hover:underline text-sm"
        >
          返回选择词库
        </button>
      </div>
    );
  }

  const word = words[index];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/study")} className="text-gray-400 hover:text-gray-600 text-sm">
          ← 返回
        </button>
        <span className="text-sm text-gray-500">
          {index + 1} / {words.length}
        </span>
      </div>

      {/* Word card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm">
        <div className="text-center mb-6">
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            {word.wordBank.name}
          </span>
        </div>

        <h2 className="text-4xl font-bold text-center mb-2">{word.word}</h2>
        <p className="text-center text-gray-500 mb-6">{word.phonetic}</p>

        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div>
            <span className="text-xs text-gray-400 uppercase">词性</span>
            <p className="font-medium">{word.partOfSpeech}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase">释义</span>
            <p className="text-lg font-medium text-gray-800">{word.definition}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase">例句</span>
            <p className="text-gray-700 italic">{word.exampleSentence}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setIndex(Math.max(0, index - 1))}
          disabled={index === 0}
          className="bg-white border border-gray-300 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← 上一个
        </button>
        <button
          onClick={() => setIndex(Math.min(words.length - 1, index + 1))}
          disabled={index === words.length - 1}
          className="bg-white border border-gray-300 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          下一个 →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create words API route**

Create `D:\WordsPlatform\src\app\api\words\route.ts`:

```typescript
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bankId = searchParams.get("bankId");

  const words = await prisma.word.findMany({
    where: bankId ? { wordBankId: parseInt(bankId) } : undefined,
    include: { wordBank: { select: { name: true } } },
    orderBy: { word: "asc" },
  });

  return NextResponse.json(words);
}
```

- [ ] **Step 4: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: create study landing and browse mode pages"
```

---

### Task 13: Create Flashcard Mode Page

**Files:**
- Create: `D:\WordsPlatform\src\app\study\flashcard\page.tsx`
- Create: `D:\WordsPlatform\src\app\api\study\record\route.ts`

- [ ] **Step 1: Create flashcard mode page**

Create `D:\WordsPlatform\src\app\study\flashcard\page.tsx`:

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Word {
  id: number;
  word: string;
  phonetic: string;
  definition: string;
  exampleSentence: string;
}

export default function FlashcardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bankId = searchParams.get("bank");

  const [words, setWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);
  const startTimeRef = useRef(Date.now());
  const resultsRef = useRef<{ wordId: number; quality: number; timeSpentMs: number }[]>([]);

  useEffect(() => {
    const url = bankId ? `/api/words?bankId=${bankId}` : "/api/words";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setWords(data);
        setLoading(false);
        startTimeRef.current = Date.now();
      });
  }, [bankId]);

  function answer(quality: number) {
    const now = Date.now();
    const timeSpent = now - startTimeRef.current;

    resultsRef.current.push({
      wordId: words[index].id,
      quality,
      timeSpentMs: timeSpent,
    });

    if (index + 1 >= words.length) {
      // Submit results
      fetch("/api/study/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "flashcard",
          bankId: bankId ? parseInt(bankId) : null,
          results: resultsRef.current,
        }),
      });
      setComplete(true);
    } else {
      setIndex(index + 1);
      setFlipped(false);
      startTimeRef.current = Date.now();
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">加载中...</div>;

  if (complete) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">本轮完成！</h2>
        <p className="text-gray-500 mb-6">学习了 {words.length} 个单词</p>
        <button
          onClick={() => router.push("/study")}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          返回学习首页
        </button>
      </div>
    );
  }

  const word = words[index];

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/study")} className="text-gray-400 hover:text-gray-600 text-sm">
          ← 退出
        </button>
        <span className="text-sm text-gray-500">{index + 1} / {words.length}</span>
      </div>

      {/* Card */}
      <div
        onClick={() => !flipped && setFlipped(true)}
        className={`bg-white rounded-2xl border-2 p-12 min-h-[300px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-sm ${
          flipped ? "border-blue-300" : "border-gray-200 hover:border-blue-200 hover:shadow-md"
        }`}
      >
        {!flipped ? (
          <>
            <p className="text-sm text-gray-400 mb-4">点击翻转</p>
            <h2 className="text-4xl font-bold mb-3">{word.word}</h2>
            <p className="text-gray-500">{word.phonetic}</p>
          </>
        ) : (
          <>
            <h2 className="text-4xl font-bold mb-4 text-blue-600">{word.word}</h2>
            <p className="text-gray-500 mb-6">{word.phonetic}</p>
            <div className="bg-blue-50 rounded-xl p-6 w-full text-center">
              <p className="text-2xl font-bold text-gray-800 mb-2">{word.definition}</p>
              <p className="text-sm text-gray-500 italic">{word.exampleSentence}</p>
            </div>
          </>
        )}
      </div>

      {/* Self-assessment buttons (only show when flipped) */}
      {flipped && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => answer(0)}
            className="flex-1 bg-red-50 text-red-700 border border-red-200 py-3 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
          >
            😕 不认识
          </button>
          <button
            onClick={() => answer(2)}
            className="flex-1 bg-yellow-50 text-yellow-700 border border-yellow-200 py-3 rounded-lg font-medium hover:bg-yellow-100 transition-colors text-sm"
          >
            🤔 不确定
          </button>
          <button
            onClick={() => answer(4)}
            className="flex-1 bg-green-50 text-green-700 border border-green-200 py-3 rounded-lg font-medium hover:bg-green-100 transition-colors text-sm"
          >
            ✅ 认识
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create study record API**

Create `D:\WordsPlatform\src\app\api\study\record\route.ts`:

```typescript
import { prisma } from "@/lib/db";
import { calculateNextReview } from "@/lib/spaced-repetition";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { mode, bankId, results } = body as {
    mode: string;
    bankId: number | null;
    results: { wordId: number; quality: number; timeSpentMs: number }[];
  };

  // Create study session
  const session = await prisma.studySession.create({
    data: {
      userId: user.userId,
      wordBankId: bankId ?? 0,
      mode,
      wordsStudied: results.length,
      correctCount: results.filter((r) => r.quality >= 3).length,
      endedAt: new Date(),
    },
  });

  // Process each result
  for (const result of results) {
    // Get or create progress
    let progress = await prisma.userWordProgress.findUnique({
      where: {
        userId_wordId: {
          userId: user.userId,
          wordId: result.wordId,
        },
      },
    });

    if (!progress) {
      progress = await prisma.userWordProgress.create({
        data: {
          userId: user.userId,
          wordId: result.wordId,
        },
      });
    }

    // Calculate next review using SM-2
    const daysOverdue = progress.nextReviewAt
      ? Math.max(0, Math.floor(
          (Date.now() - new Date(progress.nextReviewAt).getTime()) / (1000 * 60 * 60 * 24)
        ))
      : 0;

    const reviewResult = calculateNextReview({
      progress: {
        stage: progress.stage as "new" | "learning" | "review" | "mastered",
        easeFactor: progress.easeFactor,
        intervalDays: progress.intervalDays,
        repetitions: progress.repetitions,
        correctCount: progress.correctCount,
        incorrectCount: progress.incorrectCount,
      },
      quality: result.quality,
      mode: mode as "flashcard" | "choice" | "spelling",
      timeSpentMs: result.timeSpentMs,
      daysOverdue,
    });

    // Update progress
    await prisma.userWordProgress.update({
      where: { id: progress.id },
      data: {
        stage: reviewResult.newProgress.stage,
        easeFactor: reviewResult.newProgress.easeFactor,
        intervalDays: reviewResult.newProgress.intervalDays,
        repetitions: reviewResult.newProgress.repetitions,
        correctCount: reviewResult.newProgress.correctCount,
        incorrectCount: reviewResult.newProgress.incorrectCount,
        nextReviewAt: reviewResult.nextReviewAt,
        lastReviewedAt: new Date(),
      },
    });

    // Create review log
    await prisma.reviewLog.create({
      data: {
        userId: user.userId,
        wordId: result.wordId,
        mode,
        isCorrect: result.quality >= 3,
        quality: result.quality,
        timeSpentMs: result.timeSpentMs,
      },
    });
  }

  return NextResponse.json({ sessionId: session.id });
}
```

- [ ] **Step 3: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: create flashcard mode with SM-2 spaced repetition recording"
```

---

### Task 14: Create Choice Mode Page

**Files:**
- Create: `D:\WordsPlatform\src\app\study\choice\page.tsx`

- [ ] **Step 1: Create choice mode page**

Create `D:\WordsPlatform\src\app\study\choice\page.tsx`:

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Word {
  id: number;
  word: string;
  definition: string;
}

export default function ChoicePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bankId = searchParams.get("bank");

  const [words, setWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);
  const startTimeRef = useRef(Date.now());
  const resultsRef = useRef<{ wordId: number; quality: number; timeSpentMs: number }[]>([]);

  useEffect(() => {
    const url = bankId ? `/api/words?bankId=${bankId}` : "/api/words";
    fetch(url)
      .then((r) => r.json())
      .then((data: Word[]) => {
        setWords(data);
        setLoading(false);
        if (data.length > 0) {
          generateOptions(data[0], data);
        }
        startTimeRef.current = Date.now();
      });
  }, [bankId]);

  function generateOptions(target: Word, pool: Word[]) {
    const distractors = pool
      .filter((w) => w.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.definition);

    const allOptions = [...distractors, target.definition].sort(
      () => Math.random() - 0.5
    );
    setOptions(allOptions);
  }

  function select(option: string) {
    if (feedback) return; // Already answered
    setSelected(option);
    const isCorrect = option === words[index].definition;
    setFeedback(isCorrect ? "correct" : "wrong");

    const timeSpent = Date.now() - startTimeRef.current;
    const quality = isCorrect
      ? timeSpent < 3000 ? 5 : timeSpent < 10000 ? 4 : 3
      : 2;

    resultsRef.current.push({
      wordId: words[index].id,
      quality,
      timeSpentMs: timeSpent,
    });

    // Auto advance after 1.5s
    setTimeout(() => advance(), 1500);
  }

  function advance() {
    if (index + 1 >= words.length) {
      fetch("/api/study/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "choice",
          bankId: bankId ? parseInt(bankId) : null,
          results: resultsRef.current,
        }),
      });
      setComplete(true);
    } else {
      const nextWord = words[index + 1];
      setIndex(index + 1);
      setSelected(null);
      setFeedback(null);
      generateOptions(nextWord, words);
      startTimeRef.current = Date.now();
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">加载中...</div>;

  if (complete) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">本轮完成！</h2>
        <p className="text-gray-500 mb-6">练习了 {words.length} 个单词</p>
        <button
          onClick={() => router.push("/study")}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          返回学习首页
        </button>
      </div>
    );
  }

  const word = words[index];

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/study")} className="text-gray-400 hover:text-gray-600 text-sm">
          ← 退出
        </button>
        <span className="text-sm text-gray-500">{index + 1} / {words.length}</span>
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-6">
        <h2 className="text-3xl font-bold text-center mb-2">{word.word}</h2>
        <p className="text-center text-gray-400 text-sm">选择正确的中文释义</p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, i) => {
          let style = "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50";
          if (feedback && option === word.definition) {
            style = "bg-green-50 border-green-400 text-green-700";
          } else if (feedback && option === selected && option !== word.definition) {
            style = "bg-red-50 border-red-400 text-red-700";
          }

          return (
            <button
              key={i}
              onClick={() => select(option)}
              disabled={feedback !== null}
              className={`w-full text-left border-2 rounded-xl px-5 py-4 font-medium transition-all ${style}`}
            >
              <span className="text-gray-400 mr-3">{String.fromCharCode(65 + i)}.</span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: create choice mode page"
```

---

### Task 15: Create Spelling Mode Page

**Files:**
- Create: `D:\WordsPlatform\src\app\study\spelling\page.tsx`

- [ ] **Step 1: Create spelling mode page**

Create `D:\WordsPlatform\src\app\study\spelling\page.tsx`:

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Word {
  id: number;
  word: string;
  phonetic: string;
  definition: string;
}

export default function SpellingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bankId = searchParams.get("bank");

  const [words, setWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);
  const startTimeRef = useRef(Date.now());
  const resultsRef = useRef<{ wordId: number; quality: number; timeSpentMs: number }[]>([]);

  useEffect(() => {
    const url = bankId ? `/api/words?bankId=${bankId}` : "/api/words";
    fetch(url)
      .then((r) => r.json())
      .then((data: Word[]) => {
        setWords(data);
        setLoading(false);
        startTimeRef.current = Date.now();
      });
  }, [bankId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitted) return;

    const timeSpent = Date.now() - startTimeRef.current;
    const correct = input.trim().toLowerCase() === words[index].word.toLowerCase();
    setIsCorrect(correct);
    setSubmitted(true);

    const quality = correct
      ? timeSpent < 5000 ? 5 : timeSpent < 15000 ? 4 : 3
      : input.trim().length > 0 ? 1 : 0;

    resultsRef.current.push({
      wordId: words[index].id,
      quality,
      timeSpentMs: timeSpent,
    });

    setTimeout(() => advance(), 2000);
  }

  function advance() {
    if (index + 1 >= words.length) {
      fetch("/api/study/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "spelling",
          bankId: bankId ? parseInt(bankId) : null,
          results: resultsRef.current,
        }),
      });
      setComplete(true);
    } else {
      setIndex(index + 1);
      setInput("");
      setSubmitted(false);
      setIsCorrect(false);
      startTimeRef.current = Date.now();
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">加载中...</div>;

  if (complete) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">本轮完成！</h2>
        <p className="text-gray-500 mb-6">拼写了 {words.length} 个单词</p>
        <button
          onClick={() => router.push("/study")}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          返回学习首页
        </button>
      </div>
    );
  }

  const word = words[index];

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/study")} className="text-gray-400 hover:text-gray-600 text-sm">
          ← 退出
        </button>
        <span className="text-sm text-gray-500">{index + 1} / {words.length}</span>
      </div>

      {/* Prompt */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-6 text-center">
        <p className="text-gray-400 text-sm mb-4">请拼写以下单词</p>
        <p className="text-2xl font-bold text-gray-800 mb-1">{word.definition}</p>
        <p className="text-gray-500">{word.phonetic}</p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={submitted}
          autoFocus
          className={`w-full border-2 rounded-xl px-5 py-4 text-xl text-center font-mono tracking-wider focus:outline-none transition-colors ${
            submitted
              ? isCorrect
                ? "border-green-400 bg-green-50"
                : "border-red-400 bg-red-50"
              : "border-gray-200 focus:border-blue-400"
          }`}
          placeholder="输入英文拼写..."
        />

        {submitted && (
          <div className={`text-center mt-4 font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>
            {isCorrect ? "✅ 正确！" : `❌ 正确答案: ${word.word}`}
          </div>
        )}

        {!submitted && (
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            确认
          </button>
        )}
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: create spelling mode page"
```

---

## Phase 7: Dashboard, Review & Stats

### Task 16: Create Dashboard Page

**Files:**
- Create: `D:\WordsPlatform\src\app\page.tsx`

- [ ] **Step 1: Create dashboard**

Create `D:\WordsPlatform\src\app\page.tsx`:

```typescript
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { calculateLevel, xpToNextLevel } from "@/lib/gamification";
import { updateVocabEstimate } from "@/lib/vocab-assessment";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h1 className="text-4xl font-bold mb-4">📖 WordMaster</h1>
        <p className="text-xl text-gray-500 mb-8">智能背单词，高效记单词</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            登录
          </Link>
          <Link
            href="/auth/register"
            className="bg-white border border-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            注册
          </Link>
        </div>
      </div>
    );
  }

  // Get stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [streak, progressStats, todaySessions, reviewDue] = await Promise.all([
    prisma.dailyStreak.findUnique({ where: { userId: user.userId } }),
    prisma.userWordProgress.aggregate({
      where: { userId: user.userId },
      _count: true,
    }),
    prisma.reviewLog.count({
      where: {
        userId: user.userId,
        answeredAt: { gte: today },
      },
    }),
    prisma.userWordProgress.count({
      where: {
        userId: user.userId,
        nextReviewAt: { lte: new Date() },
      },
    }),
  ]);

  const totalLearned = progressStats._count;
  const mastered = await prisma.userWordProgress.count({
    where: { userId: user.userId, stage: "mastered" },
  });

  const estimatedVocab = updateVocabEstimate(totalLearned, mastered);

  // Calculate XP from review logs
  const totalLogs = await prisma.reviewLog.count({
    where: { userId: user.userId },
  });
  const xp = totalLogs * 10; // Simplified XP calculation
  const level = calculateLevel(xp);
  const xpNext = xpToNextLevel(xp);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">👋 欢迎回来，{user.username}</h1>
      <p className="text-gray-500 mb-8">今天也要加油学习！</p>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl mb-1">🔥</div>
          <div className="text-2xl font-bold">{streak?.streak ?? 0}</div>
          <div className="text-sm text-gray-500">连续打卡天数</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl mb-1">🔄</div>
          <div className="text-2xl font-bold">{reviewDue}</div>
          <div className="text-sm text-gray-500">今日待复习</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl mb-1">📊</div>
          <div className="text-2xl font-bold">{estimatedVocab.toLocaleString()}</div>
          <div className="text-sm text-gray-500">预估词汇量</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl mb-1">⭐</div>
          <div className="text-2xl font-bold">Lv.{level}</div>
          <div className="text-sm text-gray-500">XP {xp} / {xp + xpNext}</div>
        </div>
      </div>

      {/* Quick start */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl p-6 text-white mb-8">
        <h2 className="text-lg font-bold mb-3">快速开始</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/study/browse"
            className="bg-white/20 backdrop-blur px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
          >
            📖 浏览单词
          </Link>
          <Link
            href={`/review`}
            className="bg-white/20 backdrop-blur px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
          >
            🔄 开始复习 ({reviewDue})
          </Link>
          <Link
            href="/study"
            className="bg-white text-blue-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            📖 选择词库学习
          </Link>
        </div>
      </div>

      {/* Today's summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-lg mb-4">📅 今日学习</h2>
        <div className="text-center py-8">
          <p className="text-4xl font-bold text-blue-600">{todaySessions}</p>
          <p className="text-gray-500 mt-2">今日已练习单词数</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: create dashboard with stats and quick actions"
```

---

### Task 17: Create Review Center Page

**Files:**
- Create: `D:\WordsPlatform\src\app\review\page.tsx`

- [ ] **Step 1: Create review center**

Create `D:\WordsPlatform\src\app\review\page.tsx`:

```typescript
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function ReviewPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">请先登录</p>
        <Link href="/auth/login" className="text-blue-600 hover:underline mt-2 inline-block">
          去登录
        </Link>
      </div>
    );
  }

  const now = new Date();
  const dueWords = await prisma.userWordProgress.findMany({
    where: {
      userId: user.userId,
      nextReviewAt: { lte: now },
    },
    include: {
      word: { include: { wordBank: true } },
    },
    orderBy: { nextReviewAt: "asc" },
    take: 50,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reviewedToday = await prisma.reviewLog.count({
    where: {
      userId: user.userId,
      answeredAt: { gte: today },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🔄 复习中心</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
          <div className="text-3xl font-bold text-orange-600">{dueWords.length}</div>
          <div className="text-sm text-orange-700">待复习单词</div>
        </div>
        <div className="bg-green-50 rounded-xl p-5 border border-green-200">
          <div className="text-3xl font-bold text-green-600">{reviewedToday}</div>
          <div className="text-sm text-green-700">今日已复习</div>
        </div>
      </div>

      {dueWords.length > 0 ? (
        <>
          <div className="flex gap-3 mb-6">
            <Link
              href="/study/flashcard?review=1"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              🃏 卡片复习
            </Link>
            <Link
              href="/study/choice?review=1"
              className="bg-white border border-gray-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ✅ 选择复习
            </Link>
            <Link
              href="/study/spelling?review=1"
              className="bg-white border border-gray-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ✍️ 拼写复习
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 font-medium text-gray-600">单词</th>
                  <th className="px-6 py-3 font-medium text-gray-600">释义</th>
                  <th className="px-6 py-3 font-medium text-gray-600">词库</th>
                  <th className="px-6 py-3 font-medium text-gray-600">阶段</th>
                  <th className="px-6 py-3 font-medium text-gray-600">下次复习</th>
                </tr>
              </thead>
              <tbody>
                {dueWords.map((pw) => (
                  <tr key={pw.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{pw.word.word}</td>
                    <td className="px-6 py-3 text-gray-600">{pw.word.definition}</td>
                    <td className="px-6 py-3">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {pw.word.wordBank.name}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <StageBadge stage={pw.stage} />
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {new Date(pw.nextReviewAt).toLocaleDateString("zh-CN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2">没有待复习的单词</h2>
          <p className="text-gray-500 mb-4">去学习新单词吧！</p>
          <Link
            href="/study"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-block"
          >
            去学习
          </Link>
        </div>
      )}
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, string> = {
    new: "bg-gray-100 text-gray-600",
    learning: "bg-yellow-100 text-yellow-700",
    review: "bg-blue-100 text-blue-700",
    mastered: "bg-green-100 text-green-700",
  };
  const labels: Record<string, string> = {
    new: "新词",
    learning: "学习中",
    review: "复习中",
    mastered: "已掌握",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[stage] ?? ""}`}>
      {labels[stage] ?? stage}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: create review center with due words list"
```

---

### Task 18: Create Stats & Wrong Book Pages

**Files:**
- Create: `D:\WordsPlatform\src\app\stats\page.tsx`
- Create: `D:\WordsPlatform\src\app\wrong-book\page.tsx`

- [ ] **Step 1: Create stats page**

Create `D:\WordsPlatform\src\app\stats\page.tsx`:

```typescript
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function StatsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">请先登录</p>
        <Link href="/auth/login" className="text-blue-600 hover:underline mt-2 inline-block">
          去登录
        </Link>
      </div>
    );
  }

  // Aggregate stats
  const [totalLearned, mastered, learning, totalLogs, correctLogs, recentSessions] =
    await Promise.all([
      prisma.userWordProgress.count({ where: { userId: user.userId } }),
      prisma.userWordProgress.count({ where: { userId: user.userId, stage: "mastered" } }),
      prisma.userWordProgress.count({
        where: {
          userId: user.userId,
          stage: { in: ["learning", "review"] },
        },
      }),
      prisma.reviewLog.count({ where: { userId: user.userId } }),
      prisma.reviewLog.count({ where: { userId: user.userId, isCorrect: true } }),
      prisma.studySession.findMany({
        where: { userId: user.userId },
        orderBy: { startedAt: "desc" },
        take: 10,
      }),
    ]);

  const accuracy = totalLogs > 0 ? Math.round((correctLogs / totalLogs) * 100) : 0;

  // Per-mode stats
  const modeStats = await Promise.all(
    ["flashcard", "choice", "spelling"].map(async (mode) => {
      const total = await prisma.reviewLog.count({
        where: { userId: user.userId, mode },
      });
      const correct = await prisma.reviewLog.count({
        where: { userId: user.userId, mode, isCorrect: true },
      });
      return { mode, total, correct, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0 };
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📊 学习统计</h1>

      {/* Overall stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">累计学习单词</div>
          <div className="text-3xl font-bold mt-1">{totalLearned}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">已掌握</div>
          <div className="text-3xl font-bold mt-1 text-green-600">{mastered}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">学习中</div>
          <div className="text-3xl font-bold mt-1 text-blue-600">{learning}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">整体正确率</div>
          <div className="text-3xl font-bold mt-1 text-orange-600">{accuracy}%</div>
        </div>
      </div>

      {/* Per-mode accuracy */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="font-bold text-lg mb-4">各模式正确率</h2>
        <div className="space-y-4">
          {modeStats.map((stat) => (
            <div key={stat.mode}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">
                  {stat.mode === "flashcard" ? "🃏 卡片" : stat.mode === "choice" ? "✅ 选择" : "✍️ 拼写"}
                </span>
                <span className="text-gray-500">
                  {stat.correct}/{stat.total} ({stat.accuracy}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${stat.accuracy}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-lg mb-4">最近学习记录</h2>
        {recentSessions.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">时间</th>
                <th className="pb-2">模式</th>
                <th className="pb-2">单词数</th>
                <th className="pb-2">正确率</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s) => (
                <tr key={s.id} className="border-b border-gray-50">
                  <td className="py-2">
                    {new Date(s.startedAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="py-2">{s.mode}</td>
                  <td className="py-2">{s.wordsStudied}</td>
                  <td className="py-2">
                    {s.wordsStudied > 0
                      ? Math.round((s.correctCount / s.wordsStudied) * 100)
                      : 0}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-center py-8">暂无学习记录</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create wrong book page**

Create `D:\WordsPlatform\src\app\wrong-book\page.tsx`:

```typescript
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function WrongBookPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">请先登录</p>
        <Link href="/auth/login" className="text-blue-600 hover:underline mt-2 inline-block">
          去登录
        </Link>
      </div>
    );
  }

  // Get words that the user has answered incorrectly
  const wrongReviews = await prisma.reviewLog.groupBy({
    by: ["wordId"],
    where: {
      userId: user.userId,
      isCorrect: false,
    },
    _count: { wordId: true },
    orderBy: { _count: { wordId: "desc" } },
  });

  const wrongWordIds = wrongReviews.map((w) => w.wordId);

  const wrongWords = await prisma.word.findMany({
    where: { id: { in: wrongWordIds.slice(0, 50) } },
    include: { wordBank: true },
  });

  // Build a map of wordId -> error count
  const errorCountMap = new Map(
    wrongReviews.map((w) => [w.wordId, w._count.wordId])
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📋 错题本</h1>

      {wrongWords.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-gray-500">
            共 {wrongWordIds.length} 个易错单词（显示前 50 个）
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 font-medium text-gray-600">单词</th>
                  <th className="px-6 py-3 font-medium text-gray-600">释义</th>
                  <th className="px-6 py-3 font-medium text-gray-600">词库</th>
                  <th className="px-6 py-3 font-medium text-gray-600">错误次数</th>
                  <th className="px-6 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {wrongWords.map((w) => (
                  <tr key={w.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{w.word}</td>
                    <td className="px-6 py-3 text-gray-600">{w.definition}</td>
                    <td className="px-6 py-3">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {w.wordBank.name}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-red-600 font-medium">
                        {errorCountMap.get(w.id) ?? 0} 次
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/study/spelling?bank=${w.wordBankId}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        针对性练习
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2">还没有错题</h2>
          <p className="text-gray-500">继续保持！</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: create stats and wrong book pages"
```

---

### Task 19: Create Settings Page

**Files:**
- Create: `D:\WordsPlatform\src\app\auth\settings\page.tsx`

- [ ] **Step 1: Create settings page**

Create `D:\WordsPlatform\src\app\auth\settings\page.tsx`:

```typescript
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logoutUser } from "@/lib/auth-actions";
import Link from "next/link";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">请先登录</p>
        <Link href="/auth/login" className="text-blue-600 hover:underline mt-2 inline-block">
          去登录
        </Link>
      </div>
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">⚙️ 账号设置</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* User info */}
        <div>
          <h2 className="font-bold text-lg mb-4">个人信息</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">用户名</span>
              <span className="font-medium">{dbUser?.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">邮箱</span>
              <span className="font-medium">{dbUser?.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">注册时间</span>
              <span className="font-medium">
                {dbUser?.createdAt
                  ? new Date(dbUser.createdAt).toLocaleDateString("zh-CN")
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-4 border-t border-gray-100">
          <form action={logoutUser}>
            <button
              type="submit"
              className="w-full bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
            >
              退出登录
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Final verification — start the dev server**

Run: `cd D:/WordsPlatform && npm run dev`
Expected: Next.js dev server starts on http://localhost:3000

Navigate to http://localhost:3000 and verify:
- Register a new user
- Login
- Browse word banks
- Enter browse/flashcard/choice/spelling modes
- Check review center
- View stats and wrong book

- [ ] **Step 3: Commit**

```bash
cd D:/WordsPlatform && git add -A && git commit -m "feat: create settings page, complete MVP implementation"
```

---

## Plan Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1: Scaffold | 1-2 | Next.js project init, Prisma schema, DB setup |
| 2: Core Logic | 3-6 | SM-2 algorithm, quiz generator, vocab assessment, gamification |
| 3: Auth | 7 | JWT auth with Server Actions (register/login/logout) |
| 4: Layout | 8-9 | Root layout, sidebar navigation, auth pages |
| 5: Word Banks | 10-11 | Seed data, word bank listing + detail pages |
| 6: Learning | 12-15 | Browse, flashcard, choice, spelling modes + study record API |
| 7: Dashboard | 16-19 | Dashboard, review center, stats, wrong book, settings |

**Total: 19 tasks, estimated 3-4 hours for implementation.**
