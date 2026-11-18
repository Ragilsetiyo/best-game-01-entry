// physics.js — the magnetism and the violence. Bodies drift, foes steer for
// the Lodestar, and while the magnet is held everything inside the field is
// pulled into orbit. Kills come from impacts: a body moving fast enough — or
// still "hot" from a fling — breaks what it hits. Scoring lives in main.js;
// this file only moves bodies and reports what happened through callbacks.

import { FOE_KINDS, speedOf } from './entities.js';

export const WORLD = { w: 1280, h: 720 };

export function flingAll(game) {
  const p = game.player;
  let flung = 0;
  for (const b of game.bodies) {
    if (b.kind === 'core') continue;
    const dx = b.x - p.x, dy = b.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > game.mods.fieldRadius + b.radius) continue;
    const nx = dx / d, ny = dy / d;
    const tx = -ny, ty = nx; // counterclockwise tangent, matches the swirl
    const power = game.mods.flingPower;
    b.vx = b.vx * 0.25 + (nx * 190 + tx * 470) * power;
    b.vy = b.vy * 0.25 + (ny * 190 + ty * 470) * power;
    b.hot = 1.25 + (game.mods.hotBonus ?? 0);
    flung++;
  }
  return flung;
}

export function pulseAll(game) {
  const p = game.player;
  const reach = game.mods.fieldRadius + 80;
  for (const b of game.bodies) {
    if (b.kind === 'core') continue;
    const dx = b.x - p.x, dy = b.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > reach + b.radius) continue;
    const push = 620 * (1 - d / (reach + 80)) + 240;
    b.vx += (dx / d) * push;
    b.vy += (dy / d) * push;
    b.hot = Math.max(b.hot, 0.7);
  }
}

function steerFoe(game, b, dt) {
  const p = game.player;
  const dx = p.x - b.x, dy = p.y - b.y;
  const d = Math.hypot(dx, dy) || 1;
  const nx = dx / d, ny = dy / d;
  let ax = nx, ay = ny;
  if (b.foeKind === 'weaver') {
    b.diveTimer -= dt;
    if (b.diveTimer > 0 && d < 260) { ax = -ny * 0.9 + nx * 0.25; ay = nx * 0.9 + ny * 0.25; }
  }
  const accel = 130;
  b.vx += ax * accel * dt;
  b.vy += ay * accel * dt;
  const sp = speedOf(b);
  const cap = b.speed * (b.hot > 0 ? 6 : 1);
  if (sp > cap && b.hot <= 0) { b.vx = (b.vx / sp) * cap; b.vy = (b.vy / sp) * cap; }
  b.wobble += dt * 3;
}

function steerBoss(game, b, dt) {
  const p = game.player;
  const dx = p.x - b.x, dy = p.y - b.y;
  const d = Math.hypot(dx, dy) || 1;
  if (b.charging > 0) {
    b.charging -= dt;
    return; // velocity was set when the charge began
  }
  b.chargeTimer -= dt;
  b.chargeWarn = 0;
  if (b.chargeTimer <= 0.8 && b.chargeTimer > 0) b.chargeWarn = 1;
  if (b.chargeTimer <= 0) {
    b.vx = (dx / d) * 265; b.vy = (dy / d) * 265;
    b.charging = 0.75; b.chargeTimer = 5.5;
    game.onBossCharge?.(b);
    return;
  }
  b.vx += (dx / d) * 60 * dt;
  b.vy += (dy / d) * 60 * dt;
  const sp = speedOf(b);
  if (sp > b.speed) { b.vx = (b.vx / sp) * b.speed; b.vy = (b.vy / sp) * b.speed; }
}

function applyMagnet(game, b, dt) {
  const p = game.player;
  const dx = b.x - p.x, dy = b.y - p.y;
  const d = Math.hypot(dx, dy) || 1;
  if (d > game.mods.fieldRadius + b.radius) return;
  const nx = dx / d, ny = dy / d;
  const orbit = game.mods.orbitRadius;
  const radialError = d - orbit;
  const strength = game.mods.magnetStrength;
  // Pull toward the orbit ring, plus a steady tangential swirl so the catch
  // circulates instead of piling onto the core.
  const ax = (-nx * radialError * 6 + -ny * 150) * strength;
  const ay = (-ny * radialError * 6 + nx * 150) * strength;
  b.vx += ax * dt; b.vy += ay * dt;
  const sp = speedOf(b);
  const cap = 460;
  if (sp > cap) { b.vx = (b.vx / sp) * cap; b.vy = (b.vy / sp) * cap; }
}

