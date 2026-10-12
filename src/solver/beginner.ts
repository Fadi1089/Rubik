/**
 * A layer-by-layer tutor. Given any cube state, `planHint` returns the next step of the beginner
 * method as a short run of moves, with an explanation and the pieces to highlight.
 *
 * The plan is always made from the current state, so the player can go off-script at any time.
 * Colours are named after their home face in the solved model: white is U and yellow is D. The
 * solve keeps white on the bottom (world -y), so the last layer is yellow on top.
 */
import {
  applyMove,
  applyMoves,
  DEFAULT_VIEW,
  faceForNormal,
  formatAlgorithm,
  isSolved,
  moveInView,
  parseAlgorithm,
  parseMove,
  stickerNormals,
  transform,
  type CubeState,
  type Cubie,
  type Face,
  type Move,
  type MoveAmount,
  type ViewFrame,
  type Vec3,
} from '../cube'

export type StageId =
  | 'orient'
  | 'cross'
  | 'corners'
  | 'middle'
  | 'yellow-cross'
  | 'yellow-edges'
  | 'corner-places'
  | 'corner-twists'
  | 'finish'

export const STAGES: readonly { id: StageId; title: string }[] = [
  { id: 'orient', title: 'Get ready' },
  { id: 'cross', title: 'White cross' },
  { id: 'corners', title: 'White corners' },
  { id: 'middle', title: 'Middle layer' },
  { id: 'yellow-cross', title: 'Yellow cross' },
  { id: 'yellow-edges', title: 'Match the yellow edges' },
  { id: 'corner-places', title: 'Place the yellow corners' },
  { id: 'corner-twists', title: 'Twist the yellow corners' },
  { id: 'finish', title: 'Line it up' },
]

export interface Hint {
  stage: StageId
  /** One or two sentences: what's happening and why these moves. */
  text: string
  /** The moves to make next, in order. Usually one step of the method. */
  moves: Move[]
  /** Cubie ids to highlight strongly: the pieces being worked on. */
  focus: number[]
  /** Cubie ids to highlight softly: reference pieces, such as the centres a piece belongs with. */
  context: number[]
}

const WHITE: Face = 'U'
const YELLOW: Face = 'D'
const UP: Vec3 = [0, 1, 0]

const COLOUR_NAMES: Record<Face, string> = {
  U: 'white',
  D: 'yellow',
  F: 'green',
  B: 'blue',
  R: 'red',
  L: 'orange',
}

const OUTER_MOVES: Move[] = (['U', 'D', 'L', 'R', 'F', 'B'] as const).flatMap((face) =>
  ([1, -1, 2] as MoveAmount[]).map((amount) => ({ face, amount })),
)
const U_TURNS: Move[] = ['U', "U'", 'U2'].map(parseMove)

const eq = (a: Vec3, b: Vec3) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
const nonZero = (v: Vec3) => v.filter((c) => c !== 0).length

// ---------------------------------------------------------------------------------------------
// Reading the cube

interface Context {
  /** Where each colour's centre currently is. Outer moves never move centres. */
  centre: Record<Face, Vec3>
  centreId: Record<Face, number>
}

function readContext(state: CubeState): Context {
  const centre = {} as Record<Face, Vec3>
  const centreId = {} as Record<Face, number>
  for (const cubie of state) {
    if (nonZero(cubie.home) !== 1) continue
    const colour = faceForNormal(cubie.home)
    centre[colour] = cubie.position
    centreId[colour] = cubie.id
  }
  return { centre, centreId }
}

interface Sticker {
  colour: Face
  normal: Vec3
}

function stickers(cubie: Cubie): Sticker[] {
  return stickerNormals(cubie.home).map((home) => ({
    colour: faceForNormal(home),
    normal: transform(cubie.orientation, home),
  }))
}

const coloursOf = (cubie: Cubie) => stickerNormals(cubie.home).map(faceForNormal)

/** Solved relative to the centres: every sticker faces the centre of its own colour. */
function isPlaced(ctx: Context, cubie: Cubie): boolean {
  return stickers(cubie).every((s) => eq(ctx.centre[s.colour], s.normal))
}

