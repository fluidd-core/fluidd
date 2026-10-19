<template>
  <m3-dialog
    :value="open"
    eyebrow="First layer height"
    title="Bring the nozzle to the paper"
    max-width="480"
    persistent
    :close-label="canStop ? 'Stop without saving' : 'Close'"
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
        v-if="manualProbe.z_position_lower != null || manualProbe.z_position_upper != null"
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

    <div class="mp__bisect">
      <button
        type="button"
        class="cbtn"
        data-tid="manual-probe-finer"
        :aria-expanded="finer ? 'true' : 'false'"
        aria-controls="manual-probe-finer-steps"
        @click="finer = !finer"
      >
        Finer steps
      </button>
      <div
        v-show="finer"
        id="manual-probe-finer-steps"
        class="mp__bisect-buttons"
      >
        <button
          v-for="step in ['--', '-', '+', '++']"
          :key="step"
          type="button"
          class="cbtn"
          :disabled="!canMove"
          :data-step="step"
          :aria-label="stepLabel(step)"
          @click="sendTestZ(step)"
        >
          {{ stepLabel(step) }}
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
        {{ canStop ? 'Stop without saving' : 'Close' }}
      </button>
      <button
        type="button"
        class="cbtn cbtn--primary"
        :disabled="!canMove"
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
import TypedCommandsMixin from '@/mixins/typed-commands'
import ToolheadMixin from '@/mixins/toolhead'
import { cloudState } from '@/services/muon-cloud/state'
import M3Dialog from '@/components/ui/M3Dialog.vue'

/**
 * Klipper's manual probe (PROBE_CALIBRATE, Z_ENDSTOP_CALIBRATE): the paper
 * test, as Maintenance's First layer height runs it. Closer and Away move
 * the nozzle (TESTZ), by 1 mm down to the smallest step; Save this height
 * accepts it (ACCEPT), Stop without saving aborts (ABORT), as ✕ does: a
 * closed dialog with the probe still waiting left Klipper stuck in it. A
 * click outside does nothing. Finer steps exposes Klipper's bracket steps.
 */
@Component({ components: { M3Dialog } })
export default class ManualProbeDialog extends Mixins(TypedCommandsMixin, ToolheadMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  finer = false
  probeTarget: string | null = null

  get probeContext (): string { return `${this.commandTarget}|${cloudState.account?.id ?? ''}` }

  created () { this.probeTarget = this.probeContext }

  @Watch('probeContext')
  onTargetChanged () { this.open = false }

  get canStop (): boolean {
    return this.probeTarget === this.probeContext && this.commandControlAvailable &&
      this.klippyReady && this.klippyConnected && this.isManualProbeActive && !this.hasWait(this.$waits.onManualProbe)
  }

  get canMove (): boolean {
    return this.canStop && !this.printerPrinting && !this.printerPaused && this.printerState !== 'loading'
  }

  get offsets () {
    return [...new Set([
      1,
      0.1,
      ...this.$store.state.config.uiSettings.general.zAdjustDistances
    ])].filter(n => Number.isFinite(n) && n > 0).sort((a, b) => b - a)
  }

  get manualProbe () {
    return this.$store.state.printer.printer.manual_probe ?? {}
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
    if (!this.canMove) return
    const bracket = ['--', '-', '+', '++'].includes(zValue)
    const numeric = /^[+-]\d+(?:\.\d+)?$/.test(zValue) && this.offsets.includes(Math.abs(Number(zValue)))
    if (bracket || numeric) this.sendGcode(`TESTZ Z=${zValue}`, this.$waits.onManualProbe)
  }

  stepLabel (step: string): string {
    return ({ '--': 'Last closer height', '-': 'Halfway closer', '+': 'Halfway away', '++': 'Last away height' } as Record<string, string>)[step]
  }

  sendAbort () {
    if (this.canStop) this.sendGcode('ABORT', this.$waits.onManualProbe)
    this.open = false
  }

  sendAccept () {
    if (!this.canMove) return
    this.sendGcode('ACCEPT', this.$waits.onManualProbe)
  }
}
</script>

<style lang="scss" scoped>
  .mp__readout {
    display: flex;
    flex-wrap: wrap;
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
      grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;

    .cbtn {
      width: 100%;
      font-size: 13px;
    }
  }
</style>
