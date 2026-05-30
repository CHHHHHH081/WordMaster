export const dynamic = "force-dynamic";

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

  const [totalLearned, mastered, learning, totalLogs, correctLogs, recentSessions] =
    await Promise.all([
      prisma.userWordProgress.count({ where: { userId: user.userId } }),
      prisma.userWordProgress.count({ where: { userId: user.userId, stage: "mastered" } }),
      prisma.userWordProgress.count({
        where: { userId: user.userId, stage: { in: ["learning", "review"] } },
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
                      : 0}%
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
