<template>
  <div>
    <v-subheader id="presets">
      {{ $t('app.setting.title.thermal_presets') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting>
        <app-btn
          outlined
          small
          color="primary"
          @click="openAddDialog"
        >
          <v-icon
            small
            left
          >
            $plus
          </v-icon>
          {{ $t('app.setting.btn.add_thermal_preset') }}
        </app-btn>
      </app-setting>

      <v-divider v-if="presets.length > 0" />

      <template v-for="(preset, i) in presets">
        <app-setting
          :key="`preset${i}`"
          :title="preset.name"
          :r-cols="2"
        >
          <template #sub-title>
            <span
              v-for="(value, k) in preset.values"
              v-show="value.active"
              :key="k"
              class="mr-2"
            >
              {{ k }}: {{ value.value }}<small>°C</small>
            </span>
          </template>

          <app-btn
            icon
            @click.stop="openEditDialog(preset)"
          >
            <v-icon dense>
              $edit
            </v-icon>
          </app-btn>

          <app-btn
            icon
            @click.stop="handleRemovePreset(preset)"
          >
            <v-icon dense>
              $delete
            </v-icon>
          </app-btn>
        </app-setting>

        <v-divider
          v-if="i < presets.length - 1 && presets.length > 0"
          :key="preset.id"
        />
      </template>

      <preset-dialog
        v-if="dialogState.active"
        v-model="dialogState.active"
        :preset="dialogState.preset"
        @save="handleSavePreset"
      />
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PresetDialog from './PresetDialog.vue'
import type { TemperaturePreset } from '@/store/config/types'
import type { Fan, Heater } from '@/store/printer/types'
import StateMixin from '@/mixins/state'

@Component({
  components: {
    PresetDialog
  }
})
export default class TemperaturePresetSettings extends Mixins(StateMixin) {
  get heaters (): Heater[] {
    return this.$store.getters['printer/getHeaters']
  }

  get fans (): Fan[] {
    return this.$store.getters['printer/getOutputs'](['temperature_fan'])
  }

  get presets (): TemperaturePreset[] {
    return this.$store.getters['config/getTempPresets']
  }

  dialogState: any = {
    active: false,
    preset: null
  }

  openEditDialog (preset: TemperaturePreset) {
    this.dialogState = {
      active: true,
      preset
    }
  }

  openAddDialog () {
    const preset: any = {
      id: -1,
      name: '',
      values: {}
    }
    for (const item of this.heaters) {
      preset.values[item.name] = { value: 0, type: 'heater', active: true }
    }
    for (const item of this.fans) {
      preset.values[item.name] = { value: 0, type: 'fan', active: true }
    }
    this.dialogState = {
      active: true,
      preset
    }
  }

  handleSavePreset (preset: TemperaturePreset) {
    this.$store.dispatch('config/updatePreset', preset)
  }

  async handleRemovePreset (preset: TemperaturePreset) {
    const result = await this.$confirm(
      this.$t('app.general.simple_form.msg.confirm_remove_thermal_preset', { name: preset.name }).toString(),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      this.$store.dispatch('config/removePreset', preset)
    }
  }
}
</script>

<style lang="scss" scoped>
  .presets-table table > tbody > tr > td {
    padding-top: 8px;
    padding-bottom: 8px;
    vertical-align: top;
  }
</style>
