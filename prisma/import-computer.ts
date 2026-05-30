/**
 * Import computer vocabulary from Computer-English-Words markdown files
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";

const prisma = new PrismaClient();

const SOURCE_DIR = "D:/computer_words/Computer-English-Words-master";
const TOPIC_NAMES: Record<string, string> = {
  "机器学习": "机器学习",
  "线性代数": "线性代数",
  "数据挖掘": "数据挖掘",
  "大数据": "大数据",
  "图论": "图论",
  "区块链": "区块链",
  "分布式系统": "分布式系统",
  "云计算": "云计算",
};

interface WordEntry {
  word: string;
  definition: string;
  topic: string;
}

function parseLine(line: string, topic: string): WordEntry | null {
  // Remove leading * and whitespace
  const cleaned = line.replace(/^\*\s*/, "").trim();
  if (!cleaned) return null;

  // Pattern: "Chinese English1, English2" or "Chinese English"
  // Split on first space... but that won't work well
  // Better: the format is "中文名 英文名" where English comes after Chinese

  // Try to find the split point - Chinese characters end, English begins
  // Chinese chars are in range 一-鿿, plus common punctuation
  const chineseMatch = cleaned.match(/^([一-鿿＀-￯()（）\/\s]+?)\s+([A-Za-z].+)$/);
  if (chineseMatch) {
    const chinese = chineseMatch[1].trim();
    let english = chineseMatch[2].trim();
    // Take only the first English term (before comma or slash)
    english = english.split(/[,，/]\s*/)[0].trim();
    // Remove trailing notes in parentheses
    english = english.replace(/\s*\(.*\)$/, "").trim();
    if (english.length > 0 && english.length < 60) {
      return { word: english, definition: chinese, topic };
    }
  }

  // Try reverse: "English Chinese" pattern (English first, then Chinese)
  const engFirst = cleaned.match(/^([A-Za-z][A-Za-z\s-]+?)\s+([一-鿿].+)$/);
  if (engFirst) {
    const english = engFirst[1].trim();
    const chinese = engFirst[2].trim();
    if (english.length > 0 && english.length < 60) {
      return { word: english, definition: chinese, topic };
    }
  }

  return null;
}

async function main() {
  console.log("=== Importing Computer Vocabulary ===\n");

  const allWords: WordEntry[] = [];
  const seen = new Set<string>();

  // Walk through topic directories
  const dirs = readdirSync(SOURCE_DIR);
  for (const dir of dirs) {
    const dirPath = join(SOURCE_DIR, dir);
    if (!statSync(dirPath).isDirectory()) continue;

    const topicName = TOPIC_NAMES[dir] || dir;
    console.log(`Processing: ${dir} (${topicName})`);

    const files = readdirSync(dirPath).filter(f => f.endsWith(".md"));
    let count = 0;

    for (const file of files) {
      const content = readFileSync(join(dirPath, file), "utf-8");
      const lines = content.split("\n");

      for (const line of lines) {
        const entry = parseLine(line, topicName);
        if (entry && !seen.has(entry.word.toLowerCase())) {
          seen.add(entry.word.toLowerCase());
          allWords.push(entry);
          count++;
        }
      }
    }
    console.log(`  Found ${count} unique words`);
  }

  console.log(`\nTotal unique words: ${allWords.length}`);

  // Delete existing computer words
  const computerBank = await prisma.wordBank.findFirst({ where: { name: "计算机" } });
  if (computerBank) {
    await prisma.word.deleteMany({ where: { wordBankId: computerBank.id } });
    await prisma.wordBank.update({
      where: { id: computerBank.id },
      data: {
        wordCount: allWords.length,
        description: "计算机专业英语词汇（含机器学习/云计算/大数据/区块链等）",
        words: {
          create: allWords.map(w => ({
            word: w.word,
            phonetic: "",
            partOfSpeech: "n.",
            definition: w.definition,
            exampleSentence: "",
          })),
        },
      },
    });
    console.log(`\nUpdated "${computerBank.name}" with ${allWords.length} words`);
  } else {
    console.log("Computer word bank not found, creating...");
    await prisma.wordBank.create({
      data: {
        name: "计算机",
        description: "计算机专业英语词汇",
        wordCount: allWords.length,
        words: {
          create: allWords.map(w => ({
            word: w.word,
            phonetic: "",
            partOfSpeech: "n.",
            definition: w.definition,
            exampleSentence: "",
          })),
        },
      },
    });
  }

  // Show sample
  console.log("\nSample words:");
  for (const w of allWords.slice(0, 10)) {
    console.log(`  ${w.word} → ${w.definition} [${w.topic}]`);
  }

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
