import { LOOK_TOKENS, type HostLook } from './vendor/printer-client/bridge/protocol'

/**
 * Fluidd's look for the slicer (ui.look, printer-client 0.2.0): its own
 * --m3d-* values, each read from the page's root, so the slicer draws itself
 * as a part of the page in Fluidd's colours, corners and fonts.
 *
 * Colours are resolved before they are sent: Fluidd's custom properties
 * hold var(…) and color-mix(…), which the slicer refuses. A hidden probe
 * resolves each into the browser's own rgb(…) or color(srgb …), which it
 * accepts. Lengths, shadows and font stacks go as they are.
 */
export function readLook (root: HTMLElement, theme: 'light' | 'dark'): HostLook {
  const style = getComputedStyle(root)
  const probe = document.createElement('span')
  probe.style.display = 'none'
  root.append(probe)
  const tokens: HostLook['tokens'] = {}
  try {
    for (const [name, kind] of Object.entries(LOOK_TOKENS)) {
      const raw = style.getPropertyValue(`--m3d-${name}`).trim()
      if (!raw) continue
      if (kind === 'color') {
        probe.style.color = ''
        probe.style.color = raw
        const resolved = probe.style.color ? getComputedStyle(probe).color : ''
        if (resolved) tokens[name as keyof typeof tokens] = resolved
      } else {
        tokens[name as keyof typeof tokens] = raw
      }
    }
  } finally {
    probe.remove()
  }
  return { theme, tokens }
}
