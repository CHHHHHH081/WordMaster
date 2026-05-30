export const dynamic = "force-dynamic";

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
