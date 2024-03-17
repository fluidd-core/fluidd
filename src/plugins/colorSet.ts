/**
 * A basic class to manage color steps for our graphs.
 */
import _Vue from 'vue'
import { TinyColor } from '@ctrl/tinycolor'

export class ColorSet {
  logPrefix = '[WEBSOCKET]'
  colorList: ColorList = {}

  constructor (options: ColorSetPluginOptions) {
    if (options.colorList) {
      for (const item in options.colorList) {
        if ('base' in options.colorList[item]) {
          const opts = options.colorList[item] as ColorGenOption
          // this.colorList[item] = new Tinycolor(opts.base).analogous(opts.count, 20)
          //   .map((color: TinyColor) => {
          //     // const color = new Tinycolor({ h: num, s: 0.8, l: 0.8 }).toHexString()
          //     return { color: color.toHexString(), used: false }
          //   })
          const base = new TinyColor(opts.base).toHsl()
          let h = base.h
          let l = base.l
          const s = base.s
          const hsplit = opts.hsplit || 0
          const lsplit = (opts.lsplit) ? opts.lsplit / 100 : 0
          // let start = 100
          this.colorList[item] = [
            ...Array(opts.count).keys()
          ]
            .map(() => {
              const color = new TinyColor({ h, s, l }).toHexString()
              h = h + hsplit
              l = l - lsplit
              return { color, used: false }
            })
          // this.colorList[item].unshift({ color: opts.base, used: false })
        } else {
          const opts = options.colorList[item] as string[]
          this.colorList[item] = opts.map(color => {
            return { color, used: false }
          })
        }
      }
    }
  }

  /**
   * Get the next unused color in the given list.
   */
  next (list: string, name?: string) {
    if (this.colorList[list] === undefined) return // not found

    // Return a named color if given
    const namedColor = this.colorList[list].find(color => color.name === name)
    if (namedColor) {
      return namedColor.color
    }

    // If no more colors, reset non named.
    if (this.colorList[list].findIndex(color => !color.used) >= 0) {
      this.reset(list)
    }

    for (const color of this.colorList[list]) {
      if (color.used) continue
      if (name) color.name = name
      color.used = true
      return color.color
    }
  }

  /**
   * Reset the used state for all colors given a list.
   */
  reset (list: string, force = false): void {
    if (this.colorList[list] === undefined) return // not found
    this.colorList[list].forEach(color => {
      // don't reset colors that have a name, unless forced.
      if (!color.name || force) {
        color.used = false
        delete color.name
      }
    })
  }

  /**
   * Reset all color sets.
   */
  resetAll (): void {
    for (const list in this.colorList) {
      this.reset(list)
    }
  }

  /**
   * Force reset all color sets.
   * This also clears colors given a name.
   */
  forceResetAll (): void {
    for (const list in this.colorList) {
      this.reset(list, true)
    }
  }
}

export const ColorSetPlugin = {
  install (Vue: typeof _Vue, options?: ColorSetPluginOptions) {
    // Provide a specific list, or an option object to
    // define the color lists.
    const opts: ColorSetPluginOptions = {
      colorList: {
        heater: { base: '#ff5252', hsplit: 20, count: 3 },
        bed: { base: '#1fb0ff', hsplit: 20, count: 2 },
        fan: ['#3DC25A', '#58FC7C', '#10EB40', '#7EF297'],
        sensor: ['#D67600', '#830EE3', '#B366F2', '#E06573', '#E38819', '#795548', '#607D8B', '#3F51B5']
      }
    }
    const colorset = new ColorSet({ ...opts, ...options })
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

interface ColorSetPluginOptions {
  colorList?: ColorListOption;
}

interface ColorListOption {
  [index: string]: string[] | ColorGenOption;
}

interface ColorGenOption {
  base: string;
  count: number;
  hsplit?: number;
  lsplit?: number;
}

interface ColorList {
  [index: string]: Color[];
}

interface Color {
  name?: string; // allow lookups of a color given its name.
  color: string;
  used: boolean;
}