/** Where the piece belongs, ignoring twist. */
function targetOf(ctx: Context, cubie: Cubie): Vec3 {
  return coloursOf(cubie).reduce<Vec3>((sum, colour) => add(sum, ctx.centre[colour]), [0, 0, 0])
}

function normalOf(cubie: Cubie, colour: Face): Vec3 | undefined {
  return stickers(cubie).find((s) => s.colour === colour)?.normal
}

function describe(cubie: Cubie): string {
  const colours = coloursOf(cubie).sort((a, b) => order(a) - order(b))
  const names = colours.map((c) => COLOUR_NAMES[c]).join('–')
  return `the ${names} ${colours.length === 3 ? 'corner' : 'edge'}`
}
// White first, then yellow, then the side colours in a fixed order.
const order = (c: Face) => 'UDFRBL'.indexOf(c)

type Group = 'cross' | 'whiteCorners' | 'middle' | 'yellowEdges' | 'yellowCorners'

function group(state: readonly Cubie[], which: Group): Cubie[] {
  return state.filter((c) => {
    const n = nonZero(c.home)
    switch (which) {
      case 'cross':
        return c.home[1] === 1 && n === 2
      case 'whiteCorners':
        return c.home[1] === 1 && n === 3
      case 'middle':
        return c.home[1] === 0 && n === 2
      case 'yellowEdges':
        return c.home[1] === -1 && n === 2
      case 'yellowCorners':
        return c.home[1] === -1 && n === 3
    }
  })
}

const byId = (state: readonly Cubie[], id: number) => state.find((c) => c.id === id)!
const at = (state: readonly Cubie[], position: Vec3) => state.find((c) => eq(c.position, position))!
const ids = (cubies: readonly Cubie[]) => cubies.map((c) => c.id)
const centresFor = (ctx: Context, cubie: Cubie, skip: Face[] = []) =>
  coloursOf(cubie)
    .filter((c) => !skip.includes(c))
    .map((c) => ctx.centreId[c])

function f2lDone(ctx: Context, state: CubeState): boolean {
  return [
    ...group(state, 'cross'),
    ...group(state, 'whiteCorners'),
    ...group(state, 'middle'),
  ].every((c) => isPlaced(ctx, c))
}

const yellowUp = (cubie: Cubie) => eq(normalOf(cubie, YELLOW)!, UP)

/**
 * The last layer is judged up to a turn of the top: during the last steps the top layer can be
 * offset and that's fine, the final step lines it up. Returns the moves (none, or one U turn)
 * that line the yellow edges up with their centres, or null if no turn does.
 */
function edgeAlignment(ctx: Context, state: CubeState): Move[] | null {
  for (const turn of [[], ...U_TURNS.map((u) => [u])]) {
    const aligned = applyMoves(state, turn)
    if (group(aligned, 'yellowEdges').every((e) => isPlaced(ctx, e))) return turn
  }
  return null
}

// ---------------------------------------------------------------------------------------------
// Viewpoints and searches

/** Viewpoint from which the bottom slot at (sx, sz) is front-right, white still on the bottom. */
function slotFrame(sx: number, sz: number): ViewFrame {
  for (const front of [
    [sx, 0, 0],
    [0, 0, sz],
  ] as Vec3[]) {
    if (eq(add(front, cross(UP, front)), [sx, 0, sz])) return { front, up: UP }
  }
  throw new Error(`Not a corner slot: ${sx}, ${sz}`)
}

const SIDE_FRAMES: ViewFrame[] = (
  [
    [0, 0, 1],
    [1, 0, 0],
    [0, 0, -1],
    [-1, 0, 0],
  ] as Vec3[]
).map((front) => ({ front, up: UP }))

const inView = (frame: ViewFrame, alg: string) =>
  parseAlgorithm(alg).map((move) => moveInView(frame, move))

const sameFace = (a: Move, b: Move) => a.face === b.face
const AXIS_OF: Record<string, number> = { U: 0, D: 0, L: 1, R: 1, F: 2, B: 2 }
const FACE_RANK: Record<string, number> = { U: 0, D: 1, L: 2, R: 3, F: 4, B: 5 }

