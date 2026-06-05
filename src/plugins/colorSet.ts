import type _Vue from 'vue'
import { TinyColor } from '@ctrl/tinycolor'

interface ColorGenOption {
  base: string
  count: number
  hsplit?: number
  lsplit?: number
}

type PaletteOption = string[] | ColorGenOption

interface ColorSlot {
  readonly color: string
  name?: string
  locked: boolean
}

const buildPalette = (option: PaletteOption): string[] => {
  if (Array.isArray(option)) return option
  const { base, count, hsplit = 0, lsplit = 0 } = option

  const { h, s, l } = new TinyColor(base).toHsl()

  return Array.from({ length: count }, (_, i) =>
    new TinyColor({
      h: h + hsplit * i,
      s,
      l: l - (lsplit / 100) * i
    }).toHexString()
  )
}

const DEFAULT_PALETTES: Record<string, PaletteOption> = {
  heater: { base: '#ff5252', hsplit: 20, count: 4 },
  bed: { base: '#1fb0ff', hsplit: 20, count: 2 },
  fan: { base: '#4CAF50', hsplit: 20, count: 4 },
  sensor: ['#D67600', '#830EE3', '#B366F2', '#E06573', '#E38819', '#795548', '#607D8B', '#3F51B5', '#F50057']
}

export class ColorSet {
  readonly lists: Record<string, ColorSlot[]>

  constructor (palettes: Record<string, PaletteOption> = DEFAULT_PALETTES) {
    this.lists = Object.fromEntries(
      Object.entries(palettes)
        .map(([list, option]) => [
          list,
          buildPalette(option)
            .map((color): ColorSlot => ({
              color,
              locked: false
            }))
        ])
    )
  }

  /**
   * Get a stable color for `name` within `list`.
   *
   * Returns the color already assigned to `name`, otherwise the next
   * never-assigned color, otherwise the first non-locked (recyclable) color, or
   * `undefined` when the list is unknown or every color is assigned and locked.
   *
   * `locked` (default true) keeps the assignment permanent until `forceResetAll`.
   * Pass false to allow the color to be recycled once the palette is exhausted
   * (e.g. when the key's display color is overridden elsewhere).
   */
  next (list: string, name?: string, locked = true): string | undefined {
    const slots = this.lists[list]

    if (!slots) {
      return undefined
    }

    if (name !== undefined) {
      const existing = slots
        .find(slot => slot.name === name)

      if (existing) {
        existing.locked = locked

        return existing.color
      }
    }

    const slot = slots.find(slot => slot.name === undefined) ??
      slots.find(slot => !slot.locked)

    if (!slot) {
      return undefined
    }

    slot.name = name
    slot.locked = locked

    return slot.color
  }

  /**
   * Clear every color assignment so all palettes start fresh.
   */
  forceResetAll (): void {
    for (const slots of Object.values(this.lists)) {
      for (const slot of slots) {
        slot.name = undefined
        slot.locked = false
      }
    }
  }
}

export const ColorSetPlugin = {
  install (Vue: typeof _Vue) {
    const colorset = new ColorSet()
    Vue.prototype.$colorset = colorset
    Vue.$colorset = colorset
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $colorset: ColorSet;
  }

  interface VueConstructor {
    $colorset: ColorSet;
  }
}
