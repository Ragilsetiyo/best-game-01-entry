// GLOWPATH — world: the rules, the six nights, and the light that is also your life.
// One night is a single screen: platforms, lanterns, shards, wisps and the Dawn Gate.
// Your light drains in the dark, refills inside a lit lantern's glow, and a flare spends light
// to burn wisps and kindle unlit lanterns. Collect every shard and the gate opens; step through
// it to clear the night. Light at zero ends the night.
import {
  FALL_COST, FLARE_COOLDOWN, FLARE_COST, FLARE_RADIUS, GRAVITY, JUMP_SPEED,
  LANTERN_RADIUS, LANTERN_REFILL, LIGHT_MAX, MOVE_SPEED, NIGHTS, PLAYER,
  SHARD_SCORE, STEP, VIEW, WISP_SCORE, WISP_TOUCH_COST,
} from './config.js';

export const EVENT_NONE = 0;
export const EVENT_SHARD = 1;
export const EVENT_BURN = 2;
export const EVENT_FLARE = 4;
export const EVENT_HURT = 8;
export const EVENT_CLEAR = 16;
export const EVENT_OVER = 32;
export const EVENT_GATE = 64;
export const EVENT_LANTERN = 128;

/** A night's layout: platforms, lanterns, shards, wisps, gate and spawn. */
function nightLayout(night) {
  const ground = { x: 0, y: 660, w: 1280, h: 60 };
  const base = {
    1: {
      platforms: [ground, { x: 180, y: 540, w: 180, h: 24 }, { x: 520, y: 460, w: 180, h: 24 }, { x: 880, y: 540, w: 180, h: 24 }],
      lanterns: [{ x: 120, y: 660, lit: true }, { x: 640, y: 460, lit: false }],
      shards: [{ x: 270, y: 500 }, { x: 610, y: 420 }, { x: 970, y: 500 }],
      wisps: [{ x: 900, y: 560 }],
      gate: { x: 1180, y: 660 },
      spawn: { x: 80, y: 620 },
      drain: 1.0, wispSpeed: 55,
    },
    2: {
      platforms: [ground, { x: 140, y: 540, w: 150, h: 24 }, { x: 400, y: 440, w: 150, h: 24, move: { axis: 'x', range: 90, speed: 0.9 } }, { x: 700, y: 540, w: 150, h: 24 }, { x: 980, y: 440, w: 150, h: 24 }],
      lanterns: [{ x: 120, y: 660, lit: true }, { x: 475, y: 440, lit: false }, { x: 1055, y: 440, lit: false }],
      shards: [{ x: 215, y: 500 }, { x: 475, y: 400 }, { x: 775, y: 500 }, { x: 1055, y: 400 }],
      wisps: [{ x: 640, y: 560 }, { x: 1020, y: 300 }],
      gate: { x: 1180, y: 660 },
      spawn: { x: 80, y: 620 },
      drain: 1.15, wispSpeed: 62,
    },
    3: {
      platforms: [ground, { x: 120, y: 560, w: 140, h: 24 }, { x: 340, y: 460, w: 140, h: 24, move: { axis: 'y', range: 70, speed: 1.0 } }, { x: 580, y: 560, w: 140, h: 24 }, { x: 800, y: 440, w: 140, h: 24, move: { axis: 'x', range: 100, speed: 1.1 } }, { x: 1040, y: 540, w: 140, h: 24 }],
      lanterns: [{ x: 120, y: 660, lit: true }, { x: 410, y: 460, lit: false }, { x: 870, y: 440, lit: false }],
      shards: [{ x: 190, y: 520 }, { x: 410, y: 400 }, { x: 650, y: 520 }, { x: 870, y: 400 }, { x: 1110, y: 500 }],
      wisps: [{ x: 500, y: 560 }, { x: 760, y: 300 }, { x: 980, y: 560 }, { x: 300, y: 300 }],
      gate: { x: 1180, y: 660 },
      spawn: { x: 80, y: 620 },
      drain: 1.3, wispSpeed: 70,
    },
    4: {
      platforms: [ground, { x: 100, y: 560, w: 130, h: 24 }, { x: 300, y: 470, w: 130, h: 24 }, { x: 500, y: 560, w: 130, h: 24, move: { axis: 'x', range: 110, speed: 1.2 } }, { x: 700, y: 450, w: 130, h: 24 }, { x: 880, y: 540, w: 130, h: 24, move: { axis: 'y', range: 80, speed: 1.0 } }, { x: 1060, y: 430, w: 130, h: 24 }],
      lanterns: [{ x: 120, y: 660, lit: true }, { x: 365, y: 470, lit: false }, { x: 765, y: 450, lit: false }],
      shards: [{ x: 165, y: 520 }, { x: 365, y: 430 }, { x: 565, y: 520 }, { x: 765, y: 410 }, { x: 1125, y: 390 }],
      wisps: [{ x: 420, y: 560 }, { x: 640, y: 360 }, { x: 900, y: 560 }, { x: 1140, y: 300 }],
      gate: { x: 1180, y: 660 },
      spawn: { x: 80, y: 620 },
      drain: 1.45, wispSpeed: 78,
    },
    5: {
      platforms: [ground, { x: 90, y: 560, w: 120, h: 24, move: { axis: 'y', range: 60, speed: 1.2 } }, { x: 280, y: 460, w: 120, h: 24 }, { x: 470, y: 560, w: 120, h: 24, move: { axis: 'x', range: 120, speed: 1.3 } }, { x: 660, y: 440, w: 120, h: 24 }, { x: 850, y: 540, w: 120, h: 24, move: { axis: 'y', range: 70, speed: 1.1 } }, { x: 1040, y: 430, w: 120, h: 24 }],
      lanterns: [{ x: 120, y: 660, lit: true }, { x: 340, y: 460, lit: false }, { x: 720, y: 440, lit: false }, { x: 1100, y: 430, lit: false }],
      shards: [{ x: 150, y: 500 }, { x: 340, y: 420 }, { x: 530, y: 500 }, { x: 720, y: 400 }, { x: 910, y: 500 }, { x: 1100, y: 390 }],
      wisps: [{ x: 380, y: 560 }, { x: 560, y: 340 }, { x: 760, y: 560 }, { x: 960, y: 340 }, { x: 1140, y: 560 }, { x: 220, y: 300 }],
      gate: { x: 1180, y: 660 },
      spawn: { x: 80, y: 620 },
      drain: 1.6, wispSpeed: 86,
    },
    6: {
      platforms: [ground, { x: 80, y: 560, w: 120, h: 24, move: { axis: 'x', range: 100, speed: 1.4 } }, { x: 260, y: 460, w: 120, h: 24, move: { axis: 'y', range: 80, speed: 1.2 } }, { x: 440, y: 560, w: 120, h: 24 }, { x: 620, y: 440, w: 120, h: 24, move: { axis: 'x', range: 120, speed: 1.4 } }, { x: 800, y: 540, w: 120, h: 24, move: { axis: 'y', range: 70, speed: 1.3 } }, { x: 980, y: 430, w: 120, h: 24 }, { x: 1140, y: 540, w: 100, h: 24 }],
      lanterns: [{ x: 120, y: 660, lit: true }, { x: 320, y: 460, lit: false }, { x: 680, y: 440, lit: false }, { x: 1040, y: 430, lit: false }],
      shards: [{ x: 140, y: 500 }, { x: 320, y: 420 }, { x: 500, y: 520 }, { x: 680, y: 400 }, { x: 860, y: 500 }, { x: 1040, y: 390 }],
      wisps: [{ x: 340, y: 560 }, { x: 520, y: 340 }, { x: 700, y: 560 }, { x: 880, y: 340 }, { x: 1060, y: 560 }, { x: 200, y: 300 }, { x: 1180, y: 300 }],
      gate: { x: 1180, y: 660 },
      spawn: { x: 80, y: 620 },
      drain: 1.75, wispSpeed: 94,
    },
  };
  return base[night];
}

