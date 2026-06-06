import type _Vue from 'vue'
import { TinyColor } from '@ctrl/tinycolor'
import { DefaultPalettes, type PaletteOption } from '@/globals'

const FALLBACK_COLOR = '#2196F3'

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

export class ColorSet {
  readonly lists: Record<string, ColorSlot[]>

  constructor (palettes: Record<string, PaletteOption> = DefaultPalettes) {
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
   * Resolve the display color for `name` within `list`.
   *
   * When `override` is given it is returned as-is and the key's palette slot is
   * left recyclable (so an overridden key never permanently consumes a color).
   * Otherwise returns the color already assigned to `name`, then the next
   * never-assigned color, then the first non-locked (recyclable) color, locking
   * the assignment until `forceResetAll`. Falls back to `FALLBACK_COLOR` when
   * the list is unknown or fully assigned-and-locked and no override is given.
   */
  next (list: string, name?: string, override?: string): string {
    const slots = this.lists[list]

    if (!slots) {
      return override ?? FALLBACK_COLOR
    }

    const locked = !override

    if (name !== undefined) {
      const existing = slots
        .find(slot => slot.name === name)

      if (existing) {
        existing.locked = locked

        return override ?? existing.color
      }
    }

    const slot = slots.find(slot => slot.name === undefined) ??
      slots.find(slot => !slot.locked)

    if (!slot) {
      return override ?? FALLBACK_COLOR
    }

    slot.name = name
    slot.locked = locked

    return override ?? slot.color
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
