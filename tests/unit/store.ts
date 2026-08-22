import Vue from 'vue'
import { TypedStore } from '@/store'
import { history } from '@/store/history'
import { files } from '@/store/files'
import { server } from '@/store/server'
import dateTimeFormatters from '@/util/date-time-formatters'
import stringFormatters from '@/util/string-formatters'

/**
 * The history getters normalize job metadata through `Vue.$filters`. Installing
 * the real plugin would drag in the router and the app store, so the two
 * formatter modules it composes are wired up directly.
 */
export const installTestFilters = () => {
  Vue.$filters = {
    ...Vue.$filters,
    ...dateTimeFormatters(() => 'iso', () => 'iso'),
    ...stringFormatters()
  }
}

export const defaultServerInfo = (components: string[] = ['history']): Moonraker.Server.InfoResponse => ({
  klippy_connected: true,
  klippy_state: 'ready',
  components,
  failed_components: [],
  registered_directories: [],
  warnings: []
})

/**
 * A store holding only the modules under test.
 *
 * Module state is a module-level singleton in this codebase, so a fresh store
 * still starts on whatever the previous one left behind - hence the explicit
 * resets.
 */
export const createTestStore = (components: string[] = ['history']) => {
  installTestFilters()

  const store = new TypedStore({
    modules: {
      history,
      files,
      server
    }
  })

  store.commit('history/setReset')
  store.commit('files/setReset')
  store.commit('server/setReset')
  store.commit('server/setServerInfo', defaultServerInfo(components))

  return store
}

export const createHistoryJob = (job: Partial<Moonraker.History.Job> & Pick<Moonraker.History.Job, 'job_id'>): Moonraker.History.Job => ({
  exists: true,
  end_time: null,
  filament_used: 0,
  filename: `${job.job_id}.gcode`,
  print_duration: 0,
  status: 'completed',
  start_time: 0,
  total_duration: 0,
  ...job
})
