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
        <button onClick={() => router.push("/study")} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
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

      {flipped && (
        <div className="flex gap-3 mt-6">
          <button onClick={() => answer(0)} className="flex-1 bg-red-50 text-red-700 border border-red-200 py-3 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm">
            😕 不认识
          </button>
          <button onClick={() => answer(2)} className="flex-1 bg-yellow-50 text-yellow-700 border border-yellow-200 py-3 rounded-lg font-medium hover:bg-yellow-100 transition-colors text-sm">
            🤔 不确定
          </button>
          <button onClick={() => answer(4)} className="flex-1 bg-green-50 text-green-700 border border-green-200 py-3 rounded-lg font-medium hover:bg-green-100 transition-colors text-sm">
            ✅ 认识
          </button>
        </div>
      )}
    </div>
  );
}
