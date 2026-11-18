// GLOWPATH — input: keyboard and mouse, read fresh every frame.
// Arrows / WASD move and jump, Space or a click fires a flare, Enter confirms,
// P or Escape pauses. The game never reads the pointer position for aiming:
// a flare is a burst around the moth, so a click anywhere works.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_FLARE = 'flare';

export function createInput(canvas, onAction) {
  const keys = new Set();
  const input = {
    move: 0,
    jump: false,
    jumpPressed: false,
    flarePressed: false,
    consumeFlare() {
      const f = input.flarePressed;
      input.flarePressed = false;
      return f;
    },
    consumeJump() {
      const j = input.jumpPressed;
      input.jumpPressed = false;
      return j;
    },
  };

  function updateMove() {
    const left = keys.has('ArrowLeft') || keys.has('KeyA');
    const right = keys.has('ArrowRight') || keys.has('KeyD');
    input.move = (right ? 1 : 0) - (left ? 1 : 0);
    input.jump = keys.has('ArrowUp') || keys.has('KeyW') || keys.has('Space');
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
    if (event.repeat) return;
    keys.add(event.code);
    if (event.code === 'Space') input.flarePressed = true;
    if (event.code === 'ArrowUp' || event.code === 'KeyW') input.jumpPressed = true;
    if (event.code === 'Enter') onAction(ACTION_CONFIRM);
    if (event.code === 'KeyP' || event.code === 'Escape') onAction(ACTION_PAUSE);
    updateMove();
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
    updateMove();
  });
  canvas.addEventListener('mousedown', (event) => {
    event.preventDefault();
    if (event.button === 0) input.flarePressed = true;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  return input;
}
