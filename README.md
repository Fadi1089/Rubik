# Rubik's Cube

An interactive 3D Rubik's cube in the browser. Turn layers by dragging or with the keyboard, scramble, and race the timer. Best times are kept in `localStorage`.

Built with Vite, React, TypeScript (strict), Three.js via React Three Fiber and drei, Zustand, and Tailwind CSS v4.

## Controls

| Action                     | Input                                                       |
| -------------------------- | ----------------------------------------------------------- |
| Turn a layer               | Drag across a face, along the direction you want it to move |
| Turn a face                | `U` `D` `L` `R` `F` `B` (clockwise)                         |
| Prime (anticlockwise) turn | Hold `Shift` with the face key                              |
| Undo                       | `Ctrl+Z` / `⌘Z`, or the Undo button                         |
| Look around                | Drag the background; scroll or pinch to zoom                |

Press **Scramble** for 25 random moves. The timer starts on your first turn after the scramble and stops when every face is a single colour. Moves made while an animation is playing are queued, so fast input isn't lost.

## Development

Requires Node.js 20.19+ or 22.12+ (CI uses Node 24).

```bash
npm install
npm run dev
```

The dev server prints its URL, which includes the base path (by default `http://localhost:5173/Rubik/`).

| Script                 | What it does                       |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start the Vite dev server with HMR |
| `npm test`             | Run the Vitest suite once          |
| `npm run test:watch`   | Run Vitest in watch mode           |
| `npm run lint`         | ESLint                             |
| `npm run format`       | Format everything with Prettier    |
| `npm run format:check` | Check formatting without writing   |
| `npm run typecheck`    | Type-check with `tsc -b`           |
| `npm run build`        | Type-check and build to `dist/`    |
| `npm run preview`      | Serve the production build locally |

## Project layout

```
src/
  cube/    Pure TypeScript cube model: no React or Three imports (enforced by ESLint)
  scene/   React Three Fiber components: Cube, Cubie, Lights, CameraRig, drag handling
  store/   Zustand store: cube state, move queue, history, timer, best time
  ui/      Tailwind HUD: timer, move counter, buttons, solved banner
  input/   Keyboard controls
```

### Cube model

The state is 27 cubies, each with an integer position (`-1`, `0` or `1` per axis) and a 3×3 integer rotation matrix. A move rotates the positions and orientations of the cubies in one layer by a multiple of 90°, so the arithmetic is exact and states can be compared directly. `toFacelets` projects the cubies onto the 54 stickers (URFDLB order), and `isSolved` checks that each face shows one colour.

Notation covers `U D L R F B` and the slices `M E S`, with `'` for prime and `2` for half turns (`parseAlgorithm("R U R' U'")`). `generateScramble(seed)` is deterministic for a given seed and never repeats a face or turns one axis three times in a row.

### Animation

The store keeps a FIFO queue of pending moves. Every frame, `Cube` rebuilds the cubie transforms from the committed state and applies the head of the queue as a partial rotation. When that rotation finishes, the move is committed to the model in the same frame, so the rendered cube and the logical cube never disagree. Each queue entry has a unique id and can only be committed once.

## Tests

```bash
npm test
```

The suite covers the model and the store:

- every move (outer faces and slices, single, prime and double) applied four times returns the original state
- a sequence followed by its inverse returns to solved
- `isSolved` holds for a fresh cube and after a whole-cube rotation, and fails after any single move or a scramble
- notation round-trips, and scrambles are deterministic and follow their rules
- the store commits queued moves exactly once, undo reverses queued moves, and the timer runs from the first turn to the solve

## Build

```bash
npm run build
npm run preview
```

Assets are built for the base path in the `BASE_PATH` environment variable, defaulting to `/Rubik/`, which matches `https://<username>.gitlab.io/Rubik/`. For a project with a different name, or to serve from the root, set it explicitly:

```bash
BASE_PATH=/my-cube/ npm run build
```

## Deploy to GitLab Pages

`.gitlab-ci.yml` defines two jobs on the `node:24-alpine` image:

- **`pages`** runs on the default branch: `npm ci`, `npm test`, `npm run build`, then publishes `dist/` as the `public` artifact. GitLab Pages serves that artifact.
- **`check`** runs on merge requests and other branches: install, lint, test and build, without deploying.

To deploy:

1. Create a GitLab project and push this repository to it. This repo's `origin` points at GitHub, so add GitLab as a second remote:
   ```bash
   git remote add gitlab git@gitlab.com:<username>/<repo-name>.git
   ```
   ```bash
   git push gitlab main
   ```
2. Wait for the pipeline on the default branch to finish. The site appears under **Deploy → Pages** in the project.

You don't need to set `BASE_PATH` yourself in CI. The `pages` job derives it from GitLab's `$CI_PAGES_URL`, so it is `/<repo-name>/` for `https://<username>.gitlab.io/<repo-name>/` and `/` when the project uses a unique Pages domain (`https://<project>-<hash>.gitlab.io`, the default for new projects on recent GitLab versions).
