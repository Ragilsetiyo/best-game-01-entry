# GLOWPATH — Carry the last light home

A moth carries the last light through six dark nights. Light is your life: it drains
in the dark, refills inside a lit lantern's glow, and a flare spends light to burn the
shadow-wisps back and kindle unlit lanterns. Gather every star-shard to open the Dawn
Gate, step through it, and see the morning.

## Play

`node serve.ts`, then open http://localhost:8080 — or open `game/index.html` from any
static server. Arrow keys / WASD move, Up / W jumps, Space or click fires a flare,
P pauses, Enter starts and restarts.

## Entry

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to
`/output` and writes `/output/dossier.json` with the vendored make.fun library:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Made for the make.fun best-game-01 bounty. Original game, art, sounds and names.
