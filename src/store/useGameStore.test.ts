import { beforeEach, describe, expect, it } from 'vitest'
import { invertSequence, isSolved, parseAlgorithm, parseMove } from '../cube'
import { countMoves, useGameStore } from './useGameStore'

const store = useGameStore
const initial = store.getState()

/** Commit every queued move, as the scene does when animations finish. */
function flushQueue() {
  while (store.getState().queue.length > 0) {
    store.getState().commitMove(store.getState().queue[0].id)
  }
}

describe('game store', () => {
  beforeEach(() => store.setState(initial, true))

  it('queues moves and commits each exactly once, in order', () => {
    const { turn } = store.getState()
    turn(parseMove('R'))
    turn(parseMove('U'))
    const [first] = store.getState().queue
    store.getState().commitMove(first.id)
    store.getState().commitMove(first.id) // stale duplicate is ignored
    expect(store.getState().queue).toHaveLength(1)
    expect(store.getState().queue[0].move).toEqual(parseMove('U'))
  })

  it('undo reverses the latest move, including one still queued', () => {
    store.getState().turn(parseMove('R'))
    store.getState().turn(parseMove('F'))
    store.getState().undo()
    store.getState().undo()
    expect(store.getState().history).toHaveLength(0)
    flushQueue()
    expect(isSolved(store.getState().cube)).toBe(true)
  })

  it('times a solve from the first turn after a scramble until solved', () => {
    store.getState().startScramble(5)
    store.getState().turn(parseMove('R')) // ignored while scrambling
    expect(store.getState().status).toBe('scrambling')
    flushQueue()
    expect(store.getState().status).toBe('ready')

    for (const move of invertSequence(store.getState().scramble)) store.getState().turn(move)
    expect(store.getState().status).toBe('running')
    flushQueue()

    const state = store.getState()
    expect(state.status).toBe('solved')
    expect(state.finalTimeMs).not.toBeNull()
    expect(state.bestTimeMs).toBe(state.finalTimeMs)
    expect(state.history).toHaveLength(25)
  })

  it('rotations are undoable but neither count as moves nor start the timer', () => {
    store.getState().startScramble(11)
    flushQueue()
    store.getState().turn(parseMove('y'))
    expect(store.getState().status).toBe('ready')
    store.getState().turn(parseMove('R'))
    expect(store.getState().status).toBe('running')
    expect(countMoves(store.getState().history)).toBe(1)
    store.getState().undo()
    store.getState().undo()
    flushQueue()
    expect(store.getState().history).toHaveLength(0)
  })

  it('sets up a guide case untimed, and playing the algorithm solves it', () => {
    const tPerm = parseAlgorithm("R U R' U' R' F R2 U' R' U' R U R' F'")
    store.getState().setupCase('t-perm', tPerm)
    expect(store.getState().status).toBe('scrambling')
    flushQueue()
    expect(store.getState().status).toBe('idle')
    expect(store.getState().caseKey).toBe('t-perm')
    expect(isSolved(store.getState().cube)).toBe(false)

    store.getState().playAlgorithm('t-perm', tPerm)
    expect(store.getState().guidePlayback?.ids).toHaveLength(tPerm.length)
    expect(store.getState().caseKey).toBeNull()
    flushQueue()
    expect(isSolved(store.getState().cube)).toBe(true)
    expect(store.getState().status).toBe('idle')
  })

  it('walks a guided solve to the end when the player follows every suggestion', () => {
    store.getState().startScramble(21)
    flushQueue()
    store.getState().startGuide('guided')
    expect(store.getState().status).toBe('idle') // guided solves are untimed
    for (let i = 0; i < 400 && store.getState().guide?.hint; i++) {
      store.getState().guideStep()
      flushQueue()
    }
    expect(isSolved(store.getState().cube)).toBe(true)
    expect(store.getState().guide?.hint).toBeNull()
  })

  it('re-plans when the player goes their own way', () => {
    store.getState().startScramble(22)
    flushQueue()
    store.getState().startGuide('guided')
    const first = store.getState().guide!.hint!.moves[0]
    const other = parseMove(first.face === 'B' ? 'F' : 'B')
    store.getState().turn(other)
    const guide = store.getState().guide!
    expect(guide.index).toBe(0)
    expect(guide.hint).not.toBeNull()
  })

  it('scrambles first when a guided solve starts on a solved cube', () => {
    store.getState().startGuide('guided')
    expect(store.getState().status).toBe('scrambling')
    flushQueue()
    expect(store.getState().status).toBe('idle')
    expect(store.getState().guide?.hint).not.toBeNull()
  })

  it('drops a one-off hint after the next move and keeps hinted solves off the best list', () => {
    store.getState().startScramble(23)
    flushQueue()
    store.getState().startGuide('hint')
    expect(store.getState().guide?.mode).toBe('hint')
    expect(store.getState().assisted).toBe(true)
    store.getState().turn(parseMove('U'))
    expect(store.getState().guide).toBeNull()
    for (const move of invertSequence([...store.getState().scramble, parseMove('U')])) {
      store.getState().turn(move)
    }
    flushQueue()
    expect(store.getState().status).toBe('solved')
    expect(store.getState().isNewBest).toBe(false)
    expect(store.getState().bestTimeMs).toBeNull()
  })

  it('reset clears the queue mid-animation', () => {
    store.getState().startScramble(9)
    store.getState().reset()
    expect(store.getState().queue).toHaveLength(0)
    expect(store.getState().status).toBe('idle')
    expect(isSolved(store.getState().cube)).toBe(true)
  })
})