/**
 * Iterative-deepening search over outer-face turns, run on a few tracked cubies only.
 * Skips sequences that turn one face twice in a row, and fixes the order of opposite faces.
 */
function searchMoves(
  start: readonly Cubie[],
  goal: (state: readonly Cubie[]) => boolean,
  maxDepth: number,
  minDepth = 0,
): Move[] | null {
  const path: Move[] = []
  const dfs = (state: readonly Cubie[], depth: number): boolean => {
    if (depth === 0) return goal(state)
    const last = path.at(-1)
    for (const move of OUTER_MOVES) {
      if (last && sameFace(last, move)) continue
      if (
        last &&
        AXIS_OF[last.face] === AXIS_OF[move.face] &&
        FACE_RANK[move.face] < FACE_RANK[last.face]
      ) {
        continue
      }
      path.push(move)
      if (dfs(applyMove(state, move), depth - 1)) return true
      path.pop()
    }
    return false
  }
  for (let depth = minDepth; depth <= maxDepth; depth++) {
    if (dfs(start, depth)) return [...path]
  }
  return null
}

interface Macro {
  moves: Move[]
  kind: string
  frame?: ViewFrame
}

/** Breadth-first search over whole algorithms ("macros"), shortest macro count first. */
function searchMacros(
  start: CubeState,
  macros: readonly Macro[],
  goal: (state: CubeState) => boolean,
  maxDepth: number,
): Macro[] | null {
  let frontier: { state: CubeState; path: Macro[] }[] = [{ state: start, path: [] }]
  for (let depth = 0; depth <= maxDepth; depth++) {
    for (const node of frontier) if (goal(node.state)) return node.path
    if (depth === maxDepth) break
    frontier = frontier.flatMap((node) =>
      macros.map((macro) => ({
        state: applyMoves(node.state, macro.moves),
        path: [...node.path, macro],
      })),
    )
  }
  return null
}

const turnMacros: Macro[] = U_TURNS.map((move) => ({ moves: [move], kind: 'U' }))

// ---------------------------------------------------------------------------------------------
// Stages

const hint = (
  stage: StageId,
  text: string,
  moves: Move[],
  focus: number[],
  context: number[] = [],
) => ({ stage, text, moves, focus, context }) satisfies Hint

function planOrient(ctx: Context, state: CubeState): Hint | null {
  if (eq(ctx.centre[WHITE], [0, -1, 0])) return null
  for (const rotation of ['x', "x'", 'x2', 'z', "z'"].map(parseMove)) {
    if (eq(readContext(applyMove(state, rotation)).centre[WHITE], [0, -1, 0])) {
      return hint(
        'orient',
        'Roll the whole cube so the white centre is on the bottom. White stays down for the rest of the solve.',
        [rotation],
        [ctx.centreId[WHITE]],
      )
    }
  }
  return null
}

function planCross(ctx: Context, state: CubeState): Hint | null {
  const edges = group(state, 'cross')
  const unsolved = edges.filter((e) => !isPlaced(ctx, e))
  if (unsolved.length === 0) return null
  const solvedIds = ids(edges.filter((e) => isPlaced(ctx, e)))
  const keepsSolved = (s: readonly Cubie[]) => solvedIds.every((id) => isPlaced(ctx, byId(s, id)))

  // Find the edge that can be placed in the fewest moves.
  for (let depth = 1; depth <= 5; depth++) {
    for (const edge of unsolved) {
      const path = searchMoves(
        edges,
        (s) => isPlaced(ctx, byId(s, edge.id)) && keepsSolved(s),
        depth,
        depth,
      )
      if (path) {
        const side = coloursOf(edge).find((c) => c !== WHITE)!
        return hint(
          'cross',
          `Bring ${describe(edge)} down to the bottom, next to the ${COLOUR_NAMES[side]} centre, with white facing down. The cross edges already in place come back afterwards.`,
          path,
          [edge.id],
          [ctx.centreId[side], ctx.centreId[WHITE]],
        )
      }
    }
  }

  // Deeper cases: lift the edge into the top layer first, then it's at most a few moves.
  const edge = unsolved[0]
  const lift = searchMoves(edges, (s) => byId(s, edge.id).position[1] === 1 && keepsSolved(s), 4)
  if (!lift) return null
  return hint(
    'cross',
    `${capitalise(describe(edge))} is stuck where it can't drop straight in. Lift it into the top layer first.`,
    lift,
    [edge.id],
  )
}

