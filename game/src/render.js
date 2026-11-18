// render.js — everything the canvas shows of the world itself: the Reach's
// sky and silhouettes, the magnet field's rings, every body by its shape, and
// the Lodestar. HUD and screens live in hud.js; sparks live in particles.js.

import { FOE_KINDS, BOSS_STATS } from './entities.js';

const backdropCache = new Map();

export function backdropFor(reach, rng) {
  if (backdropCache.has(reach.name)) return backdropCache.get(reach.name);
  const shapes = [];
  for (let i = 0; i < 9; i++) {
    shapes.push({
      x: rng.range(40, 1240), y: rng.range(30, 690),
      r: rng.range(26, 90), kind: rng.pick(['ring', 'wreck', 'spire']),
      rot: rng.range(0, Math.PI * 2),
    });
  }
  const motes = [];
  for (let i = 0; i < 46; i++) {
    motes.push({ x: rng.range(0, 1280), y: rng.range(0, 720), s: rng.range(1, 3.4), v: rng.range(4, 16), ph: rng.range(0, 6) });
  }
  const out = { shapes, motes };
  backdropCache.set(reach.name, out);
  return out;
}

export function drawSky(ctx, game) {
  const reach = game.reach;
  const grad = ctx.createLinearGradient(0, 0, 0, 720);
  grad.addColorStop(0, reach.skyTop);
  grad.addColorStop(1, reach.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
  const bd = backdropFor(reach, game.rng);
  ctx.strokeStyle = reach.silhouette;
  ctx.fillStyle = reach.silhouette;
  for (const s of bd.shapes) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot + game.time * 0.01);
    ctx.globalAlpha = 0.55;
    if (s.kind === 'ring') {
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(0, 0, s.r, 0.4, Math.PI * 1.7); ctx.stroke();
    } else if (s.kind === 'wreck') {
      ctx.fillRect(-s.r, -s.r * 0.28, s.r * 2, s.r * 0.56);
      ctx.fillRect(-s.r * 0.2, -s.r * 0.7, s.r * 0.4, s.r * 0.5);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -s.r); ctx.lineTo(s.r * 0.5, s.r); ctx.lineTo(-s.r * 0.5, s.r);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = reach.mote;
  for (const m of bd.motes) {
    const y = (m.y + game.time * m.v) % 720;
    const x = m.x + Math.sin(game.time * 0.7 + m.ph) * 9;
    ctx.globalAlpha = 0.35 + 0.3 * Math.sin(game.time * 2 + m.ph);
    ctx.beginPath(); ctx.arc(x, y, m.s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawScrap(ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle);
  ctx.fillStyle = b.hot > 0 ? '#ffe9b0' : b.tone;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  const r = b.radius;
  ctx.beginPath();
  ctx.moveTo(-r, -r * 0.6); ctx.lineTo(r * 0.7, -r); ctx.lineTo(r, r * 0.5);
  ctx.lineTo(-r * 0.4, r); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawFoe(ctx, b) {
  const s = FOE_KINDS[b.foeKind];
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle + Math.PI / 2);
  ctx.fillStyle = b.flash > 0 ? '#ffffff' : s.color;
  ctx.strokeStyle = s.dark; ctx.lineWidth = 3;
  const r = b.radius;
  ctx.beginPath();
  if (s.shape === 'tri') { ctx.moveTo(0, -r); ctx.lineTo(r * 0.85, r); ctx.lineTo(-r * 0.85, r); }
  else if (s.shape === 'dart') { ctx.moveTo(0, -r * 1.2); ctx.lineTo(r * 0.6, r * 0.4); ctx.lineTo(0, r); ctx.lineTo(-r * 0.6, r * 0.4); }
  else if (s.shape === 'hex') { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } }
  else if (s.shape === 'orb') { ctx.arc(0, 0, r, 0, Math.PI * 2); }
  else { ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  if (s.shape === 'orb') { // the splitter's seam
    ctx.strokeStyle = s.dark;
    ctx.beginPath(); ctx.moveTo(-r * 0.6, 0); ctx.lineTo(r * 0.6, 0); ctx.stroke();
  }
  ctx.restore();
  if (b.hp < b.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(b.x - b.radius, b.y - b.radius - 10, b.radius * 2, 4);
    ctx.fillStyle = '#ff5d5d';
    ctx.fillRect(b.x - b.radius, b.y - b.radius - 10, b.radius * 2 * Math.max(0, b.hp / b.maxHp), 4);
  }
}

function drawBoss(ctx, b, game) {
  const s = BOSS_STATS[b.bossName];
  ctx.save();
  ctx.translate(b.x, b.y);
  if (b.chargeWarn) { // telegraph: a tightening red ring
    ctx.strokeStyle = 'rgba(255,60,60,0.85)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, b.radius + 26 + Math.sin(game.time * 30) * 4, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.rotate(b.angle);
  ctx.fillStyle = b.flash > 0 ? '#ffffff' : s.color;
  ctx.strokeStyle = s.dark; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(0, 0, b.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Armour plates ride the rim like scrap welded on.
  ctx.fillStyle = s.dark;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);
    ctx.fillRect(b.radius - 8, -13, 16, 26);
    ctx.restore();
  }
  ctx.fillStyle = '#0b0b12';
  ctx.beginPath(); ctx.arc(0, 0, b.radius * 0.42, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(0, 0, b.radius * 0.2 + Math.sin(game.time * 4) * 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawCorePickup(ctx, b, game) {
  const pulse = 1 + Math.sin(game.time * 5 + b.pulsePhase) * 0.15;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#69f0ae';
  ctx.strokeStyle = '#1d7a4c'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, b.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#eafff3';
  ctx.fillRect(-2, -6, 4, 12); ctx.fillRect(-6, -2, 12, 4);
  ctx.restore();
}

export function drawBodies(ctx, game) {
  for (const b of game.bodies) {
    if (b.dead) continue;
    if (b.kind === 'scrap') drawScrap(ctx, b);
    else if (b.kind === 'foe') drawFoe(ctx, b);
    else if (b.kind === 'boss') drawBoss(ctx, b, game);
    else if (b.kind === 'core') drawCorePickup(ctx, b, game);
  }
}

export function drawPlayer(ctx, game) {
  const p = game.player;
  const reach = game.reach;
  // Field rings: boundary breathes while the magnet is held.
  ctx.save();
  ctx.translate(p.x, p.y);
  const fieldAlpha = game.magnetOn ? 0.5 : 0.16;
  ctx.strokeStyle = reach.ring;
  ctx.globalAlpha = fieldAlpha;
  ctx.lineWidth = game.magnetOn ? 3 : 2;
  ctx.setLineDash([10, 14]);
  ctx.lineDashOffset = -game.time * 40;
  ctx.beginPath(); ctx.arc(0, 0, game.mods.fieldRadius, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = game.magnetOn ? 0.85 : 0.4;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, game.mods.orbitRadius, 0, Math.PI * 2); ctx.stroke();
  if (game.magnetOn) { // swirl spokes sell the rotation in a still frame
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 4; i++) {
      const a = game.time * 2.4 + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * game.mods.orbitRadius, Math.sin(a) * game.mods.orbitRadius, 5, 0, Math.PI * 2);
      ctx.fillStyle = reach.ring; ctx.fill();
    }
  }
  ctx.restore();
  // The Lodestar itself: a warm core in a rotating brass cage.
  ctx.save();
  ctx.translate(p.x, p.y);
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 44);
  glow.addColorStop(0, 'rgba(255,225,150,0.95)');
  glow.addColorStop(0.35, 'rgba(255,180,80,0.55)');
  glow.addColorStop(1, 'rgba(255,160,60,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(game.time * 0.9);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
  ctx.strokeRect(-13, -13, 26, 26);
  ctx.rotate(-game.time * 1.7);
  ctx.strokeStyle = '#fff3d6';
  ctx.strokeRect(-9, -9, 18, 18);
  ctx.fillStyle = '#fff8e7';
  ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (p.hitCooldown > 0.55) { // brief hurt flash ring
    ctx.strokeStyle = 'rgba(255,80,80,0.8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 8, 0, Math.PI * 2); ctx.stroke();
  }
}
