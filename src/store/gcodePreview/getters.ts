import type { GetterTree } from 'vuex'
import type { BBox, GcodePreviewState, Layer, LayerPaths, Part, Tool } from './types'
import { MoveFlags } from './types'
import type { RootState } from '../types'
import { binarySearch, buildLayerPaths } from '@/util/gcode-preview'

const defaultColors = ['#1fb0ff', '#ff5252', '#D67600', '#830EE3', '#B366F2', '#E06573', '#E38819', '#795548', '#607D8B']
const lightDefaultColors = Object.freeze(['#000', ...defaultColors])
const darkDefaultColors = Object.freeze(['#FFF', ...defaultColors])

export const getters = {
  getLayers: (state, getters, rootState): readonly Layer[] => {
    if (state.layers.length) {
      return state.layers
    }

    const output: Layer[] = []
    const { x, y, z, flags, filePosition, length } = state.moves

    const { minLayerHeight } = rootState.config.uiSettings.gcodePreview

    let currentZ = NaN
    let zStart = 0
    let zLast = NaN
    let zNext = NaN

    for (let index = 0; index < length; index++) {
      if (z[index] !== currentZ) {
        currentZ = z[index]
        zStart = index
      }

      const moveFlags = flags[index]

      if (
        (moveFlags & MoveFlags.Extruding) !== 0 &&
        (Number.isNaN(zLast) || currentZ < zLast || currentZ >= zNext) &&
        (
          index === 0 ||
          x[index] !== x[index - 1] ||
          y[index] !== y[index - 1] ||
          (moveFlags & MoveFlags.Arc) !== 0
        )
      ) {
        zLast = currentZ
        zNext = Math.round((currentZ + minLayerHeight) * 10000) / 10000

        output.push({
          z: Math.round(currentZ * 10000) / 10000,
          move: zStart,
          filePosition: filePosition[index]
        })
      }
    }

    // If moves exist but there are no layers, add a single "default" layer at z=0
    // This can happen for gcode that only contains travel moves (eg: 2d plotters without Z or E steppers)
    if (output.length === 0 && length) {
      output.push({
        z: 0,
        move: 0,
        filePosition: filePosition[0]
      })
    }

    return Object.freeze(output)
  },

  getParts: (state): readonly Part[] => {
    return state.parts
  },

  getBounds: (state, getters): Readonly<BBox> => {
    if (state.bounds != null) {
      return state.bounds
    }

    const layers: readonly Layer[] = getters.getLayers
    const { x, y, length } = state.moves

    // ignore first and last layer (priming and parking), unless doing so would
    // leave nothing to measure
    const useLayerRange = layers.length > 1 && layers[1].move < layers[layers.length - 1].move

    const start = useLayerRange ? layers[1].move : 0
    const end = useLayerRange ? Math.min(layers[layers.length - 1].move, length) : length

    let minX = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    for (let index = start; index < end; index++) {
      const moveX = x[index]
      const moveY = y[index]

      if (moveX < minX) minX = moveX
      if (moveX > maxX) maxX = moveX
      if (moveY < minY) minY = moveY
      if (moveY > maxY) maxY = moveY
    }

    return Object.freeze({
      x: {
        min: Number.isFinite(minX) ? minX : 0,
        max: Number.isFinite(maxX) ? maxX : 0
      },
      y: {
        min: Number.isFinite(minY) ? minY : 0,
        max: Number.isFinite(maxY) ? maxY : 0
      }
    })
  },

  getFileFilamentColors: (state): string[] => {
    const file = state.file

    if (file) {
      if (
        'extruder_colors' in file &&
        Array.isArray(file.extruder_colors)
      ) {
        return file.extruder_colors
      }

      if (
        'filament_colors' in file &&
        Array.isArray(file.filament_colors)
      ) {
        return file.filament_colors
      }
    }

    return []
  },

  getDefaultColors: (state, getters, rootState): readonly string[] => {
    return (
      rootState.config.uiSettings.theme.isDark
        ? darkDefaultColors
        : lightDefaultColors
    )
  },

  getToolColors: (state, getters): Record<Tool, string> => {
    const [toolIndexes, colorsFromFileMetadata]: [readonly number[], string[]] = state.tools.length === 0
      ? [
          [0],
          []
        ]
      : [
          state.tools,
          getters.getFileFilamentColors
        ]

    const defaultColors: readonly string[] = getters.getDefaultColors

    const tools = toolIndexes
      .reduce<Record<Tool, string>>((tools, toolIndex, index) => {
        const tool: Tool = `T${toolIndex}`
        const color: string = (
          colorsFromFileMetadata[toolIndex] ||
          defaultColors[index - colorsFromFileMetadata.length] ||
          defaultColors[0]
        )

        tools[tool] = color

        return tools
      }, {})

    return tools
  },

  getPaths: (state) => (startMove: number, endMove: number, ignoreTools = false): Readonly<LayerPaths> => {
    return buildLayerPaths(state.moves, startMove, endMove, ignoreTools)
  },

  getLayerPaths: (state, getters) => (layer: number): Readonly<LayerPaths> => {
    const layers: readonly Layer[] = getters.getLayers

    return getters.getPaths(layers[layer]?.move ?? 0, (layers[layer + 1]?.move ?? Number.POSITIVE_INFINITY) - 1, true)
  },

  getPartPaths: (state, getters): readonly string[] => {
    const parts: readonly Part[] = getters.getParts

    const partPaths = parts
      .map(part => {
        const polygonAsString = part.polygon
          .map(point => `${point.x},${point.y}`)
          .join('L')

        return `M${polygonAsString}z`
      })

    return Object.freeze(partPaths)
  },

  getMoveIndexByFilePosition: (state) => (filePosition: number): number => {
    if (filePosition <= 0) {
      return 0
    }

    const moves = state.moves

    return binarySearch(moves.length, index => filePosition - moves.filePosition[index])
  },

  getLayerNrByFilePosition: (state, getters) => (filePosition: number): number => {
    if (filePosition <= 0) {
      return 0
    }

    const layers: readonly Layer[] = getters.getLayers

    const layer = binarySearch(layers.length, index => filePosition - layers[index].filePosition)

    return (
      layer >= 0
        ? layer
        : 0
    )
  }
} satisfies GetterTree<GcodePreviewState, RootState>
