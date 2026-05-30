"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Word {
  id: number;
  word: string;
  definition: string;
}

function ChoiceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bankId = searchParams.get("bank");

  const [words, setWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
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
        if (data.length > 0) {
          generateOptions(data[0], data);
        }
        startTimeRef.current = Date.now();
      });
  }, [bankId]);

  function generateOptions(target: Word, pool: Word[]) {
    const distractors = pool
      .filter((w) => w.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.definition);

    const allOptions = [...distractors, target.definition].sort(
      () => Math.random() - 0.5
    );
    setOptions(allOptions);
  }

  function select(option: string) {
    if (feedback) return;
    setSelected(option);
    const isCorrect = option === words[index].definition;
    setFeedback(isCorrect ? "correct" : "wrong");

    const timeSpent = Date.now() - startTimeRef.current;
    const quality = isCorrect
      ? timeSpent < 3000 ? 5 : timeSpent < 10000 ? 4 : 3
      : 2;

    resultsRef.current.push({
      wordId: words[index].id,
      quality,
      timeSpentMs: timeSpent,
    });

    setTimeout(() => advance(), 1500);
  }

  function advance() {
    if (index + 1 >= words.length) {
      fetch("/api/study/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "choice",
          bankId: bankId ? parseInt(bankId) : null,
          results: resultsRef.current,
        }),
      });
      setComplete(true);
    } else {
      const nextWord = words[index + 1];
      setIndex(index + 1);
      setSelected(null);
      setFeedback(null);
      generateOptions(nextWord, words);
      startTimeRef.current = Date.now();
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">加载中...</div>;

  if (complete) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="text-5xl mb-4">&#x1F389;</div>
        <h2 className="text-2xl font-bold mb-2">本轮完成！</h2>
        <p className="text-gray-500 mb-6">练习了 {words.length} 个单词</p>
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

      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-6">
        <h2 className="text-3xl font-bold text-center mb-2">{word.word}</h2>
        <p className="text-center text-gray-400 text-sm">选择正确的中文释义</p>
      </div>

      <div className="space-y-3">
        {options.map((option, i) => {
          let style = "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50";
          if (feedback && option === word.definition) {
            style = "bg-green-50 border-green-400 text-green-700";
          } else if (feedback && option === selected && option !== word.definition) {
            style = "bg-red-50 border-red-400 text-red-700";
          }

          return (
            <button
              key={i}
              onClick={() => select(option)}
              disabled={feedback !== null}
              className={`w-full text-left border-2 rounded-xl px-5 py-4 font-medium transition-all ${style}`}
            >
              <span className="text-gray-400 mr-3">{String.fromCharCode(65 + i)}.</span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ChoicePage() {
  return (
    <Suspense>
      <ChoiceContent />
    </Suspense>
  );
}
