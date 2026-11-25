import type { GetterTree } from 'vuex'
import type { RootState } from '../types'
import type { DatabaseState } from './types'

export const getters = {
  getBackups: (state): string[] => {
    const backups = [...(state.info?.backups ?? [])]

    return backups.sort((a, b) => a.localeCompare(b))
  }
} satisfies GetterTree<DatabaseState, RootState>
