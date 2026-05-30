import { prisma } from "@/lib/db";
import { calculateNextReview } from "@/lib/spaced-repetition";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    console.log("[study/record] Unauthorized - no user cookie");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log(`[study/record] User ${user.userId} submitting results`);

  const body = await request.json();
  const { mode, bankId, results } = body as {
    mode: string;
    bankId: number | null;
    results: { wordId: number; quality: number; timeSpentMs: number }[];
  };

  // Create study session
  const session = await prisma.studySession.create({
    data: {
      userId: user.userId,
      wordBankId: bankId ?? 0,
      mode,
      wordsStudied: results.length,
      correctCount: results.filter((r) => r.quality >= 3).length,
      endedAt: new Date(),
    },
  });

  // Process each result
  for (const result of results) {
    let progress = await prisma.userWordProgress.findUnique({
      where: {
        userId_wordId: {
          userId: user.userId,
          wordId: result.wordId,
        },
      },
    });

    if (!progress) {
      progress = await prisma.userWordProgress.create({
        data: {
          userId: user.userId,
          wordId: result.wordId,
        },
      });
    }

    const daysOverdue = progress.nextReviewAt
      ? Math.max(0, Math.floor(
          (Date.now() - new Date(progress.nextReviewAt).getTime()) / (1000 * 60 * 60 * 24)
        ))
      : 0;

    const reviewResult = calculateNextReview({
      progress: {
        stage: progress.stage as "new" | "learning" | "review" | "mastered",
        easeFactor: progress.easeFactor,
        intervalDays: progress.intervalDays,
        repetitions: progress.repetitions,
        correctCount: progress.correctCount,
        incorrectCount: progress.incorrectCount,
      },
      quality: result.quality,
      mode: mode as "flashcard" | "choice" | "spelling",
      timeSpentMs: result.timeSpentMs,
      daysOverdue,
    });

    await prisma.userWordProgress.update({
      where: { id: progress.id },
      data: {
        stage: reviewResult.newProgress.stage,
        easeFactor: reviewResult.newProgress.easeFactor,
        intervalDays: reviewResult.newProgress.intervalDays,
        repetitions: reviewResult.newProgress.repetitions,
        correctCount: reviewResult.newProgress.correctCount,
        incorrectCount: reviewResult.newProgress.incorrectCount,
        nextReviewAt: reviewResult.nextReviewAt,
        lastReviewedAt: new Date(),
      },
    });

    await prisma.reviewLog.create({
      data: {
        userId: user.userId,
        wordId: result.wordId,
        mode,
        isCorrect: result.quality >= 3,
        quality: result.quality,
        timeSpentMs: result.timeSpentMs,
      },
    });
  }

  // Update daily streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingStreak = await prisma.dailyStreak.findUnique({
    where: { userId: user.userId },
  });

  if (existingStreak) {
    if (existingStreak.lastStudyDate) {
      const lastDate = new Date(existingStreak.lastStudyDate);
      lastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day, increment streak
        await prisma.dailyStreak.update({
          where: { userId: user.userId },
          data: { streak: existingStreak.streak + 1, lastStudyDate: today },
        });
      } else if (diffDays > 1) {
        // Gap too large, reset streak
        await prisma.dailyStreak.update({
          where: { userId: user.userId },
          data: { streak: 1, lastStudyDate: today },
        });
      }
      // If diffDays === 0 (same day), do nothing
    }
  } else {
    // First study record ever
    await prisma.dailyStreak.create({
      data: { userId: user.userId, streak: 1, lastStudyDate: today },
    });
  }

  return NextResponse.json({ sessionId: session.id });
}
