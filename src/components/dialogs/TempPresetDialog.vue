<template>
  <v-dialog
    :value="value"
    :max-width="320"
    persistent
  >
    <v-form
      ref="form"
      @submit.prevent="handleSave(preset)"
      v-model="valid"
    >
      <v-card>
        <v-card-title>
          <span class="headline">{{ (preset.id != -1) ? $t('Edit preset') : $t('Add preset') }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-text-field
                :label="$t('Preset Name')"
                v-model="preset.name"
                :rules="[rules.required]"
                hide-details
                class="mb-2"
                outlined
                dense
              >
              </v-text-field>
            </v-row>

            <template
              v-for="item in heaters"
            >
              <v-row align="start" :key="item.name">
                <v-checkbox
                  v-model="preset.values[item.name].active"
                  hide-details
                  class="ma-0"
                >
                </v-checkbox>

                <v-text-field
                  v-model.number="preset.values[item.name].value"
                  :label="item.name"
                  :rules="[rules.numRequired, rules.numMin]"
                  hide-details="auto"
                  type="number"
                  suffix="°C"
                  class="mb-2"
                  outlined
                  dense
                >
                </v-text-field>
              </v-row>
            </template>

            <template
              v-for="item in fans"
            >
              <v-row align="start" :key="item.name">
                <v-checkbox
                  v-model="preset.values[item.name].active"
                  hide-details
                  class="ma-0"
                >
                </v-checkbox>

                <v-text-field
                  v-model.number="preset.values[item.name].value"
                  :label="item.name"
                  :rules="[rules.numRequired, rules.numMin]"
                  hide-details="auto"
                  type="number"
                  suffix="°C"
                  class="mb-2"
                  outlined
                  dense
                >
                </v-text-field>
              </v-row>
            </template>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <btn color="warning" text @click="$emit('input', false)" type="button">{{ $t('Cancel') }}</btn>
          <btn color="primary" type="submit">{{ (preset.id !== -1) ? $t('Save') : $t('Add') }}</btn>
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
export default class FileNameDialog extends Vue {
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
    required: (v: string) => !!v || this.$t('Required'),
    numRequired: (v: number | string) => v !== '' || this.$t('Required'),
    numMin: (v: number) => v >= 0 || this.$t('Min 0')
  }

  handleSave () {
    if (this.valid) {
      this.$emit('save', this.preset)
      this.$emit('input', false)
    }
  }
}
</script>
