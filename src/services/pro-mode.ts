import Vue from 'vue'

const KEY = 'muon3d.pro'

function read (): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Pro, one switch for the person at this browser (U3). It shows more: the
 * exact values, more rows and two more pages (Console and Files). It is a
 * display choice, never a permission, so it is kept here and not on the
 * printer, where everyone using it would share it.
 */
export const proMode = Vue.observable({ on: read() })

export function setProMode (on: boolean) {
  proMode.on = on
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    // Private windows may refuse storage; the switch still holds for this visit.
  }
}
