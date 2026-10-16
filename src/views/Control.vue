<template>
  <div
    :key="contextKey"
    class="control-page"
    :class="{ 'control-page--phone': isMobileViewport }"
    data-tid="control-page"
  >
    <control-actions
      v-if="isMobileViewport"
      class="area-actions"
    />
    <control-heat
      class="area-heat"
      :phone="isMobileViewport"
    />
    <control-move
      class="area-move"
      :phone="isMobileViewport"
    />
    <control-speed class="area-speed" />
    <control-filament
      class="area-filament"
      :phone="isMobileViewport"
    />
    <control-fans
      class="area-fans"
      :phone="isMobileViewport"
    />
    <control-macros class="area-macros" />
    <control-task-fold
      class="area-diagnosis"
      fold-key="control.diagnosis"
      title="Shaper and switches"
      summary="Input shaper, filament sensors and endstops"
    >
      <control-tuning shaper-only />
      <control-outputs diagnostics-only />
    </control-task-fold>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import { cloudState } from '@/services/muon-cloud/state'
import ControlMove from '@/components/control/ControlMove.vue'
import ControlHeat from '@/components/control/ControlHeat.vue'
import ControlFilament from '@/components/control/ControlFilament.vue'
import ControlSpeed from '@/components/control/ControlSpeed.vue'
import ControlFans from '@/components/control/ControlFans.vue'
import ControlMacros from '@/components/control/ControlMacros.vue'
import ControlTuning from '@/components/control/ControlTuning.vue'
import ControlOutputs from '@/components/control/ControlOutputs.vue'
import ControlTaskFold from '@/components/control/ControlTaskFold.vue'
import ControlActions from '@/components/control/ControlActions.vue'

/** One set of task panels. Diagnosis remains here until Maintenance has its new home. */
@Component({
  components: { ControlMove, ControlHeat, ControlFilament, ControlSpeed, ControlFans, ControlMacros, ControlTuning, ControlOutputs, ControlTaskFold, ControlActions }
})
export default class Control extends Mixins(BrowserMixin) {
  get contextKey (): string {
    return `${this.$store.state.config.apiUrl}|${cloudState.activePrinterId ?? ''}|${cloudState.account?.id ?? ''}|${this.$route?.params?.printer ?? ''}`
  }
}
</script>

<style lang="scss" scoped>
  .control-page {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    grid-template-areas:
      'move move move heat heat heat'
      'filament filament speed speed fans fans'
      'macros macros macros macros macros macros'
      'diagnosis diagnosis diagnosis diagnosis diagnosis diagnosis';
    gap: 16px;
    align-items: start;
  }
  .control-page > * { min-width: 0; }
  .area-heat { grid-area: heat; }
  .area-move { grid-area: move; }
  .area-speed { grid-area: speed; }
  .area-filament { grid-area: filament; }
  .area-fans { grid-area: fans; }
  .area-macros { grid-area: macros; }
  .area-diagnosis { grid-area: diagnosis; }
  .area-actions { grid-area: actions; }
  @media (max-width: 1263px) {
    .control-page {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-areas: 'move heat' 'filament speed' 'fans fans' 'macros macros' 'diagnosis diagnosis';
    }
  }
  @media (max-width: 899px) {
    .control-page {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: 'actions' 'heat' 'move' 'speed' 'filament' 'fans' 'macros' 'diagnosis';
      gap: 12px;
    }
  }
</style>
