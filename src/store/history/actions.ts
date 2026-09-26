import type { ActionTree } from 'vuex'
import type { HistoryItem, HistoryState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import getFilePaths from '@/util/get-file-paths'
import type { ObjectWithRequest } from '@/plugins/socketClient'
import { isMoonrakerNotFoundError, isSocketError } from '@/util/is-socket-error'

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
    // Get the most recent history items.
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

    // Chunked, one commit per chunk: a commit per job re-renders every history
    // and file table row, and hundreds of jobs then block the page for seconds.
    for (let index = 0; index < jobIds.length; index += Globals.JOB_HISTORY_FETCH_CHUNK) {
      const chunk = jobIds.slice(index, index + Globals.JOB_HISTORY_FETCH_CHUNK)

      const jobs = await Promise.all(
        chunk
          .map(async jobId => {
            try {
              const { job } = await SocketActions.serverHistoryGetJob(
                jobId,
                {
                  suppressError: isMoonrakerNotFoundError
                }
              )

              return job
            } catch (error) {
              if (
                !isSocketError(error) ||
                !isMoonrakerNotFoundError(error)
              ) {
                commit('setRemoveUnresolvedJobIds', [jobId])
              }

              return null
            }
          })
      )

      commit('setUpdateHistoryJobs', jobs.filter(Boolean))
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
  async onHistoryList ({ commit, dispatch, rootState }, payload: ObjectWithRequest<Moonraker.History.ListResponse>) {
    if (payload) {
      commit('setHistoryList', payload)

      const { limit } = payload.__request__.params ?? {}

      commit('setAllLoaded', limit === 0 || (limit != null && (payload.jobs?.length ?? 0) < limit))

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