const capitalise = (s: string) => s[0].toUpperCase() + s.slice(1)

function planCorners(ctx: Context, state: CubeState): Hint | null {
  const corners = group(state, 'whiteCorners')
  const unsolved = corners.filter((c) => !isPlaced(ctx, c))
  if (unsolved.length === 0) return null

  const aboveSlot = (c: Cubie) => {
    const t = targetOf(ctx, c)
    return c.position[1] === 1 && c.position[0] === t[0] && c.position[2] === t[2]
  }
  const corner =
    unsolved.find(aboveSlot) ?? unsolved.find((c) => c.position[1] === 1) ?? unsolved[0]
  const sides = coloursOf(corner).filter((c) => c !== WHITE)
  const sideNames = sides.map((c) => COLOUR_NAMES[c]).join(' and ')
  const context = centresFor(ctx, corner, [WHITE])

  if (corner.position[1] !== 1) {
    // Stuck in the bottom layer: one trigger lifts it out.
    const frame = slotFrame(corner.position[0], corner.position[2])
    const trigger = inView(frame, "R U R' U'")
    return hint(
      'corners',
      `${capitalise(describe(corner))} is in the bottom layer but not solved. Do the trigger once to lift it into the top layer.`,
      trigger,
      [corner.id],
    )
  }

  if (!aboveSlot(corner)) {
    const turn = U_TURNS.find((u) => aboveSlot(byId(applyMove(state, u), corner.id)))!
    return hint(
      'corners',
      `Turn the top until ${describe(corner)} sits right above its slot, between the ${sideNames} centres.`,
      [turn],
      [corner.id],
      context,
    )
  }

  const t = targetOf(ctx, corner)
  const trigger = inView(slotFrame(t[0], t[2]), "R U R' U'")
  const others = corners.filter((c) => c.id !== corner.id && isPlaced(ctx, c))
  const cross = group(state, 'cross')
  for (let reps = 1; reps <= 5; reps++) {
    const moves = Array.from({ length: reps }, () => trigger).flat()
    const after = applyMoves(state, moves)
    const ok =
      isPlaced(ctx, byId(after, corner.id)) &&
      [...others, ...cross].every((c) => isPlaced(ctx, byId(after, c.id)))
    if (ok) {
      return hint(
        'corners',
        `Repeat ${formatAlgorithm(trigger)} until the corner drops in with white facing down: ${
          reps === 1 ? 'once' : `${reps} times`
        } here.`,
        moves,
        [corner.id],
        context,
      )
    }
  }
  return null
}

function planMiddle(ctx: Context, state: CubeState): Hint | null {
  const edges = group(state, 'middle')
  const unsolved = edges.filter((e) => !isPlaced(ctx, e))
  if (unsolved.length === 0) return null

  const macros: Macro[] = [
    ...turnMacros,
    ...SIDE_FRAMES.flatMap((frame) => [
      { moves: inView(frame, "U R U' R' U' F' U F"), kind: 'right', frame },
      { moves: inView(frame, "U' L' U L U F U' F'"), kind: 'left', frame },
    ]),
  ]
  const keep = [
    ...group(state, 'cross'),
    ...group(state, 'whiteCorners'),
    ...edges.filter((e) => isPlaced(ctx, e)),
  ]
  let best: { edge: Cubie; path: Macro[] } | null = null
  for (const edge of unsolved) {
    const path = searchMacros(
      state,
      macros,
      (s) => isPlaced(ctx, byId(s, edge.id)) && keep.every((c) => isPlaced(ctx, byId(s, c.id))),
      3,
    )
    if (path && (!best || path.length < best.path.length)) best = { edge, path }
  }
  if (!best || best.path.length === 0) return null

  const { edge, path } = best
  const [first] = path
  const context = centresFor(ctx, edge)
  if (first.kind === 'U') {
    return hint(
      'middle',
      `Turn the top until ${describe(edge)} has its side colour over the matching centre.`,
      first.moves,
      [edge.id],
      context,
    )
  }
  if (edge.position[1] === 0) {
    return hint(
      'middle',
      `${capitalise(describe(edge))} is in the middle layer the wrong way. Insert a top edge into its slot to pop it out, then place it properly.`,
      first.moves,
      [edge.id],
    )
  }
  return hint(
    'middle',
    `${capitalise(describe(edge))} lines up with its centre. Its top colour points ${first.kind}, so insert it to the ${first.kind}.`,
    first.moves,
    [edge.id],
    context,
  )
}

