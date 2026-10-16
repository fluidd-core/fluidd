<template>
  <dl class="maintenance-result">
    <div
      v-for="row in rows"
      :key="row.label"
      class="crow"
    >
      <dt class="crow__name">
        {{ row.label }} <span class="crow__sub">· {{ row.source }}</span>
      </dt>
      <dd class="crow__value">
        {{ row.value }}
      </dd>
    </div>
    <p v-if="!rows.length">
      No reported values available.
    </p>
  </dl>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class MaintenanceResult extends Vue {
  @Prop({ type: String, required: true }) readonly check!: 'firstLayer' | 'pid'

  get rows (): Array<{ label: string, source: string, value: string }> {
    const settings = this.$store.state.printer.printer.configfile?.settings ?? {}
    const pending = this.$store.getters['printer/getSaveConfigPendingItems'] ?? {}
    if (this.check === 'firstLayer') {
      const probe = this.$store.getters['printer/getProbe']
      const name = probe?.name ?? 'stepper_z'
      const key = probe ? 'z_offset' : 'position_endstop'
      const raw = pending[name]?.[key] ?? settings[name]?.[key]
      return raw !== undefined && Number.isFinite(Number(raw))
        ? [{ label: probe ? 'Probe Z offset' : 'Z endstop', source: pending[name]?.[key] !== undefined ? 'awaiting save' : 'printer.cfg', value: `${Number(raw).toFixed(3)} mm` }]
        : []
    }
    return Object.keys({ ...settings, ...pending })
      .filter(name => /^(extruder\d*|heater_bed|heater_generic .+)$/.test(name))
      .flatMap(name => {
        const values = { ...settings[name], ...pending[name] }
        const keys = ['pid_kp', 'pid_ki', 'pid_kd', 'heater_power', 'block_heat_capacity']
        const result = keys.filter(k => values[k] !== undefined && Number.isFinite(Number(values[k])))
          .map(k => `${({ pid_kp: 'Kp', pid_ki: 'Ki', pid_kd: 'Kd', heater_power: 'Power W', block_heat_capacity: 'Heat capacity J/K' } as Record<string, string>)[k]} ${Number(values[k])}`)
        return result.length ? [{ label: name === 'extruder' ? 'Nozzle' : name === 'heater_bed' ? 'Bed' : name.replace('heater_generic ', ''), source: pending[name] ? 'awaiting save' : 'printer.cfg', value: result.join(' · ') }] : []
      })
  }
}
</script>

<style scoped>
.maintenance-result { margin: 8px 0; font-size: 13px; }
.maintenance-result .crow { flex-wrap: wrap; }
.maintenance-result dd { margin: 0; font-size: 13px; overflow-wrap: anywhere; }
</style>