function makePlatforms(layout, time) {
  return layout.platforms.map((p) => {
    const base = { x: p.x, y: p.y, w: p.w, h: p.h, ox: p.x, oy: p.y };
    if (p.move) {
      const s = Math.sin(time * p.move.speed + p.x * 0.01) * p.move.range;
      if (p.move.axis === 'x') base.x = p.x + s;
      else base.y = p.y + s;
    }
    return base;
  });
}

export function createWorld(random) {
  const world = {
    random,
    night: 1,
    score: 0,
    scoreAtNightStart: 0,
    time: 0,
    player: { x: 80, y: 620, vx: 0, vy: 0, onGround: false, face: 1, wing: 0 },
    light: LIGHT_MAX,
    flareTimer: 0,
    flareFx: 0,
    gateOpen: false,
    cleared: false,
    over: false,
    shardsTaken: 0,
    shardsTotal: 0,
    particles: [],
    wisps: [],
    lanterns: [],
    shards: [],
    platforms: [],
    gate: { x: 1180, y: 660 },
    spawn: { x: 80, y: 620 },
    drain: 1,
    wispSpeed: 55,
    stars: [],
  };
  for (let i = 0; i < 90; i += 1) {
    world.stars.push({ x: random() * VIEW.width, y: random() * 420, r: 0.6 + random() * 1.6, tw: random() * 6.28 });
  }
  world.loadNight = (night) => loadNight(world, night);
  world.reset = () => {
    world.night = 1;
    world.score = 0;
    world.scoreAtNightStart = 0;
    loadNight(world, 1);
  };
  world.step = (dt, input, quiet) => stepWorld(world, dt, input, quiet);
  loadNight(world, 1);
  return world;
}

