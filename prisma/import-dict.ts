/**
 * Import vocabulary data from kajweb/dict ZIP files into the database.
 * Run: npx tsx prisma/import-dict.ts
 */
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { readFileSync, readdirSync, existsSync, mkdirSync, unlinkSync, rmdirSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

const DICT_DIR = "D:/dict_source/dict-master/book";
const EXTRACT_DIR = "D:/dict_source/extracted";

// Map ZIP name patterns to word bank names and descriptions
const BANK_MAP: Record<string, { name: string; desc: string; base: string }> = {
  "CET4": { name: "CET-4", desc: "大学英语四级词汇", base: "CET-4" },
  "CET6": { name: "CET-6", desc: "大学英语六级词汇", base: "CET-6" },
  "KaoYan": { name: "考研", desc: "研究生入学考试词汇", base: "考研" },
  "IELTS": { name: "IELTS", desc: "雅思考试词汇", base: "IELTS" },
  "TOEFL": { name: "TOEFL", desc: "托福考试词汇", base: "TOEFL" },
  "GRE": { name: "GRE", desc: "GRE 考试词汇", base: "GRE" },
};

interface WordEntry {
  headWord: string;
  content: {
    word: {
      wordHead: string;
      content: {
        usphone?: string;
        ukphone?: string;
        phone?: string;
        trans?: { tranCn: string; pos?: string }[];
        sentence?: { sentences?: { sContent: string }[] };
      };
    };
  };
}

function getPhonetic(entry: WordEntry): string {
  const c = entry.content.word.content;
  const ph = c.usphone || c.ukphone || c.phone || "";
  // Ensure it has /.../ format or add them
  if (!ph) return "";
  const trimmed = ph.trim();
  if (trimmed.startsWith("/")) return trimmed;
  return `/${trimmed}/`;
}

function getDefinition(entry: WordEntry): string {
  const trans = entry.content.word.content.trans;
  if (trans && trans.length > 0) {
    const pos = trans[0].pos ? `${trans[0].pos}. ` : "";
    return pos + trans[0].tranCn;
  }
  return "";
}

function getPartOfSpeech(entry: WordEntry): string {
  const trans = entry.content.word.content.trans;
  if (trans && trans.length > 0 && trans[0].pos) {
    return trans[0].pos + ".";
  }
  return "n.";
}

function getExample(entry: WordEntry): string {
  const sentences = entry.content.word.content.sentence?.sentences;
  if (sentences && sentences.length > 0) {
    // Remove HTML tags
    return sentences[0].sContent.replace(/<[^>]+>/g, "");
  }
  return "";
}

async function importBank(
  bankKey: string,
  bankInfo: { name: string; desc: string; base: string },
  zipFiles: string[]
): Promise<number> {
  console.log(`\n=== Processing ${bankInfo.name} ===`);
  console.log(`  ZIP files: ${zipFiles.length}`);

  const words: { word: string; phonetic: string; partOfSpeech: string; definition: string; exampleSentence: string }[] = [];
  const seen = new Set<string>();

  for (const zipFile of zipFiles) {
    const zipPath = join(DICT_DIR, zipFile);
    const extractSubDir = join(EXTRACT_DIR, bankKey, zipFile.replace(".zip", ""));

    try {
      // Extract
      if (!existsSync(extractSubDir)) {
        mkdirSync(extractSubDir, { recursive: true });
      }
      execSync(`unzip -o "${zipPath}" -d "${extractSubDir}"`, { stdio: "pipe" });

      // Read JSONL files
      const files = readdirSync(extractSubDir);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const filePath = join(extractSubDir, file);
        const content = readFileSync(filePath, "utf-8");
        const lines = content.trim().split("\n");

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const entry: WordEntry = JSON.parse(line);
            const word = entry.headWord?.trim();
            if (!word || seen.has(word.toLowerCase())) continue;

            const definition = getDefinition(entry);
            if (!definition) continue;

            seen.add(word.toLowerCase());
            words.push({
              word,
              phonetic: getPhonetic(entry),
              partOfSpeech: getPartOfSpeech(entry),
              definition,
              exampleSentence: getExample(entry) || "",
            });
          } catch {
            // Skip malformed lines
          }
        }
      }
      console.log(`  ${zipFile}: ${words.length} words so far`);
    } catch (e: any) {
      console.error(`  Error processing ${zipFile}: ${e.message}`);
    }
  }

  // Deduplicate and limit
  const unique = words.filter((w, i) => words.findIndex(x => x.word.toLowerCase() === w.word.toLowerCase()) === i);
  console.log(`  Total unique words: ${unique.length}`);

  // Create word bank
  const bank = await prisma.wordBank.create({
    data: {
      name: bankInfo.name,
      description: bankInfo.desc,
      wordCount: unique.length,
      words: {
        create: unique.map(w => ({
          word: w.word,
          phonetic: w.phonetic,
          partOfSpeech: w.partOfSpeech,
          definition: w.definition,
          exampleSentence: w.exampleSentence || "",
        })),
      },
    },
  });

  console.log(`  Created: ${bank.name} (${bank.wordCount} words)`);
  return unique.length;
}

