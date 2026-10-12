import { create } from 'zustand'
import {
  applyMove,
  applyMoves,
  createSolvedCube,
  generateScramble,
  invertMove,
  invertSequence,
  isRotation,
  isSolved,
  parseAlgorithm,
  randomSeed,
  type CubeState,
  type Move,
} from '../cube'
import { planHint, type Hint } from '../solver/beginner'
import { loadBestTime, saveBestTime } from './bestTime'

/** guide: moves played from the guides panel or the tutor, animated at a followable pace. */
export type MoveSource = 'user' | 'undo' | 'scramble' | 'guide'

export interface QueuedMove {
  /** Unique per enqueue, so the scene can tell queue entries apart and commit each exactly once. */
  readonly id: number
  readonly move: Move
  readonly source: MoveSource
}

/**
 * idle       free play, no timer
 * scrambling scramble (or guide case set-up) moves are animating; player input is ignored
 * ready      scrambled, timer starts on the next turn
 * running    timing a solve
 * solved     solve finished; time is frozen until the next scramble
 */
export type GameStatus = 'idle' | 'scrambling' | 'ready' | 'running' | 'solved'

/**
 * guided: a full walk-through that follows the player move by move.
 * hint:   a one-off look at the next step, gone after the next move.
 */
export interface GuideSession {
  mode: 'guided' | 'hint'
  /** The current step, or null once the cube is solved. */
  hint: Hint | null
  /** How many of the hint's moves have been made. */
  index: number
}

/** The guides hold the cube with white on the bottom, so case set-ups start from that view. */
export const GUIDE_HOLD = parseAlgorithm('z2')

interface GameState {
  /** Committed cube state: every move that has finished animating. */
  cube: CubeState
  /** Moves waiting to animate. The head is the one currently animating. */
  queue: QueuedMove[]
  /** Player moves since the last scramble or reset, including queued ones and whole-cube
   * rotations. Drives undo; use `countMoves` for the move counter. */
  history: Move[]
  scramble: Move[]
  scrambleSeed: number | null
  status: GameStatus
  startedAt: number | null
  finalTimeMs: number | null
  bestTimeMs: number | null
  isNewBest: boolean
  /** A hint was used during this timed solve, so it can't set a best time. */
  assisted: boolean
  /** Status to enter once the scramble finishes: 'ready' for a timed solve, 'idle' after a guide
   * case set-up or for a guided solve. */
  afterScramble: 'ready' | 'idle'
  /** The guide algorithm whose case is set up on the cube, until the next move. */
  caseKey: string | null
  /** The guide algorithm being played, with the queue ids of its moves in order. */
  guidePlayback: { key: string; ids: number[] } | null
  guide: GuideSession | null

  turn: (move: Move) => void
  /** Queue an algorithm from the guides, one move after another. */
  playAlgorithm: (key: string, moves: readonly Move[]) => void
  /** Reset to a solved cube held white-side down, then apply the inverse of `moves`, so `moves`
   * solves it. Untimed. */
  setupCase: (key: string, moves: readonly Move[]) => void
  undo: () => void
  startScramble: (seed?: number) => void
  reset: () => void
  /** Start a guided solve (scrambling first if the cube is solved) or show a one-off hint. */
  startGuide: (mode: GuideSession['mode']) => void
  /** Make the next move the guide suggests. */
  guideStep: () => void
  stopGuide: () => void
  /** Called by the scene when the animation for queue entry `id` completes. */
  commitMove: (id: number) => void
}

/** Turns made, not counting whole-cube rotations. */
export const countMoves = (history: readonly Move[]): number =>
  history.filter((move) => !isRotation(move)).length

let nextQueueId = 1
const enqueue = (move: Move, source: MoveSource): QueuedMove => ({
  id: nextQueueId++,
  move,
  source,
})

const clearedRound = {
  history: [],
  startedAt: null,
  finalTimeMs: null,
  isNewBest: false,
  assisted: false,
  caseKey: null,
  guidePlayback: null,
  guide: null,
} satisfies Partial<GameState>

/** The cube as it will be once every queued move has played. */
const predicted = (state: Pick<GameState, 'cube' | 'queue'>, extra: readonly Move[] = []) =>
  applyMoves(state.cube, [...state.queue.map((q) => q.move), ...extra])

/**
 * Move the guide along after the player makes `moves`. Following the suggestion steps through
 * it; anything else re-plans from the new state. One-off hints end after any move.
 */
function followGuide(
  guide: GuideSession | null,
  moves: readonly Move[],
  after: CubeState,
): GuideSession | null {
  if (!guide || guide.mode === 'hint') return null
  let { hint, index } = guide
  for (const move of moves) {
    const expected = hint?.moves[index]
    if (!hint || !expected || expected.face !== move.face) {
      return { ...guide, hint: planHint(after, hint ?? undefined), index: 0 }
    }
    if (expected.amount === move.amount) {
      index++
    } else if (expected.amount === 2) {
      // Half of a half turn: the other quarter, in the same direction, is still to come.
      const rest = [...hint.moves]
      rest[index] = { face: move.face, amount: move.amount }
      hint = { ...hint, moves: rest }
    } else {
      return { ...guide, hint: planHint(after, hint), index: 0 }
    }
  }
  if (hint && index >= hint.moves.length) return { ...guide, hint: planHint(after, hint), index: 0 }
  return { ...guide, hint, index }
}

