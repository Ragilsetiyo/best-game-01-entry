// audio.js — every sound in LODESTAR is synthesised with WebAudio: no audio
// files, no network. Short shaped blips for actions, a noise burst for smashes,
// and a slow two-oscillator pulse that plays under the fight as music.

export class SoundKit {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { this.ctx = null; }
  }

  tone(freq, dur, type = 'sine', vol = 0.15, slideTo = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  noise(dur, vol = 0.2, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 900;
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t0);
  }

  gather() { this.tone(180, 0.12, 'sine', 0.05, 320); }
  fling() { this.tone(320, 0.18, 'sawtooth', 0.07, 90); this.noise(0.1, 0.05); }
  smash(combo) {
    const base = 140 + Math.min(combo, 9) * 30;
    this.noise(0.16, 0.22);
    this.tone(base, 0.2, 'square', 0.1, base * 0.4);
    this.tone(base * 2, 0.12, 'sine', 0.08, base, 0.02);
  }
  hurt() { this.tone(90, 0.25, 'sawtooth', 0.16, 45); this.noise(0.2, 0.14); }
  pickup() { this.tone(660, 0.09, 'sine', 0.1); this.tone(990, 0.12, 'sine', 0.1, null, 0.07); }
  pulse() { this.tone(70, 0.35, 'sine', 0.22, 240); this.noise(0.25, 0.1); }
  draft() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.1, null, i * 0.08)); }
  bossRoar() { this.tone(55, 0.7, 'sawtooth', 0.2, 38); this.tone(82, 0.7, 'square', 0.1, 50, 0.1); }
  win() { [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.12, null, i * 0.12)); }
  lose() { [330, 262, 196, 131].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.12, null, i * 0.16)); }

  startMusic() {
    if (this.musicTimer || !this.ctx) return;
    const bass = [55, 55, 65.4, 49];
    const arp = [220, 261.6, 329.6, 261.6, 196, 246.9, 293.7, 246.9];
    this.musicTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const s = this.musicStep++;
      if (s % 2 === 0) this.tone(bass[(s / 2) % 4], 0.42, 'triangle', 0.055);
      this.tone(arp[s % 8], 0.16, 'sine', 0.028);
    }, 210);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}
