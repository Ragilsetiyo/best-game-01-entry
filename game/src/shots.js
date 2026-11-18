// GLOWPATH — shots: the scenes behind ?shot=start|play|play2|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered by a simple
// autopilot (head for the nearest shard, then the gate; jump when the way is blocked or the
// target is above; flare when a wisp closes in or an unlit lantern is near), so the frame
// is what a short game really looks like and the same seed always gives the same frame.
import { STEP } from './config.js';
import { EVENT_CLEAR, EVENT_OVER } from './world.js';
import { SCREEN_CLEAR, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const SAMPLE = 1 / 30;

/** No platform hangs within `height` px above the moth's head at its current x. */
function headroomClear(world, height = 165) {
  const p = world.player;
  for (const plat of world.platforms) {
    if (p.x + 26 > plat.x - 4 && p.x < plat.x + plat.w + 4
      && plat.y + plat.h > p.y - height && plat.y < p.y) return false;
  }
  return true;
}

/**
 * A platform top 30–165 px above the moth's feet whose near edge is ahead within one
 * jump's travel (about 190 px) in `move`'s direction: jumping now carries the moth
 * over the edge and onto it. Jumping from directly underneath only bumps its head,
 * and a platform more than one jump's rise above the moth's feet cannot be reached
 * from here at all — the moth must climb via a lower platform first.
 */
function platformEdgeAhead(world, move) {
  if (move === 0) return false;
  const p = world.player;
  const feet = p.y + 30;
  for (const plat of world.platforms) {
    const rise = feet - plat.y;
    if (rise < 30 || rise > 165) continue;
    if (move > 0 && p.x + 26 >= plat.x - 190 && p.x + 26 < plat.x + 10) return true;
    if (move < 0 && p.x <= plat.x + plat.w + 190 && p.x > plat.x + plat.w - 10) return true;
  }
  return false;
}

/**
 * The nearest platform top within one jump's rise that lies on the way toward
 * `targetX`: the next rung of the climb when the target is more than one jump up.
 */
function nearestStep(world, targetX) {
  const p = world.player;
  const feet = p.y + 30;
  let best = null;
  let bestScore = Infinity;
  for (const plat of world.platforms) {
    const rise = feet - plat.y;
    if (rise < 30 || rise > 165) continue;
    const centerX = plat.x + plat.w / 2;
    const score = Math.abs(centerX - (p.x + 13)) + Math.abs(centerX - targetX) * 0.5;
    if (score < bestScore) { bestScore = score; best = plat; }
  }
  return best;
}

/**
 * Where to jump from to land on `step`: just outside its near edge, on the side
 * the moth stands on. Jumping from directly underneath only bumps its head, and
 * standing still under a platform while the target hangs above it is a deadlock
 * (proven by the night-3 trace: the moth sat at x=170 for 150 s, 0 shards).
 */
function climbJumpPoint(world, step) {
  const cx = world.player.x + 13;
  const center = step.x + step.w / 2;
  if (cx < center) return { x: step.x - 56, y: step.y };
  return { x: step.x + step.w + 30, y: step.y };
}

/** Steer the moth: -1, 0 or 1, plus jump and flare flags. */
function autopilot(world) {
  const p = world.player;
  const cx = p.x + 13;
  const cy = p.y + 15;
  let target = null;
  let bestD = Infinity;
  for (const s of world.shards) {
    if (s.taken) continue;
    const d = Math.abs(s.x - cx) + Math.abs(s.y - cy);
    if (d < bestD) { bestD = d; target = s; }
  }
  if (!target && world.gateOpen) target = { x: world.gate.x, y: world.gate.y - 60 };
  if (!target) return { move: 0, jump: false, flare: false };
  // Light running low: a lit lantern refills it. Two guards stop the moth
  // yo-yoing at a lantern glow's edge: hysteresis (seek below 25, stop above 60)
  // and, once the gate is open, the exit is seconds away — push through unless
  // the light is nearly gone.
  const needLight = world.gateOpen ? world.light < 12 : world.light < 25;
  if (world.light > 60) autopilot.refilling = false;
  if (needLight) autopilot.refilling = true;
  if (autopilot.refilling) {
    let lantern = null;
    let bestDL = Infinity;
    for (const l of world.lanterns) {
      if (!l.lit) continue;
      const d = Math.abs(l.x - cx);
      if (d < bestDL) { bestDL = d; lantern = l; }
    }
    if (lantern) target = { x: lantern.x, y: lantern.y - 40 };
  }
  // More than one jump above the moth's feet: climb via the nearest platform top.
  // The rung is chosen once, on the ground, and kept for the whole jump: re-picking
  // mid-flight flips the moth between two rungs and it lands where it started
  // (night-6 trace: jumping in place at x=1035, the (980,430) rung stealing the
  // (1140,540) rung mid-air).
  let waypoint = target;
  let climbPlat = null;
  if (target.y < (p.y + 30) - 130) {
    let step;
    if (p.onGround) {
      step = nearestStep(world, target.x);
      autopilot.climbPlat = step;
      autopilot.climbFor = target;
    } else if (autopilot.climbPlat && autopilot.climbFor === target) {
      step = autopilot.climbPlat;
    } else {
      step = nearestStep(world, target.x);
    }
    if (step) {
      climbPlat = step;
      waypoint = climbJumpPoint(world, step);
    }
  }
  let move;
  // An edge-drop ends once the moth lands on a different level or the floor;
  // merely going airborne does not end it, or the moth steers back onto the
  // platform it just left and the drop loops forever.
  if (p.onGround && autopilot.dropping
    && Math.abs((p.y + 30) - (autopilot.dropFeet ?? p.y + 30)) > 4) autopilot.dropping = 0;
  if (p.y + 30 >= 655) autopilot.dropping = 0;
  if (!p.onGround) {
    if (autopilot.dropping) {
      // Dropping off a platform: keep drifting away from it until the moth lands
      // somewhere lower, or it steers back on and the drop loops forever.
      move = autopilot.dropping;
    } else {
      // Airborne: keep flying toward the climb's platform, not the shard beyond it
      // — steering at the shard mid-jump kills the horizontal carry and the moth
      // falls straight back down (night-6 trace: jumping in place at x=1035).
      const airX = climbPlat ? climbPlat.x + climbPlat.w / 2 : target.x;
      move = airX > cx + 10 ? 1 : airX < cx - 10 ? -1 : 0;
    }
  } else {
    // A target far below (the gate, a shard on the ground) must still pull the
    // moth off a platform's edge: a wide deadzone strands it above the target
    // (proven by the night-3 trace: parked at x=1160, 70 px from the open gate).
    const deadzone = target.y > cy + 60 ? 2 : 10;
    const dx = waypoint.x - cx;
    move = dx > deadzone ? 1 : dx < -deadzone ? -1 : 0;
    if (move === 0 && target.y > cy + 60) {
      // Standing on a platform directly above the target below: walk off its
      // nearest edge and drop down (night-6 trace: parked at x=1165 above the gate).
      const feet = p.y + 30;
      for (const plat of world.platforms) {
        if (Math.abs(plat.y - feet) < 4 && cx > plat.x && cx < plat.x + plat.w) {
          move = (cx - plat.x < plat.x + plat.w - cx) ? -1 : 1;
          autopilot.dropping = move;
          autopilot.dropFeet = feet;
          break;
        }
      }
    }
    // Commit to the drop: keep walking to the edge instead of flip-flopping
    // between "walk to the gate" and "walk off" (proven by the debug: -1/+1
    // alternating forever between x=1160.2 and x=1165.2).
    if (autopilot.dropping && p.y + 30 < 655) move = autopilot.dropping;
  }
  let jump = false;
  if (p.onGround && waypoint.y < cy - 50) {
    if (platformEdgeAhead(world, move)) jump = true;
    else if (headroomClear(world) && Math.abs(waypoint.x - cx) < 24) jump = true;
  }
  // A climb jump with no horizontal input falls straight back down: push toward the platform.
  if (jump && move === 0 && climbPlat) {
    move = (climbPlat.x + climbPlat.w / 2) > cx ? 1 : -1;
  }
  // Stuck against something while pushing: hop to get over it.
  if (p.onGround && move !== 0) {
    const moved = Math.abs(p.x - (autopilot.lastX ?? p.x));
    autopilot.stuck = moved < 1 ? (autopilot.stuck ?? 0) + 1 : 0;
    if (autopilot.stuck > 12) { jump = true; autopilot.stuck = 0; }
  } else autopilot.stuck = 0;
  autopilot.lastX = p.x;
  let flare = false;
  for (const w of world.wisps) {
    if (w.dead) continue;
    const d = Math.hypot(w.x - cx, w.y - cy);
    if (d < 150 && world.light > 35) { flare = true; break; }
  }
  if (!flare) {
    for (const l of world.lanterns) {
      if (l.lit) continue;
      const d = Math.hypot(l.x - cx, (l.y - 34) - cy);
      if (d < 140 && world.light > 35) { flare = true; break; }
    }
  }
  return { move, jump, flare };
}

/** Play one night with the autopilot until it clears or ends; returns true on clear. */
function playNight(world, maxSeconds) {
  const steps = Math.floor(maxSeconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const events = world.step(STEP, autopilot(world), true);
    if (events & EVENT_CLEAR) return true;
    if (events & EVENT_OVER) return false;
  }
  return false;
}

/**
 * Play `night` for up to `seconds`, stopping as soon as `minShards` shards are
 * collected — the frame is play in progress, never a cleared night. If the night
 * is cleared or lost before that (it should not be: clearing needs every shard),
 * restart it and play a shorter stretch instead.
 */
function playUntil(world, night, seconds, minShards) {
  const run = (secs) => {
    world.loadNight(night);
    const steps = Math.floor(secs / STEP);
    for (let i = 0; i < steps; i += 1) {
      const events = world.step(STEP, autopilot(world), true);
      if (world.shardsTaken >= minShards) return true;
      if (events & (EVENT_CLEAR | EVENT_OVER)) return false;
    }
    return true;
  };
  if (!run(seconds) && !run(seconds * 0.5)) run(seconds * 0.25);
}

/**
 * Set `world` to the named scene and return the screen to draw over it and the best
 * score to show. start: title over a night idling. play: night 2 in progress.
 * play2: night 4 in progress, a flare going off. end: the dawn victory screen.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    // Genuinely clear night 1 first (retries included), then play night 2 in
    // progress: stop once two shards are in, so the frame is mid-play.
    let cleared = false;
    for (let attempt = 0; attempt < 4 && !cleared; attempt += 1) {
      world.loadNight(1);
      cleared = playNight(world, 90);
    }
    if (cleared) playUntil(world, 2, 18, 2);
    else world.loadNight(2);
    return { screen: SCREEN_PLAY, best: world.score };
  }
  if (name === 'play2') {
    // Clear nights 1–3 for real, then play night 4 in progress with a flare going off.
    let reached = 1;
    for (let night = 1; night <= 3; night += 1) {
      let cleared = false;
      for (let attempt = 0; attempt < 4 && !cleared; attempt += 1) {
        world.loadNight(night);
        cleared = playNight(world, 120);
      }
      if (!cleared) { reached = night; break; }
      reached = night + 1;
    }
    playUntil(world, Math.min(reached, 4), 12, 2);
    // Fire one flare for the frame, if the moth can afford it.
    if (world.light > 30) {
      world.step(STEP, { move: 0, jump: false, flare: true }, true);
      for (let i = 0; i < 6; i += 1) world.step(STEP, { move: 0, jump: false, flare: false }, true);
    }
    return { screen: SCREEN_PLAY, best: world.score };
  }
  if (name === 'end') {
    // Play all six nights for real. If the pilot cannot finish, the frame is the
    // honest game-over screen of the night it failed on — never a false clear panel.
    for (let night = 1; night <= 6; night += 1) {
      let cleared = false;
      for (let attempt = 0; attempt < 4 && !cleared; attempt += 1) {
        world.loadNight(night);
        cleared = playNight(world, 150);
      }
      if (!cleared) return { screen: SCREEN_OVER, best: world.score };
    }
    return { screen: SCREEN_WIN, best: world.score };
  }
  // start (and anything else): let the first night idle so the moth, a lit lantern
  // and a drifting wisp are all in frame behind the title.
  for (let i = 0; i < 5 / STEP; i += 1) world.step(STEP, { move: 0, jump: false, flare: false }, true);
  return { screen: SCREEN_TITLE, best: 0 };
}

// Exported for headless autopilot tests (node test-autopilot.mjs), not for the game.
export { autopilot };
