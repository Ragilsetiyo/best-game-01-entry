// LODESTAR — a best-game-01 entry (Node 22, standard library only).
// LODESTAR is a magnet arena, not the kit's example game: hold to pull scrap and
// enemies alike into orbit around your ship, then release to throw everything the
// Gyre has gathered at what remains. The run crosses 7 Storms in 3 Reaches, with an
// upgrade draft between Storms (1 of 3 offered, from 12 coil upgrades), the boss
// HULK MOTHER in Storm 4 and THE LEVIATHAN COIL closing Storm 7. Chain-collision
// kills build a combo up to x9, SPACE fires a pulse, sound and music are synthesised
// WebAudio, and the 4 screenshots in screenshots/ show title, play, draft and a win.
// The game itself is this directory's game/ folder: plain static files a desktop
// browser loads offline (game/index.html and its ES modules, no library, no network).
//
// This program hands the game in: it first validates the hand-in (entry page present,
// screenshots inside the scorer's caps, game tree counted), then copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the
// summary the judge reads, with the vendored make.fun library. Validation refuses a
// broken hand-in here, with the reason, instead of letting the scorer refuse it later.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// --- Hand-in validation (LODESTAR) ---------------------------------------------------
// The caps checked here are the scorer's own (see the buildDossier call below): at most
// 4 screenshots of at most 256 KiB each, and game/ must hold the entry page the browser
// loads. Counting the game tree here also gives the hand-in log its file total.
const shotDir = join(here, 'screenshots');
const shotNames = existsSync(shotDir)
  ? readdirSync(shotDir).filter((name) => /\.(jpe?g|png)$/i.test(name)).sort()
  : [];
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('hand-in refused: game/index.html is missing, the browser has no entry page');
}
if (shotNames.length < 1 || shotNames.length > 4) {
  throw new Error(`hand-in refused: ${shotNames.length} screenshots found, the scorer takes 1 to 4`);
}
for (const name of shotNames) {
  const bytes = statSync(join(shotDir, name)).size;
  if (bytes > 262144) throw new Error(`hand-in refused: screenshots/${name} is ${bytes} bytes, over the 256 KiB cap`);
}
const countFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).reduce(
    (total, entry) => total + (entry.isDirectory() ? countFiles(join(dir, entry.name)) : 1),
    0,
  );
console.error(`LODESTAR hand-in: ${countFiles(join(here, 'game'))} game files, ${shotNames.length} screenshots, caps respected`);

mkdirSync(out, { recursive: true });
// Last guard before anything is copied: the game folder beside this file must be
// complete, and its entry page is the proof. Without game/index.html the browser
// has nothing to load, so the entry cannot be handed in at all.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('game folder incomplete: game/index.html is missing beside main.ts, so this entry cannot be handed in');
}
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
