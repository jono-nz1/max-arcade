# Sling Kart: project notes

A 3D slingshot kart game for the Tucker Arcade. Pull back the slingshot, launch, and roll as far as you can over hills, earning stars to spend on upgrades. Five worlds, each ending in a finish line. Runs in the browser (iPhone first), offline-capable, single HTML file.

Play: `https://jono-nz1.github.io/max-arcade/sling-kart/`

---

## Files

| File | What it is |
|---|---|
| `index.html` | The built game that actually runs. Generated, so don't edit by hand. |
| `src/game.html` | The editable game: all HTML, CSS and JS in one file. |
| `src/three.min.js` | three.js **r149** (UMD build), inlined into `index.html` at build time so the game works offline. |
| `src/build.py` | Builds `index.html` from the two files above and stamps the version label. |
| `src/balance-sim.js` | Node script that simulates runs per world and per upgrade level (see Balance). |
| `manifest.json`, `sw.js`, `icon-*.png` | Home-screen install + offline support (same pattern as Max Cube). |

### Building and publishing

1. Edit `src/game.html`.
2. Bump `VERSION` in `src/build.py` (minor for fixes, e.g. 2.4 → 2.5; major for big features).
3. `python3 src/build.py` → writes `index.html`. The title screen and ⚙︎ menu show `Sling Kart vX.Y · date, time`.
4. Commit and push to `main`. GitHub Pages updates in a minute or two.
5. On the phone the service worker serves the saved copy first and fetches the new one in the background, so open and close the game once or twice to see the update. The version label confirms which copy is running.

---

## How the code is organised (`src/game.html`)

One `<script>` IIFE, in roughly this order:

- **SAVE**: players and progress in `localStorage['slinghills.v1']` (key kept from the old name so saves survive).
- **UPGRADES**: `UPG` table, `carStats(p)`, `tierOf(p)`, costs.
- **TRACK / PHYS** (between `//PHYS_START` and `//PHYS_END`, so `balance-sim.js` can extract it): course generation and the 1D physics step. Must stay free of DOM/three.js.
- **WORLDS / zones**: themes, palettes, props per area.
- **Renderer, sky, mountains, clouds, space sky**, then **textures/materials/geometries**.
- **Chunks**: the world is built in 60 m chunks along the course (`buildChunk(i)`), created ahead of the car and disposed behind it.
- **Landmarks** (`BUILD.*`), **trees** (`TREE_DEFS` for the newer worlds; older ones are inline), **ground detail** (`DETAIL`).
- **Slingshot, car models, particles, audio**, then **game state, UI, input, main loop** (`tick`) and **Free Drive** (`tickFree`).
- `window.__game` exposes hooks used by automated tests (teleport the car, pick a player, etc.).

### Coordinates

- The course is a line. `s` = distance along it, `o` = sideways offset (+ is right).
- `frame(s)` gives the line's world position plus forward/right vectors. The line curves gently via `cx(s)`.
- `trackH(s)` = height of the line. `groundH(s, o)` = height of the land anywhere. It's flat-ish within ±10 m of the line (with a gentle tilt from `crossH`) and blends into rolling country beyond.
- `offY(s, o)` = land height relative to the line; used to sit the car on real ground when it drives off the path.

### Physics

- `physStep` is 1D along the line: gravity along the slope, rolling friction, air drag, boost thrust. The car leaves the ground when the ground drops away faster than gravity can follow (crests), then flies ballistically and lands.
- Gravity is stronger in the air (`WORLD.ga`) so jumps stay punchy. Space has low gravity.
- Steering is separate: heading `psi` relative to the line. Turning holds its heading (no self-centring), so you have to steer round bends.
- A run ends when the car stops going forward (no rolling back), or after it crosses the finish and brakes.
- Off the path: extra rolling drag, more the further out you go; water at the Lakeside is very slow. The world edge is ±150 m.

### Course shape

