/**
 * Production seed for PostgreSQL (Vercel deployment)
 * Imports vocabulary from JSON files or local dict ZIP files
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Core words embedded for production (these get imported even without ZIP files)
// Each bank gets a core set of representative words
const CORE_WORDS: Record<string, { word: string; phonetic: string; partOfSpeech: string; definition: string; exampleSentence: string }[]> = {
  "CET-4": [
    { word: "abandon", phonetic: "/əˈbændən/", partOfSpeech: "v.", definition: "放弃；抛弃", exampleSentence: "They had to abandon the plan." },
    { word: "ability", phonetic: "/əˈbɪləti/", partOfSpeech: "n.", definition: "能力；才能", exampleSentence: "She has the ability to succeed." },
    { word: "abroad", phonetic: "/əˈbrɔːd/", partOfSpeech: "adv.", definition: "在国外；到国外", exampleSentence: "He dreams of studying abroad." },
    { word: "absent", phonetic: "/ˈæbsənt/", partOfSpeech: "adj.", definition: "缺席的；不在的", exampleSentence: "He was absent from school." },
    { word: "absorb", phonetic: "/əbˈzɔːrb/", partOfSpeech: "v.", definition: "吸收；吸引", exampleSentence: "Plants absorb nutrients." },
    { word: "abstract", phonetic: "/ˈæbstrækt/", partOfSpeech: "adj.", definition: "抽象的", exampleSentence: "The concept is too abstract." },
    { word: "abundant", phonetic: "/əˈbʌndənt/", partOfSpeech: "adj.", definition: "丰富的；充裕的", exampleSentence: "We have abundant resources." },
    { word: "academic", phonetic: "/ˌækəˈdemɪk/", partOfSpeech: "adj.", definition: "学术的", exampleSentence: "She has an impressive academic record." },
    { word: "accelerate", phonetic: "/əkˈseləreɪt/", partOfSpeech: "v.", definition: "加速；促进", exampleSentence: "We need to accelerate the process." },
    { word: "access", phonetic: "/ˈækses/", partOfSpeech: "n./v.", definition: "进入；访问", exampleSentence: "Students have access to the library." },
    { word: "accommodate", phonetic: "/əˈkɒmədeɪt/", partOfSpeech: "v.", definition: "容纳；适应", exampleSentence: "The hotel can accommodate 200 guests." },
    { word: "accompany", phonetic: "/əˈkʌmpəni/", partOfSpeech: "v.", definition: "陪伴；伴随", exampleSentence: "I will accompany you." },
    { word: "accomplish", phonetic: "/əˈkʌmplɪʃ/", partOfSpeech: "v.", definition: "完成；实现", exampleSentence: "We accomplished our goal." },
    { word: "account", phonetic: "/əˈkaʊnt/", partOfSpeech: "n.", definition: "账户；说明", exampleSentence: "Please give an account of the events." },
    { word: "accurate", phonetic: "/ˈækjərət/", partOfSpeech: "adj.", definition: "准确的；精确的", exampleSentence: "The data must be accurate." },
  ],
  "CET-6": [
    { word: "abbreviation", phonetic: "/əˌbriːviˈeɪʃn/", partOfSpeech: "n.", definition: "缩写", exampleSentence: "WTO is an abbreviation." },
    { word: "abide", phonetic: "/əˈbaɪd/", partOfSpeech: "v.", definition: "遵守；忍受", exampleSentence: "You must abide by the rules." },
    { word: "abolish", phonetic: "/əˈbɒlɪʃ/", partOfSpeech: "v.", definition: "废除；取消", exampleSentence: "They abolished the old law." },
    { word: "absurd", phonetic: "/əbˈsɜːrd/", partOfSpeech: "adj.", definition: "荒谬的", exampleSentence: "That's an absurd idea." },
    { word: "abundance", phonetic: "/əˈbʌndəns/", partOfSpeech: "n.", definition: "丰富；充裕", exampleSentence: "The region has an abundance of oil." },
    { word: "accessory", phonetic: "/əkˈsesəri/", partOfSpeech: "n.", definition: "附件；配件", exampleSentence: "Phone accessories are sold separately." },
    { word: "accommodation", phonetic: "/əˌkɒməˈdeɪʃn/", partOfSpeech: "n.", definition: "住宿；适应", exampleSentence: "The university provides accommodation." },
    { word: "accountability", phonetic: "/əˌkaʊntəˈbɪləti/", partOfSpeech: "n.", definition: "责任；问责", exampleSentence: "There must be accountability." },
    { word: "acquaint", phonetic: "/əˈkweɪnt/", partOfSpeech: "v.", definition: "使熟悉", exampleSentence: "Let me acquaint you with the facts." },
    { word: "acute", phonetic: "/əˈkjuːt/", partOfSpeech: "adj.", definition: "严重的；敏锐的", exampleSentence: "There is an acute shortage of water." },
    { word: "adhere", phonetic: "/ədˈhɪər/", partOfSpeech: "v.", definition: "遵守；黏附", exampleSentence: "Members must adhere to the code." },
    { word: "adjacent", phonetic: "/əˈdʒeɪsnt/", partOfSpeech: "adj.", definition: "邻近的", exampleSentence: "The hotel is adjacent to the station." },
    { word: "adolescent", phonetic: "/ˌædəˈlesnt/", partOfSpeech: "n.", definition: "青少年", exampleSentence: "Programs for adolescents." },
    { word: "adverse", phonetic: "/ˈædvɜːrs/", partOfSpeech: "adj.", definition: "不利的；有害的", exampleSentence: "The drug has adverse effects." },
    { word: "advocate", phonetic: "/ˈædvəkeɪt/", partOfSpeech: "v.", definition: "提倡；拥护", exampleSentence: "She advocates for reform." },
  ],
  "考研": [
    { word: "abide", phonetic: "/əˈbaɪd/", partOfSpeech: "v.", definition: "遵守；忍受", exampleSentence: "Citizens must abide by the law." },
    { word: "abnormal", phonetic: "/æbˈnɔːrml/", partOfSpeech: "adj.", definition: "反常的", exampleSentence: "The test results were abnormal." },
    { word: "abolish", phonetic: "/əˈbɒlɪʃ/", partOfSpeech: "v.", definition: "废除；取消", exampleSentence: "Slavery was abolished." },
    { word: "abrupt", phonetic: "/əˈbrʌpt/", partOfSpeech: "adj.", definition: "突然的；唐突的", exampleSentence: "The meeting came to an abrupt end." },
    { word: "absorb", phonetic: "/əbˈzɔːrb/", partOfSpeech: "v.", definition: "吸收；吸引", exampleSentence: "The company was absorbed." },
    { word: "abstract", phonetic: "/ˈæbstrækt/", partOfSpeech: "adj./n.", definition: "抽象的；摘要", exampleSentence: "Write an abstract of your paper." },
    { word: "absurd", phonetic: "/əbˈsɜːrd/", partOfSpeech: "adj.", definition: "荒谬的", exampleSentence: "That's the most absurd thing." },
    { word: "abuse", phonetic: "/əˈbjuːz/", partOfSpeech: "v./n.", definition: "滥用；虐待", exampleSentence: "He was arrested for drug abuse." },
    { word: "accelerate", phonetic: "/əkˈseləreɪt/", partOfSpeech: "v.", definition: "加速", exampleSentence: "Inflation continues to accelerate." },
    { word: "accessory", phonetic: "/əkˈsesəri/", partOfSpeech: "n.", definition: "附件；从犯", exampleSentence: "He was charged as an accessory." },
    { word: "acclaim", phonetic: "/əˈkleɪm/", partOfSpeech: "v./n.", definition: "欢呼；称赞", exampleSentence: "The film received critical acclaim." },
    { word: "accommodate", phonetic: "/əˈkɒmədeɪt/", partOfSpeech: "v.", definition: "容纳；适应", exampleSentence: "The economy must accommodate change." },
    { word: "accompany", phonetic: "/əˈkʌmpəni/", partOfSpeech: "v.", definition: "伴随；陪同", exampleSentence: "Lightning accompanies thunder." },
    { word: "accomplish", phonetic: "/əˈkʌmplɪʃ/", partOfSpeech: "v.", definition: "完成；实现", exampleSentence: "We accomplished a great deal." },
    { word: "accord", phonetic: "/əˈkɔːrd/", partOfSpeech: "n./v.", definition: "协议；一致", exampleSentence: "The two sides reached an accord." },
  ],
  "IELTS": [
    { word: "accommodate", phonetic: "/əˈkɒmədeɪt/", partOfSpeech: "v.", definition: "容纳；适应", exampleSentence: "The venue can accommodate 500 people." },
    { word: "acknowledge", phonetic: "/əkˈnɒlɪdʒ/", partOfSpeech: "v.", definition: "承认；确认", exampleSentence: "Please acknowledge receipt." },
    { word: "acquire", phonetic: "/əˈkwaɪər/", partOfSpeech: "v.", definition: "获得；习得", exampleSentence: "Children acquire language naturally." },
    { word: "adequate", phonetic: "/ˈædɪkwət/", partOfSpeech: "adj.", definition: "足够的；适当的", exampleSentence: "The facilities are barely adequate." },
    { word: "advocate", phonetic: "/ˈædvəkeɪt/", partOfSpeech: "v.", definition: "提倡；拥护", exampleSentence: "He advocates for renewable energy." },
    { word: "affect", phonetic: "/əˈfekt/", partOfSpeech: "v.", definition: "影响", exampleSentence: "Climate change affects everyone." },
    { word: "aggregate", phonetic: "/ˈæɡrɪɡət/", partOfSpeech: "n.", definition: "总计；集合", exampleSentence: "The aggregate cost exceeded budget." },
    { word: "allocate", phonetic: "/ˈæləkeɪt/", partOfSpeech: "v.", definition: "分配", exampleSentence: "Resources should be allocated efficiently." },
    { word: "alter", phonetic: "/ˈɔːltər/", partOfSpeech: "v.", definition: "改变；修改", exampleSentence: "Nothing can alter the facts." },
    { word: "alternative", phonetic: "/ɔːlˈtɜːrnətɪv/", partOfSpeech: "n.", definition: "替代选择", exampleSentence: "We need an alternative solution." },
    { word: "ambiguous", phonetic: "/æmˈbɪɡjuəs/", partOfSpeech: "adj.", definition: "模棱两可的", exampleSentence: "The wording is deliberately ambiguous." },
    { word: "amend", phonetic: "/əˈmend/", partOfSpeech: "v.", definition: "修改；修订", exampleSentence: "The constitution was amended." },
    { word: "analogy", phonetic: "/əˈnælədʒi/", partOfSpeech: "n.", definition: "类比；比喻", exampleSentence: "The teacher drew an analogy." },
    { word: "analyse", phonetic: "/ˈænəlaɪz/", partOfSpeech: "v.", definition: "分析；解析", exampleSentence: "We need to analyse the data." },
    { word: "anticipate", phonetic: "/ænˈtɪsɪpeɪt/", partOfSpeech: "v.", definition: "预期；预见", exampleSentence: "We anticipate a large turnout." },
  ],
  "TOEFL": [
    { word: "accelerate", phonetic: "/əkˈseləreɪt/", partOfSpeech: "v.", definition: "加速；促进", exampleSentence: "The car accelerated smoothly." },
    { word: "accumulate", phonetic: "/əˈkjuːmjəleɪt/", partOfSpeech: "v.", definition: "积累", exampleSentence: "Wealth accumulates over time." },
    { word: "ambiguous", phonetic: "/æmˈbɪɡjuəs/", partOfSpeech: "adj.", definition: "模棱两可的", exampleSentence: "The results were ambiguous." },
    { word: "analogy", phonetic: "/əˈnælədʒi/", partOfSpeech: "n.", definition: "类比；比喻", exampleSentence: "He explained by analogy." },
    { word: "anticipate", phonetic: "/ænˈtɪsɪpeɪt/", partOfSpeech: "v.", definition: "预期", exampleSentence: "Sales are expected to rise." },
    { word: "apparent", phonetic: "/əˈpærənt/", partOfSpeech: "adj.", definition: "明显的", exampleSentence: "The apparent cause was clear." },
    { word: "arbitrary", phonetic: "/ˈɑːrbɪtrəri/", partOfSpeech: "adj.", definition: "武断的；任意的", exampleSentence: "The rules seemed arbitrary." },
    { word: "articulate", phonetic: "/ɑːrˈtɪkjuleɪt/", partOfSpeech: "v.", definition: "清晰表达", exampleSentence: "She articulated her vision." },
    { word: "assert", phonetic: "/əˈsɜːrt/", partOfSpeech: "v.", definition: "断言；维护", exampleSentence: "He asserted his innocence." },
    { word: "assess", phonetic: "/əˈses/", partOfSpeech: "v.", definition: "评估", exampleSentence: "Teachers must assess students." },
    { word: "assume", phonetic: "/əˈsjuːm/", partOfSpeech: "v.", definition: "假设；承担", exampleSentence: "She assumed responsibility." },
    { word: "attain", phonetic: "/əˈteɪn/", partOfSpeech: "v.", definition: "达到；获得", exampleSentence: "He attained the rank of professor." },
    { word: "attribute", phonetic: "/əˈtrɪbjuːt/", partOfSpeech: "v.", definition: "归因于", exampleSentence: "He attributes success to hard work." },
    { word: "authentic", phonetic: "/ɔːˈθentɪk/", partOfSpeech: "adj.", definition: "真实的", exampleSentence: "This is an authentic vase." },
    { word: "authority", phonetic: "/ɔːˈθɒrəti/", partOfSpeech: "n.", definition: "权威；当局", exampleSentence: "She is a leading authority." },
  ],
  "GRE": [
    { word: "aberration", phonetic: "/ˌæbəˈreɪʃn/", partOfSpeech: "n.", definition: "异常；偏差", exampleSentence: "The warm weather was an aberration." },
    { word: "abeyance", phonetic: "/əˈbeɪəns/", partOfSpeech: "n.", definition: "暂时搁置", exampleSentence: "The project was in abeyance." },
    { word: "abstemious", phonetic: "/æbˈstiːmiəs/", partOfSpeech: "adj.", definition: "有节制的", exampleSentence: "He led an abstemious life." },
    { word: "acerbic", phonetic: "/əˈsɜːrbɪk/", partOfSpeech: "adj.", definition: "尖刻的", exampleSentence: "Her acerbic wit was famous." },
    { word: "acumen", phonetic: "/ˈækjəmən/", partOfSpeech: "n.", definition: "敏锐；精明", exampleSentence: "Her business acumen was key." },
    { word: "adulterate", phonetic: "/əˈdʌltəreɪt/", partOfSpeech: "v.", definition: "掺杂；掺假", exampleSentence: "The wine was adulterated." },
    { word: "aesthetic", phonetic: "/esˈθetɪk/", partOfSpeech: "adj.", definition: "审美的", exampleSentence: "The design has aesthetic value." },
    { word: "aggrandize", phonetic: "/əˈɡrændaɪz/", partOfSpeech: "v.", definition: "扩大；夸大", exampleSentence: "He sought to aggrandize his power." },
    { word: "alacrity", phonetic: "/əˈlækrəti/", partOfSpeech: "n.", definition: "乐意；欣然", exampleSentence: "She accepted with alacrity." },
    { word: "amalgamate", phonetic: "/əˈmælɡəmeɪt/", partOfSpeech: "v.", definition: "合并；混合", exampleSentence: "The two companies amalgamated." },
    { word: "ameliorate", phonetic: "/əˈmiːliəreɪt/", partOfSpeech: "v.", definition: "改善", exampleSentence: "Conditions were ameliorated." },
    { word: "anachronism", phonetic: "/əˈnækrənɪzəm/", partOfSpeech: "n.", definition: "时代错误", exampleSentence: "The monarchy is an anachronism." },
    { word: "analogous", phonetic: "/əˈnæləɡəs/", partOfSpeech: "adj.", definition: "类似的", exampleSentence: "The situations are analogous." },
    { word: "anomaly", phonetic: "/əˈnɒməli/", partOfSpeech: "n.", definition: "异常", exampleSentence: "The data revealed an anomaly." },
    { word: "antipathy", phonetic: "/ænˈtɪpəθi/", partOfSpeech: "n.", definition: "反感；厌恶", exampleSentence: "He felt antipathy towards his rival." },
  ],
  "计算机": [
    { word: "algorithm", phonetic: "/ˈælɡərɪðəm/", partOfSpeech: "n.", definition: "算法", exampleSentence: "The sorting algorithm is efficient." },
    { word: "API", phonetic: "/ˌeɪ piː ˈaɪ/", partOfSpeech: "n.", definition: "应用程序接口", exampleSentence: "The API returns JSON data." },
    { word: "bandwidth", phonetic: "/ˈbændwɪdθ/", partOfSpeech: "n.", definition: "带宽", exampleSentence: "Video needs high bandwidth." },
    { word: "cache", phonetic: "/kæʃ/", partOfSpeech: "n.", definition: "缓存", exampleSentence: "Clear your browser cache." },
    { word: "compile", phonetic: "/kəmˈpaɪl/", partOfSpeech: "v.", definition: "编译", exampleSentence: "The code must be compiled." },
    { word: "database", phonetic: "/ˈdeɪtəbeɪs/", partOfSpeech: "n.", definition: "数据库", exampleSentence: "Data is stored in a database." },
    { word: "debug", phonetic: "/ˌdiːˈbʌɡ/", partOfSpeech: "v.", definition: "调试", exampleSentence: "I spent hours debugging." },
    { word: "encryption", phonetic: "/ɪnˈkrɪpʃn/", partOfSpeech: "n.", definition: "加密", exampleSentence: "Encryption protects messages." },
    { word: "firewall", phonetic: "/ˈfaɪərwɔːl/", partOfSpeech: "n.", definition: "防火墙", exampleSentence: "The firewall blocked the attack." },
    { word: "framework", phonetic: "/ˈfreɪmwɜːrk/", partOfSpeech: "n.", definition: "框架", exampleSentence: "React is a popular framework." },
    { word: "interface", phonetic: "/ˈɪntərfeɪs/", partOfSpeech: "n.", definition: "接口；界面", exampleSentence: "The UI is intuitive." },
    { word: "kernel", phonetic: "/ˈkɜːrnl/", partOfSpeech: "n.", definition: "内核", exampleSentence: "Linux kernel is open source." },
    { word: "latency", phonetic: "/ˈleɪtənsi/", partOfSpeech: "n.", definition: "延迟", exampleSentence: "Low latency is crucial." },
    { word: "protocol", phonetic: "/ˈprəʊtəkɒl/", partOfSpeech: "n.", definition: "协议", exampleSentence: "HTTP is a web protocol." },
    { word: "repository", phonetic: "/rɪˈpɒzətri/", partOfSpeech: "n.", definition: "仓库；存储库", exampleSentence: "Code is on GitHub." },
  ],
  "电子信息": [
    { word: "amplifier", phonetic: "/ˈæmplɪfaɪər/", partOfSpeech: "n.", definition: "放大器", exampleSentence: "The signal goes through an amplifier." },
    { word: "capacitor", phonetic: "/kəˈpæsɪtər/", partOfSpeech: "n.", definition: "电容器", exampleSentence: "The capacitor stores charge." },
    { word: "circuit", phonetic: "/ˈsɜːrkɪt/", partOfSpeech: "n.", definition: "电路", exampleSentence: "The circuit board is complex." },
    { word: "frequency", phonetic: "/ˈfriːkwənsi/", partOfSpeech: "n.", definition: "频率", exampleSentence: "The radio operates at 2.4 GHz." },
    { word: "transistor", phonetic: "/trænˈzɪstər/", partOfSpeech: "n.", definition: "晶体管", exampleSentence: "Chips contain billions of transistors." },
    { word: "voltage", phonetic: "/ˈvəʊltɪdʒ/", partOfSpeech: "n.", definition: "电压", exampleSentence: "The voltage is 5 volts." },
    { word: "current", phonetic: "/ˈkʌrənt/", partOfSpeech: "n.", definition: "电流", exampleSentence: "AC changes direction periodically." },
    { word: "diode", phonetic: "/ˈdaɪəʊd/", partOfSpeech: "n.", definition: "二极管", exampleSentence: "A diode conducts one way." },
    { word: "impedance", phonetic: "/ɪmˈpiːdns/", partOfSpeech: "n.", definition: "阻抗", exampleSentence: "The impedance is 50 ohms." },
    { word: "antenna", phonetic: "/ænˈtenə/", partOfSpeech: "n.", definition: "天线", exampleSentence: "The antenna receives signals." },
    { word: "sensor", phonetic: "/ˈsensər/", partOfSpeech: "n.", definition: "传感器", exampleSentence: "The sensor detects temperature." },
    { word: "semiconductor", phonetic: "/ˌsemikənˈdʌktər/", partOfSpeech: "n.", definition: "半导体", exampleSentence: "Silicon is a semiconductor." },
    { word: "microcontroller", phonetic: "/ˌmaɪkrəʊkənˈtrəʊlər/", partOfSpeech: "n.", definition: "微控制器", exampleSentence: "ARM microcontrollers are common." },
    { word: "oscillator", phonetic: "/ˈɒsɪleɪtər/", partOfSpeech: "n.", definition: "振荡器", exampleSentence: "The oscillator generates a clock." },
    { word: "resistor", phonetic: "/rɪˈzɪstər/", partOfSpeech: "n.", definition: "电阻器", exampleSentence: "A 10k resistor limits current." },
  ],
};

async function main() {
  console.log("=== Seeding PostgreSQL database ===\n");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.reviewLog.deleteMany();
  await prisma.userWordProgress.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.dailyStreak.deleteMany();
  await prisma.word.deleteMany();
  await prisma.wordBank.deleteMany();
  await prisma.user.deleteMany();

  let totalWords = 0;

  for (const [name, words] of Object.entries(CORE_WORDS)) {
    const descriptions: Record<string, string> = {
      "CET-4": "大学英语四级词汇",
      "CET-6": "大学英语六级词汇",
      "考研": "研究生入学考试词汇",
      "IELTS": "雅思考试词汇",
      "TOEFL": "托福考试词汇",
      "GRE": "GRE 考试词汇",
      "计算机": "计算机专业英语词汇",
      "电子信息": "电子信息工程专业词汇",
    };

    const bank = await prisma.wordBank.create({
      data: {
        name,
        description: descriptions[name] || name,
        wordCount: words.length,
        words: { create: words },
      },
    });
    totalWords += words.length;
    console.log(`Created: ${bank.name} (${bank.wordCount} words)`);
  }

  console.log(`\nDone! ${Object.keys(CORE_WORDS).length} word banks, ${totalWords} total words.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
