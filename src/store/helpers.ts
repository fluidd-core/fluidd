import {
  Thumbnail
} from './files/types'
import { SocketActions } from '@/api/socketActions'
import store from '@/store'

export const isOfType = <T> (
  varToBeChecked: any,
  propertyToCheckFor: keyof T
): varToBeChecked is T => (varToBeChecked as T)[propertyToCheckFor] !== undefined

/**
 * Return a file thumb if one exists
 * Optionally, pick the largest or smallest image.
 */
export const getThumb = (thumbnails: Thumbnail[], path: string, large = true) => {
  const apiUrl = store.state.config?.apiUrl
  if (thumbnails.length) {
    let thumb: Thumbnail | undefined
    if (thumbnails) {
      if (large) {
        thumb = thumbnails.reduce((a, c) => (a.size && c.size && (a.size > c.size)) ? a : c)
      } else {
        thumb = thumbnails.reduce((a, c) => (a.size && c.size && (a.size < c.size)) ? a : c)
      }
      if (thumb) {
        if (thumb.relative_path && thumb.relative_path.length > 0) {
          const url = new URL(apiUrl ?? document.location.origin)
          url.pathname = (path === '')
            ? `/server/files/gcodes/${encodeURI(thumb.relative_path)}`
            : `/server/files/gcodes/${encodeURI(path)}/${encodeURI(thumb.relative_path)}`

          return {
            ...thumb,
            absolute_path: url.toString()
          }
        }
        if (thumb.data) {
          return {
            ...thumb,
            data: 'data:image/gif;base64,' + thumb.data
          }
        }
        if (thumb.absolute_path) {
          return thumb
        }
      }
    }
  }
}

export const handleExcludeObjectChange = (payload: any, state: any, dispatch: any) => {
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

export const handlePrintStateChange = (payload: any, state: any, dispatch: any) => {
  // For every notify - if print_stats.state changes from standby -> printing,
  // then record an entry in our print history.
  // If the state changes from printing -> complete, then record the finish time.
  if (
    'print_stats' in payload &&
    'state' in payload.print_stats
  ) {
    if (
      state.printer?.printer.print_stats.state !== 'printing' &&
      payload.print_stats.state === 'printing'
    ) {
      // This is a new print starting...
      dispatch('printer/onPrintStart', payload, { root: true })
    } else if (
      state.printer?.printer.print_stats.state === 'printing' &&
      payload.print_stats.state === 'complete'
    ) {
      // This is a completed print...
      dispatch('printer/onPrintEnd', payload, { root: true })
    } else if (
      state.printer?.printer.print_stats.state === 'printing' &&
      payload.print_stats.state === 'standby'
    ) {
      // This is a cancelled print...
      dispatch('printer/onPrintEnd', payload, { root: true })
    }
  }
}

export const handleCurrentFileChange = (payload: any) => {
  if (
    'print_stats' in payload &&
    'filename' in payload.print_stats &&
    payload.print_stats.filename !== store.state.printer?.printer.print_stats.filename
  ) {
    store.commit('printer/setResetCurrentFile')
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
