import { expose } from 'threads/worker'
import parseGcode from './parseGcode'
import { Subject } from 'threads/observable'

let progress = new Subject()

expose({
  parse (gcode: string) {
    const moves = parseGcode(gcode, progress)

    progress.complete()
    progress = new Subject()

    return moves
  },
  progress () {
    return progress
  }
})
