// particles.js — the juice: sparks, shards, shock rings, floating score text
// and screen shake. Pure presentation; nothing here touches the rules.

export class Particles {
  constructor(rng) {
    this.rng = rng;
    this.bits = [];
    this.texts = [];
    this.rings = [];
    this.trauma = 0;
  }

  burst(x, y, color, count = 14, speed = 260) {
    for (let i = 0; i < count; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const v = this.rng.range(speed * 0.25, speed);
      this.bits.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: this.rng.range(0.3, 0.8), maxLife: 0.8,
        size: this.rng.range(1.5, 4.5), color,
      });
    }
  }

  sparks(x, y, color, count = 6) { this.burst(x, y, color, count, 160); }

  ring(x, y, color, maxR = 90) {
    this.rings.push({ x, y, r: 6, maxR, color, life: 0.35, maxLife: 0.35 });
  }

  floatText(x, y, text, color = '#ffffff', size = 20) {
    this.texts.push({ x, y, text, color, size, life: 1.1, maxLife: 1.1 });
  }

  shake(amount) { this.trauma = Math.min(1, this.trauma + amount); }

  shakeOffset() {
    if (this.trauma <= 0) return { x: 0, y: 0 };
    const m = this.trauma * this.trauma * 14;
    return { x: this.rng.range(-m, m), y: this.rng.range(-m, m) };
  }

  update(dt) {
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    for (const b of this.bits) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.vx *= 0.96; b.vy *= 0.96; b.life -= dt;
    }
    this.bits = this.bits.filter((b) => b.life > 0);
    for (const t of this.texts) { t.y -= 34 * dt; t.life -= dt; }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const r of this.rings) { r.r += (r.maxR - r.r) * dt * 9; r.life -= dt; }
    this.rings = this.rings.filter((r) => r.life > 0);
  }

  draw(ctx) {
    for (const r of this.rings) {
      ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.8;
      ctx.strokeStyle = r.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const b of this.bits) {
      ctx.globalAlpha = Math.max(0, b.life / b.maxLife);
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, Math.min(1, t.life / t.maxLife + 0.3));
      ctx.font = `bold ${t.size}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
