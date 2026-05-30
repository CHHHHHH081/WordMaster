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

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bankId = searchParams.get("bank");

  const [allWords, setAllWords] = useState<Word[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [randomOrder, setRandomOrder] = useState(true);

  useEffect(() => {
    async function fetchWords() {
      const url = bankId ? `/api/words?bankId=${bankId}` : "/api/words";
      const res = await fetch(url);
      const data = await res.json();
      setAllWords(data);
      setLoading(false);
    }
    fetchWords();
  }, [bankId]);

  function startBrowse() {
    setWords(randomOrder ? shuffle(allWords) : allWords);
    setStarted(true);
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>;
  }

  if (!started) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h1 className="text-2xl font-bold mb-2">📖 单词列表浏览</h1>
        <p className="text-gray-500 mb-8">翻页浏览完整单词信息，适合初识词库</p>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="text-left">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">单词数量</span>
              <span className="font-bold">{allWords.length} 个</span>
            </div>
          </div>
          <label className="flex items-center justify-between cursor-pointer py-2">
            <span className="text-sm font-medium">🔀 随机排列</span>
            <button
              type="button"
              onClick={() => setRandomOrder(!randomOrder)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                randomOrder ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  randomOrder ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>
          <button
            onClick={startBrowse}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            开始浏览
          </button>
        </div>
      </div>
    );
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
