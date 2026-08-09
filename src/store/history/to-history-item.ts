import Vue from 'vue'
import type { HistoryItem } from './types'

/**
 * Normalizes a raw Moonraker job into the shape the app consumes.
 *
 * State holds raw jobs everywhere - both the loaded page and the individually
 * fetched cache - so this is the single place that converts them.
 */
const toHistoryItem = (job: Readonly<Moonraker.History.Job>): HistoryItem => {
  const { metadata, ...restOfJob } = job

  const item: HistoryItem = restOfJob

  if (metadata != null) {
    const { filament_name, filament_type, ...restOfMetadata } = metadata

    item.metadata = {
      ...restOfMetadata,
      modified: Vue.$filters.moonrakerDateAsUnixTime(metadata.modified)
    }

    if (filament_name != null) {
      item.metadata.filament_name = Vue.$filters.getStringArray(filament_name)
    }

    if (filament_type != null) {
      item.metadata.filament_type = Vue.$filters.getStringArray(filament_type)
    }
  }

  return item
}

export default toHistoryItem
