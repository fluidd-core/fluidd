<template>
  <app-dialog
    v-model="open"
    :title="(config.id !== '') ? $t('app.general.title.edit_chart') : $t('app.general.title.add_chart')"
    :max-width="800"
  >
    <v-card-text>
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
    </v-card-text>

    <template #actions>
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
        @click="open = false"
      >
        {{ $t('app.general.btn.cancel') }}
      </app-btn>
      <app-btn
        color="primary"
        @click="handleSave"
      >
        {{ (config.id !== '') ? $t('app.general.btn.save') : $t('app.general.btn.add') }}
      </app-btn>
    </template>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'
import { DiagnosticsCardConfig } from '@/store/diagnostics/types'
import CardConfigStep from './config/CardConfigStep.vue'
import AxesConfigStep from './config/AxesConfigStep.vue'
import MetricsConfigStep from './config/MetricsConfigStep.vue'

@Component({})
export default class DiagnosticsCardConfigDialog extends Vue {
  @VModel({ type: Boolean, required: true })
    open!: boolean

  @Prop({ type: Object, required: true })
  readonly config!: DiagnosticsCardConfig

  currentStep = 1
  steps = [
    { name: this.$t('app.setting.label.card'), component: CardConfigStep },
    { name: this.$t('app.setting.label.axes'), component: AxesConfigStep },
    { name: this.$t('app.setting.label.metrics'), component: MetricsConfigStep }
  ]

  handleSave () {
    this.$emit('save', this.config)
    this.open = false
  }

  handleDelete () {
    this.$emit('delete', this.config.id)
    this.open = false
  }
}
</script>

<style lang="scss" scoped>
.v-stepper {
  background: transparent;
}
</style>
