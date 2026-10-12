import { beforeEach, describe, expect, it } from 'vitest'
import { invertSequence, isSolved, parseMove } from '../cube'
import { useGameStore } from './useGameStore'

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

  it('reset clears the queue mid-animation', () => {
    store.getState().startScramble(9)
    store.getState().reset()
    expect(store.getState().queue).toHaveLength(0)
    expect(store.getState().status).toBe('idle')
    expect(isSolved(store.getState().cube)).toBe(true)
  })
})
