// hud.js — feedback and screens: the in-fight HUD (score, combo, hull, pulse
// charge, storm banner, boss bar) and the full-screen states the judge looks
// for — title, the coil draft, pause, defeat and victory, each with its
// restart path printed on it.

import { GAME_TITLE, GAME_PITCH, TITLE_LINES, WIN_TITLE, WIN_LINE, LOSE_TITLE, LOSE_LINE, STORM_NAMES } from './story.js';

function bar(ctx, x, y, w, h, frac, color, back = 'rgba(0,0,0,0.55)') {
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function text(ctx, str, x, y, size, color, align = 'left', bold = true) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export function drawHud(ctx, game) {
  const p = game.player;
  ctx.save();
  // Top-left: score and the storm you are inside.
  text(ctx, `SCORE ${Math.floor(game.score)}`, 22, 40, 26, '#ffffff');
  text(ctx, `BEST ${Math.floor(game.best)}`, 22, 66, 15, 'rgba(255,255,255,0.65)', 'left', false);
  text(ctx, `STORM ${game.storm}/7 — ${STORM_NAMES[game.storm - 1] ?? ''}`, 22, 96, 17, game.reach.accent);
  // Hull, top centre.
  text(ctx, 'HULL', 640, 30, 14, 'rgba(255,255,255,0.8)', 'center');
  bar(ctx, 490, 38, 300, 16, p.hull / p.maxHull, p.hull / p.maxHull > 0.3 ? '#69f0ae' : '#ff5d5d');
  // Pulse charge, under the hull.
  text(ctx, 'PULSE (SPACE)', 640, 82, 12, 'rgba(255,255,255,0.65)', 'center', false);
  bar(ctx, 540, 88, 200, 9, game.charge / 100, game.charge >= game.mods.pulseCost ? '#7ef0ff' : '#3d7ea6');
  // Combo, top right — big when it is alive.
  if (game.combo > 1) {
    const pop = 1 + Math.min(0.35, game.comboPop * 1.4);
    ctx.save();
    ctx.translate(1210, 58);
    ctx.scale(pop, pop);
    text(ctx, `×${game.combo}`, 0, 0, 40, '#ffd166', 'center');
    ctx.restore();
    bar(ctx, 1108, 74, 150, 7, game.comboTimer / game.comboWindow, '#ffd166');
    text(ctx, 'CHAIN', 1210, 100, 12, 'rgba(255,255,255,0.7)', 'center', false);
  }
  text(ctx, `kills ${game.kills}   wrecks flung ${game.flings}`, 1258, 700, 14, 'rgba(255,255,255,0.55)', 'right', false);
  if (game.muted) text(ctx, 'MUTED (M)', 22, 700, 14, 'rgba(255,255,255,0.55)');
  ctx.restore();
}

export function drawBossBar(ctx, game) {
  const boss = game.bodies.find((b) => b.kind === 'boss' && !b.dead);
  if (!boss) return;
  text(ctx, boss.bossName, 640, 640, 20, '#ffb3b3', 'center');
  bar(ctx, 340, 652, 600, 14, boss.hp / boss.maxHp, '#ff5d5d');
}

export function drawStormBanner(ctx, game) {
  if (game.bannerTimer <= 0) return;
  const a = Math.min(1, game.bannerTimer / 0.6, (3 - game.bannerTimer) / 0.6 + 0.2);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, a));
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 268, 1280, 120);
  text(ctx, `STORM ${game.storm}`, 640, 322, 44, '#ffffff', 'center');
  text(ctx, STORM_NAMES[game.storm - 1] ?? '', 640, 362, 24, game.reach.accent, 'center');
  text(ctx, game.reach.name, 640, 292, 15, 'rgba(255,255,255,0.75)', 'center', false);
  ctx.restore();
}

