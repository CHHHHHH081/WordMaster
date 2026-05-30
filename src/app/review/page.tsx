export const dynamic = "force-dynamic";

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
            <Link href="/study/flashcard?review=1" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              🃏 卡片复习
            </Link>
            <Link href="/study/choice?review=1" className="bg-white border border-gray-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              ✅ 选择复习
            </Link>
            <Link href="/study/spelling?review=1" className="bg-white border border-gray-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
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
          <Link href="/study" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-block">
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
