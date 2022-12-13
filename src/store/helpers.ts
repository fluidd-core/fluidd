import { Commit, Dispatch } from 'vuex'
import { RootState } from './types'
import { SocketActions } from '@/api/socketActions'

export const isOfType = <T> (
  varToBeChecked: any,
  propertyToCheckFor: keyof T
): varToBeChecked is T => (varToBeChecked as T)[propertyToCheckFor] !== undefined

export const handleExcludeObjectChange = (payload: any, state: RootState, dispatch: Dispatch) => {
  // For every notify - if print_stats.state changes from standby -> printing,
  // then record an entry in our print history.
  // If the state changes from printing -> complete, then record the finish time.
  if ('exclude_object' in payload) {
    dispatch('parts/onPartUpdate', payload.exclude_object, { root: true })
  }

  if (
    'print_stats' in payload &&
    ('state' in payload.print_stats || 'filename' in payload.print_stats)
  ) {
    dispatch('parts/onPrintStatsUpdate', payload.print_stats, { root: true })
  }
}

export const handlePrintStateChange = (payload: any, state: RootState, dispatch: Dispatch) => {
  // For every notify - if print_stats.state changes from standby -> printing,
  // then record an entry in our print history.
  // If the state changes from printing -> complete, then record the finish time.
  if (
    'print_stats' in payload &&
    'state' in payload.print_stats
  ) {
    if (
      state.printer.printer.print_stats.state !== 'printing' &&
      payload.print_stats.state === 'printing'
    ) {
      // This is a new print starting...
      dispatch('printer/onPrintStart', payload, { root: true })
    } else if (
      state.printer.printer.print_stats.state === 'printing' &&
      payload.print_stats.state === 'complete'
    ) {
      // This is a completed print...
      dispatch('printer/onPrintEnd', payload, { root: true })
    } else if (
      state.printer.printer.print_stats.state === 'printing' &&
      payload.print_stats.state === 'standby'
    ) {
      // This is a cancelled print...
      dispatch('printer/onPrintEnd', payload, { root: true })
    }
  }
}

export const handleCurrentFileChange = (payload: any, state: RootState, commit: Commit) => {
  if (
    'print_stats' in payload &&
    'filename' in payload.print_stats &&
    payload.print_stats.filename !== state.printer.printer.print_stats.filename
  ) {
    commit('printer/setResetCurrentFile', undefined, { root: true })
    if (
      payload.print_stats.filename !== '' &&
      payload.print_stats.filename !== null
    ) {
      // This refreshes the metadata for the current file, which also
      // ensures we update the current_file with the latest data via
      // the files/onFileUpdate action.
      SocketActions.serverFilesMetaData(payload.print_stats.filename)
    }
  }
}