function loadNight(world, night) {
  const layout = nightLayout(night);
  world.night = night;
  world.time = 0;
  world.player.x = layout.spawn.x;
  world.player.y = layout.spawn.y;
  world.player.vx = 0;
  world.player.vy = 0;
  world.player.onGround = false;
  world.light = LIGHT_MAX;
  world.flareTimer = 0;
  world.flareFx = 0;
  world.gateOpen = false;
  world.cleared = false;
  world.over = false;
  world.shardsTaken = 0;
  world.shardsTotal = layout.shards.length;
  world.particles = [];
  world.spawn = layout.spawn;
  world.gate = layout.gate;
  world.drain = layout.drain;
  world.wispSpeed = layout.wispSpeed;
  world.lanterns = layout.lanterns.map((l) => ({ ...l }));
  world.shards = layout.shards.map((s) => ({ ...s, taken: false, phase: world.random() * 6.28 }));
  world.wisps = layout.wisps.map((w) => ({ x: w.x, y: w.y, wobble: world.random() * 6.28, dead: false }));
  world.platforms = makePlatforms(layout, 0);
  world.layout = layout;
}

function burst(world, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const a = world.random() * 6.283;
    const v = speed * (0.4 + world.random() * 0.8);
    world.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0.5 + world.random() * 0.5, max: 1, color, size: 2 + world.random() * 3 });
  }
}

function playerGlowRadius(world) {
  return 55 + world.light * 0.9;
}

function insideLanternGlow(world, x, y) {
  for (const l of world.lanterns) {
    if (!l.lit) continue;
    const dx = x - l.x;
    const dy = y - (l.y - 34);
    if (dx * dx + dy * dy < LANTERN_RADIUS * LANTERN_RADIUS) return l;
  }
  return null;
}

function burnWispsIn(world, x, y, radius, events) {
  let burned = 0;
  for (const w of world.wisps) {
    if (w.dead) continue;
    const dx = w.x - x;
    const dy = w.y - y;
    if (dx * dx + dy * dy < radius * radius) {
      w.dead = true;
      burned += 1;
      world.score += WISP_SCORE;
      burst(world, w.x, w.y, '#ffb347', 10, 120);
    }
  }
  if (burned > 0) return events | EVENT_BURN;
  return events;
}

export function doFlare(world) {
  if (world.flareTimer > 0 || world.light <= FLARE_COST + 3 || world.cleared || world.over) return EVENT_NONE;
  world.light -= FLARE_COST;
  world.flareTimer = FLARE_COOLDOWN;
  world.flareFx = 0.45;
  const p = world.player;
  const cx = p.x + PLAYER.width / 2;
  const cy = p.y + PLAYER.height / 2;
  let events = EVENT_FLARE;
  burst(world, cx, cy, '#ffd97a', 22, 260);
  events = burnWispsIn(world, cx, cy, FLARE_RADIUS, events);
  for (const l of world.lanterns) {
    if (l.lit) continue;
    const dx = l.x - cx;
    const dy = (l.y - 34) - cy;
    if (dx * dx + dy * dy < 150 * 150) {
      l.lit = true;
      events |= EVENT_LANTERN;
      burst(world, l.x, l.y - 34, '#ffcf6e', 14, 90);
    }
  }
  return events;
}

/**
 * Advance the world one fixed step. `input` is { move: -1|0|1, jump: bool, flare: bool }.
 * Returns an event bitmask for sounds and screen changes. `quiet` skips scoring sounds' sources
 * (used while staging screenshots) but the world still advances identically.
 */
