<template>
  <m3-dialog
    :value="open"
    eyebrow="First layer height"
    title="Bring the nozzle to the paper"
    max-width="480"
    persistent
    close-label="Stop without saving"
    data-tid="manual-probe"
    @close="sendAbort"
  >
    <p class="m3-dlg__text">
      Slide a sheet of paper between the nozzle and the plate. Move the nozzle closer in small steps until the paper
      just drags when you push it, then save the height.
    </p>

    <div class="mp__readout">
      <span class="mp__z">{{ zPosition }}</span>
      <span class="mp__unit">mm</span>
      <span
        v-if="pro && (manualProbe.z_position_lower != null || manualProbe.z_position_upper != null)"
        class="mp__range"
      >
        tried {{ zPositionLower }} to {{ zPositionUpper }}
      </span>
    </div>

    <div class="mp__steps">
      <template v-for="offset in offsets">
        <button
          :key="`down-${offset}`"
          type="button"
          class="cbtn"
          :disabled="!canMove"
          :aria-label="`${offset} mm closer to the plate`"
          @click="sendTestZ(`-${offset}`)"
        >
          <frame-icon
            name="minus"
            small
          />
          Closer
        </button>
        <span
          :key="`size-${offset}`"
          class="mp__size"
        >{{ offset }} mm</span>
        <button
          :key="`up-${offset}`"
          type="button"
          class="cbtn"
          :disabled="!canMove"
          :aria-label="`${offset} mm away from the plate`"
          @click="sendTestZ(`+${offset}`)"
        >
          <frame-icon
            name="plus"
            small
          />
          Away
        </button>
      </template>
    </div>

    <div
      v-if="pro"
      class="mp__bisect"
    >
      <span class="m3-dlg__note">Halfway to the last height tried (TESTZ)</span>
      <div class="mp__bisect-buttons">
        <button
          v-for="step in ['--', '-', '+', '++']"
          :key="step"
          type="button"
          class="cbtn"
          :disabled="!canMove"
          @click="sendTestZ(step)"
        >
          {{ step }}
        </button>
      </div>
    </div>

    <template #actions>
      <button
        type="button"
        class="cbtn cbtn--ghost"
        data-tid="manual-probe-abort"
        @click="sendAbort"
      >
        Stop without saving
      </button>
      <button
        type="button"
        class="cbtn cbtn--primary"
        :disabled="hasWait($waits.onManualProbe)"
        data-tid="manual-probe-accept"
        @click="sendAccept"
      >
        <v-progress-circular
          v-if="hasWait($waits.onManualProbe)"
          indeterminate
          size="16"
          width="2"
        />
        Save this height
      </button>
    </template>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Mixins, VModel, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import { proMode } from '@/services/pro-mode'
import M3Dialog from '@/components/ui/M3Dialog.vue'

/**
 * Klipper's manual probe (PROBE_CALIBRATE, Z_ENDSTOP_CALIBRATE): the paper
 * test, as Maintenance's First layer height runs it. Closer and Away move
 * the nozzle (TESTZ), by 1 mm down to the smallest step; Save this height
 * accepts it (ACCEPT), Stop without saving aborts (ABORT), as ✕ does: a
 * closed dialog with the probe still waiting left Klipper stuck in it. A
 * click outside does nothing, so a long test isn't lost to a stray tap. Pro
 * adds the heights tried and Klipper's halfway steps.
 */
@Component({ components: { M3Dialog } })
export default class ManualProbeDialog extends Mixins(StateMixin, ToolheadMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  get pro (): boolean {
    return proMode.on
  }

  get canMove (): boolean {
    return this.klippyReady && !this.printerPrinting
  }

  get offsets () {
    return [...new Set([
      1,
      0.1,
      ...this.$store.state.config.uiSettings.general.zAdjustDistances
    ])].sort((a, b) => b - a)
  }

  get manualProbe () {
    return this.$store.state.printer.printer.manual_probe
  }

  get zPositionLower () {
    return this.manualProbe.z_position_lower?.toFixed(3) || '–'
  }

  get zPosition () {
    return this.manualProbe.z_position?.toFixed(3) || '–'
  }

  get zPositionUpper () {
    return this.manualProbe.z_position_upper?.toFixed(3) || '–'
  }

  @Watch('isManualProbeActive')
  onIsManualProbeActive (value: boolean) {
    if (!value) {
      this.open = false
    }
  }

  sendTestZ (zValue: string) {
    this.sendGcode(`TESTZ Z=${zValue}`)
  }

  sendAbort () {
    this.sendGcode('ABORT', this.$waits.onManualProbe)
    this.open = false
  }

  sendAccept () {
    this.sendGcode('ACCEPT', this.$waits.onManualProbe)
  }
}
</script>

<style lang="scss" scoped>
  .mp__readout {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 4px 2px;
  }

  .mp__z {
    font-size: 40px;
    font-weight: 600;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .mp__unit {
    color: var(--m3d-text-muted);
    font-size: 15px;
  }

  .mp__range {
    margin-left: auto;
    color: var(--m3d-text-subtle);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .mp__steps {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 8px 12px;

    .cbtn {
      width: 100%;
    }
  }

  .mp__size {
    min-width: 64px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .mp__bisect {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mp__bisect-buttons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;

    .cbtn {
      width: 100%;
      font-family: var(--m3d-font-mono);
    }
  }
</style>
