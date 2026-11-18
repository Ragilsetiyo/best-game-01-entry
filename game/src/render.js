// GLOWPATH — render: paints the dark world, the pools of light in it, the HUD and
// every screen. The look is the game: deep indigo night, warm amber light, and a moth
// small against both. Light is drawn as holes punched in a darkness sheet, then as a
// soft additive glow, so a lit lantern genuinely lights its corner of the night.
import { FLARE_RADIUS, LANTERN_RADIUS, LIGHT_MAX, PLAYER, VIEW } from './config.js';
import { playerGlowRadius } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const INK = '#e8ecff';
const DIM = '#8b93b8';
const AMBER = '#ffcf6e';
const AMBER_DEEP = '#ffb347';

export function createRenderer(canvas) {
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  const ctx = canvas.getContext('2d');
  const dark = document.createElement('canvas');
  dark.width = VIEW.width;
  dark.height = VIEW.height;
  const dctx = dark.getContext('2d');

  function drawBackground(world) {
    const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
    g.addColorStop(0, '#0b1030');
    g.addColorStop(0.55, '#0a0d24');
    g.addColorStop(1, '#05070f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    // Stars, twinkling on their own slow clock.
    for (const s of world.stars) {
      const a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(world.time * 0.9 + s.tw));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#cdd8ff';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;
    // Far hills: two dark ridges the night sits behind.
    ctx.fillStyle = '#0d1233';
    ctx.beginPath();
    ctx.moveTo(0, 560);
    for (let x = 0; x <= VIEW.width; x += 40) ctx.lineTo(x, 560 - 46 * Math.sin(x * 0.004 + 1.2));
    ctx.lineTo(VIEW.width, VIEW.height);
    ctx.lineTo(0, VIEW.height);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#080b1e';
    ctx.beginPath();
    ctx.moveTo(0, 620);
    for (let x = 0; x <= VIEW.width; x += 40) ctx.lineTo(x, 620 - 30 * Math.sin(x * 0.006 + 4.0));
    ctx.lineTo(VIEW.width, VIEW.height);
    ctx.lineTo(0, VIEW.height);
    ctx.closePath();
    ctx.fill();
    // A low moon, the one light no lantern owns.
    const mg = ctx.createRadialGradient(1120, 92, 6, 1120, 92, 70);
    mg.addColorStop(0, 'rgba(235, 240, 255, 0.9)');
    mg.addColorStop(0.25, 'rgba(200, 212, 255, 0.35)');
    mg.addColorStop(1, 'rgba(200, 212, 255, 0)');
    ctx.fillStyle = mg;
    ctx.fillRect(1040, 12, 160, 160);
    ctx.fillStyle = '#eef2ff';
    ctx.beginPath();
    ctx.arc(1120, 92, 26, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = '#c9d2f2';
    ctx.beginPath();
    ctx.arc(1112, 86, 6, 0, 6.2832);
    ctx.arc(1130, 100, 4, 0, 6.2832);
    ctx.fill();
  }

  function drawPlatforms(world) {
    for (const plat of world.platforms) {
      const lit = world.lanterns.some((l) => l.lit && Math.abs(l.x - (plat.x + plat.w / 2)) < 260 && Math.abs(l.y - plat.y) < 160);
      ctx.fillStyle = lit ? '#333d66' : '#232b52';
      roundRect(plat.x, plat.y, plat.w, plat.h, 6);
      ctx.fill();
      ctx.fillStyle = lit ? AMBER : '#4d5a94';
      ctx.fillRect(plat.x, plat.y, plat.w, 4);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(plat.x, plat.y + plat.h - 5, plat.w, 5);
    }
  }

  function drawGate(world) {
    const gx = world.gate.x;
    const gy = world.gate.y;
    ctx.save();
    ctx.translate(gx, gy);
    ctx.fillStyle = '#232c52';
    roundRect(-34, -96, 68, 96, 10);
    ctx.fill();
    ctx.fillStyle = world.gateOpen ? '#ffd97a' : '#10142c';
    roundRect(-22, -84, 44, 84, 8);
    ctx.fill();
    if (world.gateOpen) {
      const g = ctx.createRadialGradient(0, -40, 4, 0, -40, 90);
      g.addColorStop(0, 'rgba(255, 214, 120, 0.85)');
      g.addColorStop(1, 'rgba(255, 214, 120, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(-90, -130, 180, 180);
      ctx.fillStyle = '#fff3c4';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DAWN', 0, -104);
    } else {
      ctx.fillStyle = DIM;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOCKED', 0, -104);
      const locked = world.shardsTotal - world.shardsTaken;
      ctx.fillStyle = '#9fe8ff';
      ctx.font = '13px sans-serif';
      ctx.fillText(`${locked} shard${locked === 1 ? '' : 's'} to open`, 0, -84 + 96 + 18);
    }
    ctx.restore();
  }

  function drawLanterns(world) {
    for (const l of world.lanterns) {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.strokeStyle = '#39406b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -52);
      ctx.stroke();
      ctx.strokeStyle = '#4a5488';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-14, -52);
      ctx.lineTo(14, -52);
      ctx.stroke();
      if (l.lit) {
        const g = ctx.createRadialGradient(0, -34, 2, 0, -34, 46);
        g.addColorStop(0, 'rgba(255, 207, 110, 0.95)');
        g.addColorStop(1, 'rgba(255, 207, 110, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(-46, -80, 92, 92);
        ctx.fillStyle = '#ffe9ad';
        ctx.beginPath();
        ctx.arc(0, -34, 11, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = '#fff8dd';
        ctx.beginPath();
        ctx.arc(0, -34, 6, 0, 6.2832);
        ctx.fill();
      } else {
        ctx.fillStyle = '#2c355e';
        ctx.beginPath();
        ctx.arc(0, -34, 10, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = '#556199';
        ctx.beginPath();
        ctx.arc(-3, -37, 3, 0, 6.2832);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawShards(world) {
    for (const s of world.shards) {
      if (s.taken) continue;
      const pulse = 0.75 + 0.25 * Math.sin(world.time * 3 + s.phase);
      const x = s.x;
      const y = s.y + Math.sin(world.time * 2 + s.phase) * 3;
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#9fe8ff';
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(4, -4);
      ctx.lineTo(13, 0);
      ctx.lineTo(4, 4);
      ctx.lineTo(0, 13);
      ctx.lineTo(-4, 4);
      ctx.lineTo(-13, 0);
      ctx.lineTo(-4, -4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, 6.2832);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawWisps(world) {
    for (const w of world.wisps) {
      if (w.dead) continue;
      const wob = Math.sin(w.wobble * 2) * 3;
      ctx.save();
      ctx.translate(w.x, w.y + wob);
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
      g.addColorStop(0, 'rgba(88, 60, 160, 0.9)');
      g.addColorStop(1, 'rgba(88, 60, 160, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(-26, -26, 52, 52);
      ctx.fillStyle = '#3a2a6e';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(-5, -3, 2.6, 0, 6.2832);
      ctx.arc(5, -3, 2.6, 0, 6.2832);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPlayer(world) {
    const p = world.player;
    const cx = p.x + PLAYER.width / 2;
    const cy = p.y + PLAYER.height / 2;
    const flap = Math.sin(p.wing) * 0.9;
    ctx.save();
    ctx.translate(cx, cy);
    // Glow the moth carries with it.
    const glowR = playerGlowRadius(world);
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, glowR);
    g.addColorStop(0, 'rgba(255, 207, 110, 0.28)');
    g.addColorStop(1, 'rgba(255, 207, 110, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(-glowR, -glowR, glowR * 2, glowR * 2);
    // Wings, flapping; amber above, dusk below.
    ctx.fillStyle = 'rgba(255, 190, 90, 0.9)';
    ctx.beginPath();
    ctx.ellipse(-8 * p.face, -8 - flap * 4, 12, 7 + flap * 3, -0.5 * p.face, 0, 6.2832);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8 * p.face, -8 - flap * 4, 12, 7 + flap * 3, 0.5 * p.face, 0, 6.2832);
    ctx.fill();
    // Body.
    ctx.fillStyle = '#3a2a18';
    ctx.beginPath();
    ctx.ellipse(0, 2, 6, 11, 0, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = '#ffe9ad';
    ctx.beginPath();
    ctx.arc(0, -8, 4.5, 0, 6.2832);
    ctx.fill();
    ctx.restore();
    // Flare ring while a flare is still expanding.
    if (world.flareFx > 0) {
      const t = 1 - world.flareFx / 0.45;
      ctx.strokeStyle = `rgba(255, 217, 122, ${0.9 * (1 - t)})`;
      ctx.lineWidth = 5 * (1 - t) + 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 30 + t * (FLARE_RADIUS - 30), 0, 6.2832);
      ctx.stroke();
    }
  }

  function drawParticles(world) {
    for (const pt of world.particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.max);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function punchLight(x, y, radius, strength) {
    const g = dctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(0,0,0,${strength})`);
    g.addColorStop(0.6, `rgba(0,0,0,${strength * 0.55})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = g;
    dctx.beginPath();
    dctx.arc(x, y, radius, 0, 6.2832);
    dctx.fill();
  }

  function drawLighting(world) {
    dctx.clearRect(0, 0, VIEW.width, VIEW.height);
    dctx.globalCompositeOperation = 'source-over';
    dctx.fillStyle = 'rgba(3, 5, 16, 0.5)';
    dctx.fillRect(0, 0, VIEW.width, VIEW.height);
    dctx.globalCompositeOperation = 'destination-out';
    const p = world.player;
    punchLight(p.x + PLAYER.width / 2, p.y + PLAYER.height / 2, playerGlowRadius(world) + 26, 0.96);
    for (const l of world.lanterns) {
      if (l.lit) punchLight(l.x, l.y - 34, LANTERN_RADIUS + 10, 0.95);
    }
    if (world.gateOpen) punchLight(world.gate.x, world.gate.y - 50, 120, 0.9);
    for (const s of world.shards) {
      if (!s.taken) punchLight(s.x, s.y, 64, 0.7);
    }
    ctx.drawImage(dark, 0, 0);
  }

  // Dust motes drifting in the dark: the night is empty, never dead.
  function drawMotes(world) {
    for (let i = 0; i < 42; i += 1) {
      const x = (i * 197.3 + Math.sin(world.time * 0.11 + i) * 14) % VIEW.width;
      const y = (i * 89.7 + Math.cos(world.time * 0.07 + i * 2) * 10) % 640 + 30;
      const a = 0.1 + 0.16 * (0.5 + 0.5 * Math.sin(world.time * 0.8 + i * 1.7));
      ctx.globalAlpha = a;
      ctx.fillStyle = i % 3 === 0 ? '#9fe8ff' : '#ffcf6e';
      ctx.beginPath();
      ctx.arc(x < 0 ? x + VIEW.width : x, y, 1.6, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawHud(world, best) {
    // Light meter, top left.
    ctx.save();
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(5, 8, 20, 0.55)';
    roundRect(18, 14, 250, 46, 10);
    ctx.fill();
    ctx.fillStyle = AMBER;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('LIGHT', 30, 32);
    const frac = world.light / LIGHT_MAX;
    ctx.fillStyle = '#1c2347';
    roundRect(30, 38, 200, 12, 6);
    ctx.fill();
    const lg = ctx.createLinearGradient(30, 0, 230, 0);
    lg.addColorStop(0, '#ff9d4d');
    lg.addColorStop(1, '#ffe9ad');
    ctx.fillStyle = lg;
    if (frac > 0.01) {
      roundRect(30, 38, Math.max(8, 200 * frac), 12, 6);
      ctx.fill();
    }
    if (world.light < 25) {
      ctx.fillStyle = Math.sin(world.time * 8) > 0 ? '#ff6b6b' : '#ffb3b3';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('LOW', 236, 32);
    }
    // Night + shards, top centre.
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(5, 8, 20, 0.55)';
    roundRect(500, 14, 280, 46, 10);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`NIGHT ${world.night} / ${6}`, 640, 34);
    ctx.fillStyle = '#9fe8ff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`◆ ${world.shardsTaken} / ${world.shardsTotal} shards`, 640, 52);
    // Score, top right.
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(5, 8, 20, 0.55)';
    roundRect(1012, 14, 250, 46, 10);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`SCORE ${world.score}`, 1250, 34);
    ctx.fillStyle = DIM;
    ctx.font = '13px sans-serif';
    ctx.fillText(`BEST ${best}`, 1250, 52);
    // Hint line, bottom.
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(232, 236, 255, 0.75)';
    ctx.font = '13px sans-serif';
    ctx.fillText('← → move   ↑ / W jump   SPACE or CLICK flare (burns wisps, kindles lanterns)   P pause', 640, 700);
    ctx.restore();
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = 'rgba(6, 9, 24, 0.82)';
    roundRect(x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 207, 110, 0.45)';
    ctx.lineWidth = 2;
    roundRect(x, y, w, h, 16);
    ctx.stroke();
  }

  function drawTitle(world, best) {
    ctx.fillStyle = 'rgba(4, 6, 16, 0.4)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    // A backing pill keeps every line readable over whatever the night shows behind it.
    // It is a solid card: even at 0.88 opacity a lantern pole and a platform edge
    // still ghosted through it and crossed the controls line in the title shot.
    // The night still shows above and below the card, and at its left and right edges.
    ctx.fillStyle = '#050814';
    roundRect(300, 160, 680, 440, 18);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = AMBER;
    ctx.font = 'bold 92px Georgia, serif';
    ctx.fillText('GLOWPATH', 640, 250);
    ctx.fillStyle = INK;
    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillText('Carry the last light home', 640, 296);
    ctx.fillStyle = '#cdd8ff';
    ctx.font = '17px sans-serif';
    ctx.fillText('The night eats light. Lanterns give it back. Wisps fear it.', 640, 350);
    ctx.fillText('Gather every star-shard, open the Dawn Gate, and see the morning.', 640, 378);
    ctx.fillStyle = DIM;
    ctx.font = '15px sans-serif';
    ctx.fillText('← → or A D move      ↑ / W / SPACE jump      CLICK or SPACE flare      P pause', 640, 430);
    ctx.fillStyle = AMBER;
    ctx.font = 'bold 20px sans-serif';
    const blink = 0.6 + 0.4 * Math.sin(world.time * 3);
    ctx.globalAlpha = blink;
    ctx.fillText('Press ENTER or CLICK to begin', 640, 490);
    ctx.globalAlpha = 1;
    if (best > 0) {
      ctx.fillStyle = DIM;
      ctx.font = '15px sans-serif';
      ctx.fillText(`Best score: ${best}`, 640, 524);
    }
    ctx.fillStyle = 'rgba(232, 236, 255, 0.55)';
    ctx.font = '13px sans-serif';
    ctx.fillText('Six nights. One small moth. All the light you can carry.', 640, 566);
  }

  function drawPaused(world) {
    ctx.fillStyle = 'rgba(4, 6, 16, 0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    panel(440, 250, 400, 200);
    ctx.textAlign = 'center';
    ctx.fillStyle = INK;
    ctx.font = 'bold 40px Georgia, serif';
    ctx.fillText('PAUSED', 640, 320);
    ctx.fillStyle = DIM;
    ctx.font = '16px sans-serif';
    ctx.fillText('Press P or ESC to keep flying', 640, 360);
    ctx.fillText('ENTER restarts this night', 640, 388);
  }

  function drawClear(world) {
    ctx.fillStyle = 'rgba(4, 6, 16, 0.5)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    panel(390, 210, 500, 280);
    ctx.textAlign = 'center';
    ctx.fillStyle = AMBER;
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText(`Night ${world.night} clear`, 640, 290);
    ctx.fillStyle = INK;
    ctx.font = '18px sans-serif';
    ctx.fillText(`All ${world.shardsTotal} shards gathered — the gate opened.`, 640, 330);
    ctx.fillText(`Score ${world.score}`, 640, 362);
    ctx.fillStyle = DIM;
    ctx.font = '15px sans-serif';
    ctx.fillText(world.night < 6 ? 'The next night is darker. The light is thinner.' : '', 640, 396);
    ctx.fillStyle = AMBER;
    ctx.font = 'bold 19px sans-serif';
    const blink = 0.6 + 0.4 * Math.sin(world.time * 3);
    ctx.globalAlpha = blink;
    ctx.fillText('Press ENTER for the next night', 640, 444);
    ctx.globalAlpha = 1;
  }

  function drawOver(world, best) {
    ctx.fillStyle = 'rgba(4, 6, 16, 0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    panel(390, 200, 500, 300);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText('The light went out', 640, 280);
    ctx.fillStyle = INK;
    ctx.font = '18px sans-serif';
    ctx.fillText(`Night ${world.night} — score ${world.score} — best ${best}`, 640, 322);
    ctx.fillStyle = DIM;
    ctx.font = '15px sans-serif';
    ctx.fillText('Lanterns refill your light. Flares burn wisps back.', 640, 356);
    ctx.fillText('Stay near the light, and the dark cannot have you.', 640, 382);
    ctx.fillStyle = AMBER;
    ctx.font = 'bold 19px sans-serif';
    const blink = 0.6 + 0.4 * Math.sin(world.time * 3);
    ctx.globalAlpha = blink;
    ctx.fillText('Press ENTER to try this night again', 640, 440);
    ctx.globalAlpha = 1;
  }

  function drawWin(world, best) {
    const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
    g.addColorStop(0, '#ffe9ad');
    g.addColorStop(0.5, '#ffb347');
    g.addColorStop(1, '#e2725b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff8dd';
    ctx.beginPath();
    ctx.arc(640, 220, 90, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 248, 221, 0.5)';
    ctx.beginPath();
    ctx.arc(640, 220, 150, 0, 6.2832);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3a2408';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('DAWN BREAKS', 640, 420);
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillText('Six nights carried home. The moth outlasted the dark.', 640, 462);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Final score ${world.score}   •   Best ${best}`, 640, 508);
    ctx.font = 'bold 19px sans-serif';
    const blink = 0.6 + 0.4 * Math.sin(world.time * 3);
    ctx.globalAlpha = blink;
    ctx.fillText('Press ENTER to fly again', 640, 560);
    ctx.globalAlpha = 1;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  return {
    draw(state, screen, best) {
      const world = state;
      if (screen === SCREEN_WIN) {
        drawWin(world, best);
        return;
      }
      drawBackground(world);
      drawMotes(world);
      drawPlatforms(world);
      drawGate(world);
      drawLanterns(world);
      drawShards(world);
      drawWisps(world);
      drawPlayer(world);
      drawParticles(world);
      drawLighting(world);
      if (screen === SCREEN_TITLE) drawTitle(world, best);
      else if (screen === SCREEN_PAUSED) { drawHud(world, best); drawPaused(world); }
      else if (screen === SCREEN_CLEAR) { drawHud(world, best); drawClear(world); }
      else if (screen === SCREEN_OVER) { drawHud(world, best); drawOver(world, best); }
      else drawHud(world, best);
    },
  };
}