function planYellowCross(ctx: Context, state: CubeState): Hint | null {
  const edges = group(state, 'yellowEdges')
  const up = edges.filter(yellowUp)
  if (up.length === 4) return null
  const macros = SIDE_FRAMES.map((frame) => ({
    moves: inView(frame, "F R U R' U' F'"),
    kind: 'cross',
    frame,
  }))
  const keep = [
    ...group(state, 'cross'),
    ...group(state, 'whiteCorners'),
    ...group(state, 'middle'),
  ]
  const path = searchMacros(
    state,
    macros,
    (s) =>
      group(s, 'yellowEdges').every(yellowUp) && keep.every((c) => isPlaced(ctx, byId(s, c.id))),
    3,
  )
  if (!path?.length) return null
  const shape =
    up.length === 0
      ? 'There’s just a yellow dot in the middle.'
      : up.length === 2 && eq(add(up[0].position, up[1].position), [0, 2, 0])
        ? 'There’s a yellow line on top.'
        : 'There’s a yellow L on top.'
  return hint(
    'yellow-cross',
    `${shape} Do ${formatAlgorithm(path[0].moves)} to work towards a yellow cross.`,
    path[0].moves,
    ids(up),
    [ctx.centreId[YELLOW]],
  )
}

function planYellowEdges(ctx: Context, state: CubeState): Hint | null {
  if (edgeAlignment(ctx, state)) return null
  const edges = group(state, 'yellowEdges')
  const macros: Macro[] = [
    ...turnMacros,
    ...SIDE_FRAMES.map((frame) => ({
      moves: inView(frame, "R U R' U R U2 R' U"),
      kind: 'swap',
      frame,
    })),
  ]
  const keep = [
    ...group(state, 'cross'),
    ...group(state, 'whiteCorners'),
    ...group(state, 'middle'),
  ]
  const path = searchMacros(
    state,
    macros,
    (s) => edgeAlignment(ctx, s) !== null && keep.every((c) => isPlaced(ctx, byId(s, c.id))),
    3,
  )
  if (!path?.length) return null
  const [first] = path
  const matched = edges.filter((e) => isPlaced(ctx, e))
  if (first.kind === 'U') {
    return hint(
      'yellow-edges',
      'Turn the top until two yellow edges match the centres below them.',
      first.moves,
      ids(edges),
    )
  }
  const text =
    matched.length === 2 && !eq(add(matched[0].position, matched[1].position), [0, 2, 0])
      ? 'Two edges match the centres below them, side by side. Swap the other two with this algorithm.'
      : 'The matching edges are opposite each other. Do the swap once, then look again.'
  return hint('yellow-edges', text, first.moves, ids(matched))
}

