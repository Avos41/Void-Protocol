// ── SoundManager ───────────────────────────────────────
// Procedurally generated game sounds via Web Audio API.
// All sounds are subtle and togglable. Mute state persists in localStorage.

type SoundName =
  | "click"
  | "meetingCalled"
  | "voteCast"
  | "testPass"
  | "testFail"
  | "win"
  | "loss";

const STORAGE_KEY = "void-protocol-muted";

class SoundManagerClass {
  private ctx: AudioContext | null = null;
  private _muted: boolean;
  private _subscribers: Set<() => void> = new Set();

  constructor() {
    this._muted = typeof localStorage !== "undefined"
      ? localStorage.getItem(STORAGE_KEY) === "true"
      : false;
  }

  get muted() {
    return this._muted;
  }

  set muted(val: boolean) {
    this._muted = val;
    try { localStorage.setItem(STORAGE_KEY, String(val)); } catch {}
    this._subscribers.forEach((fn) => fn());
  }

  toggle() {
    this.muted = !this._muted;
  }

  subscribe(fn: () => void) {
    this._subscribers.add(fn);
    return () => { this._subscribers.delete(fn); };
  }

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    // Resume if suspended (autoplay policy)
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  play(sound: SoundName) {
    if (this._muted) return;
    try {
      const ctx = this.getCtx();
      switch (sound) {
        case "click":
          this.playClick(ctx);
          break;
        case "meetingCalled":
          this.playMeetingAlarm(ctx);
          break;
        case "voteCast":
          this.playVoteChime(ctx);
          break;
        case "testPass":
          this.playTestPass(ctx);
          break;
        case "testFail":
          this.playTestFail(ctx);
          break;
        case "win":
          this.playWin(ctx);
          break;
        case "loss":
          this.playLoss(ctx);
          break;
      }
    } catch {
      // Audio not available, fail silently
    }
  }

  // ── Sound Generators ─────────────────────────────────

  private playClick(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }

  private playMeetingAlarm(ctx: AudioContext) {
    // Alternating two-tone klaxon
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(i % 2 === 0 ? 440 : 580, ctx.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.12);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.14);
    }
  }

  private playVoteChime(ctx: AudioContext) {
    // Rising confirmation: C → E → G
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.07, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.22);
    });
  }

  private playTestPass(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.22);
  }

  private playTestFail(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.27);
  }

  private playWin(ctx: AudioContext) {
    // Triumph fanfare: ascending arpeggio C-E-G-C
    const notes = [523, 659, 784, 1047]; // C5-E5-G5-C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.07, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(
        i === notes.length - 1 ? 0.09 : 0.03,
        ctx.currentTime + i * 0.12 + 0.1
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.12 + (i === notes.length - 1 ? 0.5 : 0.15)
      );
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.55);
    });
  }

  private playLoss(ctx: AudioContext) {
    // Ominous descending drone
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc2.type = "sine";
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.8);
    osc2.frequency.setValueAtTime(122, ctx.currentTime); // slight detune for unease
    osc2.frequency.exponentialRampToValueAtTime(58, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    osc.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.1);
    osc2.stop(ctx.currentTime + 1.1);
  }
}

// Singleton
export const soundManager = new SoundManagerClass();
