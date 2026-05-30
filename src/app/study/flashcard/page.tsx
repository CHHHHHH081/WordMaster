"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Word {
  id: number;
  word: string;
  phonetic: string;
  definition: string;
  exampleSentence: string;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function FlashcardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bankId = searchParams.get("bank");

  const [allWords, setAllWords] = useState<Word[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [randomOrder, setRandomOrder] = useState(true);
  const [wordLimit, setWordLimit] = useState(20);
  const [useLimit, setUseLimit] = useState(false);
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef(Date.now());
  const resultsRef = useRef<{ wordId: number; quality: number; timeSpentMs: number }[]>([]);
  const submittedRef = useRef(false);

  useEffect(() => {
    const url = bankId ? `/api/words?bankId=${bankId}` : "/api/words";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setAllWords(data);
        setLoading(false);
      });
  }, [bankId]);

  // Shared submit function — callable from both completion and exit
  const submitResults = useCallback(async (results: { wordId: number; quality: number; timeSpentMs: number }[]) => {
    if (results.length === 0 || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/study/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "flashcard",
          bankId: bankId ? parseInt(bankId) : null,
          results,
        }),
      });
      const data = await res.json();
      console.log("[flashcard] Submitted:", results.length, "results", data);
      return data;
    } catch (err) {
      console.error("[flashcard] Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  }, [bankId]);

  // Exit handler — save partial progress before leaving
  const handleExit = useCallback(async () => {
    await submitResults(resultsRef.current);
    router.push("/study");
  }, [submitResults, router]);

  function startStudy() {
    const pool = randomOrder ? shuffle(allWords) : allWords;
    const selected = useLimit && wordLimit > 0 ? pool.slice(0, wordLimit) : pool;
    setWords(selected);
    setStarted(true);
    startTimeRef.current = Date.now();
  }

  async function answer(quality: number) {
    const now = Date.now();
    resultsRef.current.push({
      wordId: words[index].id,
      quality,
      timeSpentMs: now - startTimeRef.current,
    });

    if (index + 1 >= words.length) {
      await submitResults(resultsRef.current);
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

  if (!started) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h1 className="text-2xl font-bold mb-2">🃏 卡片翻转模式</h1>
        <p className="text-gray-500 mb-8">看英文回忆中文，自评记忆程度</p>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">词库单词总数</span>
            <span className="font-bold">{allWords.length} 个</span>
          </div>
          <label className="flex items-center justify-between cursor-pointer py-2">
            <span className="text-sm font-medium">🔀 随机排列</span>
            <button type="button" onClick={() => setRandomOrder(!randomOrder)}
              className={`relative w-11 h-6 rounded-full transition-colors ${randomOrder ? "bg-blue-600" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${randomOrder ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </label>
          <label className="flex items-center justify-between cursor-pointer py-2">
            <span className="text-sm font-medium">🔢 限制数量</span>
            <button type="button" onClick={() => setUseLimit(!useLimit)}
              className={`relative w-11 h-6 rounded-full transition-colors ${useLimit ? "bg-blue-600" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${useLimit ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </label>
          {useLimit && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">学习</span>
              <input type="number" value={wordLimit} onChange={(e) => setWordLimit(Math.max(5, Math.min(allWords.length, parseInt(e.target.value) || 20)))}
                className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-center" min={5} max={allWords.length} />
              <span className="text-sm text-gray-500">个单词</span>
            </div>
          )}
          <button onClick={startStudy}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
            开始学习 ({useLimit ? wordLimit : allWords.length} 词)
          </button>
        </div>
      </div>
    );
  }

  const word = words[index];

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={handleExit} disabled={submitting}
          className="text-gray-400 hover:text-gray-600 text-sm disabled:opacity-50">
          ← {submitting ? "保存中..." : "退出"}{resultsRef.current.length > 0 ? ` (已学${resultsRef.current.length}词)` : ""}
        </button>
        <span className="text-sm text-gray-500">{index + 1} / {words.length}</span>
      </div>

      <div onClick={() => !flipped && setFlipped(true)}
        className={`bg-white rounded-2xl border-2 p-12 min-h-[300px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-sm ${
          flipped ? "border-blue-300" : "border-gray-200 hover:border-blue-200 hover:shadow-md"}`}>
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

export default function FlashcardPage() {
  return <Suspense><FlashcardContent /></Suspense>;
}
