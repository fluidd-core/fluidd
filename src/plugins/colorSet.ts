/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * A basic class to manage color steps for our graphs.
 */
import _Vue from 'vue'

export class ColorSet {
  logPrefix = '[WEBSOCKET]'
  colorList: ColorList = {}

  constructor (options: Options) {
    if (options.colorList) {
      for (const list in options.colorList) {
        this.colorList[list] = options.colorList[list].map(color => {
          return { color, used: false }
        })
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
    this.colorList[list].map(color => {
      if (color.name && !force) {
        // don't reset colors that have a name.
        return color
      } else {
        return { ...color, used: false }
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
  install (Vue: typeof _Vue, options?: Options) {
    const opts: Options = {
      colorList: {
        heater: ['#ff5252', '#802929', '#E64949', '#BF3D3D'],
        bed: ['#1fb0ff', '#0F5880'],
        sensor: ['#fb8c00', '#BA6600', '#7A4300', '#3B2000', '#E07B00'],
        fan: ['#307032', '#4caf50', '#51BD55', '#6DFC71', '#419644']
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
declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
      $colorset?: ColorSet;
  }
}

interface Options {
  colorList?: ColorListOption;
}

interface ColorListOption {
  [index: string]: string[];
}

interface ColorList {
  [index: string]: Color[];
}

interface Color {
  name?: string; // allow lookups of a color given its name.
  color: string;
  used: boolean;
}
