export interface ParticlePreset {
  count: number;
  sizeMin: number;
  sizeMax: number;
  speedMin: number;
  speedMax: number;
  lifetimeMin: number;
  lifetimeMax: number;
  gravity: number;
  friction: number;
  colors: string[];
  spread: number; // radians
  direction: number; // radians (0 = right, PI/2 = down)
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
  friction: number;
  active: boolean;
}

export const PRESETS: Record<string, ParticlePreset> = {
  keystroke: {
    count: 5,
    sizeMin: 2,
    sizeMax: 4,
    speedMin: 60,
    speedMax: 150,
    lifetimeMin: 300,
    lifetimeMax: 600,
    gravity: 30,
    friction: 0.96,
    colors: ["#22d3ee", "#3b82f6", "#60a5fa"],
    spread: Math.PI * 2,
    direction: -Math.PI / 2,
  },
  error: {
    count: 10,
    sizeMin: 2,
    sizeMax: 5,
    speedMin: 80,
    speedMax: 200,
    lifetimeMin: 200,
    lifetimeMax: 500,
    gravity: 50,
    friction: 0.94,
    colors: ["#ef4444", "#f87171", "#dc2626"],
    spread: Math.PI * 2,
    direction: 0,
  },
  wordBurst: {
    count: 20,
    sizeMin: 3,
    sizeMax: 6,
    speedMin: 100,
    speedMax: 250,
    lifetimeMin: 500,
    lifetimeMax: 900,
    gravity: 20,
    friction: 0.95,
    colors: ["#22d3ee", "#3b82f6", "#a855f7", "#60a5fa"],
    spread: Math.PI * 2,
    direction: 0,
  },
  comboMilestone: {
    count: 30,
    sizeMin: 3,
    sizeMax: 7,
    speedMin: 120,
    speedMax: 300,
    lifetimeMin: 600,
    lifetimeMax: 1200,
    gravity: 15,
    friction: 0.96,
    colors: ["#fbbf24", "#f59e0b", "#eab308", "#fde68a"],
    spread: Math.PI * 2,
    direction: -Math.PI / 2,
  },
  confetti: {
    count: 50,
    sizeMin: 4,
    sizeMax: 8,
    speedMin: 150,
    speedMax: 400,
    lifetimeMin: 1000,
    lifetimeMax: 2000,
    gravity: 40,
    friction: 0.97,
    colors: ["#22d3ee", "#3b82f6", "#a855f7", "#ec4899", "#fbbf24", "#34d399"],
    spread: Math.PI,
    direction: -Math.PI / 2,
  },
};

const MAX_PARTICLES = 250;
const POOL_SIZE = 300;

export class ParticleSystem {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private activeCount = 0;
  private animFrameId: number | null = null;
  private lastTime = 0;
  private dpr = 1;

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true })!;
    this.dpr = window.devicePixelRatio || 1;

    this.resize();

    // Pre-allocate particle pool
    this.particles = Array.from({ length: POOL_SIZE }, () => ({
      x: 0, y: 0, vx: 0, vy: 0,
      size: 0, color: "", life: 0, maxLife: 0,
      gravity: 0, friction: 0, active: false,
    }));

    window.addEventListener("resize", this.resize);
  }

  private resize = (): void => {
    if (!this.canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx?.scale(this.dpr, this.dpr);
  };

  spawn(presetName: string, x: number, y: number, rateMultiplier = 1): void {
    const preset = PRESETS[presetName];
    if (!preset) return;

    const count = Math.round(preset.count * rateMultiplier);
    let spawned = 0;

    for (const p of this.particles) {
      if (spawned >= count) break;
      if (this.activeCount >= MAX_PARTICLES) break;
      if (p.active) continue;

      const angle = preset.direction + (Math.random() - 0.5) * preset.spread;
      const speed = preset.speedMin + Math.random() * (preset.speedMax - preset.speedMin);
      const lifetime = preset.lifetimeMin + Math.random() * (preset.lifetimeMax - preset.lifetimeMin);

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = preset.sizeMin + Math.random() * (preset.sizeMax - preset.sizeMin);
      p.color = preset.colors[Math.floor(Math.random() * preset.colors.length)];
      p.life = lifetime;
      p.maxLife = lifetime;
      p.gravity = preset.gravity;
      p.friction = preset.friction;
      p.active = true;

      this.activeCount++;
      spawned++;
    }

    // Start animation loop if not running
    if (this.animFrameId === null) {
      this.lastTime = performance.now();
      this.animFrameId = requestAnimationFrame(this.update);
    }
  }

  spawnCustom(x: number, y: number, preset: Partial<ParticlePreset>): void {
    const merged = { ...PRESETS.keystroke, ...preset };
    const tempName = "__custom__";
    PRESETS[tempName] = merged;
    this.spawn(tempName, x, y);
    delete PRESETS[tempName];
  }

  private update = (time: number): void => {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05); // Cap delta at 50ms
    this.lastTime = time;

    if (!this.ctx || !this.canvas) return;

    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;

    // Clear
    this.ctx.clearRect(0, 0, w, h);

    // Set additive blending for neon glow
    this.ctx.globalCompositeOperation = "lighter";

    let activeCount = 0;

    for (const p of this.particles) {
      if (!p.active) continue;

      // Update physics
      p.life -= dt * 1000;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      p.vy += p.gravity * dt;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Draw
      const alpha = Math.max(0, p.life / p.maxLife);
      const currentSize = p.size * (0.5 + 0.5 * alpha);

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = alpha * 0.8;
      this.ctx.fill();

      // Glow layer
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, currentSize * 2, 0, Math.PI * 2);
      this.ctx.globalAlpha = alpha * 0.15;
      this.ctx.fill();

      activeCount++;
    }

    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = "source-over";
    this.activeCount = activeCount;

    // Continue loop or stop
    if (activeCount > 0) {
      this.animFrameId = requestAnimationFrame(this.update);
    } else {
      this.animFrameId = null;
    }
  };

  clear(): void {
    for (const p of this.particles) {
      p.active = false;
    }
    this.activeCount = 0;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  destroy(): void {
    this.clear();
    window.removeEventListener("resize", this.resize);
    this.canvas = null;
    this.ctx = null;
  }

  getActiveCount(): number {
    return this.activeCount;
  }
}
