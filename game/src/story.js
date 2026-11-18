// story.js — the words and the worlds of LODESTAR: its pitch, its three Reaches
// (the stretches of the Gyre, each with its own palette and weather), the seven
// Storms that cross them, and the names the HUD and screens speak in.

export const GAME_TITLE = 'LODESTAR';
export const GAME_PITCH =
  'Sling a scrap fleet with magnetism: hold to gather the Gyre into orbit, ' +
  'let go to fling it — 7 Storms, 3 Reaches, 2 bosses, 12 coil upgrades.';
export const CORE_NAME = 'the Lodestar';

// Each Reach tints the whole scene: sky gradient, field-ring colour, accent,
// ambient mote colour and the silhouettes that drift far behind the fight.
export const REACHES = [
  {
    name: 'Verdigris Shallows',
    storms: [1, 2],
    skyTop: '#0b2e3d', skyBottom: '#0a141f',
    ring: '#57e6c9', accent: '#ffd166', mote: '#9ff5e2',
    silhouette: '#0f4256', weather: 'motes',
    blurb: 'Copper reefs and slow water. The Gyre is kind here, briefly.',
  },
  {
    name: 'The Ember Drift',
    storms: [3, 4],
    skyTop: '#3d1408', skyBottom: '#170b10',
    ring: '#ffb35c', accent: '#ff5d5d', mote: '#ffcf99',
    silhouette: '#571f10', weather: 'embers',
    blurb: 'A furnace current. Everything arrives already burning.',
  },
  {
    name: 'The Pale Gyre',
    storms: [5, 6, 7],
    skyTop: '#1c1440', skyBottom: '#07060f',
    ring: '#b79cff', accent: '#7ef0ff', mote: '#d9ccff',
    silhouette: '#2a1e5e', weather: 'shards',
    blurb: 'The heart of the whirlpool, where the Leviathan coils.',
  },
];

export const STORM_NAMES = [
  'First Rust', 'The Skittering', 'Emberfall', 'HULK MOTHER',
  'Pale Weather', 'The Long Teeth', 'THE LEVIATHAN COIL',
];

export const BOSS_STORMS = { 4: 'HULK MOTHER', 7: 'THE LEVIATHAN COIL' };

export function reachForStorm(storm) {
  return REACHES.find((r) => r.storms.includes(storm)) ?? REACHES[REACHES.length - 1];
}

export const TITLE_LINES = [
  'HOLD the mouse: the Gyre gathers into orbit around you.',
  'RELEASE: everything you hold is flung — wrecks kill what they hit.',
  'SPACE spends charge on a polarity pulse. Chain kills to raise the combo.',
  'Survive all 7 Storms. Draft a coil upgrade after each one.',
];

export const WIN_TITLE = 'THE GYRE IS QUIET';
export const WIN_LINE = 'Every Storm spent, every wreck sung home. The Lodestar dims, content.';
export const LOSE_TITLE = 'THE LODESTAR GOES DARK';
export const LOSE_LINE = 'The Gyre keeps what it catches. It will catch this wreck kindly.';
