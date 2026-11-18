// upgrades.js — the coil draft. After every Storm the Lodestar is offered
// three of these twelve windings and keeps one; the pool is the game's build
// variety, and the draft screen is where a run becomes *this* run.

export const UPGRADES = [
  {
    id: 'widefield', name: 'Widefield Coil', icon: '◎',
    text: 'Field radius +35. Gather whole squadrons at once.',
    apply: (m) => { m.fieldRadius += 35; },
  },
  {
    id: 'tightorbit', name: 'Tight Orbit', icon: '◉',
    text: 'Orbit ring closes in; held wrecks swing 20% faster.',
    apply: (m) => { m.orbitRadius = Math.max(44, m.orbitRadius - 12); m.flingPower *= 1.2; },
  },
  {
    id: 'catapult', name: 'Catapult Winding', icon: '➤',
    text: 'Flings hit 35% harder. Chain weather incoming.',
    apply: (m) => { m.flingPower *= 1.35; },
  },
  {
    id: 'ironheart', name: 'Ironheart Plating', icon: '♥',
    text: 'Hull +30 and repair 30 now.',
    apply: (m, g) => { g.player.maxHull += 30; g.player.hull = Math.min(g.player.maxHull, g.player.hull + 30); },
  },
  {
    id: 'siphon', name: 'Siphon Lattice', icon: '✦',
    text: 'Every kill feeds the pulse charge twice as fast.',
    apply: (m) => { m.chargeRate *= 2; },
  },
  {
    id: 'quickpulse', name: 'Quickpulse Capacitor', icon: '⚡',
    text: 'Polarity pulse costs 30 charge instead of 50.',
    apply: (m) => { m.pulseCost = 30; },
  },
  {
    id: 'magnetplus', name: 'Deepwell Magnet', icon: '🧲',
    text: 'Magnet pull +40%. The Gyre leans toward you.',
    apply: (m) => { m.magnetStrength *= 1.4; },
  },
  {
    id: 'hotmetal', name: 'Hot Metal Memory', icon: '♨',
    text: 'Flung wrecks stay hot 0.8s longer — longer chains.',
    apply: (m) => { m.hotBonus += 0.8; },
  },
  {
    id: 'comboanchor', name: 'Combo Anchor', icon: '⚓',
    text: 'Combo fades half as fast. Keep the streak alive.',
    apply: (m) => { m.comboDecay *= 0.5; },
  },
  {
    id: 'greedchoir', name: 'Greed Choir', icon: '♪',
    text: 'Score +25% on every kill, forever. Shiny.',
    apply: (m) => { m.scoreMul *= 1.25; },
  },
  {
    id: 'swiftcore', name: 'Swiftcore Servo', icon: '»',
    text: 'The Lodestar answers the mouse 35% faster.',
    apply: (m) => { m.coreSpeed *= 1.35; },
  },
  {
    id: 'secondheart', name: 'Second Heart', icon: '✚',
    text: 'Once, at zero hull, burst back to 40 and clear the field.',
    apply: (m, g) => { g.player.secondHeart = true; },
  },
];

export function defaultMods() {
  return {
    fieldRadius: 165, orbitRadius: 74, flingPower: 1,
    magnetStrength: 1, chargeRate: 1, pulseCost: 50,
    hotBonus: 0, comboDecay: 1, scoreMul: 1, coreSpeed: 1,
  };
}

export function draftThree(rng, takenIds) {
  const pool = UPGRADES.filter((u) => !takenIds.has(u.id) || u.id === 'ironheart');
  const picks = [];
  const copy = [...pool];
  while (picks.length < 3 && copy.length) {
    picks.push(copy.splice(Math.floor(rng.next() * copy.length), 1)[0]);
  }
  return picks;
}
