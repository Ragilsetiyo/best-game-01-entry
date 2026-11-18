// waves.js — the Storm director. Each of the seven Storms has a manifest of
// foes that ride in from the edges on a timer, a scrap level to keep the arena
// armed, and — twice — a boss. A Storm is cleared when its manifest is spent
// and nothing hostile remains alive.

import { makeBoss, makeFoe, makeScrap } from './entities.js';
import { BOSS_STORMS } from './story.js';

export const STORM_PLANS = [
  null,
  { foes: { drifter: 7, skitter: 3 }, interval: 1.5, scrap: 9 },
  { foes: { drifter: 8, skitter: 6, splitter: 2 }, interval: 1.3, scrap: 10 },
  { foes: { drifter: 7, skitter: 7, bulwark: 3, splitter: 2 }, interval: 1.15, scrap: 11 },
  { foes: { skitter: 6, splitter: 3, weaver: 3 }, interval: 1.2, scrap: 11, boss: 'HULK MOTHER' },
  { foes: { drifter: 8, skitter: 8, bulwark: 4, weaver: 4 }, interval: 1.0, scrap: 12 },
  { foes: { skitter: 10, bulwark: 5, splitter: 4, weaver: 5 }, interval: 0.9, scrap: 12 },
  { foes: { drifter: 6, skitter: 8, bulwark: 4, weaver: 4 }, interval: 1.05, scrap: 13, boss: 'THE LEVIATHAN COIL' },
];

export class StormDirector {
  constructor(rng) {
    this.rng = rng;
    this.storm = 0;
    this.queue = [];
    this.spawnTimer = 0;
    this.bossSpawned = false;
    this.active = false;
  }

  startStorm(game, storm) {
    this.storm = storm;
    const plan = STORM_PLANS[storm];
    this.queue = [];
    for (const [kind, count] of Object.entries(plan.foes)) {
      for (let i = 0; i < count; i++) this.queue.push(kind);
    }
    // Shuffle so kinds interleave instead of arriving in blocks.
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng.next() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
    this.spawnTimer = 0.6;
    this.bossSpawned = !plan.boss;
    this.active = true;
    if (plan.boss) game.onBossArrive?.(plan.boss);
  }

  edgePoint(minPlayerDist = 380) {
    const p = this.lastPlayer ?? { x: 640, y: 360 };
    for (let tries = 0; tries < 12; tries++) {
      const side = this.rng.int(0, 3);
      const x = side === 0 ? 30 : side === 1 ? 1250 : this.rng.range(40, 1240);
      const y = side === 2 ? 30 : side === 3 ? 690 : this.rng.range(40, 680);
      if (Math.hypot(x - p.x, y - p.y) >= minPlayerDist) return { x, y };
    }
    return { x: 60, y: 60 };
  }

  update(game, dt) {
    if (!this.active) return;
    this.lastPlayer = game.player;
    const plan = STORM_PLANS[this.storm];
    this.spawnTimer -= dt;
    if (this.queue.length && this.spawnTimer <= 0) {
      const kind = this.queue.shift();
      const at = this.edgePoint();
      const scale = 1 + (this.storm - 1) * 0.07;
      game.bodies.push(makeFoe(this.rng, kind, at.x, at.y, scale));
      this.spawnTimer = plan.interval * this.rng.range(0.7, 1.25);
    }
    if (!this.bossSpawned && this.queue.length === 0) {
      const at = this.edgePoint(520);
      game.bodies.push(makeBoss(this.rng, plan.boss, at.x, at.y));
      this.bossSpawned = true;
    }
    // Keep the arena armed: scrap is ammunition, and it trickles in.
    const scrapCount = game.bodies.filter((b) => b.kind === 'scrap' && !b.dead).length;
    if (scrapCount < plan.scrap && this.rng.chance(dt * 0.8)) {
      const at = this.edgePoint(200);
      game.bodies.push(makeScrap(this.rng, at.x, at.y));
    }
  }

  hostilesAlive(game) {
    return game.bodies.some((b) => !b.dead && (b.kind === 'foe' || b.kind === 'boss'));
  }

  isCleared(game) {
    return this.active && this.queue.length === 0 && this.bossSpawned && !this.hostilesAlive(game);
  }

  bossName() { return BOSS_STORMS[this.storm] ?? null; }
}
