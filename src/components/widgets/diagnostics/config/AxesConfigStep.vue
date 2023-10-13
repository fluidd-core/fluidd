<template>
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
          {{ step }}
        </v-stepper-step>

        <v-divider
          v-if="index < steps.length - 1"
          :key="index"
        />
      </template>
    </v-stepper-header>

    <v-stepper-content
      v-for="(step, i) of steps"
      :key="`${i}-content`"
      class="pt-4"
      :step="i + 1"
    >
      <template v-if="currentStep === i + 1">
        <app-setting :title="$t('app.setting.label.enable')">
          <v-switch
            v-model="config.axes[i].enabled"
            hide-details
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.setting.label.show_legend')">
          <v-switch
            v-model="config.axes[i].showLegend"
            hide-details
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.setting.label.unit')">
          <v-text-field
            v-model="config.axes[i].unit"
            filled
            dense
            single-line
            hide-details="auto"
            :rules="[
              $rules.required
            ]"
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.setting.label.min')">
          <v-text-field
            v-model="config.axes[i].min"
            filled
            dense
            single-line
            hide-details="auto"
            :hint="$t('app.setting.label.optional')"
            :rules="[
              $rules.numberValid
            ]"
            :suffix="config.axes[i].unit"
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.setting.label.max')">
          <v-text-field
            v-model="config.axes[i].max"
            filled
            dense
            single-line
            hide-details="auto"
            :hint="$t('app.setting.label.optional')"
            :rules="[
              $rules.numberValid
            ]"
            :suffix="config.axes[i].unit"
          />
        </app-setting>
      </template>
    </v-stepper-content>
  </v-stepper>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import type { DiagnosticsCardConfig } from '@/store/diagnostics/types'

@Component({})
export default class AxesConfigStep extends Vue {
  @Prop({ type: Object, required: true })
  readonly config!: DiagnosticsCardConfig

  currentStep = 1
  steps = [this.$t('app.setting.label.left_y'), this.$t('app.setting.label.right_y')]
}
</script>

<style lang="scss" scoped>
.v-stepper {
  background: transparent;
}
</style>
