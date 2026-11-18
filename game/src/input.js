// input.js — mouse and keyboard for LODESTAR. The mouse steers the core and its
// button is the magnet: held = gather, released = fling. Edges (pressed and
// released this frame) are exposed once per frame and then cleared by main.

export class Input {
  constructor(canvas) {
    this.x = 640; this.y = 360;
    this.held = false;
    this.pressedEdge = false;
    this.releasedEdge = false;
    this.pulseEdge = false;
    this.confirmEdge = false;
    this.pauseEdge = false;
    this.muteEdge = false;
    this.draftPick = 0; // 1..3 when a number key is hit on the draft screen

    const toGame = (e) => {
      const r = canvas.getBoundingClientRect();
      this.x = ((e.clientX - r.left) / r.width) * 1280;
      this.y = ((e.clientY - r.top) / r.height) * 720;
    };
    canvas.addEventListener('mousemove', toGame);
    canvas.addEventListener('mousedown', (e) => {
      toGame(e);
      if (e.button === 0 && !this.held) { this.held = true; this.pressedEdge = true; }
      if (e.button === 2) this.pulseEdge = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0 && this.held) { this.held = false; this.releasedEdge = true; }
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.code === 'Space') { this.pulseEdge = true; e.preventDefault(); }
      if (e.code === 'Enter') this.confirmEdge = true;
      if (e.code === 'KeyP' || e.code === 'Escape') this.pauseEdge = true;
      if (e.code === 'KeyM') this.muteEdge = true;
      if (e.code === 'Digit1') this.draftPick = 1;
      if (e.code === 'Digit2') this.draftPick = 2;
      if (e.code === 'Digit3') this.draftPick = 3;
    });
  }

  clearEdges() {
    this.pressedEdge = false;
    this.releasedEdge = false;
    this.pulseEdge = false;
    this.confirmEdge = false;
    this.pauseEdge = false;
    this.muteEdge = false;
    this.draftPick = 0;
  }
}
