export const dynamic = "force-dynamic";

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
