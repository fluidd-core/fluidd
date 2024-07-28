<template>
  <app-dialog
    v-model="open"
    :title="(preset.id != -1) ? $t('app.general.label.edit_preset') : $t('app.general.label.add_preset')"
    max-width="500"
    :save-button-text="(preset.id !== -1) ? $t('app.general.btn.save') : $t('app.general.btn.add')"
    @save="handleSave"
  >
    <v-card-text class="pa-0">
      <app-setting :title="$t('app.setting.label.thermal_preset_name')">
        <v-text-field
          v-model="preset.name"
          :rules="[
            $rules.required
          ]"
          hide-details="auto"
          filled
          dense
        />
      </app-setting>

      <v-divider />

      <template v-for="(item, i) in heaters">
        <app-setting
          :key="`${i}heater`"
          :title="$filters.prettyCase(item.name)"
        >
          <v-checkbox
            v-model="preset.values[item.name].active"
            hide-details
          />

          <v-text-field
            v-model.number="preset.values[item.name].value"
            :disabled="!preset.values[item.name].active"
            :rules="preset.values[item.name].active ? [
              $rules.required,
              $rules.numberValid,
              $rules.numberGreaterThan(0)
            ] : undefined"
            hide-details="auto"
            type="number"
            suffix="°C"
            filled
            dense
          />
        </app-setting>

        <v-divider :key="i + 'heaterd'" />
      </template>

      <template v-for="(item, i) in fans">
        <app-setting
          :key="`${i}fan`"
          :title="$filters.prettyCase(item.name)"
        >
          <v-checkbox
            v-model="preset.values[item.name].active"
            hide-details
          />

          <v-text-field
            v-model.number="preset.values[item.name].value"
            :disabled="!preset.values[item.name].active"
            :rules="preset.values[item.name].active ? [
              $rules.required,
              $rules.numberValid,
              $rules.numberGreaterThan(0)
            ] : undefined"
            hide-details="auto"
            type="number"
            suffix="°C"
            filled
            dense
          />
        </app-setting>

        <v-divider :key="i + 'fand'" />
      </template>

      <app-setting :title="$t('app.setting.label.thermal_preset_gcode')">
        <v-textarea
          v-model="preset.gcode"
          rows="2"
          hide-details="auto"
          filled
          spellcheck="false"
          class="console-command"
        />
      </app-setting>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'
import type { TemperaturePreset } from '@/store/config/types'
import type { Fan, Heater } from '@/store/printer/types'

@Component({})
export default class TemperaturePresetDialog extends Vue {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: Object, required: true })
  readonly preset!: TemperaturePreset

  get heaters (): Heater[] {
    return this.$store.getters['printer/getHeaters']
  }

  get fans (): Fan[] {
    return this.$store.getters['printer/getOutputs'](['temperature_fan'])
  }

  handleSave () {
    this.$emit('save', this.preset)
    this.open = false
  }
}
</script>

<style lang="scss" scoped>
  .console-command {
    font-family: monospace;
  }
</style>
