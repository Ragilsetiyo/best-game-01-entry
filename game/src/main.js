// main.js — LODESTAR's conductor: the state machine (title, playing, draft,
// paused, defeat, victory), the per-frame update, scoring and combo rules,
// boss behaviour, and the render order. The rules of movement live in
// physics.js; the words live in story.js; this file makes them a game.

import { Input } from './input.js';
import { SoundKit } from './audio.js';
import { Particles } from './particles.js';
import { makeRng, liveSeed } from './rng.js';
import { makeFoe, makeScrap, makeCorePickup, FOE_KINDS } from './entities.js';
import { stepPhysics, flingAll, pulseAll, WORLD } from './physics.js';
import { StormDirector } from './waves.js';
import { defaultMods, draftThree } from './upgrades.js';
import { reachForStorm, BOSS_STORMS } from './story.js';
import { drawSky, drawBodies, drawPlayer } from './render.js';
import {
  drawHud, drawBossBar, drawStormBanner, drawTitle, drawDraft,
  drawPause, drawGameOver, drawVictory, draftCardRects,
} from './hud.js';
import { setupShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function loadBest() {
  try { return Number(localStorage.getItem('lodestar-best') ?? 0) || 0; } catch { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem('lodestar-best', String(Math.floor(v))); } catch { /* private mode */ }
}

export function createGame(seed) {
  const rng = makeRng(seed);
  const game = {
    state: 'title',
    time: 0, runTime: 0,
    rng,
    input: null, sound: new SoundKit(), particles: new Particles(rng),
    player: null, bodies: [], mods: defaultMods(),
    director: new StormDirector(rng),
    score: 0, best: loadBest(), charge: 35,
    combo: 0, comboTimer: 0, comboWindow: 2.6, comboPop: 0, maxCombo: 0,
    kills: 0, flings: 0, storm: 1, stormsCleared: 0,
    draftOptions: [], takenUpgrades: new Set(),
    reach: reachForStorm(1), bannerTimer: 0,
    magnetOn: false, wasHeld: false, muted: false,
    onImpact: null, onPlayerHit: null, onPickup: null, onBossArrive: null, onBossCharge: null,
  };
  resetPlayer(game);
  return game;
}

function resetPlayer(game) {
  game.player = {
    x: 640, y: 400, vx: 0, vy: 0, radius: 16,
    hull: 100, maxHull: 100, hitCooldown: 0, secondHeart: false,
  };
}

function wireEvents(game) {
  game.onImpact = (body, dmg, x, y) => {
    game.particles.sparks(x, y, '#ffe9b0', 3);
  };
  game.onPlayerHit = (dmg, body) => {
    if (game.state !== 'playing') return;
    const p = game.player;
    p.hull -= dmg;
    game.combo = 0; game.comboTimer = 0;
    game.particles.burst(p.x, p.y, '#ff5d5d', 16, 300);
    game.particles.shake(0.45);
    game.sound.hurt();
    game.particles.floatText(p.x, p.y - 34, `-${dmg} HULL`, '#ff8a8a', 18);
    if (p.hull <= 0) {
      if (p.secondHeart) {
        p.secondHeart = false;
        p.hull = 40;
        pulseAll(game);
        game.particles.ring(p.x, p.y, '#69f0ae', 320);
        game.particles.floatText(p.x, p.y - 52, 'SECOND HEART', '#69f0ae', 24);
        game.sound.pulse();
      } else {
        endRun(game, false);
      }
    }
  };
  game.onPickup = (b) => {
    if (game.state !== 'playing') return;
    game.player.hull = Math.min(game.player.maxHull, game.player.hull + 6);
    game.charge = Math.min(100, game.charge + 20);
    game.particles.ring(b.x, b.y, '#69f0ae', 46);
    game.particles.floatText(b.x, b.y - 16, '+HULL +CHARGE', '#69f0ae', 14);
    game.sound.pickup();
  };
  game.onBossArrive = (name) => {
    game.particles.floatText(640, 150, name + ' APPROACHES', '#ffb3b3', 30);
    game.sound.bossRoar();
  };
  game.onBossCharge = () => { game.sound.fling(); };
}

function startRun(game) {
  game.rng = makeRng(liveSeed());
  game.particles = new Particles(game.rng);
  game.director = new StormDirector(game.rng);
  game.bodies = [];
  game.mods = defaultMods();
  game.score = 0; game.charge = 35;
  game.combo = 0; game.comboTimer = 0; game.maxCombo = 0;
  game.kills = 0; game.flings = 0;
  game.storm = 1; game.stormsCleared = 0;
  game.takenUpgrades = new Set();
  game.runTime = 0;
  resetPlayer(game);
  beginStorm(game, 1);
  game.state = 'playing';
}

function beginStorm(game, storm) {
  game.storm = storm;
  game.reach = reachForStorm(storm);
  game.bannerTimer = 3;
  game.director.startStorm(game, storm);
  // Opening scrap so the first gather has something to hold.
  for (let i = 0; i < 6; i++) {
    const at = game.director.edgePoint(240);
    game.bodies.push(makeScrap(game.rng, at.x, at.y));
  }
}

function endRun(game, wonGame) {
  game.player.hull = Math.max(0, game.player.hull);
  game.state = wonGame ? 'win' : 'over';
  if (game.score > game.best) { game.best = game.score; saveBest(game.best); }
  if (wonGame) game.sound.win(); else game.sound.lose();
  game.particles.burst(game.player.x, game.player.y, wonGame ? '#ffd166' : '#ff5d5d', 46, 420);
}

function processDead(game) {
  const survivors = [];
  for (const b of game.bodies) {
    if (!b.dead && b.hp > 0) { survivors.push(b); continue; }
    if (b.kind === 'foe') {
      const s = FOE_KINDS[b.foeKind];
      game.combo = Math.min(9, game.combo + 1);
      game.comboTimer = game.comboWindow;
      game.comboPop = 0.25;
      game.maxCombo = Math.max(game.maxCombo, game.combo);
      const gained = Math.round(s.score * Math.max(1, game.combo) * game.mods.scoreMul);
      game.score += gained;
      game.kills++;
      game.charge = Math.min(100, game.charge + 6 * game.mods.chargeRate);
      game.particles.burst(b.x, b.y, s.color, 18, 320);
      game.particles.floatText(b.x, b.y - 10, `+${gained}`, '#ffffff', 17);
      if (game.combo >= 3) game.particles.floatText(b.x, b.y - 32, `CHAIN ×${game.combo}`, '#ffd166', 15);
      game.sound.smash(game.combo);
      if (b.foeKind === 'splitter') {
        for (let i = 0; i < 2; i++) {
          const mini = makeFoe(game.rng, 'skitter', b.x, b.y, 1);
          const a = game.rng.range(0, Math.PI * 2);
          mini.vx = Math.cos(a) * 190; mini.vy = Math.sin(a) * 190;
          survivors.push(mini);
        }
      }
      if (game.rng.chance(0.09)) survivors.push(makeCorePickup(game.rng, b.x, b.y));
    } else if (b.kind === 'boss') {
      const gained = Math.round((b.bossName === 'THE LEVIATHAN COIL' ? 3000 : 1500) * game.mods.scoreMul);
      game.score += gained;
      game.kills++;
      game.particles.burst(b.x, b.y, '#ffd166', 60, 480);
      game.particles.ring(b.x, b.y, '#ffd166', 260);
      game.particles.shake(0.8);
      game.particles.floatText(b.x, b.y, `${b.bossName} BROKEN +${gained}`, '#ffd166', 26);
      game.sound.smash(9);
    } else if (b.kind === 'scrap') {
      game.particles.burst(b.x, b.y, '#c0c7d1', 7, 200);
    }
  }
  game.bodies = survivors;
}

function bossBehaviour(game, dt) {
  for (const b of game.bodies) {
    if (b.kind !== 'boss' || b.dead) continue;
    b.spawnTimer -= dt;
    if (b.spawnTimer <= 0) {
      b.spawnTimer = b.bossName === 'THE LEVIATHAN COIL' ? 3.4 : 4.4;
      const kind = game.rng.pick(['skitter', 'drifter']);
      const minion = makeFoe(game.rng, kind, b.x + game.rng.range(-50, 50), b.y + game.rng.range(-50, 50), 1);
      game.bodies.push(minion);
    }
    const frac = b.hp / b.maxHp;
    const stage = frac > 0.75 ? 0 : frac > 0.5 ? 1 : frac > 0.25 ? 2 : 3;
    if (stage > b.shedStage) { // armour comes off in burning handfuls of scrap
      b.shedStage = stage;
      for (let i = 0; i < 4; i++) {
        const s = makeScrap(game.rng, b.x + game.rng.range(-40, 40), b.y + game.rng.range(-40, 40));
        s.hot = 0.8;
        s.vx = game.rng.range(-220, 220); s.vy = game.rng.range(-220, 220);
        game.bodies.push(s);
      }
      game.particles.floatText(b.x, b.y - b.radius - 18, 'ARMOUR SHED', '#ffb3b3', 16);
    }
  }
}

function updatePlaying(game, dt) {
  const input = game.input;
  const p = game.player;
  game.runTime += dt;
  // The core answers the mouse with a stiff spring — fast, never teleporting.
  const stiffness = 16 * game.mods.coreSpeed;
  p.vx += (input.x - p.x) * stiffness * dt * 8;
  p.vy += (input.y - p.y) * stiffness * dt * 8;
  p.vx *= Math.exp(-dt * 10); p.vy *= Math.exp(-dt * 10);
  p.x += p.vx * dt; p.y += p.vy * dt;
  p.x = Math.max(p.radius, Math.min(WORLD.w - p.radius, p.x));
  p.y = Math.max(p.radius, Math.min(WORLD.h - p.radius, p.y));

  game.magnetOn = input.held;
  if (input.pressedEdge) game.sound.gather();
  if (input.releasedEdge && game.wasHeld) {
    const n = flingAll(game);
    if (n > 0) {
      game.flings++;
      game.sound.fling();
      game.particles.ring(p.x, p.y, game.reach.ring, game.mods.fieldRadius * 0.9);
    }
  }
  game.wasHeld = input.held;
  if (input.pulseEdge && game.charge >= game.mods.pulseCost) {
    game.charge -= game.mods.pulseCost;
    pulseAll(game);
    game.particles.ring(p.x, p.y, '#7ef0ff', game.mods.fieldRadius + 90);
    game.particles.shake(0.3);
    game.sound.pulse();
  }
  game.director.update(game, dt);
  bossBehaviour(game, dt);
  stepPhysics(game, dt);
  processDead(game);
  if (game.comboTimer > 0) {
    game.comboTimer -= dt * game.mods.comboDecay;
    if (game.comboTimer <= 0) game.combo = 0;
  }
  game.comboPop = Math.max(0, game.comboPop - dt);
  game.bannerTimer = Math.max(0, game.bannerTimer - dt);
  if (game.state === 'playing' && game.director.isCleared(game)) {
    game.stormsCleared = game.storm;
    if (game.storm >= 7) { endRun(game, true); return; }
    game.draftOptions = draftThree(game.rng, game.takenUpgrades);
    game.state = 'draft';
    game.sound.draft();
  }
}

function updateTitle(game, dt) {
  // A quiet demo behind the title: scrap circles the Lodestar on its own.
  const p = game.player;
  p.x = 640 + Math.cos(game.time * 0.24) * 130;
  p.y = 400 + Math.sin(game.time * 0.31) * 66;
  game.magnetOn = true;
  const scrapCount = game.bodies.filter((b) => b.kind === 'scrap').length;
  if (scrapCount < 9 && game.rng.chance(dt * 2)) {
    game.bodies.push(makeScrap(game.rng, p.x + game.rng.range(-190, 190), p.y + game.rng.range(-150, 150)));
  }
  stepPhysics(game, dt);
  game.bodies = game.bodies.filter((b) => b.hp > 0);
}

function pickDraft(game, index) {
  const u = game.draftOptions[index];
  if (!u) return;
  u.apply(game.mods, game);
  game.takenUpgrades.add(u.id);
  game.particles.floatText(640, 200, `${u.name} FITTED`, '#ffd166', 24);
  game.sound.draft();
  beginStorm(game, game.storm + 1);
  game.state = 'playing';
}

function handleGlobalInput(game) {
  const input = game.input;
  if (input.muteEdge) game.muted = game.sound.toggleMute();
  if (input.pressedEdge || input.confirmEdge) { game.sound.unlock(); game.sound.startMusic(); }
  if (game.state === 'title' && (input.pressedEdge || input.confirmEdge)) startRun(game);
  else if ((game.state === 'over' || game.state === 'win') && (input.pressedEdge || input.confirmEdge)) startRun(game);
  else if (game.state === 'draft') {
    if (input.draftPick) pickDraft(game, input.draftPick - 1);
    else if (input.pressedEdge) {
      const rects = draftCardRects();
      const i = rects.findIndex((r) => input.x >= r.x && input.x <= r.x + r.w && input.y >= r.y && input.y <= r.y + r.h);
      if (i >= 0) pickDraft(game, i);
    }
  } else if (game.state === 'playing' && input.pauseEdge) game.state = 'paused';
  else if (game.state === 'paused') {
    if (input.pauseEdge) game.state = 'playing';
    else if (input.confirmEdge) startRun(game);
  }
}

export function drawFrame(game) {
  ctx.save();
  const sh = game.particles.shakeOffset();
  ctx.translate(sh.x, sh.y);
  drawSky(ctx, game);
  drawBodies(ctx, game);
  drawPlayer(ctx, game);
  game.particles.draw(ctx);
  ctx.restore();
  if (game.state !== 'title') drawHud(ctx, game);
  drawBossBar(ctx, game);
  if (game.state === 'title') drawTitle(ctx, game);
  if (game.state === 'playing') drawStormBanner(ctx, game);
  if (game.state === 'draft') drawDraft(ctx, game);
  if (game.state === 'paused') drawPause(ctx, game);
  if (game.state === 'over') drawGameOver(ctx, game);
  if (game.state === 'win') drawVictory(ctx, game);
}

// ---- boot ---------------------------------------------------------------
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const game = createGame(shotName ? Number(params.get('seed') ?? 1) : liveSeed());
game.input = new Input(canvas);
wireEvents(game);

if (shotName) {
  setupShot(game, shotName);
  drawFrame(game);
  window.__shotReady = true;
} else {
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    game.time += dt;
    handleGlobalInput(game);
    if (game.state === 'title') updateTitle(game, dt);
    else if (game.state === 'playing') updatePlaying(game, dt);
    game.particles.update(dt);
    drawFrame(game);
    game.input.clearEdges();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

window.__game = game; // play-test hook: scripted runs read state from here
export { game };
