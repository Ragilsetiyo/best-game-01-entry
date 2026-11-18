// GLOWPATH — audio: every sound is synthesised with WebAudio, no audio files.
// The context is created on the first user gesture, so headless screenshots stay silent.
let ctx = null;

export function ensureAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
  return ctx;
}

function tone(freq, dur, type, vol, slideTo) {
  const ac = ensureAudio();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur);
  } catch {
    // Sound is garnish: never let it break the game.
  }
}

export function playShard() { tone(880, 0.18, 'sine', 0.12, 1320); }
export function playBurn() { tone(220, 0.25, 'sawtooth', 0.08, 60); }
export function playFlare() { tone(520, 0.3, 'triangle', 0.1, 180); }
export function playGate() { tone(660, 0.4, 'sine', 0.1, 990); }
export function playHurt() { tone(160, 0.3, 'square', 0.07, 90); }
export function playClear() {
  tone(523, 0.16, 'sine', 0.1);
  setTimeout(() => tone(659, 0.16, 'sine', 0.1), 120);
  setTimeout(() => tone(784, 0.3, 'sine', 0.12), 240);
}
export function playOver() { tone(330, 0.7, 'triangle', 0.1, 110); }
