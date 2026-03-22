import type { Passage } from "@/types/game";

const PASSAGES: Passage[] = [
  // Easy
  {
    id: "e1",
    text: "The quick brown fox jumps over the lazy dog near the quiet river bank.",
    difficulty: "easy",
    source: "Classic pangram",
    wordCount: 13,
    charCount: 70,
  },
  {
    id: "e2",
    text: "Stars shine bright in the dark night sky above the sleeping city below.",
    difficulty: "easy",
    wordCount: 12,
    charCount: 70,
  },
  {
    id: "e3",
    text: "The warm summer breeze carried the scent of fresh flowers across the garden path.",
    difficulty: "easy",
    wordCount: 14,
    charCount: 80,
  },
  {
    id: "e4",
    text: "Music fills the room as the rain gently taps against the window pane outside.",
    difficulty: "easy",
    wordCount: 14,
    charCount: 76,
  },
  {
    id: "e5",
    text: "A good book and a cup of coffee make for the perfect quiet afternoon at home.",
    difficulty: "easy",
    wordCount: 16,
    charCount: 77,
  },
  {
    id: "e6",
    text: "The ocean waves crashed against the rocky shore as seagulls circled overhead in the wind.",
    difficulty: "easy",
    wordCount: 15,
    charCount: 88,
  },
  // Medium
  {
    id: "m1",
    text: "Technology has fundamentally transformed the way we communicate, work, and interact with each other across the globe.",
    difficulty: "medium",
    wordCount: 18,
    charCount: 115,
  },
  {
    id: "m2",
    text: "The intersection of artificial intelligence and human creativity opens pathways to innovations we never imagined possible.",
    difficulty: "medium",
    wordCount: 17,
    charCount: 118,
  },
  {
    id: "m3",
    text: "Every great achievement begins with the decision to try, followed by persistence through countless setbacks and failures.",
    difficulty: "medium",
    wordCount: 17,
    charCount: 119,
  },
  {
    id: "m4",
    text: "The best software engineers write code that is not only functional but also readable, maintainable, and elegantly structured.",
    difficulty: "medium",
    wordCount: 18,
    charCount: 121,
  },
  {
    id: "m5",
    text: "Building something meaningful requires patience, focus, and the willingness to iterate until every detail feels exactly right.",
    difficulty: "medium",
    wordCount: 17,
    charCount: 122,
  },
  {
    id: "m6",
    text: "The rhythm of keystrokes on a mechanical keyboard is like a symphony of productivity, each click bringing ideas to life.",
    difficulty: "medium",
    wordCount: 20,
    charCount: 119,
  },
  {
    id: "m7",
    text: "In the depths of concentrated work, time seems to dissolve as the mind enters a flow state of pure creative expression.",
    difficulty: "medium",
    wordCount: 21,
    charCount: 119,
  },
  // Hard
  {
    id: "h1",
    text: "The phenomenon of emergent complexity in distributed systems challenges our understanding of how simple rules give rise to sophisticated, self-organizing behaviors across interconnected networks.",
    difficulty: "hard",
    wordCount: 27,
    charCount: 185,
  },
  {
    id: "h2",
    text: "Quantum entanglement, Einstein's 'spooky action at a distance,' demonstrates that particles can be instantaneously correlated regardless of the spatial separation between them.",
    difficulty: "hard",
    wordCount: 25,
    charCount: 175,
  },
  {
    id: "h3",
    text: "The architecture of modern web applications has evolved from monolithic server-rendered pages to sophisticated client-side frameworks that orchestrate complex state management and real-time data synchronization.",
    difficulty: "hard",
    wordCount: 28,
    charCount: 202,
  },
  {
    id: "h4",
    text: "Asynchronous programming paradigms, including promises, generators, and async/await patterns, have revolutionized how developers handle concurrent operations in JavaScript-based applications.",
    difficulty: "hard",
    wordCount: 23,
    charCount: 184,
    category: "code",
  },
  {
    id: "h5",
    text: "The philosophical implications of artificial general intelligence raise profound questions about consciousness, identity, and what it fundamentally means to be a thinking, self-aware entity in the universe.",
    difficulty: "hard",
    wordCount: 29,
    charCount: 197,
  },
  {
    id: "h6",
    text: "Cryptographic hash functions provide the mathematical foundation for blockchain technology, ensuring data integrity through deterministic, collision-resistant transformations of arbitrary-length inputs.",
    difficulty: "hard",
    wordCount: 23,
    charCount: 190,
    category: "code",
  },
  {
    id: "h7",
    text: "The butterfly effect suggests that minute perturbations in a chaotic system's initial conditions can cascade through nonlinear feedback loops, ultimately producing dramatically divergent outcomes.",
    difficulty: "hard",
    wordCount: 25,
    charCount: 186,
  },
  // Code passages
  {
    id: "code1",
    text: "const fetchData = async (url: string) => { const res = await fetch(url); return res.json(); };",
    difficulty: "medium",
    source: "TypeScript",
    category: "code",
    wordCount: 15,
    charCount: 95,
  },
  {
    id: "code2",
    text: "function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }",
    difficulty: "hard",
    source: "JavaScript",
    category: "code",
    wordCount: 17,
    charCount: 137,
  },
  {
    id: "code3",
    text: "for item in items: if item.is_valid(): results.append(process(item))",
    difficulty: "easy",
    source: "Python",
    category: "code",
    wordCount: 8,
    charCount: 69,
  },
  {
    id: "code4",
    text: "export default function App({ children }: { children: React.ReactNode }) { return <main>{children}</main>; }",
    difficulty: "medium",
    source: "React TSX",
    category: "code",
    wordCount: 10,
    charCount: 108,
  },
  {
    id: "code5",
    text: "SELECT users.name, COUNT(orders.id) AS total FROM users LEFT JOIN orders ON users.id = orders.user_id GROUP BY users.name;",
    difficulty: "hard",
    source: "SQL",
    category: "code",
    wordCount: 16,
    charCount: 121,
  },
  // Quotes
  {
    id: "q1",
    text: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking.",
    difficulty: "easy",
    source: "Steve Jobs",
    category: "quotes",
    wordCount: 20,
    charCount: 96,
  },
  {
    id: "q2",
    text: "Move fast and break things. Unless you are breaking stuff, you are not moving fast enough.",
    difficulty: "easy",
    source: "Mark Zuckerberg",
    category: "quotes",
    wordCount: 16,
    charCount: 90,
  },
  {
    id: "q3",
    text: "Any sufficiently advanced technology is indistinguishable from magic, and any technology that does not appear magical is insufficiently advanced.",
    difficulty: "medium",
    source: "Arthur C. Clarke",
    category: "quotes",
    wordCount: 19,
    charCount: 143,
  },
  {
    id: "q4",
    text: "It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change.",
    difficulty: "medium",
    source: "Charles Darwin",
    category: "quotes",
    wordCount: 21,
    charCount: 119,
  },
  {
    id: "q5",
    text: "The best time to plant a tree was twenty years ago. The second best time is now.",
    difficulty: "easy",
    source: "Chinese Proverb",
    category: "quotes",
    wordCount: 16,
    charCount: 80,
  },
  {
    id: "q6",
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit that we cultivate through persistent, deliberate practice.",
    difficulty: "medium",
    source: "Aristotle",
    category: "quotes",
    wordCount: 21,
    charCount: 131,
  },
];

export type PassageCategory = "all" | "prose" | "code" | "quotes";

export function getPassages(difficulty?: "easy" | "medium" | "hard", category?: PassageCategory): Passage[] {
  let pool = PASSAGES;
  if (difficulty) {
    pool = pool.filter((p) => p.difficulty === difficulty);
  }
  if (category && category !== "all") {
    pool = pool.filter((p) => {
      if (category === "prose") return !p.category || p.category === "prose";
      return p.category === category;
    });
  }
  return pool;
}

// Anti-repeat: track recently used passages
const recentIds: string[] = [];
const MAX_RECENT = 5;

export function getRandomPassage(difficulty?: "easy" | "medium" | "hard", category?: PassageCategory): Passage {
  const pool = getPassages(difficulty, category);

  // Filter out recent passages to avoid repeats
  const available = pool.filter((p) => !recentIds.includes(p.id));
  const selection = available.length > 0 ? available : pool;

  const passage = selection[Math.floor(Math.random() * selection.length)];

  recentIds.push(passage.id);
  if (recentIds.length > MAX_RECENT) recentIds.shift();

  return passage;
}

export function getPassageById(id: string): Passage | undefined {
  return PASSAGES.find((p) => p.id === id);
}