// Computer science vocabulary (manually curated)
const COMPUTER_WORDS = [
  { word: "algorithm", phonetic: "/ˈælɡərɪðəm/", partOfSpeech: "n.", definition: "算法", exampleSentence: "This sorting algorithm runs in O(n log n) time." },
  { word: "bandwidth", phonetic: "/ˈbændwɪdθ/", partOfSpeech: "n.", definition: "带宽", exampleSentence: "Video streaming requires a lot of bandwidth." },
  { word: "cache", phonetic: "/kæʃ/", partOfSpeech: "n./v.", definition: "缓存；高速缓存", exampleSentence: "Clear your browser cache and try again." },
  { word: "compile", phonetic: "/kəmˈpaɪl/", partOfSpeech: "v.", definition: "编译；汇编", exampleSentence: "The code needs to be compiled before running." },
  { word: "compiler", phonetic: "/kəmˈpaɪlər/", partOfSpeech: "n.", definition: "编译器", exampleSentence: "GCC is a widely used C compiler." },
  { word: "concurrency", phonetic: "/kənˈkʌrənsi/", partOfSpeech: "n.", definition: "并发；并发性", exampleSentence: "Concurrency is a key challenge in distributed systems." },
  { word: "database", phonetic: "/ˈdeɪtəbeɪs/", partOfSpeech: "n.", definition: "数据库", exampleSentence: "All user data is stored in a relational database." },
  { word: "debug", phonetic: "/ˌdiːˈbʌɡ/", partOfSpeech: "v.", definition: "调试；排错", exampleSentence: "I spent hours debugging the code." },
  { word: "deployment", phonetic: "/dɪˈplɔɪmənt/", partOfSpeech: "n.", definition: "部署；发布", exampleSentence: "The deployment went smoothly with zero downtime." },
  { word: "encryption", phonetic: "/ɪnˈkrɪpʃn/", partOfSpeech: "n.", definition: "加密", exampleSentence: "End-to-end encryption protects your messages." },
  { word: "firewall", phonetic: "/ˈfaɪərwɔːl/", partOfSpeech: "n.", definition: "防火墙", exampleSentence: "The firewall blocked the suspicious connection." },
  { word: "framework", phonetic: "/ˈfreɪmwɜːrk/", partOfSpeech: "n.", definition: "框架；架构", exampleSentence: "React is a popular front-end framework." },
  { word: "interface", phonetic: "/ˈɪntərfeɪs/", partOfSpeech: "n.", definition: "接口；界面", exampleSentence: "The user interface is intuitive and clean." },
  { word: "iteration", phonetic: "/ˌɪtəˈreɪʃn/", partOfSpeech: "n.", definition: "迭代；重复", exampleSentence: "Each iteration of the loop processes one item." },
  { word: "kernel", phonetic: "/ˈkɜːrnl/", partOfSpeech: "n.", definition: "内核；核心", exampleSentence: "Linux kernel development is community-driven." },
  { word: "latency", phonetic: "/ˈleɪtənsi/", partOfSpeech: "n.", definition: "延迟；潜伏期", exampleSentence: "Low latency is crucial for real-time applications." },
  { word: "middleware", phonetic: "/ˈmɪdlweər/", partOfSpeech: "n.", definition: "中间件", exampleSentence: "The middleware handles authentication and logging." },
  { word: "protocol", phonetic: "/ˈprəʊtəkɒl/", partOfSpeech: "n.", definition: "协议；规程", exampleSentence: "HTTP is the protocol used for web communication." },
  { word: "refactor", phonetic: "/ˌriːˈfæktər/", partOfSpeech: "v.", definition: "重构（代码）", exampleSentence: "We need to refactor this legacy code." },
  { word: "repository", phonetic: "/rɪˈpɒzətri/", partOfSpeech: "n.", definition: "仓库；存储库", exampleSentence: "The code is hosted in a Git repository." },
  { word: "scalability", phonetic: "/ˌskeɪləˈbɪləti/", partOfSpeech: "n.", definition: "可扩展性", exampleSentence: "The architecture was designed for scalability." },
  { word: "throughput", phonetic: "/ˈθruːpʊt/", partOfSpeech: "n.", definition: "吞吐量；处理量", exampleSentence: "The system can handle high throughput of requests." },
  { word: "virtualization", phonetic: "/ˌvɜːrtʃuəlaɪˈzeɪʃn/", partOfSpeech: "n.", definition: "虚拟化", exampleSentence: "Virtualization allows multiple OS on one server." },
  { word: "backup", phonetic: "/ˈbækʌp/", partOfSpeech: "n./v.", definition: "备份", exampleSentence: "Always backup your data before upgrading." },
  { word: "authentication", phonetic: "/ɔːˌθentɪˈkeɪʃn/", partOfSpeech: "n.", definition: "认证；验证", exampleSentence: "Two-factor authentication adds extra security." },
  { word: "decryption", phonetic: "/diːˈkrɪpʃn/", partOfSpeech: "n.", definition: "解密；解码", exampleSentence: "Only the intended recipient can perform decryption." },
  { word: "redundancy", phonetic: "/rɪˈdʌndənsi/", partOfSpeech: "n.", definition: "冗余；备份", exampleSentence: "Data redundancy ensures reliability." },
  { word: "semaphore", phonetic: "/ˈseməfɔːr/", partOfSpeech: "n.", definition: "信号量", exampleSentence: "Semaphores prevent race conditions in multithreading." },
  { word: "serialize", phonetic: "/ˈsɪəriəlaɪz/", partOfSpeech: "v.", definition: "序列化；连载", exampleSentence: "JSON is a common format to serialize data." },
  { word: "tokenize", phonetic: "/ˈtəʊkənaɪz/", partOfSpeech: "v.", definition: "标记化；分词", exampleSentence: "The parser tokenizes the input into words." },
  { word: "asynchronous", phonetic: "/eɪˈsɪŋkrənəs/", partOfSpeech: "adj.", definition: "异步的；非同步的", exampleSentence: "Asynchronous programming avoids blocking the main thread." },
  { word: "binary", phonetic: "/ˈbaɪnəri/", partOfSpeech: "adj./n.", definition: "二进制的；二元", exampleSentence: "Computers store data in binary format." },
  { word: "boolean", phonetic: "/ˈbuːliən/", partOfSpeech: "n./adj.", definition: "布尔值；布尔逻辑的", exampleSentence: "A boolean expression evaluates to true or false." },
  { word: "buffer", phonetic: "/ˈbʌfər/", partOfSpeech: "n./v.", definition: "缓冲区；缓冲", exampleSentence: "The video is buffering, please wait a moment." },
  { word: "callback", phonetic: "/ˈkɔːlbæk/", partOfSpeech: "n.", definition: "回调函数", exampleSentence: "The callback function is invoked when the operation completes." },
  { word: "class", phonetic: "/klɑːs/", partOfSpeech: "n.", definition: "类（面向对象编程）", exampleSentence: "Each object is an instance of a class." },
  { word: "client", phonetic: "/ˈklaɪənt/", partOfSpeech: "n.", definition: "客户端", exampleSentence: "The client sends a request to the server." },
  { word: "cloud computing", phonetic: "/klaʊd kəmˈpjuːtɪŋ/", partOfSpeech: "n.", definition: "云计算", exampleSentence: "Cloud computing enables on-demand access to computing resources." },
  { word: "cluster", phonetic: "/ˈklʌstər/", partOfSpeech: "n./v.", definition: "集群；聚集", exampleSentence: "The application runs on a Kubernetes cluster." },
  { word: "compression", phonetic: "/kəmˈpreʃn/", partOfSpeech: "n.", definition: "压缩", exampleSentence: "Data compression reduces storage requirements." },
  { word: "container", phonetic: "/kənˈteɪnər/", partOfSpeech: "n.", definition: "容器", exampleSentence: "Docker containers package applications with their dependencies." },
  { word: "cryptography", phonetic: "/krɪpˈtɒɡrəfi/", partOfSpeech: "n.", definition: "密码学；密码术", exampleSentence: "Cryptography is essential for secure communication." },
  { word: "deadlock", phonetic: "/ˈdedlɒk/", partOfSpeech: "n.", definition: "死锁", exampleSentence: "The two threads entered a deadlock waiting for each other." },
  { word: "dependency", phonetic: "/dɪˈpendənsi/", partOfSpeech: "n.", definition: "依赖；依赖项", exampleSentence: "The project has several external dependencies." },
  { word: "distributed", phonetic: "/dɪˈstrɪbjuːtɪd/", partOfSpeech: "adj.", definition: "分布式的", exampleSentence: "Distributed systems share workloads across multiple nodes." },
  { word: "endpoint", phonetic: "/ˈendpɔɪnt/", partOfSpeech: "n.", definition: "端点；终端", exampleSentence: "The API endpoint returns user data in JSON format." },
  { word: "exception", phonetic: "/ɪkˈsepʃn/", partOfSpeech: "n.", definition: "异常；例外", exampleSentence: "The program threw an exception when the file was not found." },
  { word: "gateway", phonetic: "/ˈɡeɪtweɪ/", partOfSpeech: "n.", definition: "网关", exampleSentence: "The API gateway routes requests to the appropriate service." },
  { word: "hash", phonetic: "/hæʃ/", partOfSpeech: "n./v.", definition: "哈希；散列", exampleSentence: "Passwords are stored as cryptographic hashes." },
  { word: "heap", phonetic: "/hiːp/", partOfSpeech: "n.", definition: "堆（内存区域）", exampleSentence: "Objects are allocated on the heap in most languages." },
  { word: "inheritance", phonetic: "/ɪnˈherɪtəns/", partOfSpeech: "n.", definition: "继承（面向对象）", exampleSentence: "Code reuse is achieved through inheritance in OOP." },
  { word: "instance", phonetic: "/ˈɪnstəns/", partOfSpeech: "n.", definition: "实例", exampleSentence: "Create a new instance of the class before using it." },
  { word: "load balancing", phonetic: "/loʊd ˈbælənsɪŋ/", partOfSpeech: "n.", definition: "负载均衡", exampleSentence: "Load balancing distributes traffic across multiple servers." },
  { word: "metadata", phonetic: "/ˈmetədeɪtə/", partOfSpeech: "n.", definition: "元数据", exampleSentence: "The file metadata includes creation date and author." },
  { word: "namespace", phonetic: "/ˈneɪmspeɪs/", partOfSpeech: "n.", definition: "命名空间", exampleSentence: "Use namespaces to organize classes logically." },
  { word: "node", phonetic: "/nəʊd/", partOfSpeech: "n.", definition: "节点", exampleSentence: "Each node in the cluster runs independently." },
  { word: "object", phonetic: "/ˈɒbdʒɪkt/", partOfSpeech: "n.", definition: "对象", exampleSentence: "An object encapsulates both data and behavior." },
  { word: "optimization", phonetic: "/ˌɒptɪmaɪˈzeɪʃn/", partOfSpeech: "n.", definition: "优化", exampleSentence: "Performance optimization is an ongoing process." },
  { word: "overload", phonetic: "/ˌəʊvəˈləʊd/", partOfSpeech: "v./n.", definition: "重载；过载", exampleSentence: "You can overload methods with different parameter types." },
  { word: "parse", phonetic: "/pɑːrz/", partOfSpeech: "v.", definition: "解析；语法分析", exampleSentence: "The compiler parses the source code into an AST." },
  { word: "patch", phonetic: "/pætʃ/", partOfSpeech: "n./v.", definition: "补丁；修补", exampleSentence: "Install the latest security patch immediately." },
  { word: "payload", phonetic: "/ˈpeɪləʊd/", partOfSpeech: "n.", definition: "有效载荷；数据负载", exampleSentence: "The request payload contains the user credentials." },
  { word: "pointer", phonetic: "/ˈpɔɪntər/", partOfSpeech: "n.", definition: "指针", exampleSentence: "A null pointer dereference causes a segmentation fault." },
  { word: "polymorphism", phonetic: "/ˌpɒlɪˈmɔːrfɪzəm/", partOfSpeech: "n.", definition: "多态性", exampleSentence: "Polymorphism allows objects of different types to be treated uniformly." },
  { word: "query", phonetic: "/ˈkwɪəri/", partOfSpeech: "n./v.", definition: "查询", exampleSentence: "Execute a database query to retrieve the results." },
  { word: "recursion", phonetic: "/rɪˈkɜːrʒn/", partOfSpeech: "n.", definition: "递归", exampleSentence: "Recursion solves problems by breaking them into smaller subproblems." },
  { word: "sandbox", phonetic: "/ˈsændbɒks/", partOfSpeech: "n.", definition: "沙箱；隔离环境", exampleSentence: "Run untrusted code in a sandbox for security." },
  { word: "schema", phonetic: "/ˈskiːmə/", partOfSpeech: "n.", definition: "模式；架构", exampleSentence: "The database schema defines table structures." },
  { word: "singleton", phonetic: "/ˈsɪŋɡltən/", partOfSpeech: "n.", definition: "单例模式", exampleSentence: "The singleton pattern ensures only one instance exists." },
  { word: "stack", phonetic: "/stæk/", partOfSpeech: "n.", definition: "栈；堆栈", exampleSentence: "Local variables are stored on the call stack." },
  { word: "thread", phonetic: "/θred/", partOfSpeech: "n.", definition: "线程", exampleSentence: "Multi-threaded programs can run tasks concurrently." },
  { word: "timeout", phonetic: "/ˈtaɪmaʊt/", partOfSpeech: "n.", definition: "超时", exampleSentence: "The connection failed due to a network timeout." },
  { word: "version control", phonetic: "/ˈvɜːrʒn kənˈtrəʊl/", partOfSpeech: "n.", definition: "版本控制", exampleSentence: "Git is the most popular version control system." },
];