function stepWorld(world, dt, input, quiet) {
  if (world.cleared || world.over) return EVENT_NONE;
  world.time += dt;
  let events = EVENT_NONE;
  const p = world.player;
  world.flareTimer = Math.max(0, world.flareTimer - dt);
  world.flareFx = Math.max(0, world.flareFx - dt);
  p.wing += dt * (p.onGround ? 6 : 14);

  // Move + jump, resolving each axis against the platforms in turn.
  p.vx = input.move * MOVE_SPEED;
  p.face = input.move !== 0 ? input.move : p.face;
  if (input.jump && p.onGround) {
    p.vy = -JUMP_SPEED;
    p.onGround = false;
  }
  p.vy += GRAVITY * dt;
  if (p.vy > 1400) p.vy = 1400;

  // Moving platforms carry a standing player along.
  const prevPlatforms = world.platforms;
  world.platforms = makePlatforms(world.layout, world.time);
  if (p.onGround) {
    for (let i = 0; i < world.platforms.length; i += 1) {
      const plat = world.platforms[i];
      const prev = prevPlatforms[i];
      if (prev && Math.abs((p.y + PLAYER.height) - prev.y) < 4
        && p.x + PLAYER.width > prev.x && p.x < prev.x + prev.w) {
        p.x += plat.x - prev.x;
        p.y += plat.y - prev.y;
      }
    }
  }

  p.x += p.vx * dt;
  if (p.x < 0) p.x = 0;
  if (p.x > VIEW.width - PLAYER.width) p.x = VIEW.width - PLAYER.width;
  // Platforms are one-way: the moth jumps up through them and lands on top, and
  // never bumps its head or gets shoved sideways by one. A solid side would trap
  // the moth under every platform it must climb (proven by the Ronde 1 autopilot,
  // which head-bumped in a loop and never collected a shard).
  const prevBottom = p.y + PLAYER.height;
  p.y += p.vy * dt;
  p.onGround = false;
  for (const plat of world.platforms) {
    if (p.x + PLAYER.width > plat.x + 2 && p.x < plat.x + plat.w - 2
      && p.y + PLAYER.height > plat.y && p.y < plat.y + plat.h) {
      if (p.vy >= 0 && prevBottom <= plat.y + 30) {
        p.y = plat.y - PLAYER.height;
        p.vy = 0;
        p.onGround = true;
      }
    }
  }

  // Fell out of the world: lose light, back to the spawn.
  if (p.y > VIEW.height + 40) {
    world.light -= FALL_COST;
    p.x = world.spawn.x;
    p.y = world.spawn.y;
    p.vx = 0;
    p.vy = 0;
    events |= EVENT_HURT;
    burst(world, p.x + 13, p.y + 15, '#8fa8ff', 12, 140);
  }

  // Light: drain in the dark, refill in a lantern's glow.
  const cx = p.x + PLAYER.width / 2;
  const cy = p.y + PLAYER.height / 2;
  const lantern = insideLanternGlow(world, cx, cy);
  if (lantern) world.light = Math.min(LIGHT_MAX, world.light + LANTERN_REFILL * dt);
  else world.light -= world.drain * dt;

  if (input.flare) events |= doFlare(world);

  // Wisps drift toward the moth and burn in any light.
  const glow = playerGlowRadius(world);
  for (const w of world.wisps) {
    if (w.dead) continue;
    w.wobble += dt * 2;
    const dx = cx - w.x;
    const dy = cy - w.y;
    const d = Math.hypot(dx, dy) || 1;
    w.x += (dx / d) * world.wispSpeed * dt + Math.cos(w.wobble) * 14 * dt;
    w.y += (dy / d) * world.wispSpeed * dt * 0.7 + Math.sin(w.wobble * 1.3) * 12 * dt;
    const dl = Math.hypot(w.x - cx, w.y - cy);
    if (dl < glow) {
      w.dead = true;
      world.score += WISP_SCORE;
      events |= EVENT_BURN;
      burst(world, w.x, w.y, '#ffb347', 10, 120);
      continue;
    }
    if (lantern) {
      const ldx = w.x - lantern.x;
      const ldy = w.y - (lantern.y - 34);
      if (ldx * ldx + ldy * ldy < LANTERN_RADIUS * LANTERN_RADIUS) {
        w.dead = true;
        world.score += WISP_SCORE;
        events |= EVENT_BURN;
        burst(world, w.x, w.y, '#ffb347', 10, 120);
        continue;
      }
    }
    if (dl < 30) {
      w.dead = true;
      world.light -= WISP_TOUCH_COST;
      events |= EVENT_HURT;
      burst(world, cx, cy, '#c084fc', 12, 160);
    }
  }

  // Shards.
  for (const s of world.shards) {
    if (s.taken) continue;
    const dx = s.x - cx;
    const dy = s.y - cy;
    if (dx * dx + dy * dy < 34 * 34) {
      s.taken = true;
      world.shardsTaken += 1;
      world.score += SHARD_SCORE;
      events |= EVENT_SHARD;
      burst(world, s.x, s.y, '#9fe8ff', 12, 130);
      if (world.shardsTaken === world.shardsTotal) {
        world.gateOpen = true;
        events |= EVENT_GATE;
      }
    }
  }

  // The Dawn Gate.
  if (world.gateOpen) {
    const gx = world.gate.x;
    const gy = world.gate.y;
    if (cx > gx - 26 && cx < gx + 26 && cy > gy - 90 && cy < gy + 10) {
      world.cleared = true;
      world.score += Math.round(world.light) * 5;
      events |= EVENT_CLEAR;
    }
  }

  // Light out: the night ends.
  if (world.light <= 0) {
    world.light = 0;
    world.over = true;
    events |= EVENT_OVER;
  }

  // Particles.
  for (const pt of world.particles) {
    pt.life -= dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 300 * dt;
  }
  world.particles = world.particles.filter((pt) => pt.life > 0);
  return events;
}

export { NIGHTS, STEP, VIEW, playerGlowRadius };
