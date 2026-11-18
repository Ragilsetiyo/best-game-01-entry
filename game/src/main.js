// GLOWPATH — main: boot and the one loop. Input is read every frame, the world advances
// in fixed 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between six screens: title, play, paused,
// night-clear, game over and dawn. ?seed=N fixes the night pattern. ?shot=start|play|
// play2|end (with &seed=N) stages that scene instead of running the loop, paints it
// twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_BURN, EVENT_CLEAR, EVENT_FLARE, EVENT_GATE, EVENT_HURT, EVENT_LANTERN, EVENT_OVER, EVENT_SHARD } from './world.js';
import { ACTION_CONFIRM, ACTION_FLARE, ACTION_PAUSE, createInput } from './input.js';
import { playBurn, playClear, playFlare, playGate, playHurt, playOver, playShard } from './audio.js';
import { createRenderer, SCREEN_CLEAR, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function handleEvents(events) {
    if (events & EVENT_SHARD) playShard();
    if (events & EVENT_BURN) playBurn();
    if (events & EVENT_FLARE) playFlare();
    if (events & EVENT_GATE) playGate();
    if (events & EVENT_HURT) playHurt();
    if (events & EVENT_LANTERN) playFlare();
    if (events & EVENT_CLEAR) {
      playClear();
      if (world.night >= 6) {
        screen = SCREEN_WIN;
        if (world.score > best) { best = world.score; saveBest(best); }
      } else {
        screen = SCREEN_CLEAR;
      }
    }
    if (events & EVENT_OVER) {
      playOver();
      screen = SCREEN_OVER;
      if (world.score > best) { best = world.score; saveBest(best); }
    }
  }

  function onAction(action) {
    if (action === ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) screen = SCREEN_PAUSED;
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
      return;
    }
    if (action !== ACTION_CONFIRM) return;
    if (screen === SCREEN_TITLE) {
      world.reset();
      world.scoreAtNightStart = 0;
      screen = SCREEN_PLAY;
    } else if (screen === SCREEN_CLEAR) {
      world.scoreAtNightStart = world.score;
      world.loadNight(world.night + 1);
      screen = SCREEN_PLAY;
    } else if (screen === SCREEN_OVER) {
      world.score = world.scoreAtNightStart;
      world.loadNight(world.night);
      screen = SCREEN_PLAY;
    } else if (screen === SCREEN_WIN) {
      world.reset();
      world.scoreAtNightStart = 0;
      screen = SCREEN_PLAY;
    } else if (screen === SCREEN_PAUSED) {
      world.score = world.scoreAtNightStart;
      world.loadNight(world.night);
      screen = SCREEN_PLAY;
    }
  }

  const input = createInput(canvas, onAction);

  function frame(now) {
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (screen === SCREEN_PLAY) {
      accumulator += elapsed;
      let steps = 0;
      while (accumulator >= STEP && steps < 5) {
        const events = world.step(STEP, {
          move: input.move,
          jump: input.consumeJump(),
          flare: input.consumeFlare(),
        }, false);
        handleEvents(events);
        accumulator -= STEP;
        steps += 1;
        if (screen !== SCREEN_PLAY) break;
      }
      if (steps === 5) accumulator = 0;
    } else {
      input.consumeJump();
      input.consumeFlare();
      world.time += elapsed;
    }
    if (screen === SCREEN_TITLE && input.consumeFlare()) onAction(ACTION_CONFIRM);
    renderer.draw(world, screen, best);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
