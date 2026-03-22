// Word Drop Engine — Guitar Hero style falling word game

export interface FallingWord {
  id: number;
  text: string;
  lane: number;
  y: number; // 0 = top, 1 = bottom (normalized)
  speed: number; // units per second (normalized)
  state: "falling" | "active" | "hit" | "missed";
  hitTime?: number;
}

export interface WordDropState {
  words: FallingWord[];
  score: number;
  combo: number;
  maxCombo: number;
  hits: number;
  misses: number;
  currentInput: string;
  activeWordId: number | null;
  level: number;
  wordsSpawned: number;
  isPlaying: boolean;
  startTime: number | null;
  lastSpawnTime: number;
}

export type HitRating = "perfect" | "great" | "good" | "miss";

export interface WordDropEffect {
  type: "hit" | "miss" | "combo_milestone" | "level_up";
  rating?: HitRating;
  word?: FallingWord;
  combo?: number;
  level?: number;
}

// Strike zone position (normalized Y)
const STRIKE_ZONE_Y = 0.85;
const STRIKE_ZONE_TOLERANCE = 0.12;
const PERFECT_TOLERANCE = 0.03;
const GREAT_TOLERANCE = 0.06;

// Difficulty scaling
const BASE_SPEED = 0.15; // normalized units per second
const SPEED_INCREMENT = 0.008; // per level
const BASE_SPAWN_INTERVAL = 2200; // ms
const MIN_SPAWN_INTERVAL = 800;
const SPAWN_INTERVAL_DECREASE = 100; // per level
const WORDS_PER_LEVEL = 10;
const NUM_LANES = 4;

// Scoring
const SCORE_PERFECT = 300;
const SCORE_GREAT = 200;
const SCORE_GOOD = 100;
const COMBO_MULTIPLIER = 0.1; // bonus per combo point

// Word pool (short words for fast gameplay)
const WORD_POOL = [
  // 2-3 letter
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
  "her", "was", "one", "our", "out", "get", "has", "him", "his", "how",
  "its", "may", "new", "now", "old", "see", "way", "who", "did", "let",
  // 4 letter
  "that", "with", "have", "this", "will", "your", "from", "they", "been",
  "call", "come", "each", "find", "give", "good", "help", "just", "know",
  "like", "long", "look", "make", "many", "more", "most", "much", "must",
  "name", "over", "part", "plan", "play", "read", "said", "same", "show",
  "side", "some", "such", "take", "tell", "than", "them", "then", "time",
  "turn", "upon", "very", "want", "well", "went", "what", "when", "work",
  // 5-6 letter
  "about", "after", "again", "being", "build", "could", "every", "first",
  "found", "great", "house", "large", "never", "other", "place", "point",
  "right", "small", "sound", "spell", "still", "study", "their", "there",
  "these", "think", "three", "under", "water", "where", "which", "while",
  "world", "would", "write", "start", "quick", "forge", "power", "speed",
  "combo", "laser", "pixel", "turbo", "blaze", "flash", "ultra", "prime",
];

let nextWordId = 0;

export function createWordDropState(): WordDropState {
  return {
    words: [],
    score: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    currentInput: "",
    activeWordId: null,
    level: 1,
    wordsSpawned: 0,
    isPlaying: false,
    startTime: null,
    lastSpawnTime: 0,
  };
}

export function startWordDrop(state: WordDropState, now: number): WordDropState {
  return {
    ...createWordDropState(),
    isPlaying: true,
    startTime: now,
    lastSpawnTime: now,
  };
}

function getRandomWord(): string {
  return WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
}

function getRandomLane(existingWords: FallingWord[]): number {
  // Avoid lanes with words near the top
  const nearTopWords = existingWords.filter((w) => w.y < 0.3 && w.state === "falling");
  const usedLanes = new Set(nearTopWords.map((w) => w.lane));
  const availableLanes = Array.from({ length: NUM_LANES }, (_, i) => i).filter(
    (l) => !usedLanes.has(l)
  );
  if (availableLanes.length === 0) return Math.floor(Math.random() * NUM_LANES);
  return availableLanes[Math.floor(Math.random() * availableLanes.length)];
}

