import resolveAliasLabel from '@/util/resolve-alias-label'

export interface ThermalTooltipContext {
  // Live alias map; read per-hover so in-place Vue.set/Vue.delete stay reflected.
  aliases: Record<string, string>
  prettyCase: (value: string) => string
  fontColor: string
  fontSize: number
}

/**
 * Build the ECharts tooltip HTML for the thermal chart.
 *
 * Extracted from ThermalChart so the alias-resolution + HTML-escape wiring
 * (AC1 tooltip + AC6 XSS) is unit-testable without mounting the component.
 * The series label is resolved via `resolveAliasLabel`, which applies the user
 * alias (keyed by the full `seriesName`) AND escapes it — escaping alone would
 * show the auto name; both steps are required.
 */
export const formatThermalTooltip = (params: unknown, ctx: ThermalTooltipContext): string => {
  if (!Array.isArray(params)) {
    return ''
  }

  const { aliases, prettyCase, fontColor, fontSize } = ctx

  let text = ''

  params.forEach((param: any) => {
    if (
      param.seriesName &&
      !param.seriesName.endsWith('#target') &&
      !param.seriesName.endsWith('#power') &&
      !param.seriesName.endsWith('#speed') &&
      param.value[param.seriesName] != null
    ) {
      const name = param.seriesName.trim().split(/\s+/).pop() || ''
      const label = resolveAliasLabel(param.seriesName, aliases, prettyCase(name))

      text += `
        <div>
          ${param.marker}
          <span style="font-size:${fontSize}px;color:${fontColor};font-weight:400;margin-left:2px">
            ${label}:
          </span>
          <span style="float:right;margin-left:20px;font-size:${fontSize}px;color:${fontColor};font-weight:900">
            ${param.value[param.seriesName].toFixed(2)}<small>°C</small>`

      if (param.value[`${param.seriesName}#target`] != null) {
        text += ` / ${param.value[`${param.seriesName}#target`].toFixed()}<small>°C</small>`
      }
      if (param.value[`${param.seriesName}#power`] != null) {
        text += ` / ${(param.value[`${param.seriesName}#power`] * 100).toFixed()}<small>%</small>`
      }
      if (param.value[`${param.seriesName}#speed`] != null) {
        text += ` / ${(param.value[`${param.seriesName}#speed`] * 100).toFixed()}<small>%</small>`
      }
      text += `</span>
        <div style="clear: both"></div>
      </div>
      <div style="clear: both"></div>`
    }
  })

  return text
}
