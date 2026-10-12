import type { ImageOptions } from './images'

/**
 * Solving guides shown in the side panel. Pure data: no React or Three imports.
 *
 * Every algorithm says which part of a solved cube it leaves untouched (`keeps`), and the test
 * suite checks each one against the cube model, so a typo in a sequence fails the build.
 */

/** Which part of the cube an algorithm leaves solved, when applied to a solved cube. */
export type Keeps =
  /** The bottom layer: D face and the bottom row of each side. */
  | 'first-layer'
  /** The first two layers. */
  | 'f2l'
  /** The first two layers, and the top edges keep the top colour facing up. */
  | 'f2l-and-top-edges'
  /** The first two layers, and the top face stays one colour (only the top layer moves around). */
  | 'f2l-and-top-colour'
  /** The cross and the three F2L slots other than front-right. */
  | 'all-but-front-right-slot'
  /** The cross and the three F2L slots other than front-left. */
  | 'all-but-front-left-slot'
  /** Nothing in particular: the algorithm is a building block meant to be repeated. */
  | 'repeats'

export interface Algorithm {
  name: string
  moves: string
  /** When to use it, or how to hold the cube. */
  hint?: string
  keeps: Keeps
  /** For 'repeats': applying it this many times returns the cube to where it started. */
  period?: number
  /** Overrides how the case is pictured (see images.ts). */
  image?: Partial<Pick<ImageOptions, 'mask' | 'view'>>
}

export interface GuideStep {
  title: string
  body: string
  /** A picture of the cube once this step is done. */
  image?: ImageOptions
  algorithms?: Algorithm[]
}

export interface Guide {
  id: string
  name: string
  level: 'Start here' | 'Intermediate' | 'Advanced'
  summary: string
  /** Short facts shown as chips, e.g. average move count. */
  facts: string[]
  steps: GuideStep[]
  sources: { label: string; url: string }[]
}

export interface NotationEntry {
  symbol: string
  meaning: string
}

export const NOTATION: NotationEntry[] = [
  { symbol: 'R', meaning: 'Right face a quarter turn clockwise, as if you were looking at it' },
  { symbol: "R'", meaning: 'Prime: the same face anticlockwise' },
  { symbol: 'R2', meaning: 'Half turn; direction doesn’t matter' },
  { symbol: 'U D L F B', meaning: 'Up, down, left, front and back faces, same rules' },
  {
    symbol: 'r',
    meaning: 'Lowercase: the face plus the middle layer next to it (also written Rw)',
  },
  { symbol: 'M E S', meaning: 'Middle layers. M turns like L, E like D, S like F' },
  { symbol: 'x y z', meaning: 'Turn the whole cube, like R, U and F respectively' },
]

