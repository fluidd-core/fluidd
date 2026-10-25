import type { GcodePreviewState, MoveStore } from './types'

export const defaultMoveStore: MoveStore = Object.freeze({
  x: new Float32Array(0),
  y: new Float32Array(0),
  z: new Float32Array(0),
  i: new Float32Array(0),
  j: new Float32Array(0),
  tool: new Uint8Array(0),
  flags: new Uint8Array(0),
  role: new Uint8Array(0),
  speed: new Uint16Array(0),
  fan: new Uint8Array(0),
  filePosition: new Uint32Array(0),
  length: 0
})

export const createState = (): GcodePreviewState => {
  return {
    moves: defaultMoveStore,
    layers: [],
    parts: [],
    tools: [],
    roles: [],
    speedRange: null,
    fanRange: null,
    bounds: null,
    file: null,
    parserProgress: 0,
    parserWorker: null
  }
}
