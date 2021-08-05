import { expose } from 'threads/worker'
import parseGcode from './parseGcode'
import { Subject, Observable } from 'threads/observable'

let progress = new Subject<number>()

expose({
  parse (gcode: string) {
    const movesAndParts = parseGcode(gcode, progress)

    progress.complete()
    progress = new Subject<number>()

    return movesAndParts
  },
  progress (): Observable<number> {
    return Observable.from(progress)
  }
})
