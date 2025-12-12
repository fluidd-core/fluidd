import type { GetterTree } from 'vuex'
import type { BBox, GcodePreviewState, Layer, LayerPaths, Move, Part, Point3D, Tool } from './types'
import type { RootState } from '../types'
import { binarySearch, moveToSVGPath } from '@/util/gcode-preview'
import isKeyOf from '@/util/is-key-of'

const defaultColors = ['#1fb0ff', '#ff5252', '#D67600', '#830EE3', '#B366F2', '#E06573', '#E38819', '#795548', '#607D8B']
const lightDefaultColors = ['#000', ...defaultColors]
const darkDefaultColors = ['#FFF', ...defaultColors]

const updateMinMax = (previous: { min: number, max: number }, value?: number) => {
  if (value != null) {
    previous.min = Number.isFinite(previous.min)
      ? Math.min(previous.min, value)
      : value

    previous.max = Number.isFinite(previous.max)
      ? Math.max(previous.max, value)
      : value
  }
}

export const getters = {
  getLayers: (state, getters, rootState): readonly Layer[] => {
    if (state.layers.length) {
      return state.layers
    }

    const output: Layer[] = []
    const moves: readonly Move[] = state.moves

    let z = NaN
    let zStart = 0
    let zLast = NaN
    let zNext = NaN

    const { minLayerHeight } = rootState.config.uiSettings.gcodePreview

    moves.forEach((move, index) => {
      if (move.z !== undefined && z !== move.z) {
        z = move.z
        zStart = index
      }

      if (move.e && move.e > 0 && (Number.isNaN(zLast) || z < zLast || z >= zNext)) {
        if (['x', 'y', 'i', 'j'].some(x => isKeyOf(x, move) && move[x] !== 0)) {
          zLast = z
          zNext = Math.round((z + minLayerHeight) * 10000) / 10000

          output.push({
            z,
            move: zStart,
            filePosition: move.filePosition
          })
        }
      }
    })

    // If moves exist but there are no layers, add a single "default" layer at z=0
    // This can happen for gcode that only contains travel moves (eg: 2d plotters without Z or E steppers)
    if (output.length === 0 && moves.length) {
      output.push({
        z: 0,
        move: 0,
        filePosition: moves[0].filePosition
      })
    }

    return Object.freeze(output)
  },

  getParts: (state): readonly Part[] => {
    return state.parts
  },

  getBounds: (state, getters): BBox => {
    const layers: readonly Layer[] = getters.getLayers

    // ignore first and last layer (priming and parking)
    const moveRangeStart = layers[layers.length > 1 ? 1 : 0]?.move
    const moveRangeEnd = layers[layers.length - 1]?.move
    const moves: readonly Move[] = (moveRangeStart && moveRangeEnd)
      ? Object.freeze(state.moves.slice(moveRangeStart, moveRangeEnd))
      : state.moves

    const bounds = {
      x: {
        min: NaN,
        max: NaN
      },
      y: {
        min: NaN,
        max: NaN
      }
    }

    for (let index = 0; index < moves.length; index++) {
      const move = moves[index]

      updateMinMax(bounds.x, move.x)
      updateMinMax(bounds.y, move.y)
    }

    return {
      x: {
        min: bounds.x.min || 0,
        max: bounds.x.max || 0
      },
      y: {
        min: bounds.y.min || 0,
        max: bounds.y.max || 0
      }
    }
  },

  getToolHeadPosition: (state) => (moveIndex: number): Point3D => {
    const moves: readonly Move[] = state.moves
    const output = {
      x: NaN,
      y: NaN,
      z: NaN
    }

    for (let i = moveIndex; i >= 0 && (!Number.isFinite(output.x) || !Number.isFinite(output.y) || !Number.isFinite(output.z)); i--) {
      const move = moves[i]

      if (!Number.isFinite(output.x) && move.x != null) {
        output.x = move.x
      }

      if (!Number.isFinite(output.y) && move.y != null) {
        output.y = move.y
      }

      if (!Number.isFinite(output.z) && move.z != null) {
        output.z = move.z
      }
    }

    return {
      x: output.x || 0,
      y: output.y || 0,
      z: output.z || 0
    }
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

  getDefaultColors: (state, getters, rootState) => {
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

    const defaultColors: string[] = getters.getDefaultColors

    const tools = toolIndexes
      .reduce<Record<Tool, string>>((tools, toolIndex, index) => {
        const tool: Tool = `T${toolIndex}`
        const color: string = (
          colorsFromFileMetadata[index] ||
          defaultColors[index - colorsFromFileMetadata.length] ||
          defaultColors[0]
        )

        tools[tool] = color

        return tools
      }, {})

    return tools
  },

  getPaths: (state, getters) => (startMove: number, endMove: number, ignoreTools = false): LayerPaths => {
    const toolhead: Point3D = getters.getToolHeadPosition(startMove)
    const moves: readonly Move[] = state.moves

    const path: LayerPaths = {
      extrusions: {},
      moves: `M${toolhead.x},${toolhead.y}`,
      retractions: [],
      unretractions: [],
      toolhead: {
        x: 0,
        y: 0
      },
      tool: 'T0'
    }

    let traveling = true

    for (let index = startMove; index <= endMove && index < moves.length; index++) {
      const move = moves[index]

      if (!ignoreTools) {
        path.tool = `T${move.tool}`
      }

      if (move.e != null && move.e > 0) {
        if (traveling) {
          path.extrusions[path.tool] = `${path.extrusions[path.tool] || ''}M${toolhead.x},${toolhead.y}`
          path.unretractions.push({
            x: toolhead.x,
            y: toolhead.y
          })

          traveling = false
        }

        path.extrusions[path.tool] += moveToSVGPath(toolhead, move)
        Object.assign(toolhead, move)
      } else {
        if (!traveling) {
          path.moves += `M${toolhead.x},${toolhead.y}`
          traveling = true
        }

        if (move.e != null && move.e < 0) {
          path.retractions.push({
            x: toolhead.x,
            y: toolhead.y
          })
        }

        path.moves += moveToSVGPath(toolhead, move)
        Object.assign(toolhead, move)
      }
    }

    path.toolhead = {
      x: toolhead.x,
      y: toolhead.y
    }

    return path
  },

  getLayerPaths: (state, getters) => (layer: number): LayerPaths => {
    const layers: readonly Layer[] = getters.getLayers

    return getters.getPaths(layers[layer]?.move ?? 0, (layers[layer + 1]?.move ?? Infinity) - 1, true)
  },

  getPartPaths: (state, getters): string[] => {
    const parts: readonly Part[] = getters.getParts

    return parts
      .map(part => {
        const polygonAsString = part.polygon
          .map(point => `${point.x},${point.y}`)
          .join('L')

        return `M${polygonAsString}z`
      })
  },

  getMoveIndexByFilePosition: (state) => (filePosition: number): number => {
    if (filePosition <= 0) {
      return 0
    }

    const moves: readonly Move[] = state.moves

    return binarySearch(moves, move => filePosition - move.filePosition)
  },

  getLayerNrByFilePosition: (state, getters) => (filePosition: number): number => {
    if (filePosition <= 0) {
      return 0
    }

    const layers: Layer[] = getters.getLayers

    const layer = binarySearch(layers, layer => filePosition - layer.filePosition, true)

    return (
      layer >= 0
        ? layer
        : 0
    )
  }
} satisfies GetterTree<GcodePreviewState, RootState>