export const GUIDES: Guide[] = [
  {
    id: 'beginner',
    name: 'Layer by layer',
    level: 'Start here',
    summary:
      'The classic first method. Solve the bottom layer, then the middle, then the top, with a handful of short algorithms.',
    facts: ['7 steps', '7 algorithms'],
    steps: [
      {
        title: 'White cross',
        image: { hold: false, mask: 'white-cross', view: 'top' },
        body: 'With white on top, bring the four white edges next to the white centre so each one’s side colour matches the centre beside it. No algorithm: move one edge at a time and check the sides. Then turn the cube over so white is on the bottom for the rest of the solve.',
      },
      {
        title: 'White corners',
        image: { mask: 'first-layer', view: 'low' },
        body: 'Find a white corner in the top layer and turn the top until it sits above the slot it belongs in, between its two matching centres. Hold that slot at front-right and repeat the trigger until the corner drops in with white facing down.',
        algorithms: [
          {
            name: 'Corner trigger',
            moves: "R U R' U'",
            hint: 'Repeat 1 to 5 times. Six repeats bring everything back.',
            keeps: 'repeats',
            period: 6,
          },
        ],
      },
      {
        title: 'Middle layer edges',
        image: { mask: 'f2l', view: 'iso' },
        body: 'Find a top-layer edge with no yellow. Turn the top so its front colour matches the front centre, then check which way its top colour needs to go. If an edge is stuck in the middle layer the wrong way round, insert any top edge into that slot first to pop it out.',
        algorithms: [
          {
            name: 'Edge to the right',
            moves: "U R U' R' U' F' U F",
            keeps: 'first-layer',
          },
          {
            name: 'Edge to the left',
            moves: "U' L' U L U F U' F'",
            keeps: 'first-layer',
          },
        ],
      },
      {
        title: 'Yellow cross',
        image: { moves: "R U2 R' U' R U' R'", mask: 'yellow', view: 'top' },
        body: 'Look at the yellow edges on top and ignore the corners. A line: hold it horizontal and do the algorithm once. An L: hold it at back and left, do it twice. Just a dot: three times.',
        algorithms: [
          {
            name: 'Yellow cross',
            moves: "F R U R' U' F'",
            keeps: 'f2l',
          },
        ],
      },
      {
        title: 'Match the yellow edges',
        body: 'Turn the top until at least two edges match their side centres. If the two that match are next to each other, hold them at back and right. If they’re opposite, do the algorithm once from any side and look again.',
        algorithms: [
          {
            name: 'Edge swap',
            image: { mask: 'top-layer' },
            moves: "R U R' U R U2 R' U",
            keeps: 'f2l-and-top-edges',
          },
        ],
      },
      {
        title: 'Place the yellow corners',
        body: 'Find a corner that sits between its three colours, even if it’s twisted. Hold it at front-right-top and repeat until all four corners are in their spots. If none is in place, do it once from anywhere first.',
        algorithms: [
          {
            name: 'Corner cycle',
            image: { mask: 'top-layer' },
            moves: "U R U' L' U R' U' L",
            keeps: 'f2l-and-top-edges',
          },
        ],
      },
      {
        title: 'Twist the yellow corners',
        body: 'Hold the cube with a twisted corner at front-right-top. Repeat the trigger until yellow faces up; the bottom will look scrambled, which is expected. Then turn only the top layer to bring the next twisted corner to front-right-top and repeat. When the last corner is twisted, everything falls back into place.',
        algorithms: [
          {
            name: 'Twist trigger',
            image: { mask: 'yellow', view: 'top' },
            moves: "R' D' R D",
            hint: 'Repeat 2 or 4 times per corner. Never rotate the cube in this step.',
            keeps: 'repeats',
            period: 6,
          },
        ],
      },
    ],
    sources: [
      {
        label: 'Ruwix: beginner’s method',
        url: 'https://ruwix.com/the-rubiks-cube/how-to-solve-the-rubiks-cube-beginners-method/',
      },
      {
        label: 'SpeedCubeShop: beginner-friendly 3x3',
        url: 'https://speedcubeshop.com/pages/how-to-solve-the-3x3-rubiks-cube-beginner-friendly',
      },
    ],
  },
  {
    id: 'cfop',
    name: 'CFOP',
    level: 'Intermediate',
    summary:
      'Cross, F2L, OLL, PLL. The most common speed method and the usual next step after layer by layer. Learn the 2-look last layer first: 16 algorithms instead of 78.',
    facts: ['55–60 moves', '2-look: 16 algs', 'Full: 78 algs'],
    steps: [
      {
        title: 'Cross',
        image: { mask: 'white-cross', view: 'low' },
        body: 'Solve the four white edges on the bottom, matched to their centres, without building it on top first. Plan it during inspection; it never needs more than 8 moves.',
      },
      {
        title: 'F2L: first two layers',
        image: { mask: 'f2l', view: 'iso' },
        body: 'Pair each bottom corner with the middle-layer edge above it and insert both together, one slot at a time. Most of F2L is intuitive: bring the two pieces together in the top layer without disturbing solved slots, then insert. These are the four basic inserts, shown for the front-right slot.',
        algorithms: [
          {
            name: 'Pair over the slot, right',
            moves: "R U R'",
            keeps: 'all-but-front-right-slot',
          },
          {
            name: 'Pair over the slot, front',
            moves: "F' U' F",
            keeps: 'all-but-front-right-slot',
          },
          {
            name: 'Split, edge at back',
            moves: "U R U' R'",
            keeps: 'all-but-front-right-slot',
          },
          {
            name: 'Split, edge at left',
            moves: "U' F' U F",
            keeps: 'all-but-front-right-slot',
          },
        ],
      },
      {
        title: 'OLL, look 1: yellow cross',
        body: 'Make the yellow cross on top. The same idea as in layer by layer, with a faster algorithm for each shape.',
        algorithms: [
          { name: 'Line', moves: "F R U R' U' F'", hint: 'Line horizontal', keeps: 'f2l' },
          { name: 'L shape', moves: "f R U R' U' f'", hint: 'L at back and left', keeps: 'f2l' },
          {
            name: 'Dot',
            moves: "F R U R' U' F' f R U R' U' f'",
            keeps: 'f2l',
          },
        ],
      },
      {
        title: 'OLL, look 2: yellow corners',
        body: 'With the cross done, count the yellow corners facing up and match the pattern. These seven cases cover every possibility.',
        algorithms: [
          {
            name: 'Sune',
            moves: "R U R' U R U2 R'",
            hint: 'One corner up, at front-left',
            keeps: 'f2l-and-top-edges',
          },
          {
            name: 'Antisune',
            moves: "R U2 R' U' R U' R'",
            hint: 'One corner up, at back-right',
            keeps: 'f2l-and-top-edges',
          },
          {
            name: 'H',
            moves: "R U R' U R U' R' U R U2 R'",
            hint: 'No corners up; yellow on left and right',
            keeps: 'f2l-and-top-edges',
          },
          {
            name: 'Pi',
            moves: "R U2 R2 U' R2 U' R2 U2 R",
            hint: 'No corners up; yellow on the left side',
            keeps: 'f2l-and-top-edges',
          },
          {
            name: 'Headlights',
            moves: "R2 D R' U2 R D' R' U2 R'",
            hint: 'Two up at back; front two face you',
            keeps: 'f2l-and-top-edges',
          },
          {
            name: 'Chameleon',
            moves: "r U R' U' r' F R F'",
            hint: 'Two up on the left; yellow on the right side facing out',
            keeps: 'f2l-and-top-edges',
          },
          {
            name: 'Bowtie',
            moves: "F' r U R' U' r' F R",
            hint: 'Two up, diagonal',
            keeps: 'f2l-and-top-edges',
          },
        ],
      },
      {
        title: 'PLL, look 1: corners',
        body: 'Look for headlights: two corners on one side with the same colour. If you find them, hold them at the back and do the T perm. If there are none on any side, do the Y perm.',
        algorithms: [
          {
            name: 'T perm',
            moves: "R U R' U' R' F R2 U' R' U' R U R' F'",
            hint: 'Headlights at the back',
            keeps: 'f2l-and-top-colour',
          },
          {
            name: 'Y perm',
            moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
            hint: 'No headlights anywhere',
            keeps: 'f2l-and-top-colour',
          },
        ],
      },
      {
        title: 'PLL, look 2: edges',
        body: 'The corners are solved; now cycle or swap the edges. If one side is fully solved, hold it at the back and pick Ua or Ub. No solved side means H (opposite swaps) or Z (neighbour swaps).',
        algorithms: [
          {
            name: 'Ua perm',
            moves: "R U' R U R U R U' R' U' R2",
            hint: 'Three edges cycle anticlockwise',
            keeps: 'f2l-and-top-colour',
          },
          {
            name: 'Ub perm',
            moves: "R2 U R U R' U' R' U' R' U R'",
            hint: 'Three edges cycle clockwise',
            keeps: 'f2l-and-top-colour',
          },
          {
            name: 'H perm',
            moves: 'M2 U M2 U2 M2 U M2',
            hint: 'Opposite edges swap',
            keeps: 'f2l-and-top-colour',
          },
          {
            name: 'Z perm',
            moves: "M' U M2 U M2 U M' U2 M2",
            hint: 'Neighbouring edges swap',
            keeps: 'f2l-and-top-colour',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'SpeedSolving wiki: CFOP',
        url: 'https://www.speedsolving.com/wiki/index.php?title=CFOP',
      },
      { label: 'J Perm: CFOP last layer', url: 'https://www.jperm.net/3x3/cfop/ll' },
      { label: 'Cube Academy: 2-look OLL', url: 'https://www.cube.academy/2-look-oll-algs' },
      { label: 'Cube Academy: 2-look PLL', url: 'https://www.cube.academy/2-look-pll-algs' },
    ],
  },
  {
    id: 'roux',
    name: 'Roux',
    level: 'Advanced',
    summary:
      'Gilles Roux’s block-building method. Build a 1×2×3 block on each side, solve the top corners, then finish with only M and U moves. Fewer moves than CFOP and very few algorithms, but more to work out yourself.',
    facts: ['Fewer moves than CFOP', 'Mostly intuitive', 'Ends with M and U only'],
    steps: [
      {
        title: 'First block',
        image: { mask: 'first-block', view: 'left' },
        body: 'Build a 1×2×3 block on the bottom left: the left centre, the DL edge, and two corner-edge pairs. It’s intuitive and usually about 7 or 8 moves, which makes it a good thing to plan during inspection.',
      },
      {
        title: 'Second block',
        image: { mask: 'both-blocks', view: 'iso' },
        body: 'Build the same block on the bottom right without breaking the first. Use R, U, r and M moves: the middle slice isn’t solved yet, so you can turn it freely. Together the two blocks leave the top layer and middle slice open.',
      },
      {
        title: 'CMLL: top corners',
        body: 'Solve the four top corners while ignoring the middle slice. The two-look version orients the corners with the seven CFOP corner cases (Sune and Antisune shown here, the rest are in the CFOP guide), then swaps them into place with one of two permutations.',
        algorithms: [
          {
            name: 'Sune',
            moves: "R U R' U R U2 R'",
            keeps: 'f2l-and-top-edges',
          },
          {
            name: 'Antisune',
            moves: "R U2 R' U' R U' R'",
            keeps: 'f2l-and-top-edges',
          },
          {
            name: 'Adjacent corner swap',
            moves: "R U R' F' R U R' U' R' F R2 U' R'",
            hint: 'Jb perm. Swapped pair at front-right and back-right',
            keeps: 'f2l-and-top-colour',
          },
          {
            name: 'Diagonal corner swap',
            moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
            hint: 'Y perm',
            keeps: 'f2l-and-top-colour',
          },
        ],
      },
      {
        title: 'LSE: last six edges',
        body: 'Everything left is in the top layer and the middle slice. First orient the six edges using M and U moves until the top and bottom stickers show the top or bottom colour. Then place the UL and UR edges. Finish with one of these M-slice permutations.',
        algorithms: [
          {
            name: 'Ua (M-slice)',
            moves: "M2 U M U2 M' U M2",
            keeps: 'f2l-and-top-colour',
          },
          {
            name: 'Ub (M-slice)',
            moves: "M2 U' M U2 M' U' M2",
            keeps: 'f2l-and-top-colour',
          },
          {
            name: 'H (M-slice)',
            moves: "M2 U' M2 U2 M2 U' M2",
            keeps: 'f2l-and-top-colour',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'SpeedSolving wiki: Roux',
        url: 'https://speedsolving.com/wiki/index.php?title=Roux',
      },
      {
        label: 'Ruwix: Roux tutorial',
        url: 'https://ruwix.com/the-rubiks-cube/different-rubiks-cube-solving-methods/roux-method/',
      },
      { label: 'Scheopner: Roux guide', url: 'https://www.scheopner.com/cube/' },
    ],
  },
  {
    id: 'zz',
    name: 'ZZ',
    level: 'Advanced',
    summary:
      'Zbigniew Zborowski’s method from 2006. Fix every edge’s orientation first, then the rest of the solve uses only R, U and L turns, with no cube rotations.',
    facts: ['~45 moves (EOLine)', '~53 moves (EOCross)', 'R, U, L only'],
    steps: [
      {
        title: 'EOLine or EOCross',
        image: { mask: 'line', view: 'low' },
        body: 'An edge is “good” if it can be solved without quarter turns of F or B, and “bad” otherwise. A quarter turn of F or B flips the four edges in that face. Make every edge good while placing the DF and DB edges (EOLine), or all four bottom edges (EOCross, easier to look ahead from).',
      },
      {
        title: 'F2L with R, U and L',
        image: { mask: 'f2l', view: 'iso' },
        body: 'With edges oriented you never need F or B again. After EOLine, build a 1×2×3 block on each side of the line; after EOCross, insert four pairs like in CFOP. Basic inserts on either side:',
        algorithms: [
          {
            name: 'Right insert',
            moves: "R U R'",
            keeps: 'all-but-front-right-slot',
          },
          {
            name: 'Right insert, split',
            moves: "U R U' R'",
            keeps: 'all-but-front-right-slot',
          },
          {
            name: 'Left insert',
            moves: "L' U' L",
            keeps: 'all-but-front-left-slot',
          },
        ],
      },
      {
        title: 'Last layer',
        body: 'Because the edges are already oriented, the yellow cross is always there. Orient the corners with the seven CFOP corner cases (OCLL), then finish with PLL. Advanced ZZ solvers learn ZBLL, which solves the whole last layer in one algorithm.',
        algorithms: [
          {
            name: 'Sune',
            moves: "R U R' U R U2 R'",
            keeps: 'f2l-and-top-edges',
          },
          {
            name: 'Antisune',
            moves: "R U2 R' U' R U' R'",
            keeps: 'f2l-and-top-edges',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'SpeedSolving wiki: ZZ',
        url: 'https://www.speedsolving.com/wiki/index.php?title=ZZ',
      },
      {
        label: 'Ruwix: ZZ tutorial',
        url: 'https://ruwix.com/the-rubiks-cube/different-rubiks-cube-solving-methods/zz-method/',
      },
    ],
  },
]