function collidePair(game, a, b, dt) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const minD = a.radius + b.radius;
  const d2 = dx * dx + dy * dy;
  if (d2 >= minD * minD || d2 === 0) return;
  const d = Math.sqrt(d2);
  const nx = dx / d, ny = dy / d;
  const overlap = (minD - d) / 2;
  a.x -= nx * overlap; a.y -= ny * overlap;
  b.x += nx * overlap; b.y += ny * overlap;
  const relVx = b.vx - a.vx, relVy = b.vy - a.vy;
  const relSpeed = Math.abs(relVx * nx + relVy * ny);
  // Bounce: swap a slice of normal velocity so wrecks carom off each other.
  const impulse = (relVx * nx + relVy * ny) * 0.6;
  a.vx += nx * impulse; a.vy += ny * impulse;
  b.vx -= nx * impulse; b.vy -= ny * impulse;
  const hot = a.hot > 0 || b.hot > 0;
  const threshold = hot ? 130 : 235;
  if (relSpeed <= threshold) return;
  const dmg = (relSpeed - 170) * 0.085 * (hot ? 1.7 : 1);
  for (const body of [a, b]) {
    if (body.kind === 'foe' || body.kind === 'boss') {
      body.hp -= dmg; body.flash = 0.12;
      game.onImpact?.(body, dmg, (a.x + b.x) / 2, (a.y + b.y) / 2);
    } else if (body.kind === 'scrap') {
      body.hp -= dmg * 0.7;
    }
  }
}

export function stepPhysics(game, dt) {
  const p = game.player;
  for (const b of game.bodies) {
    if (b.dead) continue;
    b.hot = Math.max(0, b.hot - dt);
    b.flash = Math.max(0, b.flash - dt);
    if (b.kind === 'foe') steerFoe(game, b, dt);
    else if (b.kind === 'boss') steerBoss(game, b, dt);
    if (game.magnetOn && b.kind !== 'core') applyMagnet(game, b, dt);
    b.x += b.vx * dt; b.y += b.vy * dt;
    b.vx *= 0.995; b.vy *= 0.995;
    b.angle += b.spin * dt;
    // Soft walls: the Gyre is a bowl; everything stays in the bowl.
    if (b.x < b.radius) { b.x = b.radius; b.vx = Math.abs(b.vx) * 0.7; }
    if (b.x > WORLD.w - b.radius) { b.x = WORLD.w - b.radius; b.vx = -Math.abs(b.vx) * 0.7; }
    if (b.y < b.radius) { b.y = b.radius; b.vy = Math.abs(b.vy) * 0.7; }
    if (b.y > WORLD.h - b.radius) { b.y = WORLD.h - b.radius; b.vy = -Math.abs(b.vy) * 0.7; }
  }
  const bodies = game.bodies;
  for (let i = 0; i < bodies.length; i++) {
    if (bodies[i].dead) continue;
    for (let j = i + 1; j < bodies.length; j++) {
      if (!bodies[j].dead) collidePair(game, bodies[i], bodies[j], dt);
    }
  }
  // Contact with the core itself.
  p.hitCooldown = Math.max(0, (p.hitCooldown ?? 0) - dt);
  for (const b of bodies) {
    if (b.dead) continue;
    const d = Math.hypot(b.x - p.x, b.y - p.y);
    if (d > b.radius + p.radius) continue;
    if (b.kind === 'core') { b.dead = true; game.onPickup?.(b); continue; }
    if (b.kind === 'scrap') continue;
    if (p.hitCooldown <= 0) {
      const touch = b.kind === 'boss' ? FOE_KINDS.drifter.touch + 14 : FOE_KINDS[b.foeKind].touch;
      game.onPlayerHit?.(touch, b);
      p.hitCooldown = 0.85;
    }
    if (b.kind === 'foe') b.dead = true; // a foe that reaches the core spends itself
    else { b.vx = -b.vx * 0.5 + (b.x - p.x) * 2; b.vy = -b.vy * 0.5 + (b.y - p.y) * 2; }
  }
}
