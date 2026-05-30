import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { calculateLevel, xpToNextLevel } from "@/lib/gamification";
import { updateVocabEstimate } from "@/lib/vocab-assessment";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h1 className="text-4xl font-bold mb-4">📖 WordMaster</h1>
        <p className="text-xl text-gray-500 mb-8">智能背单词，高效记单词</p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/login" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            登录
          </Link>
          <Link href="/auth/register" className="bg-white border border-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            注册
          </Link>
        </div>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [streak, progressStats, todaySessions, reviewDue] = await Promise.all([
    prisma.dailyStreak.findUnique({ where: { userId: user.userId } }),
    prisma.userWordProgress.aggregate({
      where: { userId: user.userId },
      _count: true,
    }),
    prisma.reviewLog.count({
      where: { userId: user.userId, answeredAt: { gte: today } },
    }),
    prisma.userWordProgress.count({
      where: { userId: user.userId, nextReviewAt: { lte: new Date() } },
    }),
  ]);

  const totalLearned = progressStats._count;
  const mastered = await prisma.userWordProgress.count({
    where: { userId: user.userId, stage: "mastered" },
  });

  const estimatedVocab = updateVocabEstimate(totalLearned, mastered);

  const totalLogs = await prisma.reviewLog.count({ where: { userId: user.userId } });
  const xp = totalLogs * 10;
  const level = calculateLevel(xp);
  const xpNext = xpToNextLevel(xp);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">👋 欢迎回来，{user.username}</h1>
      <p className="text-gray-500 mb-8">今天也要加油学习！</p>

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

      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl p-6 text-white mb-8">
        <h2 className="text-lg font-bold mb-3">快速开始</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/study/browse" className="bg-white/20 backdrop-blur px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
            📖 浏览单词
          </Link>
          <Link href="/review" className="bg-white/20 backdrop-blur px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
            🔄 开始复习 ({reviewDue})
          </Link>
          <Link href="/study" className="bg-white text-blue-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
            📖 选择词库学习
          </Link>
        </div>
      </div>

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
