<template>
  <v-dialog
    :value="value"
    :max-width="800"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-card-title class="card-heading py-2">
        <span class="focus--text">{{ (config.id !== '') ? $t('app.general.title.edit_card') : $t('app.general.title.add_card') }}</span>
      </v-card-title>

      <v-divider />

      <v-stepper
        v-model="currentStep"
        non-linear
        flat
      >
        <v-stepper-header>
          <template v-for="(step, index) of steps">
            <v-stepper-step
              :key="`step-${index}`"
              :step="index + 1"
              editable
            >
              {{ step.name }}
            </v-stepper-step>

            <v-divider
              v-if="index < steps.length - 1"
              :key="index"
            />
          </template>
        </v-stepper-header>

        <v-stepper-items>
          <v-stepper-content
            v-for="(step, index) of steps"
            :key="`${index}-content`"
            class="pa-0"
            :step="index + 1"
          >
            <component
              :is="step.component"
              v-if="currentStep === index + 1"
              :config="config"
            />
          </v-stepper-content>
        </v-stepper-items>
      </v-stepper>

      <v-divider />

      <v-card-actions class="pt-4">
        <app-btn
          v-if="config.id !== ''"
          color="error"
          text
          @click="handleDelete"
        >
          {{ $t('app.general.btn.remove') }}
        </app-btn>
        <v-spacer />
        <app-btn
          color="warning"
          text
          @click="$emit('input', false)"
        >
          {{ $t('app.general.btn.cancel') }}
        </app-btn>
        <app-btn
          color="primary"
          @click="handleSave"
        >
          {{ (config.id !== '') ? $t('app.general.btn.save') : $t('app.general.btn.add') }}
        </app-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { DiagnosticsCardConfig } from '@/store/diagnostics/types'
import CardConfigStep from './config/CardConfigStep.vue'
import AxesConfigStep from './config/AxesConfigStep.vue'
import MetricsConfigStep from './config/MetricsConfigStep.vue'

@Component({})
export default class DiagnosticsCardConfigDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  public value!: boolean

  @Prop({ type: Object, required: true })
  public config!: DiagnosticsCardConfig

  currentStep = 1
  steps = [
    { name: this.$t('app.setting.label.card'), component: CardConfigStep },
    { name: this.$t('app.setting.label.axes'), component: AxesConfigStep },
    { name: this.$t('app.setting.label.metrics'), component: MetricsConfigStep }
  ]

  handleSave () {
    this.$emit('save', this.config)
    this.$emit('input', false)
  }

  handleDelete () {
    this.$emit('delete', this.config.id)
    this.$emit('input', false)
  }
}
</script>

<style lang="scss" scoped>
.v-stepper {
  background: transparent;
}
</style>