const EE_WORDS = [
  { word: "amplifier", phonetic: "/ˈæmplɪfaɪər/", partOfSpeech: "n.", definition: "放大器", exampleSentence: "The audio signal passes through a power amplifier." },
  { word: "capacitor", phonetic: "/kəˈpæsɪtər/", partOfSpeech: "n.", definition: "电容器", exampleSentence: "The capacitor stores electrical charge between its plates." },
  { word: "circuit", phonetic: "/ˈsɜːrkɪt/", partOfSpeech: "n.", definition: "电路；回路", exampleSentence: "The printed circuit board contains multiple components." },
  { word: "frequency", phonetic: "/ˈfriːkwənsi/", partOfSpeech: "n.", definition: "频率", exampleSentence: "The signal operates at a frequency of 2.4 GHz." },
  { word: "transistor", phonetic: "/trænˈzɪstər/", partOfSpeech: "n.", definition: "晶体管", exampleSentence: "Modern processors contain billions of transistors." },
  { word: "impedance", phonetic: "/ɪmˈpiːdns/", partOfSpeech: "n.", definition: "阻抗", exampleSentence: "The impedance of the circuit is 50 ohms." },
  { word: "inductor", phonetic: "/ɪnˈdʌktər/", partOfSpeech: "n.", definition: "电感器", exampleSentence: "An inductor resists changes in current flow." },
  { word: "voltage", phonetic: "/ˈvəʊltɪdʒ/", partOfSpeech: "n.", definition: "电压", exampleSentence: "The voltage across the resistor is 5 volts." },
  { word: "current", phonetic: "/ˈkʌrənt/", partOfSpeech: "n.", definition: "电流", exampleSentence: "Alternating current changes direction periodically." },
  { word: "resistor", phonetic: "/rɪˈzɪstər/", partOfSpeech: "n.", definition: "电阻器", exampleSentence: "A 10k ohm resistor limits the current flow." },
  { word: "diode", phonetic: "/ˈdaɪəʊd/", partOfSpeech: "n.", definition: "二极管", exampleSentence: "A diode allows current to flow in one direction only." },
  { word: "oscillator", phonetic: "/ˈɒsɪleɪtər/", partOfSpeech: "n.", definition: "振荡器", exampleSentence: "The crystal oscillator generates a stable clock signal." },
  { word: "modulation", phonetic: "/ˌmɒdʒuˈleɪʃn/", partOfSpeech: "n.", definition: "调制", exampleSentence: "Frequency modulation is used in FM radio broadcasting." },
  { word: "demodulation", phonetic: "/diːˌmɒdʒuˈleɪʃn/", partOfSpeech: "n.", definition: "解调", exampleSentence: "The receiver performs demodulation of the signal." },
  { word: "antenna", phonetic: "/ænˈtenə/", partOfSpeech: "n.", definition: "天线", exampleSentence: "The antenna receives electromagnetic waves from space." },
  { word: "waveform", phonetic: "/ˈweɪvfɔːrm/", partOfSpeech: "n.", definition: "波形", exampleSentence: "The oscilloscope displays the signal waveform clearly." },
  { word: "attenuation", phonetic: "/əˌtenjuˈeɪʃn/", partOfSpeech: "n.", definition: "衰减", exampleSentence: "Signal attenuation increases with transmission distance." },
  { word: "rectifier", phonetic: "/ˈrektɪfaɪər/", partOfSpeech: "n.", definition: "整流器", exampleSentence: "The rectifier converts alternating current to direct current." },
  { word: "microcontroller", phonetic: "/ˌmaɪkrəʊkənˈtrəʊlər/", partOfSpeech: "n.", definition: "微控制器", exampleSentence: "The device is powered by an ARM microcontroller." },
  { word: "propagation", phonetic: "/ˌprɒpəˈɡeɪʃn/", partOfSpeech: "n.", definition: "传播；传输", exampleSentence: "Radio wave propagation is affected by atmospheric conditions." },
  { word: "interference", phonetic: "/ˌɪntərˈfɪərəns/", partOfSpeech: "n.", definition: "干扰；干涉", exampleSentence: "Electromagnetic interference disrupted the communication signal." },
  { word: "grounding", phonetic: "/ˈɡraʊndɪŋ/", partOfSpeech: "n.", definition: "接地", exampleSentence: "Proper grounding prevents electrical shock hazards." },
  { word: "bandpass", phonetic: "/ˈbændpæs/", partOfSpeech: "n.", definition: "带通；带通滤波器", exampleSentence: "A bandpass filter selects specific frequency ranges." },
  { word: "transceiver", phonetic: "/trænˈsiːvər/", partOfSpeech: "n.", definition: "收发器", exampleSentence: "The transceiver handles both transmission and reception." },
  { word: "telemetry", phonetic: "/təˈlemətri/", partOfSpeech: "n.", definition: "遥测；遥感技术", exampleSentence: "Telemetry data is continuously sent from the satellite." },
  { word: "sensor", phonetic: "/ˈsensər/", partOfSpeech: "n.", definition: "传感器", exampleSentence: "The temperature sensor triggers the cooling fan." },
  { word: "actuator", phonetic: "/ˈæktʃueɪtər/", partOfSpeech: "n.", definition: "执行器；驱动器", exampleSentence: "The actuator converts electrical signals into mechanical motion." },
  { word: "semiconductor", phonetic: "/ˌsemikənˈdʌktər/", partOfSpeech: "n.", definition: "半导体", exampleSentence: "Silicon is the most widely used semiconductor material." },
  { word: "resonance", phonetic: "/ˈrezənəns/", partOfSpeech: "n.", definition: "共振；谐振", exampleSentence: "The circuit operates at its resonant frequency." },
  { word: "filter", phonetic: "/ˈfɪltər/", partOfSpeech: "n./v.", definition: "滤波器；过滤", exampleSentence: "A low-pass filter removes high-frequency noise." },
  { word: "multiplexer", phonetic: "/ˈmʌltɪpleksər/", partOfSpeech: "n.", definition: "多路复用器", exampleSentence: "The multiplexer combines multiple signals into one." },
  { word: "oscilloscope", phonetic: "/ɒˈsɪləskəʊp/", partOfSpeech: "n.", definition: "示波器", exampleSentence: "The oscilloscope visualizes the electrical waveform." },
  { word: "transformer", phonetic: "/trænsˈfɔːrmər/", partOfSpeech: "n.", definition: "变压器", exampleSentence: "The transformer steps down the voltage for household use." },
  { word: "conductor", phonetic: "/kənˈdʌktər/", partOfSpeech: "n.", definition: "导体", exampleSentence: "Copper is an excellent electrical conductor." },
  { word: "insulator", phonetic: "/ˈɪnsjuleɪtər/", partOfSpeech: "n.", definition: "绝缘体", exampleSentence: "Rubber is commonly used as an electrical insulator." },
  { word: "electrode", phonetic: "/ɪˈlektrəʊd/", partOfSpeech: "n.", definition: "电极", exampleSentence: "The electrodes are placed at opposite ends of the cell." },
  { word: "radar", phonetic: "/ˈreɪdɑːr/", partOfSpeech: "n.", definition: "雷达", exampleSentence: "Radar systems detect objects using radio waves." },
  { word: "transmission", phonetic: "/trænsˈmɪʃn/", partOfSpeech: "n.", definition: "传输；传送", exampleSentence: "Digital transmission is less prone to interference." },
  { word: "receiver", phonetic: "/rɪˈsiːvər/", partOfSpeech: "n.", definition: "接收器", exampleSentence: "The radio receiver picks up signals from the antenna." },
  { word: "transmitter", phonetic: "/trænsˈmɪtər/", partOfSpeech: "n.", definition: "发射器；发射机", exampleSentence: "The transmitter broadcasts the signal across the city." },
  { word: "wavelength", phonetic: "/ˈweɪvleŋθ/", partOfSpeech: "n.", definition: "波长", exampleSentence: "Different colors of light have different wavelengths." },
  { word: "amplitude", phonetic: "/ˈæmplɪtjuːd/", partOfSpeech: "n.", definition: "振幅；幅度", exampleSentence: "The amplitude of the signal determines its loudness." },
  { word: "spectrum", phonetic: "/ˈspektrəm/", partOfSpeech: "n.", definition: "频谱；光谱", exampleSentence: "The electromagnetic spectrum covers all wavelengths of light." },
  { word: "bandwidth", phonetic: "/ˈbændwɪdθ/", partOfSpeech: "n.", definition: "带宽", exampleSentence: "Higher bandwidth enables faster data transmission." },
  { word: "impedance matching", phonetic: "/ɪmˈpiːdns ˈmætʃɪŋ/", partOfSpeech: "n.", definition: "阻抗匹配", exampleSentence: "Impedance matching maximizes power transfer in the circuit." },
  { word: "analog", phonetic: "/ˈænəlɒɡ/", partOfSpeech: "adj./n.", definition: "模拟的；模拟信号", exampleSentence: "Analog signals vary continuously over time." },
  { word: "digital", phonetic: "/ˈdɪdʒɪtl/", partOfSpeech: "adj.", definition: "数字的", exampleSentence: "Digital signals represent data as discrete values." },
  { word: "sampling", phonetic: "/ˈsɑːmplɪŋ/", partOfSpeech: "n.", definition: "采样；取样", exampleSentence: "The sampling rate determines audio quality." },
  { word: "quantization", phonetic: "/ˌkwɒntaɪˈzeɪʃn/", partOfSpeech: "n.", definition: "量化", exampleSentence: "Quantization converts continuous values into discrete levels." },
  { word: "feedback", phonetic: "/ˈfiːdbæk/", partOfSpeech: "n.", definition: "反馈", exampleSentence: "Negative feedback stabilizes the amplifier circuit." },
  { word: "integrated circuit", phonetic: "/ˈɪntɪɡreɪtɪd ˈsɜːrkɪt/", partOfSpeech: "n.", definition: "集成电路", exampleSentence: "Integrated circuits pack millions of components onto a single chip." },
  { word: "signal processing", phonetic: "/ˈsɪɡnəl ˈprəʊsesɪŋ/", partOfSpeech: "n.", definition: "信号处理", exampleSentence: "Digital signal processing enables advanced audio effects." },
  { word: "electromagnetic", phonetic: "/ɪˌlektrəʊmæɡˈnetɪk/", partOfSpeech: "adj.", definition: "电磁的", exampleSentence: "Electromagnetic waves travel at the speed of light." },
  { word: "phase", phonetic: "/feɪz/", partOfSpeech: "n.", definition: "相位；阶段", exampleSentence: "The two signals are 180 degrees out of phase." },
  { word: "harmonic", phonetic: "/hɑːrˈmɒnɪk/", partOfSpeech: "n./adj.", definition: "谐波；和谐的", exampleSentence: "Higher harmonics can cause unwanted distortion." },
  { word: "noise", phonetic: "/nɔɪz/", partOfSpeech: "n.", definition: "噪声；噪音", exampleSentence: "Signal-to-noise ratio measures the quality of a signal." },
  { word: "filtering", phonetic: "/ˈfɪltərɪŋ/", partOfSpeech: "n.", definition: "滤波；过滤", exampleSentence: "Digital filtering removes unwanted frequency components." },
  { word: "decibel", phonetic: "/ˈdesɪbel/", partOfSpeech: "n.", definition: "分贝", exampleSentence: "Sound intensity is measured in decibels." },
  { word: "firmware", phonetic: "/ˈfɜːrmweər/", partOfSpeech: "n.", definition: "固件；韧体", exampleSentence: "Updating the firmware fixed several hardware bugs." },
];

