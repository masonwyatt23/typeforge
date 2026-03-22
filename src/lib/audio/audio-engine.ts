type SoundId =
  | "keystroke"
  | "error"
  | "combo-milestone"
  | "combo-break"
  | "word-complete"
  | "countdown-tick"
  | "countdown-go"
  | "complete"
  | "level-up";

class AudioEngine {
  private static instance: AudioEngine | null = null;
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private initialized = false;
  private _volume = 0.7;
  private _enabled = true;

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this._volume;

    this.sfxGain = this.context.createGain();
    this.sfxGain.gain.value = 1;
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);

    this.initialized = true;

    // Resume context if suspended (browser autoplay policy)
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  play(soundId: SoundId, options?: { pitch?: number; volume?: number }): void {
    if (!this._enabled || !this.context || !this.sfxGain) return;

    const pitch = options?.pitch ?? 1;
    const volume = options?.volume ?? 1;

    switch (soundId) {
      case "keystroke":
        this.playKeystroke(pitch, volume);
        break;
      case "error":
        this.playError(volume);
        break;
      case "combo-milestone":
        this.playComboMilestone(pitch, volume);
        break;
      case "combo-break":
        this.playComboBreak(volume);
        break;
      case "word-complete":
        this.playWordComplete(volume);
        break;
      case "countdown-tick":
        this.playCountdownTick(volume);
        break;
      case "countdown-go":
        this.playCountdownGo(volume);
        break;
      case "complete":
        this.playComplete(volume);
        break;
      case "level-up":
        this.playLevelUp(volume);
        break;
    }
  }

  private playKeystroke(pitch: number, volume: number): void {
    const ctx = this.context!;
    const now = ctx.currentTime;

    // Triangle wave with random pitch variation for natural feel
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = (780 + Math.random() * 100) * pitch;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain!);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  private playError(volume: number): void {
    const ctx = this.context!;
    const now = ctx.currentTime;

    // Filtered noise burst
    const bufferSize = ctx.sampleRate * 0.07;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 400;
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);

    source.start(now);
    source.stop(now + 0.08);
  }

  private playComboMilestone(pitch: number, volume: number): void {
    const ctx = this.context!;
    const now = ctx.currentTime;

    // Rising chime — two slightly detuned sine waves
    const freq = 440 * pitch;

    for (const detune of [-3, 3]) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.detune.value = detune;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06 * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now);
      osc.stop(now + 0.35);
    }
  }

  private playComboBreak(volume: number): void {
    const ctx = this.context!;
    const now = ctx.currentTime;

    // Descending tone
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain!);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /** Plays a sequence of notes as an arpeggio with configurable timing and tone. */
  private playArpeggio(
    notes: number[],
    options: { waveform?: OscillatorType; interval: number; gainLevel: number; decay: number; volume: number }
  ): void {
    const ctx = this.context!;
    const now = ctx.currentTime;
    const waveform = options.waveform ?? "sine";

    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = waveform;
      osc.frequency.value = notes[i];

      const gain = ctx.createGain();
      const start = now + i * options.interval;
      gain.gain.setValueAtTime(options.gainLevel * options.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + options.decay);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(start);
      osc.stop(start + options.decay + 0.02);
    }
  }

  private playWordComplete(volume: number): void {
    // Two-tone arpeggio C6 -> E6
    this.playArpeggio([1047, 1319], { interval: 0.04, gainLevel: 0.04, decay: 0.08, volume });
  }

  private playCountdownTick(volume: number): void {
    this.playArpeggio([440], { interval: 0, gainLevel: 0.1, decay: 0.1, volume });
  }

  private playCountdownGo(volume: number): void {
    this.playArpeggio([880], { interval: 0, gainLevel: 0.12, decay: 0.2, volume });
  }

  private playComplete(volume: number): void {
    // Ascending major arpeggio: C5 -> E5 -> G5 -> C6
    this.playArpeggio([523, 659, 784, 1047], { interval: 0.08, gainLevel: 0.06, decay: 0.3, volume });
  }

  private playLevelUp(volume: number): void {
    // Triumphant arpeggio with richer harmonics
    this.playArpeggio([523, 659, 784, 1047, 1319], { waveform: "triangle", interval: 0.06, gainLevel: 0.07, decay: 0.4, volume });
  }

  get volume(): number {
    return this._volume;
  }

  set volume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.value = this._volume;
    }
  }

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(v: boolean) {
    this._enabled = v;
  }

  async ensureResumed(): Promise<void> {
    if (this.context?.state === "suspended") {
      await this.context.resume();
    }
  }
}

export { AudioEngine };
export type { SoundId };
