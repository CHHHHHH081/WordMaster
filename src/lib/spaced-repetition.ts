/**
 * SM-2 改良间隔复习算法
 *
 * 改良点：
 * 1. 答题时间加权 — <3s EF+0.1, >10s EF-0.1
 * 2. 模式权重 — choice ×0.8, spelling ×1.2
 * 3. 弹性复习窗口 — 逾期1-3天 EF×0.95, 逾期>7天重置
 */

export type StudyMode = "flashcard" | "choice" | "spelling";

export interface ProgressState {
  stage: "new" | "learning" | "review" | "mastered";
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  correctCount: number;
  incorrectCount: number;
  nextReviewAt?: Date;
}

export interface ReviewInput {
  progress: ProgressState;
  quality: number;      // 0-5
  mode: StudyMode;
  timeSpentMs: number;  // 答题耗时
  daysOverdue: number;  // 逾期天数，0=按时/提前
}

export interface ReviewOutput {
  newProgress: ProgressState;
  nextReviewAt: Date;
}

const MIN_EF = 1.3;
const MODE_WEIGHTS: Record<StudyMode, number> = {
  flashcard: 1.0,
  choice: 0.8,
  spelling: 1.2,
};

export function calculateNextReview(input: ReviewInput): ReviewOutput {
  const { progress, quality, mode, timeSpentMs, daysOverdue } = input;
  const newProgress = { ...progress };
  const now = new Date();

  // 答错 (q < 3): 重置
  if (quality < 3) {
    newProgress.repetitions = 0;
    newProgress.intervalDays = 1;
    newProgress.stage = "learning";
    newProgress.incorrectCount += 1;
    newProgress.correctCount = Math.max(0, newProgress.correctCount);
    newProgress.nextReviewAt = addDays(now, 1);
    return {
      newProgress,
      nextReviewAt: newProgress.nextReviewAt ?? addDays(now, 1),
    };
  }

  // 答对: 更新正确计数
  newProgress.correctCount += 1;

  // 更新 Ease Factor (SM-2 标准公式)
  let efDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);

  // 改良1: 答题时间加权
  if (timeSpentMs < 3000) {
    efDelta += 0.1; // 秒答加分
  } else if (timeSpentMs > 10000) {
    efDelta -= 0.1; // 犹豫减分
  }

  // 改良2: 模式权重
  efDelta *= MODE_WEIGHTS[mode];

  newProgress.easeFactor = Math.max(
    MIN_EF,
    progress.easeFactor + efDelta
  );

  // 改良3: 弹性复习窗口
  let adjustedEF = newProgress.easeFactor;
  if (daysOverdue >= 1 && daysOverdue <= 3) {
    adjustedEF *= 0.95;
  } else if (daysOverdue > 7) {
    // 逾期太久，重置
    newProgress.repetitions = 0;
    newProgress.intervalDays = 1;
    newProgress.stage = "learning";
    newProgress.nextReviewAt = addDays(now, 1);
    return {
      newProgress,
      nextReviewAt: newProgress.nextReviewAt ?? addDays(now, 1),
    };
  }

  // 计算间隔
  let interval: number;
  if (newProgress.repetitions === 0) {
    interval = 1;
  } else if (newProgress.repetitions === 1) {
    interval = 6;
  } else {
    interval = Math.round(newProgress.intervalDays * adjustedEF);
  }

  newProgress.repetitions += 1;
  newProgress.intervalDays = interval;

  // 更新阶段
  if (newProgress.repetitions > 0 && newProgress.stage === "new") {
    newProgress.stage = "learning";
  }
  if (newProgress.repetitions >= 3 && newProgress.stage === "learning") {
    newProgress.stage = "review";
  }
  if (interval >= 90 && newProgress.stage === "review") {
    newProgress.stage = "mastered";
  }

  newProgress.nextReviewAt = addDays(now, interval);
  return {
    newProgress,
    nextReviewAt: newProgress.nextReviewAt ?? addDays(now, interval),
  };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 获取给定质量评分的描述
 */
export function qualityDescription(q: number): string {
  const descriptions: Record<number, string> = {
    5: "完美，秒答",
    4: "正确，稍作思考",
    3: "正确，明显犹豫",
    2: "错误，看到答案后记得",
    1: "错误，看到答案也模糊",
    0: "完全不记得",
  };
  return descriptions[q] ?? "未知";
}
