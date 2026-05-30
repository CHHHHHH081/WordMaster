"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Word {
  id: number;
  word: string;
  phonetic: string;
  definition: string;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function SpellingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bankId = searchParams.get("bank");

  const [allWords, setAllWords] = useState<Word[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
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
      .then((data: Word[]) => {
        setAllWords(data);
        setLoading(false);
      });
  }, [bankId]);

  const submitResults = useCallback(async (results: { wordId: number; quality: number; timeSpentMs: number }[]) => {
    if (results.length === 0 || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await fetch("/api/study/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "spelling", bankId: bankId ? parseInt(bankId) : null, results }),
      });
      console.log("[spelling] Submitted:", results.length, "results");
    } catch (err) {
      console.error("[spelling] Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  }, [bankId]);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitted) return;

    const timeSpent = Date.now() - startTimeRef.current;
    const correct = input.trim().toLowerCase() === words[index].word.toLowerCase();
    setIsCorrect(correct);
    setSubmitted(true);

    resultsRef.current.push({
      wordId: words[index].id,
      quality: correct ? (timeSpent < 5000 ? 5 : timeSpent < 15000 ? 4 : 3) : (input.trim().length > 0 ? 1 : 0),
      timeSpentMs: timeSpent,
    });

    setTimeout(() => advance(), 2000);
  }

  async function advance() {
    if (index + 1 >= words.length) {
      await submitResults(resultsRef.current);
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

  if (!started) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h1 className="text-2xl font-bold mb-2">✍️ 拼写模式</h1>
        <p className="text-gray-500 mb-8">看中文写英文，深度掌握拼写</p>
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

      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-6 text-center">
        <p className="text-gray-400 text-sm mb-4">请拼写以下单词</p>
        <p className="text-2xl font-bold text-gray-800 mb-1">{word.definition}</p>
        <p className="text-gray-500">{word.phonetic}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={submitted} autoFocus
          className={`w-full border-2 rounded-xl px-5 py-4 text-xl text-center font-mono tracking-wider focus:outline-none transition-colors ${
            submitted ? (isCorrect ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50") : "border-gray-200 focus:border-blue-400"}`}
          placeholder="输入英文拼写..." />
        {submitted && (
          <div className={`text-center mt-4 font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>
            {isCorrect ? "✅ 正确！" : `❌ 正确答案: ${word.word}`}
          </div>
        )}
        {!submitted && (
          <button type="submit" disabled={!input.trim()}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            确认
          </button>
        )}
      </form>
    </div>
  );
}

export default function SpellingPage() {
  return <Suspense><SpellingContent /></Suspense>;
}
