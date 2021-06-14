import vuetify from '@/plugins/vuetify'
import { GetterTree } from 'vuex'
import { ChartState } from './types'
import { RootState } from '../types'
import { Globals } from '@/globals'
import dayjs from 'dayjs'

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
  },

  /**
   * Return the charts retention.
   */
  getChartRetention: (state, getters, rootState, rootGetters) => {
    const config = rootGetters['server/getConfig']
    return (
      'server' in config &&
      'temperature_store_size' in config.server
    )
      ? config.server.temperature_store_size
      : Globals.CHART_HISTORY_RETENTION
  },

  /**
   * Return base chart options given a chart type.
   */
  getBaseChartOptions: (state, getters, rootState, rootGetters) => () => {
    // Common properties across all chart types.
    const isDark = rootState.config?.uiSettings.theme.isDark
    const isMobile = vuetify.framework.breakpoint.mobile

    const fontColor = (isDark) ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)'
    const fontSize = (isMobile) ? 13 : 14

    const lineStyle = {
      color: (isDark) ? '#ffffff' : '#000000',
      opacity: 0.05
    }

    const pointerStyle = {
      color: (isDark) ? '#ffffff' : '#000000',
      opacity: 0.5
    }

    const grid = {
      show: true,
      borderWidth: 1,
      borderColor: (isDark) ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'
    }

    const tooltip = {
      backgroundColor: (isDark) ? 'rgba(15,15,15,0.75)' : 'rgba(255,255,255,0.75)',
      borderColor: (isDark) ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
      textStyle: {
        color: fontColor,
        fontSize
      }
    }

    const theme = rootGetters['config/getTheme']
    const color = [
      theme.currentTheme.primary,
      theme.currentTheme.secondary
    ]

    return {
      color,
      grid,
      tooltip: {
        ...tooltip,
        show: true,
        trigger: 'axis',
        position: ['-8px', '-8px'],
        // position (pos: any, params: any, el: HTMLElement, elRect: any, size: any) {
        //   const obj: { [index: string]: any } = { top: 0 }
        //   obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 0
        //   return obj
        // },
        formatter: (params: any) => {
          let title = false
          let text = '<div>'
          params
            .forEach((param: any) => {
              // console.log(param)
              const yDimension = param.dimensionNames[param.encode.y]
              const xDimension = param.dimensionNames[param.encode.x]
              if (
                xDimension &&
                yDimension &&
                param.seriesName
              ) {
                if (!title) {
                  const date = dayjs(param.value[xDimension])
                  text += `
                  <span style="font-size:${fontSize}px;color:${fontColor};font-weight:400;margin-left:2px">
                    ${date.format('LTS')}
                  </span>
                  `
                  title = true
                }
                text += `
                  <div style="white-space: nowrap;">
                    ${param.marker}
                    <span style="font-size:${fontSize}px;color:${fontColor};font-weight:400;margin-left:2px">
                      ${param.seriesName}:
                    </span>
                    <span style="float:right;margin-left:20px;font-size:${fontSize}px;color:${fontColor};font-weight:900">
                      ${param.value[yDimension]}%
                    </span>
                    <div style="clear: both"></div>
                  </div>
                  <div style="clear: both"></div>
                `
              }
            })
          text += '</div>'
          return text
        }
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        // min: (value: any) => {
        //   return value.max - (600 * 1000)
        // },
        min: 'dataMin',
        max: 'dataMax',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false, formatter: '{value}%' },
        splitLine: { show: true, lineStyle },
        axisPointer: { lineStyle: pointerStyle }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: (value: any) => {
          return (value.max <= 100)
            ? 100
            : value.max
        },
        axisLabel: { show: false, formatter: '{value}%' },
        splitLine: { show: true, lineStyle }
      }
    }
  },

  /**
   * Returb base chart series configuration based on a type
   */
  getBaseSeries: () => (options: any) => {
    const o = {
      type: 'line',
      smooth: true,
      animation: false,
      showSymbol: false,
      symbol: 'none',
      areaStyle: { type: 'solid', opacity: 0.3 },
      lineStyle: { type: 'solid', width: 1.5, opacity: 1 },
      emphasis: {
        lineStyle: { width: 1.5 }
      },
      ...options
    }
    return o
  }
}
