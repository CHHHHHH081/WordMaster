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
