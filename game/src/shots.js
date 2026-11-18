// shots.js — the four screenshot scenes. Each is built from the game's real
// factories and stepped through the real physics for a fixed number of fixed
// steps, so what the camera sees is the game itself, deterministic per seed:
// 1-title (the cover), 2-play, 3-draft, 4-win.

import { makeScrap, makeFoe } from './entities.js';
import { stepPhysics, flingAll } from './physics.js';
import { reachForStorm } from './story.js';
import { draftThree } from './upgrades.js';

const DT = 1 / 60;

function step(game, n) {
  for (let i = 0; i < n; i++) {
    game.time += DT;
    stepPhysics(game, DT);
    game.particles.update(DT);
  }
}

function scatter(game, kinds, count, cx, cy, spread) {
  for (let i = 0; i < count; i++) {
    const kind = kinds[i % kinds.length];
    const x = cx + game.rng.range(-spread, spread);
    const y = cy + game.rng.range(-spread * 0.66, spread * 0.66);
    const b = kind === 'scrap'
      ? makeScrap(game.rng, x, y)
      : makeFoe(game.rng, kind, x, y, 1.2);
    game.bodies.push(b);
  }
}

function titleScene(game) {
  game.state = 'title';
  game.player.x = 640; game.player.y = 400;
  game.magnetOn = true;
  scatter(game, ['scrap'], 11, 640, 400, 190);
  scatter(game, ['drifter', 'skitter'], 2, 190, 130, 60);
  scatter(game, ['bulwark'], 1, 1130, 610, 30);
  step(game, 200);
}

function playScene(game) {
  game.state = 'playing';
  game.storm = 5;
  game.reach = reachForStorm(5);
  game.score = 12450; game.best = 30120;
  game.kills = 47; game.flings = 23;
  game.player.x = 520; game.player.y = 390;
  game.player.hull = 68;
  game.charge = 80;
  game.combo = 6; game.comboTimer = 1.9; game.maxCombo = 8;
  game.magnetOn = true;
  scatter(game, ['scrap'], 13, 520, 390, 175);
  scatter(game, ['drifter', 'weaver', 'skitter', 'splitter', 'skitter', 'weaver'], 9, 830, 320, 190);
  scatter(game, ['bulwark', 'drifter'], 2, 1060, 570, 80);
  step(game, 130); // gather into orbit
  game.magnetOn = false;
  flingAll(game); // ...and let go: the still catches the wrecks mid-flight
  step(game, 9);
  // Two wrecks have just landed: sell the impact the still cannot animate.
  const victim = game.bodies.find((b) => b.kind === 'foe');
  if (victim) {
    game.particles.burst(victim.x, victim.y, '#ffd166', 22, 340);
    game.particles.burst(victim.x + 30, victim.y + 14, '#e4572e', 14, 260);
    game.particles.floatText(victim.x, victim.y - 26, '+540', '#ffffff', 19);
    game.particles.floatText(victim.x, victim.y - 50, 'CHAIN ×6', '#ffd166', 16);
  }
  game.comboPop = 0.2;
}

function draftScene(game) {
  game.state = 'draft';
  game.storm = 3;
  game.reach = reachForStorm(3);
  game.score = 8650; game.best = 30120;
  game.kills = 38; game.flings = 19; game.stormsCleared = 3;
  game.player.x = 640; game.player.y = 430;
  game.player.hull = 74;
  game.charge = 45;
  game.draftOptions = draftThree(game.rng, new Set(['catapult']));
  scatter(game, ['scrap'], 7, 640, 430, 260);
  step(game, 40);
}

function winScene(game) {
  game.state = 'win';
  game.storm = 7;
  game.reach = reachForStorm(7);
  game.score = 48210; game.best = 48210;
  game.kills = 132; game.flings = 87;
  game.maxCombo = 9; game.stormsCleared = 7;
  game.runTime = 372;
  game.player.x = 640; game.player.y = 400;
  game.magnetOn = true;
  scatter(game, ['scrap'], 10, 640, 400, 180);
  step(game, 160);
}

export function setupShot(game, name) {
  if (name === 'title') titleScene(game);
  else if (name === 'play') playScene(game);
  else if (name === 'draft') draftScene(game);
  else if (name === 'win') winScene(game);
  else titleScene(game);
}
