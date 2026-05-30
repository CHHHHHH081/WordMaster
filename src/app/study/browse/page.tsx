"use client";

import { useState, useEffect, Suspense } from "react";
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

function BrowseContent() {
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
        <button onClick={() => router.push("/study")} className="text-blue-600 hover:underline text-sm">
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

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseContent />
    </Suspense>
  );
}
