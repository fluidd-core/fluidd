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
 * exact values and more rows. Console and Files live under Tools. It is a
 * display choice, never a permission, so it is kept here and not on the
 * printer, where everyone using it would share it.
 */
export const proMode = Vue.observable({ on: read() })

/**
 * Whether the page offers the Pro switch (the header's, More's "Pro controls",
 * Shift X and the command bar's "Turn Pro on"). A page that frames another
 * app (Slice, and Design once Control frames it) has no mode: the switch would
 * change nothing in it, so it is not offered there (KAN-550). Its route says so
 * with meta.noMode.
 */
export function hasProSwitch (route: { meta?: { noMode?: boolean } } | null | undefined): boolean {
  return route?.meta?.noMode !== true
}

export function setProMode (on: boolean) {
  proMode.on = on
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    // Private windows may refuse storage; the switch still holds for this visit.
  }
}