async function main() {
  console.log("=== Vocabulary Import from kajweb/dict ===\n");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.reviewLog.deleteMany();
  await prisma.userWordProgress.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.dailyStreak.deleteMany();
  await prisma.word.deleteMany();
  await prisma.wordBank.deleteMany();
  await prisma.user.deleteMany();
  console.log("Cleared.\n");

  // Create extract dir
  if (!existsSync(EXTRACT_DIR)) {
    mkdirSync(EXTRACT_DIR, { recursive: true });
  }

  let grandTotal = 0;

  // Process each exam word bank from ZIP files
  for (const [bankKey, bankInfo] of Object.entries(BANK_MAP)) {
    const zipFiles = readdirSync(DICT_DIR).filter(
      (f) => f.endsWith(".zip") && f.toUpperCase().includes(bankKey.toUpperCase())
    );
    if (zipFiles.length > 0) {
      const count = await importBank(bankKey, bankInfo, zipFiles);
      grandTotal += count;
    }
  }

  // Import computer science words
  console.log(`\n=== Processing 计算机 ===`);
  const csBank = await prisma.wordBank.create({
    data: {
      name: "计算机",
      description: "计算机专业英语词汇",
      wordCount: COMPUTER_WORDS.length,
      words: { create: COMPUTER_WORDS },
    },
  });
  grandTotal += COMPUTER_WORDS.length;
  console.log(`  Created: ${csBank.name} (${csBank.wordCount} words)`);

  // Import EE words
  console.log(`\n=== Processing 电子信息 ===`);
  const eeBank = await prisma.wordBank.create({
    data: {
      name: "电子信息",
      description: "电子信息工程专业词汇",
      wordCount: EE_WORDS.length,
      words: { create: EE_WORDS },
    },
  });
  grandTotal += EE_WORDS.length;
  console.log(`  Created: ${eeBank.name} (${eeBank.wordCount} words)`);

  console.log(`\n=== IMPORT COMPLETE ===`);
  console.log(`Total: 8 word banks, ${grandTotal} words`);
}

main()
  .catch((e) => {
    console.error("FATAL:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