export function updateWordDrop(
  state: WordDropState,
  deltaMs: number,
  now: number
): { state: WordDropState; effects: WordDropEffect[] } {
  if (!state.isPlaying) return { state, effects: [] };

  const effects: WordDropEffect[] = [];
  const dt = deltaMs / 1000;
  const speed = BASE_SPEED + (state.level - 1) * SPEED_INCREMENT;
  const spawnInterval = Math.max(
    MIN_SPAWN_INTERVAL,
    BASE_SPAWN_INTERVAL - (state.level - 1) * SPAWN_INTERVAL_DECREASE
  );

  // Update falling words
  const updatedWords = state.words.map((w) => {
    if (w.state !== "falling" && w.state !== "active") return w;
    return { ...w, y: w.y + speed * dt };
  });

  // Check for missed words (past strike zone)
  let { combo, misses, score } = state;
  const processedWords = updatedWords.map((w) => {
    if ((w.state === "falling" || w.state === "active") && w.y > STRIKE_ZONE_Y + STRIKE_ZONE_TOLERANCE) {
      if (combo > 0) {
        effects.push({ type: "miss", word: w, combo });
      }
      combo = 0;
      misses++;
      return { ...w, state: "missed" as const };
    }
    return w;
  });

  // Remove old hit/missed words (after animation)
  const activeWords = processedWords.filter(
    (w) => !(w.state === "hit" && w.y > 1.2) && !(w.state === "missed" && w.y > 1.2)
  );

  // Spawn new words
  let { wordsSpawned, lastSpawnTime, level } = state;
  if (now - lastSpawnTime >= spawnInterval) {
    const word: FallingWord = {
      id: nextWordId++,
      text: getRandomWord(),
      lane: getRandomLane(activeWords),
      y: -0.05,
      speed,
      state: "falling",
    };
    activeWords.push(word);
    wordsSpawned++;
    lastSpawnTime = now;

    // Level up
    if (wordsSpawned > 0 && wordsSpawned % WORDS_PER_LEVEL === 0) {
      level++;
      effects.push({ type: "level_up", level });
    }
  }

  // Auto-activate: find the word in the strike zone that matches current input start
  let activeWordId = state.activeWordId;
  if (activeWordId !== null) {
    const activeWord = activeWords.find((w) => w.id === activeWordId);
    if (!activeWord || activeWord.state === "missed" || activeWord.state === "hit") {
      activeWordId = null;
    }
  }

  return {
    state: {
      ...state,
      words: activeWords,
      score,
      combo,
      maxCombo: Math.max(state.maxCombo, combo),
      misses,
      activeWordId,
      level,
      wordsSpawned,
      lastSpawnTime,
    },
    effects,
  };
}

export function handleWordDropInput(
  state: WordDropState,
  char: string
): { state: WordDropState; effects: WordDropEffect[] } {
  if (!state.isPlaying) return { state, effects: [] };

  const effects: WordDropEffect[] = [];
  const newInput = state.currentInput + char;

  // Find matching words in the strike zone
  const strikeZoneWords = state.words
    .filter(
      (w) =>
        (w.state === "falling" || w.state === "active") &&
        w.y >= STRIKE_ZONE_Y - STRIKE_ZONE_TOLERANCE &&
        w.y <= STRIKE_ZONE_Y + STRIKE_ZONE_TOLERANCE
    )
    .sort((a, b) => Math.abs(a.y - STRIKE_ZONE_Y) - Math.abs(b.y - STRIKE_ZONE_Y));

  // Check if input matches any word start
  const matchingWord = strikeZoneWords.find((w) => w.text.startsWith(newInput));

  if (!matchingWord) {
    // No match — reset input
    return { state: { ...state, currentInput: "", activeWordId: null }, effects: [] };
  }

  // Mark as active
  const words = state.words.map((w) =>
    w.id === matchingWord.id ? { ...w, state: "active" as const } : w
  );

  // Check if word is complete
  if (newInput === matchingWord.text) {
    // Calculate hit rating based on position
    const distance = Math.abs(matchingWord.y - STRIKE_ZONE_Y);
    let rating: HitRating;
    let scoreGain: number;

    if (distance <= PERFECT_TOLERANCE) {
      rating = "perfect";
      scoreGain = SCORE_PERFECT;
    } else if (distance <= GREAT_TOLERANCE) {
      rating = "great";
      scoreGain = SCORE_GREAT;
    } else {
      rating = "good";
      scoreGain = SCORE_GOOD;
    }

    const combo = state.combo + 1;
    const comboBonus = Math.floor(scoreGain * combo * COMBO_MULTIPLIER);
    scoreGain += comboBonus;

    effects.push({ type: "hit", rating, word: matchingWord, combo });

    if (combo === 10 || combo === 25 || combo === 50 || combo === 100) {
      effects.push({ type: "combo_milestone", combo });
    }

    return {
      state: {
        ...state,
        words: words.map((w) =>
          w.id === matchingWord.id ? { ...w, state: "hit" as const, hitTime: Date.now() } : w
        ),
        currentInput: "",
        activeWordId: null,
        score: state.score + scoreGain,
        combo,
        maxCombo: Math.max(state.maxCombo, combo),
        hits: state.hits + 1,
      },
      effects,
    };
  }

  // Partial match — keep building input
  return {
    state: { ...state, words, currentInput: newInput, activeWordId: matchingWord.id },
    effects: [],
  };
}

export function handleWordDropBackspace(
  state: WordDropState
): { state: WordDropState; effects: WordDropEffect[] } {
  if (!state.currentInput) return { state, effects: [] };
  return {
    state: {
      ...state,
      currentInput: state.currentInput.slice(0, -1),
      activeWordId: state.currentInput.length <= 1 ? null : state.activeWordId,
    },
    effects: [],
  };
}

export function getHitRatingColor(rating: HitRating): string {
  switch (rating) {
    case "perfect": return "text-accent-cyan";
    case "great": return "text-accent-blue";
    case "good": return "text-accent-purple";
    case "miss": return "text-error";
  }
}

export function getWordDropResults(state: WordDropState) {
  const total = state.hits + state.misses;
  return {
    score: state.score,
    hits: state.hits,
    misses: state.misses,
    accuracy: total > 0 ? state.hits / total : 0,
    maxCombo: state.maxCombo,
    level: state.level,
    duration: state.startTime ? Date.now() - state.startTime : 0,
  };
}
