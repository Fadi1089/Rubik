import { create } from 'zustand'
import {
  applyMove,
  createSolvedCube,
  generateScramble,
  invertMove,
  isSolved,
  randomSeed,
  type CubeState,
  type Move,
} from '../cube'
import { loadBestTime, saveBestTime } from './bestTime'

export type MoveSource = 'user' | 'undo' | 'scramble'

export interface QueuedMove {
  /** Unique per enqueue, so the scene can tell queue entries apart and commit each exactly once. */
  readonly id: number
  readonly move: Move
  readonly source: MoveSource
}

/**
 * idle       free play, no timer
 * scrambling scramble moves are animating; player input is ignored
 * ready      scrambled, timer starts on the next turn
 * running    timing a solve
 * solved     solve finished; time is frozen until the next scramble
 */
export type GameStatus = 'idle' | 'scrambling' | 'ready' | 'running' | 'solved'

interface GameState {
  /** Committed cube state: every move that has finished animating. */
  cube: CubeState
  /** Moves waiting to animate. The head is the one currently animating. */
  queue: QueuedMove[]
  /** Player moves since the last scramble or reset, including queued ones. Drives undo and the move counter. */
  history: Move[]
  scramble: Move[]
  scrambleSeed: number | null
  status: GameStatus
  startedAt: number | null
  finalTimeMs: number | null
  bestTimeMs: number | null
  isNewBest: boolean

  turn: (move: Move) => void
  undo: () => void
  startScramble: (seed?: number) => void
  reset: () => void
  /** Called by the scene when the animation for queue entry `id` completes. */
  commitMove: (id: number) => void
}

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
} satisfies Partial<GameState>

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

  turn: (move) => {
    const { status, queue, history } = get()
    if (status === 'scrambling') return
    set({
      queue: [...queue, enqueue(move, 'user')],
      history: [...history, move],
      ...(status === 'ready' && { status: 'running', startedAt: performance.now() }),
    })
  },

  undo: () => {
    const { status, queue, history } = get()
    const last = history.at(-1)
    if (status === 'scrambling' || !last) return
    set({
      queue: [...queue, enqueue(invertMove(last), 'undo')],
      history: history.slice(0, -1),
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

  commitMove: (id) => {
    const { queue, cube, status, startedAt, bestTimeMs } = get()
    const [head, ...rest] = queue
    // Ignore stale or repeated commits (e.g. after a reset mid-animation).
    if (head?.id !== id) return

    const next = applyMove(cube, head.move)
    const update: Partial<GameState> = { cube: next, queue: rest }

    if (status === 'scrambling' && !rest.some((q) => q.source === 'scramble')) {
      update.status = 'ready'
    } else if (status === 'running' && startedAt !== null && isSolved(next)) {
      const time = performance.now() - startedAt
      const isNewBest = bestTimeMs === null || time < bestTimeMs
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
