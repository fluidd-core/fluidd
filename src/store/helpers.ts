import { SocketState, FileChangeSocketResponse } from './socket/types'
import { FileListChangeInfo } from './files/types'

/**
 * Takes the file list changed information and formats
 * it for us.
 * The user can only change the file name, or its path -
 * but not both at once.
 */
export const getFileListChangeInfo = (payload: FileChangeSocketResponse): FileListChangeInfo => {
  // Determine the old and new path;
  // Determine the old and new item (if relevent..);
  // Note, the item could represent a folder or file.
  const root = payload.item.root
  const path = payload.item.path.substr(0, payload.item.path.lastIndexOf('/'))
  let r = {
    root,
    destination: {
      item: payload.item.path.split('/').pop() || '',
      path,
      notifyPath: (path.length === 0) ? root : root + '/' + path
    }
  }

  if (payload.source_item) {
    const sourcePath = payload.source_item.path.substr(0, payload.source_item.path.lastIndexOf('/'))
    r = {
      ...r,
      ...{
        source: {
          item: payload.source_item.path.split('/').pop(),
          path: sourcePath,
          notifyPath: (sourcePath.length === 0) ? root : root + '/' + sourcePath
        }
      }
    }
  }
  return r
}

/**
 * Prepare packet data for a chart entry.
 * Every packet should have both a current temperature
 * and a target. If this update is the target, use the existing temp.
 * If this update is the temp, use the existing target.
 * @param key The sensor key to update.
 * @param val The value being passed. We can tell if its a temp or target due to its property name.
 */
export const configureChartEntry = (key: string, val: {[key: string]: number }, state: SocketState) => {
  let label = key
  if (key.includes(' ')) label = key.split(' ')[1]

  const now = new Date() // Common date for this data.
  const r = {
    date: now,
    temperature: {
      label,
      x: now,
      y: 0
    },
    target: {
      label: `${label}Target`,
      x: now,
      y: 0
    }
  }

  if ('temperature' in val) {
    r.temperature.y = val.temperature
  } else {
    r.temperature.y = state.printer[key].temperature
  }

  if ('target' in val) {
    r.target.y = val.target
  } else {
    r.target.y = state.printer[key].target || 0 // sensors may not have targets
  }

  return r
}
