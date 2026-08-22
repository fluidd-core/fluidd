import type { ActionTree } from 'vuex'
import { consola } from 'consola'
import type { HistoryItem, HistoryState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import getFilePaths from '@/util/get-file-paths'

/**
 * Individually fetched jobs - lifecycle
 * =====================================
 *
 * `history/init` loads only the newest `JOB_HISTORY_LOAD` jobs, but the file
 * browser needs the job behind each file's last print, and those are spread
 * across the whole history. Files whose job falls outside that page are
 * resolved one at a time instead.
 *
 *   files/onServerFilesGetDirectory ─┐
 *   files/onFileMetaData ────────────┴─> fetchMissingJobs(jobIds)
 *                                          │
 *                                          ├─ history component unsupported? stop
 *                                          ├─ drop ids already in `jobs`,
 *                                          │  in `jobsById`, in `missingJobIds`,
 *                                          │  or in flight
 *                                          ├─ drain through a bounded pool
 *                                          └─ commit ONCE per drain
 *                                               ├─ setJobsById   (resolved)
 *                                               └─ setMissingJobIds (404 only)
 *
 * Invalidated by:
 *   setDeleteJob         evict + mark missing (the job really is gone)
 *   setAddHistory        clear missing (SQLite reuses deleted job ids)
 *   setUpdateHistory     clear missing
 *   setHistoryList       drop whatever the new page covers
 *   repairMissingJobs    clear all negatives + re-scan on reconnect
 *   setReset             cleared via defaultState() on instance switch
 *
 * Keep this comment in step with any change to that flow.
 */

/**
 * Moonraker serializes every history endpoint behind a single lock, so
 * concurrency here buys no wall-clock - it only bounds how many promises are
 * pending client-side. Kept deliberately low so a long drain does not hold
 * that lock against the history page or an in-flight delete.
 */
const JOB_FETCH_CONCURRENCY = 2

/**
 * Module-local, not state: Vuex strict mode forbids writing to state outside a
 * mutation, and this never needs to be reactive.
 */
const inFlightJobIds = new Set<string>()

const isJobNotFoundError = (error: unknown): boolean => (
  error != null &&
  typeof error === 'object' &&
  'code' in error &&
  error.code === 404
)

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    inFlightJobIds.clear()

    commit('setReset')
  },

  /**
   * Inits moonraker component
   */
  async init ({ dispatch }) {
    // Get the last 50 history items.
    const historyList = SocketActions.serverHistoryList({ limit: Globals.JOB_HISTORY_LOAD })

    // Load the known totals.
    SocketActions.serverHistoryTotals()

    try {
      await historyList
    } catch (error) {
      consola.debug('Error loading history list', error)

      return
    }

    await dispatch('repairMissingJobs')
  },

  /**
   * `init` re-runs on every socket ready and `setHistoryList` replaces the
   * loaded page wholesale, so jobs added while we were away are only in the
   * new page, and any 404 we recorded belongs to a connection that is gone.
   * `files` is not reset on a socket drop, so nothing else reloads the
   * directories that are on screen - re-scan them here.
   */
  async repairMissingJobs ({ commit, dispatch, rootState }) {
    commit('setClearMissingJobIds')

    const jobIds = Object.values(rootState.files.pathContent)
      .flatMap(pathContent => pathContent?.files ?? [])
      .map(file => 'job_id' in file ? file.job_id : null)

    await dispatch('fetchMissingJobs', jobIds)
  },

  /**
   * Resolves jobs the loaded history page does not cover, one request each.
   *
   * Ids that are already known - loaded, cached, known missing, or in flight -
   * are dropped, so repeat directory loads issue nothing.
   */
  async fetchMissingJobs ({ commit, state, rootGetters }, payload: (string | null | undefined)[]) {
    if (!rootGetters['server/componentSupport']('history')) {
      return
    }

    const loadedJobIds = new Set(state.jobs.map(job => job.job_id))

    const queue = [...new Set(payload)]
      .filter((jobId): jobId is string => (
        !!jobId &&
        !loadedJobIds.has(jobId) &&
        state.jobsById[jobId] == null &&
        state.missingJobIds[jobId] == null &&
        !inFlightJobIds.has(jobId)
      ))

    if (queue.length === 0) {
      return
    }

    for (const jobId of queue) {
      inFlightJobIds.add(jobId)
    }

    const jobs: Moonraker.History.Job[] = []
    const missingJobIds: string[] = []

    const worker = async () => {
      while (queue.length > 0) {
        const jobId = queue.shift()

        if (jobId == null) {
          return
        }

        try {
          // suppressError: an orphaned job_id is expected - Moonraker never
          // clears it from the file metadata when the job is deleted - and a
          // directory of them would otherwise be a toast per file.
          const { job } = await SocketActions.serverHistoryGetJob(jobId, { suppressError: true })

          if (job != null) {
            jobs.push(job)
          }
        } catch (error) {
          if (isJobNotFoundError(error)) {
            missingJobIds.push(jobId)
          } else {
            // Transient - a dropped socket, say. Left uncached so the next
            // directory load tries again.
            consola.debug('Error fetching history job', jobId, error)
          }
        } finally {
          inFlightJobIds.delete(jobId)
        }
      }
    }

    await Promise.all(
      Array.from(
        { length: Math.min(JOB_FETCH_CONCURRENCY, queue.length) },
        worker
      )
    )

    if (jobs.length > 0) {
      commit('setJobsById', jobs)
    }

    if (missingJobIds.length > 0) {
      commit('setMissingJobIds', missingJobIds)
    }
  },

  async updateHistory ({ commit }, payload: Moonraker.History.Job) {
    if (payload) {
      commit('setUpdateHistory', payload)
    }
  },

  async clearHistoryThumbnails ({ commit }, payload: string) {
    if (payload) {
      commit('setClearHistoryThumbnails', payload)
    }
  },

  /**
   * Update the store with history totals data
   */
  async onHistoryTotals ({ commit }, payload: Moonraker.History.TotalsResponse) {
    if (payload) {
      commit('setHistoryTotals', payload)
    }
  },

  /**
   * Update the store with history
   */
  async onHistoryList ({ commit }, payload: Moonraker.History.ListResponse) {
    if (payload) {
      commit('setHistoryList', payload)
    }
  },

  /**
   * History has changed, update the data.
   */
  async onHistoryChange ({ commit, rootState }, payload: { action: 'added' | 'finished'; job: HistoryItem }) {
    SocketActions.serverHistoryTotals()

    if (payload) {
      switch (payload.action) {
        case 'added': {
          commit('setAddHistory', payload.job)

          const { rootPath, filename } = getFilePaths(payload.job.filename, 'gcodes')

          const pathContent = rootState.files.pathContent[rootPath]

          // If the file is known, then update the file metadata
          if (pathContent != null && pathContent.files.some(file => file.filename === filename)) {
            SocketActions.serverFilesMetadata(payload.job.filename)
          }

          break
        }
        case 'finished':
          commit('setUpdateHistory', payload.job)

          break
      }
    }
  },

  async onDelete ({ commit }, payload: Moonraker.History.DeleteJobResponse) {
    commit('setDeleteJob', payload.deleted_jobs)
  }
} satisfies ActionTree<HistoryState, RootState>
