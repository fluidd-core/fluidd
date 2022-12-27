<template>
  <v-dialog
    v-model="open"
    :max-width="500"
  >
    <v-form
      ref="form"
      @submit.prevent="handleSave"
    >
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ (preset.id != -1) ? $t('app.general.label.edit_preset') : $t('app.general.label.add_preset') }}</span>
        </v-card-title>

        <v-divider />

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

        <template
          v-for="(item, i) in heaters"
        >
          <app-setting
            :key="`${i}heater`"
            :title="item.name"
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

        <template
          v-for="(item, i) in fans"
        >
          <app-setting
            :key="`${i}fan`"
            :title="item.name"
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
          />
        </app-setting>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <app-btn
            color="warning"
            text
            type="button"
            @click="open = false"
          >
            {{ $t('app.general.btn.cancel') }}
          </app-btn>
          <app-btn
            color="primary"
            type="submit"
          >
            {{ (preset.id !== -1) ? $t('app.general.btn.save') : $t('app.general.btn.add') }}
          </app-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, VModel, Ref } from 'vue-property-decorator'
import { TemperaturePreset } from '@/store/config/types'
import { Fan, Heater } from '@/store/printer/types'
import { VForm } from '@/types'

@Component({})
export default class TemperaturePresetDialog extends Vue {
  @VModel({ type: Boolean, required: true })
    open!: boolean

  @Prop({ type: Object, required: true })
  readonly preset!: TemperaturePreset

  @Ref('form')
  readonly form!: VForm

  get heaters (): Heater[] {
    return this.$store.getters['printer/getHeaters']
  }

  get fans (): Fan[] {
    return this.$store.getters['printer/getOutputs'](['temperature_fan'])
  }

  handleSave () {
    if (this.form.validate()) {
      this.$emit('save', this.preset)
      this.open = false
    }
  }
}
</script>
