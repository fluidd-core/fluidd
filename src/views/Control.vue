<template>
  <div
    class="control-page"
    :class="{
      'control-page--pro': pro,
      'control-page--phone': isMobileViewport
    }"
    data-tid="control-page"
  >
    <template v-if="isMobileViewport">
      <control-heat phone />
      <control-move phone />
      <control-speed />
      <control-filament phone />
      <control-fans phone />
      <control-macros v-if="pro" />
    </template>

    <template v-else-if="!pro">
      <control-move class="area-move" />
      <div class="area-side">
        <control-heat />
        <control-filament />
      </div>
      <div class="area-row">
        <control-speed />
        <control-fans />
      </div>
    </template>

    <template v-else>
      <control-move class="area-move" />
      <control-heat class="area-heat" />
      <control-speed class="area-limits" />
      <control-fans class="area-fans" />
      <control-filament class="area-filament" />
      <control-macros class="area-macros" />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import { proMode } from '@/services/pro-mode'
import ControlMove from '@/components/control/ControlMove.vue'
import ControlHeat from '@/components/control/ControlHeat.vue'
import ControlFilament from '@/components/control/ControlFilament.vue'
import ControlSpeed from '@/components/control/ControlSpeed.vue'
import ControlFans from '@/components/control/ControlFans.vue'
import ControlMacros from '@/components/control/ControlMacros.vue'

/**
 * Control (`/boxwood-367a/control`): heat, move, filament, speed, fans and
 * lights, one page with a panel each. Simple names things (PLA, Normal,
 * Fan on); Pro shows the exact values in the same places and adds the
 * extruder, the motion limits and the macros.
 */
@Component({
  components: { ControlMove, ControlHeat, ControlFilament, ControlSpeed, ControlFans, ControlMacros }
})
export default class Control extends Mixins(BrowserMixin) {
  get pro (): boolean {
    return proMode.on
  }
}
</script>

<style lang="scss" scoped>
  .control-page {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    gap: 16px;
    align-items: start;
  }

  .area-side {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .area-row {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }

  .control-page--pro {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-areas:
      'move heat limits'
      'fans macros macros'
      'filament macros macros';
  }

  .control-page--pro .area-move { grid-area: move; }
  .control-page--pro .area-heat { grid-area: heat; }
  .control-page--pro .area-limits { grid-area: limits; }
  .control-page--pro .area-fans { grid-area: fans; }
  .control-page--pro .area-filament { grid-area: filament; }
  .control-page--pro .area-macros { grid-area: macros; }

  @media (max-width: 1263px) {
    .control-page {
      grid-template-columns: minmax(0, 1fr);
    }

    .control-page--pro {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-areas:
        'move move'
        'heat limits'
        'fans filament'
        'macros macros';
    }
  }

  @media (max-width: 899px) {
    .control-page--pro {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        'move'
        'heat'
        'limits'
        'fans'
        'filament'
        'macros';
    }
  }

  .control-page--phone {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
</style>
