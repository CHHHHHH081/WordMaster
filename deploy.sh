#!/bin/bash
# ==============================================
# WordMaster Vercel 一键部署脚本
# 在 VSCode 终端中运行: bash deploy.sh
# ==============================================
set -e

echo "========================================="
echo "  WordMaster Vercel 部署"
echo "========================================="
echo ""

# 1. Get database URL
if [ -z "$DATABASE_URL" ]; then
  echo "请先设置 Neon 数据库连接字符串:"
  echo ""
  echo "1. 打开 https://neon.tech → 注册 → 创建免费项目"
  echo "2. 复制 Connection string"
  echo "3. 粘贴到下方:"
  echo ""
  read -p "DATABASE_URL: " DATABASE_URL
fi

# 2. Update schema to PostgreSQL
echo ""
echo "[1/4] 切换到 PostgreSQL..."
cp prisma/schema.prisma prisma/schema.sqlite.bak
cat > prisma/schema.prisma << 'SCHEMA_END'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}

model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique
  username      String
  passwordHash  String
  emailVerified Boolean   @default(false)
  verifyToken   String?
  interests     String?
  createdAt     DateTime  @default(now())
  wordProgresses UserWordProgress[]
  studySessions  StudySession[]
  reviewLogs     ReviewLog[]
  dailyStreak    DailyStreak?
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
  stage          String   @default("new")
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
  mode         String
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
  mode        String
  isCorrect   Boolean
  quality     Int
  timeSpentMs Int
  answeredAt  DateTime @default(now())
  user User @relation(fields: [userId], references: [id])
  word Word @relation(fields: [wordId], references: [id])
}

model DailyStreak {
  id            Int       @id @default(autoincrement())
  userId        Int       @unique
  streak        Int       @default(0)
  lastStudyDate DateTime?
  user          User      @relation(fields: [userId], references: [id])
}
SCHEMA_END

export DIRECT_DATABASE_URL="$DATABASE_URL"

# 3. Push schema + seed data
echo "[2/4] 推送数据库结构 + 导入数据..."
npx prisma generate
npx prisma db push --accept-data-loss
npx tsx prisma/seed-pg.ts

# 4. Deploy to Vercel
echo "[3/4] 部署到 Vercel..."
echo ""
echo "如果首次使用 Vercel，会要求浏览器登录。"
echo "登录后按照提示操作即可（一直回车选默认值）。"
echo ""
npx vercel --env DATABASE_URL="$DATABASE_URL" --env DIRECT_DATABASE_URL="$DATABASE_URL" --env JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"

echo ""
echo "[4/4] 恢复本地开发配置..."
mv prisma/schema.sqlite.bak prisma/schema.prisma
npx prisma generate

echo ""
echo "========================================="
echo "  部署完成！"
echo "========================================="
