<template>
  <collapsable-card
    :title="$t('printer.temperature.preset.title')"
    cardKey="TemperaturePresetSettings"
    icon="$fire"
    :subTitle="$t('printer.temperature.preset.subTitle')"
  >
    <v-card-text>

      <div v-for="(preset) in presets" :key="preset.index">
        <v-layout align-center >
          <div class="grey--text focus--text mr-4">{{ preset.name }}</div>
          <v-chip
            label
            class="mx-1 my-2"
            v-for="(value, k) in preset.values"
            :key="k"
            :disabled="!value.active">
            {{ k }}: {{ value.value }}<small>°C</small>
          </v-chip>
          <div class="ml-auto">
            <btn
              @click="openEditDialog(preset)"
              icon
              color="primary">
              <v-icon small>$pencil</v-icon>
            </btn>
            <btn
              @click="remove(preset.index)"
              icon
              color="error">
              <v-icon small>$delete</v-icon>
            </btn>
          </div>
        </v-layout>
        <v-divider></v-divider>
      </div>
      <btn
        @click="openAddDialog"
        class="mt-2"
        color="secondary">
        <v-icon small left>$plus</v-icon>
        {{$t('printer.temperature.preset.add')}}
      </btn>

      <v-dialog
        v-model="dialog.active"
        max-width="250px"
      >
        <v-form
          ref="tempPresetsform"
          @submit.prevent="save(preset)"
          v-model="dialog.valid"
        >
          <v-card color="secondary darken-1">
            <v-card-title>
              <span class="headline">{{ (preset.index >= 0) ? $t('printer.temperature.preset.edit') : $t('printer.temperature.preset.add') }}</span>
            </v-card-title>
            <v-card-text>
              <v-text-field
                :label="$t('printer.temperature.preset.name')"
                v-model="preset.name"
                :rules="[rules.required]"
                hide-details="auto"
                class="mb-2"
                filled dense>
              </v-text-field>
              <template v-if="dialog.active">
                <v-text-field
                  v-for="item in heaters" :key="item.name"
                  v-model.number="preset.values[item.name].value"
                  :label="$t('printer.temperature.heaters.'+item.name.toLowerCase())"
                  :rules="[rules.numRequired, rules.numMin]"
                  :append-outer-icon="preset.values[item.name].active ? '$checkboxMarked' : '$checkboxBlank'"
                  @click:append-outer="preset.values[item.name].active = !preset.values[item.name].active"
                  hide-details="auto"
                  type="number"
                  :suffix="$t('app.degree.celsius')"
                  class="mb-2"
                  filled dense>
                </v-text-field>
                <v-text-field
                  v-for="item in fans" :key="item.name"
                  v-model.number="preset.values[item.name].value"
                  :label="$t('printer.outputs.fans.'+item.name.toLowerCase())"
                  :rules="[rules.numRequired, rules.numMin]"
                  :append-outer-icon="preset.values[item.name].active ? '$checkboxMarked' : '$checkboxBlank'"
                  @click:append-outer="preset.values[item.name].active = !preset.values[item.name].active"
                  hide-details="auto"
                  type="number"
                  :suffix="$t('app.degree.celsius')"
                  class="mb-2"
                  filled dense>
                </v-text-field>
              </template>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <btn color="warning" text @click.prevent="dialog.active = false" type="button">{{$t('app.btn.cancel')}}</btn>
              <btn color="primary" type="submit">{{ (preset.index >= 0) ? $t('app.btn.save') : $t('app.btn.add') }}</btn>
            </v-card-actions>
          </v-card>
        </v-form>
      </v-dialog>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { cloneDeep } from 'lodash-es'
import StateMixin from '@/mixins/state'
import { TemperaturePreset } from '@/store/config/types'
import { Fan, Heater } from '@/store/printer/types'
import { VForm } from '@/types/vuetify'

@Component({})
export default class TemperaturePresetSettingsCard extends Mixins(StateMixin) {
  get heaters (): Heater[] {
    return this.$store.getters['printer/getHeaters']
  }

  get fans (): Fan[] {
    return this.$store.getters['printer/getOutputs'](['temperature_fan'])
  }

  get presets () {
    return this.$store.getters['config/getTempPresets']
  }

  get form (): VForm {
    return this.$refs.tempPresetsform as VForm
  }

  dialog = {
    active: false,
    valid: false
  }

  preset: TemperaturePreset = {
    index: -1,
    name: '',
    values: {}
  }

  rules = {
    required: (v: string) => !!v || this.$t('app.form.required'),
    numRequired: (v: number | string) => v !== '' || this.$t('app.form.required'),
    numMin: (v: number) => v >= 0 || this.$t('app.form.min', { min: 0 })
  }

  openEditDialog (preset: TemperaturePreset) {
    this.dialog = {
      active: true,
      valid: false
    }
    this.preset = cloneDeep(preset)
  }

  openAddDialog () {
    this.preset = {
      index: -1,
      name: '',
      values: {}
    }
    for (const item of this.heaters) {
      this.preset.values[item.name] = { value: 0, type: 'heater', active: true }
    }
    for (const item of this.fans) {
      this.preset.values[item.name] = { value: 0, type: 'fan', active: true }
    }
    this.dialog = {
      active: true,
      valid: false
    }
  }

  save (preset: TemperaturePreset) {
    const valid = this.form.validate()
    if (valid) {
      this.$store.dispatch('config/updatePreset', { preset, index: this.preset.index })
      this.dialog.active = false
    }
  }

  remove (index: number) {
    this.$store.dispatch('config/removePreset', index)
    this.dialog.active = false
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
