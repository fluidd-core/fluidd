import type { GetterTree } from 'vuex'
import type { DatabaseState } from './types'
import type { RootState } from '../types'

export const getters = {
  getBackups: (state): string[] => {
    const backups = [...state.info?.backups ?? []]
      .sort((a, b) => a.localeCompare(b))

    return backups
  }
} satisfies GetterTree<DatabaseState, RootState>
