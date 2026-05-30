export const dynamic = "force-dynamic";

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
