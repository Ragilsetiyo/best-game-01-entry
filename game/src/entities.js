// entities.js — what floats in the Gyre: scrap (your ammunition), five kinds of
// foe that ride the current toward the Lodestar, repair cores, and the two
// bosses. A body is a plain circle with velocity; physics.js moves them.

export const FOE_KINDS = {
  drifter: {
    name: 'Drifter', hp: 11, radius: 17, speed: 34, touch: 8, score: 40,
    color: '#e4572e', dark: '#8f2f14', shape: 'tri',
    blurb: 'Slow rust with a grudge.',
  },
  skitter: {
    name: 'Skitter', hp: 8, radius: 11, speed: 74, touch: 6, score: 60,
    color: '#ffd166', dark: '#9c7414', shape: 'dart',
    blurb: 'Fast, fragile, everywhere.',
  },
  bulwark: {
    name: 'Bulwark', hp: 42, radius: 24, speed: 22, touch: 14, score: 120,
    color: '#7d8597', dark: '#424a5a', shape: 'hex',
    blurb: 'Plated. Needs a real impact.',
  },
  splitter: {
    name: 'Splitter', hp: 18, radius: 19, speed: 40, touch: 8, score: 90,
    color: '#c77dff', dark: '#6d28a8', shape: 'orb',
    blurb: 'Dies into two Skitters.',
  },
  weaver: {
    name: 'Weaver', hp: 20, radius: 15, speed: 52, touch: 10, score: 110,
    color: '#4cc9f0', dark: '#1d6f8f', shape: 'kite',
    blurb: 'Orbits you, then dives.',
  },
};

export const BOSS_STATS = {
  'HULK MOTHER': { hp: 420, radius: 54, speed: 15, touch: 22, score: 1500, color: '#b08968', dark: '#5e4630' },
  'THE LEVIATHAN COIL': { hp: 780, radius: 68, speed: 18, touch: 28, score: 3000, color: '#8d6bff', dark: '#432a7d' },
};

let nextId = 1;

function baseBody(x, y, radius) {
  return {
    id: nextId++, x, y, vx: 0, vy: 0, radius,
    angle: 0, spin: 0, hot: 0, dead: false, flash: 0,
  };
}

export function makeScrap(rng, x, y) {
  const b = baseBody(x, y, rng.range(8, 15));
  b.kind = 'scrap';
  b.hp = 10; b.maxHp = 10;
  b.angle = rng.range(0, Math.PI * 2);
  b.spin = rng.range(-1.4, 1.4);
  b.tone = rng.pick(['#c0c7d1', '#9aa5b1', '#d9b382', '#8fb8a8']);
  return b;
}

export function makeFoe(rng, kind, x, y, stormScale = 1) {
  const s = FOE_KINDS[kind];
  const b = baseBody(x, y, s.radius);
  b.kind = 'foe'; b.foeKind = kind;
  b.hp = s.hp * stormScale; b.maxHp = b.hp;
  b.speed = s.speed * rng.range(0.85, 1.15);
  b.angle = rng.range(0, Math.PI * 2);
  b.spin = rng.range(-2, 2);
  b.wobble = rng.range(0, Math.PI * 2);
  b.diveTimer = rng.range(2, 5);
  return b;
}

export function makeCorePickup(rng, x, y) {
  const b = baseBody(x, y, 10);
  b.kind = 'core';
  b.hp = 1; b.maxHp = 1;
  b.pulsePhase = rng.range(0, Math.PI * 2);
  return b;
}

export function makeBoss(rng, name, x, y) {
  const s = BOSS_STATS[name];
  const b = baseBody(x, y, s.radius);
  b.kind = 'boss'; b.bossName = name;
  b.hp = s.hp; b.maxHp = s.hp;
  b.speed = s.speed;
  b.angle = 0; b.spin = 0.25;
  b.spawnTimer = 3; b.chargeTimer = 6; b.charging = 0; b.shedStage = 0;
  return b;
}

export function speedOf(b) { return Math.hypot(b.vx, b.vy); }
