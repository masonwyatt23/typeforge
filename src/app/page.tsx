"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Logo } from "@/components/brand/Logo";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStatsStore } from "@/stores/stats-store";
import { cn } from "@/lib/utils/cn";

// ============================================
// ANIMATED BACKGROUND (client-only particles to avoid hydration mismatch)
// ============================================
function AnimatedBackground() {
  const [particles, setParticles] = useState<
    Array<{ left: number; top: number; yOffset: number; duration: number; delay: number }>
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 30 }, () => ({
        left: 5 + Math.random() * 90,
        top: 5 + Math.random() * 90,
        yOffset: -20 - Math.random() * 20,
        duration: 8 + Math.random() * 12,
        delay: Math.random() * -10,
      }))
    );
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#080c18] via-bg-primary to-[#0a0f1e]" />
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse,_rgba(34,211,238,0.07)_0%,_transparent_60%)]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[400px] bg-[radial-gradient(ellipse,_rgba(168,85,247,0.05)_0%,_transparent_60%)]" />
      <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-[radial-gradient(ellipse,_rgba(59,130,246,0.04)_0%,_transparent_60%)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-[2px] h-[2px] rounded-full bg-accent-cyan/30"
          style={{ left: `${p.left}%`, top: `${p.top}%` }}
          animate={{ y: [0, p.yOffset, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ============================================
// LIVE TYPING DEMO - Interactive hero element
// ============================================
function LiveTypingDemo() {
  const passages = [
    "the quick brown fox jumps over the lazy dog",
    "every great journey begins with a single keystroke",
    "forge your skills in the fires of competition",
    "speed and accuracy are the pillars of mastery",
  ];
  const [passageIndex, setPassageIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wpm, setWpm] = useState(0);
  const text = passages[passageIndex];

  useEffect(() => {
    if (charIndex >= text.length) {
      const timeout = setTimeout(() => {
        setCharIndex(0);
        setCombo(0);
        setWpm(0);
        setPassageIndex((i) => (i + 1) % passages.length);
      }, 1500);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => {
      setCharIndex((i) => i + 1);
      setCombo((c) => c + 1);
      setWpm(charIndex > 3 ? Math.round(55 + Math.random() * 30) : 0);
    }, 45 + Math.random() * 55);
    return () => clearTimeout(timeout);
  }, [charIndex, text.length, passages.length]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <GlassPanel intense className="relative overflow-hidden">
        {/* Mini HUD */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-4">
            <span className="font-[family-name:var(--font-accent)] text-xl font-bold text-accent-cyan tabular-nums">
              {wpm} <span className="text-xs text-text-ghost font-normal">WPM</span>
            </span>
            {combo > 5 && (
              <motion.span
                key={combo}
                initial={{ scale: 1.3, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-[family-name:var(--font-accent)] text-sm font-bold text-accent-purple tabular-nums"
              >
                {combo}x
              </motion.span>
            )}
          </div>
          <span className="font-[family-name:var(--font-accent)] text-sm font-bold text-success tabular-nums">
            100%
          </span>
        </div>

        {/* Progress bar */}
        <div className="mx-5 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-cyan to-accent-blue rounded-full"
            animate={{ width: `${(charIndex / text.length) * 100}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>

        {/* Typing text */}
        <div className="px-5 py-5 font-[family-name:var(--font-mono)] text-lg md:text-xl leading-[2] select-none">
          {text.split("").map((char, i) => (
            <span
              key={`${passageIndex}-${i}`}
              className={cn(
                "transition-colors duration-75",
                i < charIndex ? "text-accent-cyan" : "text-text-ghost",
                i === charIndex && "border-l-2 border-accent-cyan ml-[-1px]"
              )}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

// ============================================
// KEYBOARD VISUAL
// ============================================
function KeyboardVisual() {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const keys = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ];

  useEffect(() => {
    const allKeys = keys.flat();
    const interval = setInterval(() => {
      const randomKey = allKeys[Math.floor(Math.random() * allKeys.length)];
      setActiveKeys(new Set([randomKey]));
      setTimeout(() => setActiveKeys(new Set()), 150);
    }, 300 + Math.random() * 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-1.5 opacity-40">
      {keys.map((row, ri) => (
        <div key={ri} className="flex gap-1.5" style={{ paddingLeft: ri * 12 }}>
          {row.map((key) => (
            <div
              key={key}
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-[family-name:var(--font-mono)] transition-all duration-100 border",
                activeKeys.has(key)
                  ? "bg-accent-cyan/20 border-accent-cyan/40 text-accent-cyan scale-95 shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                  : "bg-white/[0.02] border-white/[0.06] text-text-ghost"
              )}
            >
              {key}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================
// FEATURE CARDS
// ============================================
const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    title: "Combo System",
    description: "Chain correct keystrokes to build combos. Hit 100x for UNSTOPPABLE mode with full visual chaos.",
    gradient: "from-accent-cyan to-accent-blue",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
    title: "AI-Powered",
    description: "Generate custom passages on any topic. Get personalized coaching tips after every session.",
    gradient: "from-accent-purple to-accent-pink",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
      </svg>
    ),
    title: "Immersive Audio",
    description: "Synthesized keystroke sounds, combo chimes, and satisfying feedback on every action.",
    gradient: "from-accent-blue to-accent-purple",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.048 8.287 8.287 0 0 0 9 9.6a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
      </svg>
    ),
    title: "Particle Effects",
    description: "Neon particle bursts on every keystroke. Screen shake on errors. Flow state visual escalation.",
    gradient: "from-accent-pink to-accent-cyan",
  },
];

// ============================================
// STAT COUNTER
// ============================================
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1500;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="font-[family-name:var(--font-accent)] text-4xl font-bold text-text-primary tabular-nums">
      {count}{suffix}
    </span>
  );
}

// ============================================
// MODE CARDS
// ============================================
const modes = [
  {
    name: "Solo Practice",
    description: "Curated passages across three difficulties",
    href: "/practice",
    available: true,
    accent: "from-accent-cyan to-accent-blue",
    glowColor: "rgba(34, 211, 238, 0.2)",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
  },
  {
    name: "AI Passages",
    description: "Custom passages on any topic you choose",
    href: "/practice?mode=ai",
    available: true,
    accent: "from-accent-purple to-accent-pink",
    glowColor: "rgba(168, 85, 247, 0.2)",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
  },
  {
    name: "Daily Challenge",
    description: "One passage. One chance. Global leaderboard.",
    href: "/daily",
    available: false,
    accent: "from-accent-blue to-accent-purple",
    glowColor: "rgba(59, 130, 246, 0.2)",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
  {
    name: "Quick Race",
    description: "Real-time typing races against others",
    href: "/race",
    available: false,
    accent: "from-accent-pink to-accent-cyan",
    glowColor: "rgba(236, 72, 153, 0.2)",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
];

// ============================================
// MAIN PAGE
// ============================================
export default function HomePage() {
  const router = useRouter();
  const stats = useStatsStore();

  // Enter to start
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") router.push("/practice");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  return (
    <main className="relative">
      <AnimatedBackground />

      {/* ===== HERO SECTION ===== */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4"
        >
          <Logo size="hero" animated showIcon />
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-text-secondary text-lg md:text-xl text-center max-w-md mb-10 tracking-wide"
        >
          Forge your typing skills in the fires of competition
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex gap-3 mb-14"
        >
          <Link href="/practice">
            <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue text-white font-semibold text-sm tracking-wide hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer">
              Start Typing
            </button>
          </Link>
          <Link href="/practice?mode=ai">
            <button className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary font-semibold text-sm tracking-wide hover:bg-white/10 hover:border-white/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer">
              Try AI Mode
            </button>
          </Link>
        </motion.div>

        {/* Live typing demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl"
        >
          <LiveTypingDemo />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-text-ghost"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="font-[family-name:var(--font-accent)] text-3xl font-bold tracking-wider text-text-primary mb-3">
              NOT YOUR AVERAGE TYPING TEST
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto">
              Every keystroke triggers particles, audio, and visual feedback. Build combos. Enter flow state. Get addicted.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <GlassPanel className="p-6 h-full group hover:border-white/15 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${feature.gradient} text-white/90 shrink-0`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary mb-1">{feature.title}</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          {stats.gamesPlayed > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-xs text-text-ghost uppercase tracking-[0.2em] mb-6"
            >
              Your Stats
            </motion.p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {(stats.gamesPlayed > 0
              ? [
                  { value: stats.bestWpm, suffix: "", label: "Best WPM" },
                  { value: Math.round(stats.bestAccuracy * 100), suffix: "%", label: "Best Accuracy" },
                  { value: stats.bestCombo, suffix: "x", label: "Best Combo" },
                  { value: stats.gamesPlayed, suffix: "", label: "Games Played" },
                ]
              : [
                  { value: 30, suffix: "+", label: "Curated Passages" },
                  { value: 5, suffix: "", label: "Combo Tiers" },
                  { value: 100, suffix: "x", label: "Max Combo" },
                  { value: 0, suffix: "ms", label: "Audio Latency", display: "<5ms" },
                ]
            ).map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-1"
              >
                {stat.display ? (
                  <span className="font-[family-name:var(--font-accent)] text-4xl font-bold text-text-primary">
                    {stat.display}
                  </span>
                ) : (
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                )}
                <span className="text-xs text-text-secondary uppercase tracking-[0.15em]">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KEYBOARD VISUAL + CTA ===== */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <KeyboardVisual />

            <h2 className="font-[family-name:var(--font-accent)] text-2xl font-bold tracking-wider text-text-primary mt-10 mb-3">
              READY TO FORGE?
            </h2>
            <p className="text-text-secondary mb-8 max-w-sm mx-auto">
              No sign-up required. Jump straight in and start typing.
            </p>

            <div className="flex justify-center gap-3">
              <Link href="/practice">
                <button className="px-10 py-3.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue text-white font-semibold tracking-wide hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer">
                  Start Playing
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== GAME MODES ===== */}
      <section className="py-20 px-6 pb-32">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-[family-name:var(--font-accent)] text-xl font-bold tracking-widest text-text-primary text-center mb-8"
          >
            GAME MODES
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modes.map((mode, i) => (
              <motion.div
                key={mode.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                {mode.available ? (
                  <Link href={mode.href}>
                    <ModeCard mode={mode} />
                  </Link>
                ) : (
                  <ModeCard mode={mode} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo size="sm" showIcon={false} />
          <span className="text-xs text-text-ghost">Built for typists who demand more</span>
        </div>
      </footer>
    </main>
  );
}

function ModeCard({ mode }: { mode: (typeof modes)[number] }) {
  return (
    <GlassPanel
      intense={mode.available}
      className={`p-4 h-full transition-all duration-300 group ${
        mode.available
          ? "cursor-pointer hover:scale-[1.02] hover:border-white/20"
          : "opacity-30 cursor-default"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg bg-gradient-to-br ${mode.accent} text-white/90 shrink-0`}
          style={mode.available ? { boxShadow: `0 4px 16px ${mode.glowColor}` } : undefined}
        >
          {mode.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary text-sm group-hover:text-white transition-colors">
              {mode.name}
            </h3>
            {!mode.available && (
              <span className="text-[9px] uppercase tracking-wider text-text-ghost bg-white/5 px-1.5 py-0.5 rounded-full">
                Soon
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">{mode.description}</p>
        </div>
        {mode.available && (
          <svg className="w-4 h-4 text-text-ghost group-hover:text-accent-cyan transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        )}
      </div>
    </GlassPanel>
  );
}
