/**
 * 游戏化系统：打卡、成就、经验值、等级
 */

export interface UserGamification {
  streak: number;
  xp: number;
  level: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

// 预定义成就列表
export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_word", name: "初出茅庐", description: "学习第一个单词", icon: "🌱" },
  { id: "streak_3", name: "三天打渔", description: "连续打卡 3 天", icon: "🔥" },
  { id: "streak_7", name: "一周之星", description: "连续打卡 7 天", icon: "⭐" },
  { id: "streak_30", name: "月月不断", description: "连续打卡 30 天", icon: "🌟" },
  { id: "words_100", name: "百词斩", description: "累计学习 100 个单词", icon: "💯" },
  { id: "words_500", name: "词汇达人", description: "累计学习 500 个单词", icon: "📚" },
  { id: "words_1000", name: "千词大师", description: "累计学习 1000 个单词", icon: "🏆" },
  { id: "bank_cet4", name: "四级通关", description: "完成 CET-4 词库", icon: "🎓" },
  { id: "bank_cet6", name: "六级通关", description: "完成 CET-6 词库", icon: "🎓" },
  { id: "perfect_spell", name: "拼写无误", description: "拼写模式一次全对 (20词)", icon: "✍️" },
  { id: "speed_demon", name: "闪电记忆", description: "平均答题时间 < 2秒 (20词)", icon: "⚡" },
];

// 每个等级所需经验值
const XP_PER_LEVEL = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800,
  4700, 5700, 6800, 8000, 9300, 10700, 12200, 13800, 15500, 17500,
];

/** 计算当前等级 */
export function calculateLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < XP_PER_LEVEL.length; i++) {
    if (xp >= XP_PER_LEVEL[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

/** 计算到达下一级还需要多少经验 */
export function xpToNextLevel(xp: number): number {
  const level = calculateLevel(xp);
  if (level >= XP_PER_LEVEL.length) return 0;
  return XP_PER_LEVEL[level] - xp;
}

/** 根据学习行为计算获得的经验值 */
export function calculateXpGain(mode: string, isCorrect: boolean, quality: number): number {
  if (!isCorrect) return 2;

  const baseXP: Record<string, number> = {
    browse: 5,
    flashcard: 10,
    choice: 15,
    spelling: 20,
  };

  const base = baseXP[mode] ?? 10;
  const qualityBonus = Math.max(0, quality - 3) * 2;
  return base + qualityBonus;
}

/** 检查并解锁新成就 */
export function checkAchievements(
  stats: {
    totalWordsLearned: number;
    streak: number;
    bankCompletion: Record<string, boolean>;
    perfectSpellStreak: number;
    avgResponseTime: number;
  },
  existingAchievements: string[]
): Achievement[] {
  const unlocked: Achievement[] = [];

  const checks: [string, boolean][] = [
    ["first_word", stats.totalWordsLearned >= 1],
    ["streak_3", stats.streak >= 3],
    ["streak_7", stats.streak >= 7],
    ["streak_30", stats.streak >= 30],
    ["words_100", stats.totalWordsLearned >= 100],
    ["words_500", stats.totalWordsLearned >= 500],
    ["words_1000", stats.totalWordsLearned >= 1000],
    ["bank_cet4", stats.bankCompletion["CET-4"] ?? false],
    ["bank_cet6", stats.bankCompletion["CET-6"] ?? false],
    ["perfect_spell", stats.perfectSpellStreak >= 20],
    ["speed_demon", stats.avgResponseTime < 2000 && stats.totalWordsLearned >= 20],
  ];

  for (const [id, condition] of checks) {
    if (condition && !existingAchievements.includes(id)) {
      const achievement = ACHIEVEMENTS.find((a) => a.id === id);
      if (achievement) {
        unlocked.push({ ...achievement, unlockedAt: new Date() });
      }
    }
  }

  return unlocked;
}