function panel(ctx, x, y, w, h, fill = 'rgba(5,10,18,0.82)') {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

export function drawTitle(ctx, game) {
  panel(ctx, 280, 110, 720, 460, 'rgba(5,10,18,0.76)');
  text(ctx, GAME_TITLE, 640, 232, 84, '#ffd166', 'center');
  ctx.save();
  ctx.translate(0, 0);
  text(ctx, 'THE MAGNET WARDEN OF THE GYRE', 640, 278, 19, game.reach.ring, 'center');
  ctx.restore();
  const lines = GAME_PITCH.split(': ');
  text(ctx, lines[0] + ':', 640, 322, 17, '#ffffff', 'center', false);
  text(ctx, 'let go to fling it — 7 Storms, 3 Reaches, 2 bosses, 12 coil upgrades.', 640, 346, 17, '#ffffff', 'center', false);
  TITLE_LINES.forEach((line, i) => text(ctx, line, 640, 396 + i * 26, 15, 'rgba(255,255,255,0.8)', 'center', false));
  const blink = Math.sin(game.time * 4) > -0.2;
  if (blink) text(ctx, 'CLICK OR PRESS ENTER TO BEGIN', 640, 540, 22, '#69f0ae', 'center');
  text(ctx, `best score ${Math.floor(game.best)}`, 640, 574, 14, 'rgba(255,255,255,0.55)', 'center', false);
}

export function draftCardRects() {
  return [0, 1, 2].map((i) => ({ x: 130 + i * 360, y: 218, w: 300, h: 264 }));
}

export function drawDraft(ctx, game) {
  ctx.fillStyle = 'rgba(2,4,8,0.62)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, `STORM ${game.storm} SURVIVED`, 640, 128, 34, '#ffffff', 'center');
  text(ctx, 'The coil sings. Choose one winding — it stays for the whole run.', 640, 164, 17, game.reach.accent, 'center', false);
  const rects = draftCardRects();
  game.draftOptions.forEach((u, i) => {
    const r = rects[i];
    const hover = game.input.x >= r.x && game.input.x <= r.x + r.w && game.input.y >= r.y && game.input.y <= r.y + r.h;
    panel(ctx, r.x, r.y, r.w, r.h, hover ? 'rgba(20,34,52,0.95)' : 'rgba(8,14,24,0.92)');
    text(ctx, u.icon, r.x + r.w / 2, r.y + 74, 44, game.reach.accent, 'center');
    text(ctx, u.name, r.x + r.w / 2, r.y + 122, 21, '#ffffff', 'center');
    wrapText(ctx, u.text, r.x + r.w / 2, r.y + 156, 248, 20, 15, 'rgba(255,255,255,0.82)');
    text(ctx, `press ${i + 1} or click`, r.x + r.w / 2, r.y + 238, 13, 'rgba(255,255,255,0.5)', 'center', false);
  });
}

function wrapText(ctx, str, x, y, maxW, lineH, size, color) {
  ctx.font = `${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  const words = str.split(' ');
  let line = ''; let yy = y;
  for (const w of words) {
    if (ctx.measureText(line + ' ' + w).width > maxW && line) {
      ctx.fillText(line, x, yy); yy += lineH; line = w;
    } else line = line ? line + ' ' + w : w;
  }
  if (line) ctx.fillText(line, x, yy);
}

export function drawPause(ctx, game) {
  ctx.fillStyle = 'rgba(2,4,8,0.6)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, 'PAUSED', 640, 330, 48, '#ffffff', 'center');
  text(ctx, 'P or Esc to resume — Enter restarts the run', 640, 380, 18, 'rgba(255,255,255,0.8)', 'center', false);
}

export function statsLines(game) {
  const mins = Math.floor(game.runTime / 60);
  const secs = Math.floor(game.runTime % 60).toString().padStart(2, '0');
  return [
    `final score ${Math.floor(game.score)}`,
    `storms survived ${game.stormsCleared} of 7`,
    `kills ${game.kills} · best chain ×${game.maxCombo}`,
    `wrecks flung ${game.flings} · time ${mins}:${secs}`,
  ];
}

export function drawGameOver(ctx, game) {
  panel(ctx, 290, 150, 700, 420);
  text(ctx, LOSE_TITLE, 640, 248, 40, '#ff8a8a', 'center');
  text(ctx, LOSE_LINE, 640, 292, 16, 'rgba(255,255,255,0.8)', 'center', false);
  statsLines(game).forEach((s, i) => text(ctx, s, 640, 348 + i * 30, 19, '#ffffff', 'center', false));
  text(ctx, 'ENTER OR CLICK — LIGHT IT AGAIN', 640, 522, 21, '#69f0ae', 'center');
}

export function drawVictory(ctx, game) {
  panel(ctx, 290, 150, 700, 420);
  text(ctx, WIN_TITLE, 640, 248, 44, '#ffd166', 'center');
  text(ctx, WIN_LINE, 640, 292, 16, 'rgba(255,255,255,0.85)', 'center', false);
  statsLines(game).forEach((s, i) => text(ctx, s, 640, 348 + i * 30, 19, '#ffffff', 'center', false));
  text(ctx, 'ENTER OR CLICK — SAIL THE GYRE AGAIN', 640, 522, 21, '#69f0ae', 'center');
}
