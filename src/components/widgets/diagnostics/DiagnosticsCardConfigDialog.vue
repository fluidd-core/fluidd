<template>
  <app-dialog
    v-model="open"
    :title="dialogTitle"
    max-width="800"
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
      <v-spacer v-if="isMobileViewport" />

      <app-btn
        v-if="config.id !== ''"
        color="error"
        text
        @click="handleDelete"
      >
        {{ $t('app.general.btn.remove') }}
      </app-btn>

      <v-spacer v-if="!isMobileViewport" />

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
import { Component, Prop, VModel, Mixins } from 'vue-property-decorator'
import type { DiagnosticsCardConfig } from '@/store/diagnostics/types'
import CardConfigStep from './config/CardConfigStep.vue'
import ChartAxisConfigStep from './config/ChartAxisConfigStep.vue'
import ChartMetricsConfigStep from './config/ChartMetricsConfigStep.vue'
import WatchMetricsConfigStep from './config/WatchMetricsConfigStep.vue'
import BrowserMixin from '@/mixins/browser'

@Component({})
export default class DiagnosticsCardConfigDialog extends Mixins(BrowserMixin) {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Object, required: true })
  readonly config!: DiagnosticsCardConfig

  currentStep = 1

  get dialogTitle (): string {
    const isNew = this.config.id === ''

    switch (this.config.type) {
      case 'chart':
        return isNew
          ? this.$t('app.general.title.add_chart').toString()
          : this.$t('app.general.title.edit_chart').toString()

      case 'watches':
        return isNew
          ? this.$t('app.general.title.add_watch_panel').toString()
          : this.$t('app.general.title.edit_watch_panel').toString()

      default:
        return ''
    }
  }

  get steps () {
    const cardStep = {
      name: this.$t('app.setting.label.card').toString(),
      component: CardConfigStep
    }

    switch (this.config.type) {
      case 'chart':
        return [
          cardStep,
          {
            name: this.$t('app.setting.label.axes').toString(),
            component: ChartAxisConfigStep
          },
          {
            name: this.$t('app.setting.label.metrics').toString(),
            component: ChartMetricsConfigStep
          }
        ]

      case 'watches':
        return [
          cardStep,
          {
            name: this.$t('app.setting.label.watch_metrics').toString(),
            component: WatchMetricsConfigStep
          }
        ]

      default:
        return []
    }
  }

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
