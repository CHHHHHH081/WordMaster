import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WORD_BANKS = [
  { name: "CET-4", description: "大学英语四级词汇", words: [
    { word: "abandon", phonetic: "/əˈbændən/", partOfSpeech: "v.", definition: "放弃；抛弃", exampleSentence: "They had to abandon the plan due to lack of funding." },
    { word: "ability", phonetic: "/əˈbɪləti/", partOfSpeech: "n.", definition: "能力；才能", exampleSentence: "She has the ability to learn languages quickly." },
    { word: "absent", phonetic: "/ˈæbsənt/", partOfSpeech: "adj.", definition: "缺席的；不在的", exampleSentence: "He was absent from school yesterday." },
    { word: "absorb", phonetic: "/əbˈzɔːrb/", partOfSpeech: "v.", definition: "吸收；吸引", exampleSentence: "Plants absorb nutrients from the soil." },
    { word: "abstract", phonetic: "/ˈæbstrækt/", partOfSpeech: "adj.", definition: "抽象的；理论的", exampleSentence: "The concept is too abstract for beginners." },
  ]},
  { name: "CET-6", description: "大学英语六级词汇", words: [
    { word: "abbreviation", phonetic: "/əˌbriːviˈeɪʃn/", partOfSpeech: "n.", definition: "缩写；缩写词", exampleSentence: "WTO is the abbreviation for World Trade Organization." },
    { word: "abide", phonetic: "/əˈbaɪd/", partOfSpeech: "v.", definition: "遵守；忍受", exampleSentence: "You must abide by the rules of the game." },
    { word: "abolish", phonetic: "/əˈbɒlɪʃ/", partOfSpeech: "v.", definition: "废除；取消", exampleSentence: "The government decided to abolish the outdated law." },
    { word: "absurd", phonetic: "/əbˈsɜːrd/", partOfSpeech: "adj.", definition: "荒谬的；可笑的", exampleSentence: "It's absurd to think that money can buy happiness." },
    { word: "abundance", phonetic: "/əˈbʌndəns/", partOfSpeech: "n.", definition: "丰富；充裕", exampleSentence: "The region has an abundance of natural resources." },
  ]},
  { name: "考研", description: "研究生入学考试词汇", words: [
    { word: "acquaint", phonetic: "/əˈkweɪnt/", partOfSpeech: "v.", definition: "使熟悉；使了解", exampleSentence: "I need to acquaint myself with the new software." },
    { word: "adolescent", phonetic: "/ˌædəˈlesnt/", partOfSpeech: "n.", definition: "青少年", exampleSentence: "The program is designed for adolescents aged 13-18." },
    { word: "adverse", phonetic: "/ˈædvɜːrs/", partOfSpeech: "adj.", definition: "不利的；有害的", exampleSentence: "The drug may have adverse side effects." },
    { word: "aesthetic", phonetic: "/esˈθetɪk/", partOfSpeech: "adj.", definition: "审美的；美学的", exampleSentence: "The building has great aesthetic appeal." },
    { word: "allege", phonetic: "/əˈledʒ/", partOfSpeech: "v.", definition: "声称；指控", exampleSentence: "The plaintiff alleges that the company was negligent." },
  ]},
  { name: "IELTS", description: "雅思考试词汇", words: [
    { word: "accommodate", phonetic: "/əˈkɒmədeɪt/", partOfSpeech: "v.", definition: "容纳；提供食宿；适应", exampleSentence: "The hotel can accommodate up to 200 guests." },
    { word: "acknowledge", phonetic: "/əkˈnɒlɪdʒ/", partOfSpeech: "v.", definition: "承认；确认收到", exampleSentence: "He acknowledged his mistake publicly." },
    { word: "acquire", phonetic: "/əˈkwaɪər/", partOfSpeech: "v.", definition: "获得；习得", exampleSentence: "It takes years to acquire fluency in a new language." },
    { word: "adequate", phonetic: "/ˈædɪkwət/", partOfSpeech: "adj.", definition: "足够的；适当的", exampleSentence: "The current safety measures are not adequate." },
    { word: "advocate", phonetic: "/ˈædvəkeɪt/", partOfSpeech: "v.", definition: "提倡；拥护", exampleSentence: "She advocates for better working conditions." },
  ]},
  { name: "TOEFL", description: "托福考试词汇", words: [
    { word: "accelerate", phonetic: "/əkˈseləreɪt/", partOfSpeech: "v.", definition: "加速；促进", exampleSentence: "The new policy will accelerate economic growth." },
    { word: "accumulate", phonetic: "/əˈkjuːmjəleɪt/", partOfSpeech: "v.", definition: "积累；积聚", exampleSentence: "Over time, small savings can accumulate into a large sum." },
    { word: "ambiguous", phonetic: "/æmˈbɪɡjuəs/", partOfSpeech: "adj.", definition: "模棱两可的；含糊的", exampleSentence: "The contract contains several ambiguous clauses." },
    { word: "analogy", phonetic: "/əˈnælədʒi/", partOfSpeech: "n.", definition: "类比；比喻", exampleSentence: "The teacher used an analogy to explain the complex concept." },
    { word: "anticipate", phonetic: "/ænˈtɪsɪpeɪt/", partOfSpeech: "v.", definition: "预期；预见", exampleSentence: "We anticipate that sales will increase next quarter." },
  ]},
  { name: "GRE", description: "GRE 考试词汇", words: [
    { word: "aberration", phonetic: "/ˌæbəˈreɪʃn/", partOfSpeech: "n.", definition: "异常；偏差", exampleSentence: "The warm weather in January was an aberration." },
    { word: "abeyance", phonetic: "/əˈbeɪəns/", partOfSpeech: "n.", definition: "暂时搁置；中止", exampleSentence: "The project was held in abeyance until funding could be secured." },
    { word: "abstemious", phonetic: "/æbˈstiːmiəs/", partOfSpeech: "adj.", definition: "有节制的；饮食适度的", exampleSentence: "He led an abstemious life, avoiding alcohol and rich foods." },
    { word: "acerbic", phonetic: "/əˈsɜːrbɪk/", partOfSpeech: "adj.", definition: "尖刻的；辛辣的", exampleSentence: "The critic's acerbic review angered the artist." },
    { word: "acumen", phonetic: "/ˈækjəmən/", partOfSpeech: "n.", definition: "敏锐；精明", exampleSentence: "Her business acumen helped the company grow rapidly." },
  ]},
  { name: "计算机", description: "计算机专业英语词汇", words: [
    { word: "algorithm", phonetic: "/ˈælɡərɪðəm/", partOfSpeech: "n.", definition: "算法", exampleSentence: "The sorting algorithm has O(n log n) time complexity." },
    { word: "bandwidth", phonetic: "/ˈbændwɪdθ/", partOfSpeech: "n.", definition: "带宽", exampleSentence: "Streaming video requires high bandwidth." },
    { word: "cache", phonetic: "/kæʃ/", partOfSpeech: "n.", definition: "缓存；高速缓冲存储器", exampleSentence: "The browser cache stores frequently accessed data." },
    { word: "database", phonetic: "/ˈdeɪtəbeɪs/", partOfSpeech: "n.", definition: "数据库", exampleSentence: "All user information is stored in a relational database." },
    { word: "encryption", phonetic: "/ɪnˈkrɪpʃn/", partOfSpeech: "n.", definition: "加密", exampleSentence: "End-to-end encryption ensures message privacy." },
  ]},
  { name: "电子信息", description: "电子信息工程专业词汇", words: [
    { word: "amplifier", phonetic: "/ˈæmplɪfaɪər/", partOfSpeech: "n.", definition: "放大器", exampleSentence: "The audio signal passes through a power amplifier." },
    { word: "capacitor", phonetic: "/kəˈpæsɪtər/", partOfSpeech: "n.", definition: "电容器", exampleSentence: "The capacitor stores electrical charge between its plates." },
    { word: "circuit", phonetic: "/ˈsɜːrkɪt/", partOfSpeech: "n.", definition: "电路", exampleSentence: "The printed circuit board contains multiple components." },
    { word: "frequency", phonetic: "/ˈfriːkwənsi/", partOfSpeech: "n.", definition: "频率", exampleSentence: "The signal operates at a frequency of 2.4 GHz." },
    { word: "transistor", phonetic: "/trænˈzɪstər/", partOfSpeech: "n.", definition: "晶体管", exampleSentence: "Modern processors contain billions of transistors." },
  ]},
];

async function main() {
  console.log("Seeding database...");

  for (const bank of WORD_BANKS) {
    const created = await prisma.wordBank.create({
      data: {
        name: bank.name,
        description: bank.description,
        wordCount: bank.words.length,
        words: {
          create: bank.words,
        },
      },
    });
    console.log(`Created word bank: ${created.name} (${created.wordCount} words)`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
