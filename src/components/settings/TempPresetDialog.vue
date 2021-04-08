<template>
  <v-dialog
    :value="value"
    :max-width="500"
    persistent
  >
    <v-form
      ref="form"
      @submit.prevent="handleSave(preset)"
      v-model="valid"
    >
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ (preset.id != -1) ? $t('app.general.label.edit_preset') : $t('app.general.label.add_preset') }}</span>
        </v-card-title>

        <app-setting :title="$t('app.setting.label.thermal_preset_name')">
          <v-text-field
            v-model="preset.name"
            :rules="[rules.required]"
            hide-details="auto"
            filled
            dense
          >
          </v-text-field>
        </app-setting>

        <v-divider></v-divider>

        <template
          v-for="(item, i) in heaters"
        >
          <app-setting :title="item.name" :key="i + 'heater'">
            <v-checkbox
              v-model="preset.values[item.name].active"
              hide-details
              class="ma-0"
            >
            </v-checkbox>

            <v-text-field
              v-model.number="preset.values[item.name].value"
              :rules="[rules.numRequired, rules.numMin]"
              hide-details="auto"
              type="number"
              suffix="°C"
              class="mb-2"
              outlined
              dense
            >
            </v-text-field>
          </app-setting>

          <v-divider :key="i + 'heaterd'"></v-divider>

        </template>

        <template
          v-for="(item, i) in fans"
        >
          <app-setting :title="item.name" :key="i + 'fan'">
            <v-checkbox
              v-model="preset.values[item.name].active"
              hide-details
              class="ma-0"
            >
            </v-checkbox>

            <v-text-field
              v-model.number="preset.values[item.name].value"
              :rules="[rules.numRequired, rules.numMin]"
              hide-details="auto"
              type="number"
              suffix="°C"
              class="mb-2"
              outlined
              dense
            >
            </v-text-field>
          </app-setting>

          <v-divider :key="i + 'fand'"></v-divider>
        </template>

        <v-card-actions>
          <v-spacer></v-spacer>
          <app-btn color="warning" text @click="$emit('input', false)" type="button">{{ $t('app.general.btn.cancel') }}</app-btn>
          <app-btn color="primary" type="submit">{{ (preset.id !== -1) ? $t('app.general.btn.save') : $t('app.general.btn.add') }}</app-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { TemperaturePreset } from '@/store/config/types'
import { Fan, Heater } from '@/store/printer/types'

@Component({})
export default class TemperaturePresetDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  value!: boolean

  @Prop({ type: Object, required: true })
  preset!: TemperaturePreset

  valid = false

  get heaters (): Heater[] {
    return this.$store.getters['printer/getHeaters']
  }

  get fans (): Fan[] {
    return this.$store.getters['printer/getOutputs'](['temperature_fan'])
  }

  rules = {
    required: (v: string) => !!v || this.$t('app.general.simple_form.error.required'),
    numRequired: (v: number | string) => v !== '' || this.$t('app.general.simple_form.error.required'),
    numMin: (v: number) => v >= 0 || this.$t('app.general.simple_form.error.min', { min: 1 })
  }

  handleSave () {
    if (this.valid) {
      this.$emit('save', this.preset)
      this.$emit('input', false)
    }
  }
}
</script>
