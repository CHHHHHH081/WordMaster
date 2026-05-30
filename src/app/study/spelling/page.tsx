"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Word {
  id: number;
  word: string;
  phonetic: string;
  definition: string;
}

export default function SpellingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bankId = searchParams.get("bank");

  const [words, setWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);
  const startTimeRef = useRef(Date.now());
  const resultsRef = useRef<{ wordId: number; quality: number; timeSpentMs: number }[]>([]);

  useEffect(() => {
    const url = bankId ? `/api/words?bankId=${bankId}` : "/api/words";
    fetch(url)
      .then((r) => r.json())
      .then((data: Word[]) => {
        setWords(data);
        setLoading(false);
        startTimeRef.current = Date.now();
      });
  }, [bankId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitted) return;

    const timeSpent = Date.now() - startTimeRef.current;
    const correct = input.trim().toLowerCase() === words[index].word.toLowerCase();
    setIsCorrect(correct);
    setSubmitted(true);

    const quality = correct
      ? timeSpent < 5000 ? 5 : timeSpent < 15000 ? 4 : 3
      : input.trim().length > 0 ? 1 : 0;

    resultsRef.current.push({
      wordId: words[index].id,
      quality,
      timeSpentMs: timeSpent,
    });

    setTimeout(() => advance(), 2000);
  }

  function advance() {
    if (index + 1 >= words.length) {
      fetch("/api/study/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "spelling",
          bankId: bankId ? parseInt(bankId) : null,
          results: resultsRef.current,
        }),
      });
      setComplete(true);
    } else {
      setIndex(index + 1);
      setInput("");
      setSubmitted(false);
      setIsCorrect(false);
      startTimeRef.current = Date.now();
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">加载中...</div>;

  if (complete) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">本轮完成！</h2>
        <p className="text-gray-500 mb-6">拼写了 {words.length} 个单词</p>
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

      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-6 text-center">
        <p className="text-gray-400 text-sm mb-4">请拼写以下单词</p>
        <p className="text-2xl font-bold text-gray-800 mb-1">{word.definition}</p>
        <p className="text-gray-500">{word.phonetic}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={submitted}
          autoFocus
          className={`w-full border-2 rounded-xl px-5 py-4 text-xl text-center font-mono tracking-wider focus:outline-none transition-colors ${
            submitted
              ? isCorrect
                ? "border-green-400 bg-green-50"
                : "border-red-400 bg-red-50"
              : "border-gray-200 focus:border-blue-400"
          }`}
          placeholder="输入英文拼写..."
        />

        {submitted && (
          <div className={`text-center mt-4 font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>
            {isCorrect ? "✅ 正确！" : `❌ 正确答案: ${word.word}`}
          </div>
        )}

        {!submitted && (
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            确认
          </button>
        )}
      </form>
    </div>
  );
}
