<template>
  <section
    class="ov-card ov-tune"
    data-tid="overview-live-tune"
  >
    <div class="ov-card__head">
      <h2 class="ov-card__title">
        Live tune
      </h2>
      <span class="ov-card__aside">applies now, not saved</span>
    </div>
    <div class="ov-tune__rows">
      <div class="crow">
        <span class="crow__name">Speed</span>
        <span class="ov-tune__stepper">
          <button
            type="button"
            aria-label="Slower"
            :disabled="!klippyReady"
            @click="setSpeed(Math.max(1, speedFactor - 5))"
          >
            <frame-icon
              name="minus"
              small
            />
          </button>
          <number-field
            :value="speedFactor"
            unit="%"
            :min="1"
            :max="500"
            label="Speed"
            :disabled="!klippyReady"
            @change="setSpeed"
          />
          <button
            type="button"
            aria-label="Faster"
            :disabled="!klippyReady"
            @click="setSpeed(speedFactor + 5)"
          >
            <frame-icon
              name="plus"
              small
            />
          </button>
        </span>
      </div>
      <div class="crow">
        <span class="crow__name">Flow</span>
        <span class="ov-tune__stepper">
          <button
            type="button"
            aria-label="Less flow"
            :disabled="!klippyReady"
            @click="setFlow(Math.max(1, flowFactor - 1))"
          >
            <frame-icon
              name="minus"
              small
            />
          </button>
          <number-field
            :value="flowFactor"
            unit="%"
            :min="1"
            :max="300"
            label="Flow"
            :disabled="!klippyReady"
            @change="setFlow"
          />
          <button
            type="button"
            aria-label="More flow"
            :disabled="!klippyReady"
            @click="setFlow(flowFactor + 1)"
          >
            <frame-icon
              name="plus"
              small
            />
          </button>
        </span>
      </div>
      <div
        v-if="pressureAdvance !== null"
        class="crow"
      >
        <span class="crow__name">Pressure advance</span>
        <number-field
          :value="pressureAdvance"
          unit="s"
          :min="0"
          :max="2"
          :decimals="3"
          label="Pressure advance"
          :disabled="!klippyReady"
          @change="setPressureAdvance"
        />
      </div>
      <div class="crow">
        <span class="crow__name">Z offset <span class="crow__sub">(babystep)</span></span>
        <span class="ov-tune__stepper">
          <button
            type="button"
            class="ov-tune__nudge"
            aria-label="Nozzle closer"
            :disabled="!klippyReady"
            @click="nudgeZ(-0.01)"
          >
            −0.01
          </button>
          <b class="ov-tune__z">{{ zOffset.toFixed(3) }}</b>
          <button
            type="button"
            class="ov-tune__nudge"
            aria-label="Nozzle further"
            :disabled="!klippyReady"
            @click="nudgeZ(0.01)"
          >
            +0.01
          </button>
        </span>
      </div>
      <div
        v-if="partFan"
        class="crow"
      >
        <span class="crow__name">Part fan</span>
        <range-slider
          class="ov-tune__slider"
          :value="fanValue(partFan)"
          label="Part fan"
          :disabled="!klippyReady"
          @change="setFan(partFan, $event)"
        />
        <b class="crow__value">{{ fanValue(partFan) }}%</b>
      </div>
      <div class="crow">
        <span class="crow__name">Accel limit</span>
        <number-field
          :value="toolhead.max_accel || null"
          unit="mm/s²"
          :min="1"
          label="Acceleration limit"
          :disabled="!klippyReady"
          @change="setLimit('ACCEL', $event)"
        />
      </div>
    </div>
    <button
      v-if="canSaveZ"
      type="button"
      class="ov-tune__save"
      :disabled="!klippyReady || !zOffset"
      @click="saveZ"
    >
      Save Z offset for next time
    </button>
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import NumberField from '@/components/control/NumberField.vue'
import RangeSlider from '@/components/control/RangeSlider.vue'

/**
 * Pro, while it prints: speed and flow, pressure advance, the Z offset a
 * hundredth of a millimetre at a time, the part fan and the acceleration.
 * Each applies at once and lasts until the next restart; the Z offset can
 * be saved for next time.
 */
@Component({ components: { NumberField, RangeSlider } })
export default class OverviewLiveTune extends Mixins(OverviewMixin) {
  get zOffset (): number {
    const origin = this.gcodeMove.homing_origin as number[] | undefined
    return origin && origin.length >= 3 ? +origin[2] : 0
  }

  nudgeZ (by: number) {
    this.sendGcode(`SET_GCODE_OFFSET Z_ADJUST=${by} MOVE=${this.isHomed('Z') ? 1 : 0}`, this.$waits.onZAdjust)
  }

  get commands (): Record<string, unknown> {
    return (this.$store.state.printer.printer.gcode?.commands as Record<string, unknown> | undefined) ??
      (this.$store.getters['printer/getAvailableCommands'] as Record<string, unknown>) ?? {}
  }

  get canSaveZ (): boolean {
    return 'Z_OFFSET_APPLY_PROBE' in this.commands || 'Z_OFFSET_APPLY_ENDSTOP' in this.commands
  }

  saveZ () {
    this.sendGcode('Z_OFFSET_APPLY_PROBE' in this.commands ? 'Z_OFFSET_APPLY_PROBE' : 'Z_OFFSET_APPLY_ENDSTOP')
  }
}
</script>

<style lang="scss" scoped>
  .ov-tune__rows > .crow + .crow {
    border-top: 1px solid var(--m3d-border);
  }

  .ov-tune__stepper {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    > button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      padding: 0 8px;
      border-radius: 999px;
      background: var(--m3d-surface-2);
      color: var(--m3d-text);
      font-size: 13px;
      font-weight: 600;

      &:disabled {
        opacity: 0.45;
        cursor: default;
      }
    }
  }

  .ov-tune__z {
    min-width: 64px;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .ov-tune__slider {
    flex: 0 1 160px;
    margin-left: auto;
  }

  .ov-tune__save {
    align-self: flex-start;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 600;

    &:hover:not(:disabled) {
      color: var(--m3d-text);
    }

    &:disabled {
      opacity: 0.45;
      cursor: default;
    }
  }
</style>