function planCornerPlaces(ctx: Context, state: CubeState): Hint | null {
  const corners = group(state, 'yellowCorners')
  // The corner cycle leaves the edges where they are, so one alignment holds throughout.
  const align = edgeAlignment(ctx, state) ?? []
  const placed = (s: CubeState, c: Cubie) =>
    eq(byId(applyMoves(s, align), c.id).position, targetOf(ctx, c))
  if (corners.every((c) => placed(state, c))) return null
  const macros = SIDE_FRAMES.map((frame) => ({
    moves: inView(frame, "U R U' L' U R' U' L"),
    kind: 'cycle',
    frame,
  }))
  const keep = [
    ...group(state, 'cross'),
    ...group(state, 'whiteCorners'),
    ...group(state, 'middle'),
  ]
  const path = searchMacros(
    state,
    macros,
    (s) =>
      corners.every((c) => placed(s, c)) &&
      edgeAlignment(ctx, s) !== null &&
      keep.every((c) => isPlaced(ctx, byId(s, c.id))),
    3,
  )
  if (!path?.length) return null
  const frame = path[0].frame!
  const anchor = at(state, add(add(frame.front, cross(frame.up, frame.front)), UP))
  const anchored = placed(state, anchor)
  return hint(
    'corner-places',
    anchored
      ? 'This corner is already in its spot, just maybe twisted. With it at front-right, cycle the other three.'
      : 'No corner is in its spot yet. Cycle once from here, then look again.',
    path[0].moves,
    anchored ? [anchor.id] : ids(corners),
  )
}

function planCornerTwists(state: CubeState): Hint | null {
  const corners = group(state, 'yellowCorners')
  // Only meaningful while the yellow corners are all in the top layer.
  if (corners.some((c) => c.position[1] !== 1) || corners.every(yellowUp)) return null
  const frontRight = at(state, [1, 1, 1])
  if (!yellowUp(frontRight)) {
    const trigger = inView(DEFAULT_VIEW, "R' D' R D")
    for (const reps of [2, 4]) {
      const moves = Array.from({ length: reps }, () => trigger).flat()
      if (yellowUp(byId(applyMoves(state, moves), frontRight.id))) {
        return hint(
          'corner-twists',
          `Repeat R' D' R D until yellow faces up on this corner: ${reps} times. The bottom will look scrambled until the last corner is done; that’s expected.`,
          moves,
          [frontRight.id],
        )
      }
    }
    return null
  }
  const turn = U_TURNS.find((u) => !yellowUp(at(applyMove(state, u), [1, 1, 1])))!
  return hint(
    'corner-twists',
    'Turn only the top layer to bring the next twisted corner to the front-right. Don’t turn the whole cube.',
    [turn],
    ids(corners.filter((c) => !yellowUp(c))),
  )
}

function planFinish(state: CubeState): Hint | null {
  const turn = U_TURNS.find((u) => isSolved(applyMove(state, u)))
  return turn
    ? hint('finish', 'Everything’s in place. Turn the top to line it up.', [turn], [])
    : null
}

/**
 * The next step towards a solved cube, or null when it's solved (or the state can't be read).
 * Pass the previous hint once its moves are done: twisting the last corners breaks the bottom
 * layers on purpose, and the planner needs to know it's mid-way through that step.
 */
export function planHint(state: CubeState, previous?: Hint): Hint | null {
  if (isSolved(state)) return null
  const ctx = readContext(state)

  // Twisting the last corners scrambles the bottom on purpose (and sometimes un-scrambles it
  // part-way), so once that step starts, keep going until every corner shows yellow on top.
  if (previous?.stage === 'corner-twists') {
    const twist = planCornerTwists(state)
    if (twist) return twist
  }

  // Once the top is all yellow, a single turn of the top is often all that's left.
  const topYellow = [...group(state, 'yellowEdges'), ...group(state, 'yellowCorners')].every(
    yellowUp,
  )
  if (topYellow && f2lDone(ctx, state)) {
    const finish = planFinish(state)
    if (finish) return finish
  }

  return (
    planOrient(ctx, state) ??
    planCross(ctx, state) ??
    planCorners(ctx, state) ??
    planMiddle(ctx, state) ??
    planYellowCross(ctx, state) ??
    planYellowEdges(ctx, state) ??
    planCornerPlaces(ctx, state) ??
    planCornerTwists(state) ??
    planFinish(state)
  )
}

export function stageNumber(stage: StageId): number {
  return STAGES.findIndex((s) => s.id === stage) + 1
}