export const useGameStore = create<GameState>()((set, get) => ({
  cube: createSolvedCube(),
  queue: [],
  history: [],
  scramble: [],
  scrambleSeed: null,
  status: 'idle',
  startedAt: null,
  finalTimeMs: null,
  bestTimeMs: loadBestTime(),
  isNewBest: false,
  assisted: false,
  afterScramble: 'ready',
  caseKey: null,
  guidePlayback: null,
  guide: null,

  turn: (move) => {
    const state = get()
    if (state.status === 'scrambling') return
    set({
      queue: [...state.queue, enqueue(move, 'user')],
      history: [...state.history, move],
      caseKey: null,
      guide: followGuide(state.guide, [move], predicted(state, [move])),
      ...(state.status === 'ready' &&
        !isRotation(move) && { status: 'running', startedAt: performance.now() }),
    })
  },

  playAlgorithm: (key, moves) => {
    const state = get()
    if (state.status === 'scrambling' || moves.length === 0) return
    const queued = moves.map((move) => enqueue(move, 'guide'))
    set({
      queue: [...state.queue, ...queued],
      history: [...state.history, ...moves],
      guidePlayback: { key, ids: queued.map((q) => q.id) },
      caseKey: null,
      guide: followGuide(state.guide, moves, predicted(state, moves)),
      ...(state.status === 'ready' &&
        moves.some((m) => !isRotation(m)) && {
          status: 'running',
          startedAt: performance.now(),
        }),
    })
  },

  setupCase: (key, moves) => {
    if (get().status === 'scrambling') return
    set({
      ...clearedRound,
      cube: createSolvedCube(),
      queue: [...GUIDE_HOLD, ...invertSequence(moves)].map((move) => enqueue(move, 'scramble')),
      scramble: [],
      scrambleSeed: null,
      status: 'scrambling',
      afterScramble: 'idle',
      caseKey: key,
    })
  },

  undo: () => {
    const state = get()
    const last = state.history.at(-1)
    if (state.status === 'scrambling' || !last) return
    const inverse = invertMove(last)
    set({
      queue: [...state.queue, enqueue(inverse, 'undo')],
      history: state.history.slice(0, -1),
      caseKey: null,
      guide: followGuide(state.guide, [inverse], predicted(state, [inverse])),
    })
  },

  startScramble: (seed = randomSeed()) => {
    if (get().status === 'scrambling') return
    const moves = generateScramble(seed)
    set({
      ...clearedRound,
      cube: createSolvedCube(),
      queue: moves.map((move) => enqueue(move, 'scramble')),
      scramble: moves,
      scrambleSeed: seed,
      status: 'scrambling',
      afterScramble: 'ready',
    })
  },

  reset: () => {
    set({
      ...clearedRound,
      cube: createSolvedCube(),
      queue: [],
      scramble: [],
      scrambleSeed: null,
      status: 'idle',
    })
  },

  startGuide: (mode) => {
    if (mode === 'guided' && isSolved(predicted(get()))) get().startScramble()
    const state = get()
    const hint = planHint(predicted(state))
    if (mode === 'guided') {
      // Guided solves are untimed.
      set({
        guide: { mode, hint, index: 0 },
        ...(state.status === 'scrambling'
          ? { afterScramble: 'idle' as const }
          : state.status === 'ready' || state.status === 'running'
            ? { status: 'idle' as const, startedAt: null }
            : {}),
      })
    } else {
      set({
        guide: { mode, hint, index: 0 },
        ...((state.status === 'ready' || state.status === 'running') && { assisted: true }),
      })
    }
  },

  guideStep: () => {
    const state = get()
    const { guide } = state
    const next = guide?.hint?.moves[guide.index]
    if (!next || state.status === 'scrambling') return
    set({
      queue: [...state.queue, enqueue(next, 'guide')],
      history: [...state.history, next],
      caseKey: null,
      // A one-off hint ends once its move has been shown.
      guide: guide.mode === 'hint' ? null : followGuide(guide, [next], predicted(state, [next])),
      ...(state.status === 'ready' &&
        !isRotation(next) && { status: 'running', startedAt: performance.now(), assisted: true }),
    })
  },

  stopGuide: () => set({ guide: null }),

  commitMove: (id) => {
    const { queue, cube, status, startedAt, bestTimeMs, afterScramble, assisted } = get()
    const [head, ...rest] = queue
    // Ignore stale or repeated commits (e.g. after a reset mid-animation).
    if (head?.id !== id) return

    const next = applyMove(cube, head.move)
    const update: Partial<GameState> = { cube: next, queue: rest }

    if (status === 'scrambling' && !rest.some((q) => q.source === 'scramble')) {
      update.status = afterScramble
    } else if (status === 'running' && startedAt !== null && isSolved(next)) {
      const time = performance.now() - startedAt
      const isNewBest = !assisted && (bestTimeMs === null || time < bestTimeMs)
      if (isNewBest) saveBestTime(time)
      Object.assign(update, {
        status: 'solved',
        finalTimeMs: time,
        isNewBest,
        bestTimeMs: isNewBest ? time : bestTimeMs,
      })
    }

    set(update)
  },
}))
