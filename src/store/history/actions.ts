import type { ActionTree } from 'vuex'
import type { HistoryItem, HistoryState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import getFilePaths from '@/util/get-file-paths'
import type { ObjectWithRequest } from '@/plugins/socketClient'

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
    commit('setReset')
  },

  /**
   * Inits moonraker component
   */
  async init () {
    // Get the last 50 history items.
    SocketActions.serverHistoryList({ limit: Globals.JOB_HISTORY_LOAD })

    // Load the known totals.
    SocketActions.serverHistoryTotals()
  },

  async fetchMissingJobs ({ commit, state, rootGetters }, payload: string[]) {
    if (!rootGetters['server/componentSupport']('history')) {
      return
    }

    const loadedJobIds = new Set(
      state.jobs
        .map(job => job.job_id)
    )

    const jobIds = [...new Set(payload)]
      .filter(jobId => (
        !loadedJobIds.has(jobId) &&
        !state.unresolvedJobIds.has(jobId)
      ))

    if (jobIds.length === 0) {
      return
    }

    commit('setAddUnresolvedJobIds', jobIds)

    await Promise.all(
      jobIds
        .map(async jobId => {
          try {
            await SocketActions.serverHistoryGetJob(
              jobId,
              {
                suppressError: true
              }
            )
          } catch (error) {
            if (!isJobNotFoundError(error)) {
              commit('setRemoveUnresolvedJobIds', [jobId])
            }
          }
        })
    )
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
   * Update a job in the store
   */
  async onHistoryJob ({ commit }, payload: Moonraker.History.JobResponse) {
    if (payload.job) {
      commit('setUpdateHistory', payload.job)
    }
  },

  /**
   * Update the store with history
   */
  async onHistoryList ({ commit, dispatch, rootState }, payload: ObjectWithRequest<Moonraker.History.ListResponse>) {
    if (payload) {
      commit('setHistoryList', payload)

      const { limit } = payload.__request__.params ?? {}

      commit('setAllLoaded', limit === 0 || (limit != null && (payload.jobs?.length ?? 0) < limit))

      commit('setClearUnresolvedJobIds')

      const jobIds = Object.values(rootState.files.pathContent)
        .flatMap(pathContent => pathContent?.files ?? [])
        .map(file => (
          'job_id' in file
            ? file.job_id
            : null
        ))
        .filter(Boolean)

      await dispatch('fetchMissingJobs', jobIds)
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
          commit('setUpdateHistory', payload.job)

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
    commit('setDeleteJobs', payload.deleted_jobs)
  }
} satisfies ActionTree<HistoryState, RootState>
