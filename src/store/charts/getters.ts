import { GetterTree } from 'vuex'
import { ChartState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<ChartState, RootState> = {
  /**
   * Returns our actual chart data
   */
  getChartData: (state) => {
    return state.chart
  },

  /**
   * Returns currently selected legends
   */
  getSelectedLegends: (state) => {
    return state.selectedLegends
  }
}