- Opening (`rollH`, s < ~400): small launch hill, lake valley, three growing hills. Same in every world.
- After that (`buildCourse`): sections chosen per world from long descents, long climbs (scaled by the world's `climb`), drop-offs, rollers and plateaus, with altitude kept within bounds. The first eight sections are hand-set so difficulty ramps gently.
- Flat run-out after `FINISH_S`.

### Solid things and clear lanes

- Each chunk keeps a collider list (circles and oriented boxes): trees, rocks, logs, saplings, buildings, fences, ramp sides. Bushes and ground clutter are not solid.
- Stars and boost pads are planned first, and a lane along each star row (plus ~13 m beyond) and around each pad is reserved (`RESV`), so hazards never sit in them.
- Nothing solid is placed inside the driving lane (±9 m of the line).

---

## Worlds

| # | World | Finish | Gravity (ground/air) | Climb scale | Rough | Areas |
|---|---|---|---|---|---|---|
| 1 | Countryside | 1300 m | 9.8 / 14 | 0.8 | 1.0 | Lakeside, Green Hills, Autumn Woods, Desert Canyon, Snowy Peaks, Volcano Valley |
| 2 | Space | 1500 m | 5.5 / 7.5 | 2.0 | 1.0 | Launch Base, The Moon, Mars, Nebula |
| 3 | Candy Land | 1900 m | 9.8 / 14 | 1.2 | 1.15 | Lollipop Meadow, Gumdrop Hills, Chocolate Valley, Ice-cream Peaks |
| 4 | Block World | 2100 m | 9.8 / 14 | 1.35 | 1.15 | Grassland, Block Forest, Block Desert, Block Snow |
| 5 | Cat Kingdom | 2600 m | 9.8 / 14 | 1.5 | 1.2 | Kitten Meadow, Yarn Hills, Fish Market Shore, Cat Castle |

Each area (zone) defines: ground palette, trail colour, fog/sky/light colours, distant mountain colours, tree mix, landmark mix (`props`), ground detail style (`det`), optional weather (`snow`, `leaves`, `embers`, `sprinkles`, `petals`, `twinkle`) and flags (`mesa` tall rocks, `lava` glowing rocks). Areas blend over the 60 m before a boundary. There are no on-screen area names: the landscape tells you where you are, and a fanfare plays the first time you reach a new area.

Finishing a world: chequered finish gate, "WORLD COMPLETE!", confetti, finish bonus (400 × world number first time, 100 × after), and the next world unlocks. The garage World card switches between unlocked worlds. Bests and areas found are kept per world.

---

## Upgrades and balance

| Upgrade | Effect | Cost |
|---|---|---|
| Slingshot | launch speed `8 + 1.6·L` m/s; new look every 5 levels (Wooden, Stone, Steel, Golden, Neon Crystal) | `12 × 1.36^L` |
| Wheels | rolling friction `0.8 / (1 + 0.12·L)` | `14 × 1.37^L` |
| Aero | air drag `0.0022 / (1 + 0.08·L)` | `16 × 1.38^L` |
| Boost | level 1 unlocks 1.0 s; +0.15 s per level; thrust `4.5 + 0.2·L` | `30 × 1.38^L` |
| Earnings | star multiplier `1 + 0.3·L` | `14 × 1.42^L` |

- Max level 35 each. The car body changes every 8 combined Wheels + Aero + Boost levels: Cardboard Cart → Go-Kart → Dune Buggy → Rocket Racer.
- Stars: 1 per 2 m, plus 2 per star collected, × Earnings. Lucky spin wheel on a new best (×1.5 to ×5, free upgrade, or next run ×1.5).
- **Boost pads** top up a slow car to `21 + 2 × world` m/s, or add +1 m/s if you're already faster. (They used to add a fixed +9 m/s, which made fast runs endless: one run went from 2.8 km to 24 km.)
- **Balance target** from `balance-sim.js`, with upgrades spread evenly over the four performance upgrades. Finish reached at roughly this total number of levels: World 1 ≈ 56, World 2 ≈ 80, World 3 ≈ 96, World 4 ≈ 104, World 5 ≈ 128 (out of 140 possible).
- A fresh Cardboard Cart goes about 60 m. Starter stars are hand-placed along the first 100 m so early runs earn something.

Run the sim: `node src/balance-sim.js` (needs Node; no install).

---

## Modes

- **Title**: player buttons + "Add player". Players are added per device (name + colour) and stored in that device's browser only; nothing personal is built into the game. ⚙︎ menu in the garage: +500 stars (testing), rename/colour, reset player, delete player, reset everyone (reset/delete need a second tap to confirm).
- **Garage**: upgrades, world card, launch.
- **Aim**: drag down to pull back (Weak / Good / Strong / MAX), release to launch.
- **Run**: hold and slide to steer, BOOST button (staged gauge, 1 s per colour), speed lines above ~60 km/h.
- **Results**: distance flag + confetti where you stopped (not shown at the finish), star breakdown, spin wheel on a new best.
- **Free Drive (secret)**: tap the car's name in the garage 5 times (or press F on a computer). GO/BRAKE, open world, extra trails and wooden ramps, fewer obstacles, its own car-engine sound. Stars collected are added on exit.

---

## Testing approach

- Headless Chromium (Playwright, SwiftShader WebGL) loading `index.html`, driving the game through `window.__game` hooks, taking screenshots to check visuals.
- Useful checks: lane clear of colliders across all worlds; car sits on the ground in Free Drive (gap between car and `worldH` ≈ 0); ramp side-hits don't launch the car; a run ends promptly when the car stops.
- Headless rendering is slow, so time-based things (physics feel, sounds) need a real phone check.

---

## Change log

- **v2.4**: players are added per device (no built-in names); rename, colour and delete players; older saves become players automatically.
- **v2.3**: finish line spans the whole gate on tilted ground; chequered banner; no distance flag at the finish.
- **v2.2**: Free Drive fix: the car was floating on an invisible floor at height 0 over low valleys.
- **v2.1**: audio wakes after iPhone interruptions; Free Drive upward speed capped and ramp sides solid; invisible wall removed from the main game.
- **v2.0**: five worlds with finish lines and a world switcher; Car split into Wheels, Aero and Boost; slingshot looks; boost-pad fix; version label.
- **v1.x**: original single world with six areas, upgrades, spin wheel, Free Drive, collisions, staged boost gauge, open-world terrain.

## Ideas not done yet

- Same engine sound as Free Drive on the Go-Kart, Dune Buggy and Rocket Racer.
- A space area after the volcano in World 1 (the "Cardboard to Cosmos" idea).
- Syncing players and progress across devices (currently each device keeps its own).
