import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bankId = searchParams.get("bankId");

  const words = await prisma.word.findMany({
    where: bankId ? { wordBankId: parseInt(bankId) } : undefined,
    include: { wordBank: { select: { name: true } } },
    orderBy: { word: "asc" },
  });

  return NextResponse.json(words);
}
