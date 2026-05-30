/**
 * 题型生成引擎
 * 负责为选择题生成干扰项、为拼写题验证答案
 */

export interface WordInfo {
  id: number;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
}

export interface ChoiceQuestion {
  wordId: number;
  questionWord: string;       // 题干的英文单词
  correctAnswer: string;      // 正确的中文释义
  options: string[];          // 4 个中文选项（含正确项），顺序随机
}

/**
 * 从词库中为给定单词生成选择题
 */
export function generateChoiceQuestion(
  word: WordInfo,
  pool: WordInfo[],
  count: number = 4
): ChoiceQuestion {
  const distractors = pool
    .filter((w) => w.id !== word.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, count - 1)
    .map((w) => w.definition);

  while (distractors.length < count - 1) {
    distractors.push(`(选项 ${distractors.length + 1})`);
  }

  const options = shuffle([word.definition, ...distractors]);

  return {
    wordId: word.id,
    questionWord: word.word,
    correctAnswer: word.definition,
    options,
  };
}

export type LetterResult =
  | { type: "correct"; char: string }
  | { type: "incorrect"; expected: string; actual: string }
  | { type: "missing"; expected: string }
  | { type: "extra"; actual: string };

export function checkSpelling(
  correct: string,
  userInput: string
): LetterResult[] {
  const results: LetterResult[] = [];
  const correctChars = correct.toLowerCase().split("");
  const inputChars = userInput.toLowerCase().split("");
  const maxLen = Math.max(correctChars.length, inputChars.length);

  for (let i = 0; i < maxLen; i++) {
    const expected = correctChars[i];
    const actual = inputChars[i];

    if (expected === actual) {
      results.push({ type: "correct", char: actual });
    } else if (expected && actual) {
      results.push({ type: "incorrect", expected, actual });
    } else if (expected && !actual) {
      results.push({ type: "missing", expected });
    } else if (!expected && actual) {
      results.push({ type: "extra", actual });
    }
  }

  return results;
}

export function isSpellingCorrect(results: LetterResult[]): boolean {
  return results.every((r) => r.type === "correct");
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
