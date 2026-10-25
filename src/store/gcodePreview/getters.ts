import type { GetterTree } from 'vuex'
import type { BBox, BuildLayerPathsOptions, GcodePreviewState, Layer, LayerPaths, Part, ColorStop, Tool, ValueRange } from './types'
import { ExtrusionRole, MoveFlags } from './types'
import type { RootState } from '../types'
import { binarySearch, buildLayerPaths, rangeColors } from '@/util/gcode-preview'
import decimalRound from '@/util/decimal-round'

const defaultColors = ['#1fb0ff', '#ff5252', '#D67600', '#830EE3', '#B366F2', '#E06573', '#E38819', '#795548', '#607D8B']
const lightDefaultColors = Object.freeze(['#000', ...defaultColors])
const darkDefaultColors = Object.freeze(['#FFF', ...defaultColors])

const roleColors = [
  '#E6B3B3', // None
  '#FFE64D', // Perimeter
  '#FF7D38', // ExternalPerimeter
  '#1F1FFF', // OverhangPerimeter
  '#B03029', // InternalInfill
  '#9654CC', // SolidInfill
  '#F04040', // TopSolidInfill
  '#FF8C69', // Ironing
  '#4D80BA', // BridgeInfill
  '#FFFFFF', // GapFill
  '#00876E', // Skirt
  '#00FF00', // SupportMaterial
  '#008000', // SupportMaterialInterface
  '#B3E3AB', // WipeTower
  '#5ED194' // Custom
]
const groupColors = (prefix: string, colors: readonly string[]) => Object.freeze(
  colors
    .reduce<Record<string, string>>((groups, color, index) => {
      groups[`${prefix}${index}`] = color

      return groups
    }, {})
)

const darkRoleColors = groupColors('R', roleColors)
// white gap fill disappears on a light background
const lightRoleColors = groupColors('R', roleColors.map((color, role) => role === ExtrusionRole.GapFill ? '#333333' : color))

const speedColors = groupColors('S', rangeColors)
const fanColors = groupColors('F', rangeColors)

// same stops as PrusaSlicer's range legend: one per distinct value when there are at most 2
const rangeStops = (range: Readonly<ValueRange> | null, scale: number): readonly ColorStop[] => {
  if (!range) {
    return []
  }

  const min = range.min * scale
  const max = range.max * scale

  if (range.count <= 2) {
    return Object.freeze(
      [
        { value: min, color: rangeColors[0] },
        { value: max, color: rangeColors[rangeColors.length - 1] }
      ].slice(0, range.count)
    )
  }

  const step = (max - min) / (rangeColors.length - 1)

  return Object.freeze(
    rangeColors
      .map((color, index) => ({
        value: min + step * index,
        color
      }))
  )
}

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
        zNext = decimalRound(currentZ + minLayerHeight, 4)

        output.push({
          z: decimalRound(currentZ, 4),
          move: zStart,
          filePosition: filePosition[zStart]
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
        min: Number.isFinite(minX) ? decimalRound(minX, 4) : 0,
        max: Number.isFinite(maxX) ? decimalRound(maxX, 4) : 0
      },
      y: {
        min: Number.isFinite(minY) ? decimalRound(minY, 4) : 0,
        max: Number.isFinite(maxY) ? decimalRound(maxY, 4) : 0
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

    return Object.freeze(tools)
  },

  getRoleColors: (state, getters, rootState): Record<string, string> => {
    return rootState.config.uiSettings.theme.isDark
      ? darkRoleColors
      : lightRoleColors
  },

  getSpeedStops: (state): readonly ColorStop[] => {
    // mm/min to mm/s
    return rangeStops(state.speedRange, 1 / 60)
  },

  getFanStops: (state): readonly ColorStop[] => {
    // M106 S to percent
    return rangeStops(state.fanRange, 100 / 255)
  },

  getExtrusionColors: (state, getters, rootState): Record<string, string> => {
    switch (rootState.config.uiSettings.gcodePreview.colorMode) {
      case 'role':
        return getters.getRoleColors
      case 'speed':
        return speedColors
      case 'fan':
        return fanColors
      default:
        return getters.getToolColors
    }
  },

  getPaths: (state) => (startMove: number, endMove: number, options?: BuildLayerPathsOptions): Readonly<LayerPaths> => {
    return buildLayerPaths(state.moves, startMove, endMove, options)
  },

  getLayerPaths: (state, getters) => (layer: number, options?: BuildLayerPathsOptions): Readonly<LayerPaths> => {
    const layers: readonly Layer[] = getters.getLayers

    return getters.getPaths(layers[layer]?.move ?? 0, (layers[layer + 1]?.move ?? Number.POSITIVE_INFINITY) - 1, options)
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

    const move = binarySearch(moves.length, index => filePosition - moves.filePosition[index])

    return Math.max(0, move)
  },

  getLayerNrByFilePosition: (state, getters) => (filePosition: number): number => {
    if (filePosition <= 0) {
      return 0
    }

    const layers: readonly Layer[] = getters.getLayers

    const layer = binarySearch(layers.length, index => filePosition - layers[index].filePosition)

    return Math.max(0, layer)
  }
} satisfies GetterTree<GcodePreviewState, RootState>
