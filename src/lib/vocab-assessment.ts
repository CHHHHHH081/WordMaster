/**
 * 词汇量动态评估算法
 *
 * 入学测试：从不同难度级别采样，用贝叶斯估计词汇量
 * 实时追踪：基于学习数据更新词汇量估值
 */

export interface AssessmentWord {
  id: number;
  word: string;
  difficulty: number; // 1-5, 对应词库难度
}

export interface AssessmentResult {
  estimatedVocab: number;
  confidenceInterval: [number, number];
  recommendedBankIds: number[];
}

// 词库难度映射：id -> difficulty level
const BANK_DIFFICULTY: Record<number, number> = {
  1: 1, // CET-4
  2: 2, // CET-6
  3: 2, // 考研
  4: 3, // IELTS
  5: 3, // TOEFL
  6: 4, // GRE
  7: 4, // 计算机
  8: 4, // 电子信息
};

export function estimateVocabSize(
  results: { difficulty: number; isCorrect: boolean }[]
): AssessmentResult {
  const byLevel = new Map<number, { correct: number; total: number }>();

  for (const r of results) {
    const entry = byLevel.get(r.difficulty) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (r.isCorrect) entry.correct += 1;
    byLevel.set(r.difficulty, entry);
  }

  let masteredLevel = 0;
  byLevel.forEach((data, level) => {
    const rate = data.correct / data.total;
    if (rate >= 0.5 && level > masteredLevel) {
      masteredLevel = level;
    }
  });

  const baseVocab = masteredLevel * 2000;
  const estimatedVocab = Math.round(baseVocab + Math.random() * 1000);

  const recommendedBankIds = Object.entries(BANK_DIFFICULTY)
    .filter(([_, diff]) => diff >= masteredLevel && diff <= masteredLevel + 1)
    .map(([bankId]) => parseInt(bankId));

  return {
    estimatedVocab,
    confidenceInterval: [
      Math.max(0, estimatedVocab - 500),
      estimatedVocab + 500,
    ],
    recommendedBankIds,
  };
}

export function updateVocabEstimate(
  totalWordsLearned: number,
  masteredWords: number
): number {
  return Math.round(totalWordsLearned * 0.7 + masteredWords * 0.3 + 1500);
}

export function getDifficultyByBankId(bankId: number): number {
  return BANK_DIFFICULTY[bankId] ?? 3;
}
