<template>
  <control-card
    class="mchecks"
    data-tid="maintenance-checks"
  >
    <div
      v-if="saveConfigPending"
      class="mchecks__save"
    >
      <span>New results are kept until the printer restarts. Save them to keep them for good.</span>
      <button
        type="button"
        class="cbtn cbtn--primary"
        :disabled="!!saveBlocked"
        :title="saveBlocked || undefined"
        @click="saveResults"
      >
        Save
      </button>
    </div>

    <div
      v-for="row in checks"
      :key="row.id"
      class="mchecks__row"
      :data-tid="`check-${row.id}`"
    >
      <control-task-fold
        :fold-key="`maintenance.${row.id}`"
        :title="row.title"
        :summary="runningId === row.id ? 'Running…' : row.status.text"
      >
        <p class="mcheck__desc">
          {{ row.description }}
        </p>
        <maintenance-result
          v-if="row.id === 'firstLayer' || row.id === 'pid'"
          :check="row.id"
        />
        <control-tuning
          v-if="row.id === 'shaper'"
          shaper-only
        />
        <router-link
          v-if="row.id === 'bedMesh'"
          :to="bedTo"
          class="cbtn"
        >
          Open Bed
        </router-link>
        <button
          v-if="row.gcode"
          type="button"
          class="cbtn"
          :disabled="!!checksBlocked"
          :title="checksBlocked || undefined"
          @click="runCheck(row)"
        >
          {{ row.action }}
        </button>
      </control-task-fold>
    </div>

    <control-task-fold
      fold-key="maintenance.sensors"
      title="Switches and sensors"
      summary="Endstops, probe and filament state"
    >
      <control-outputs diagnostics-only />
      <probe-card v-if="hasProbe" />
    </control-task-fold>

    <div
      class="mchecks__row"
      data-tid="check-nozzle"
    >
      <h3 class="mcheck__title">
        Nozzle
      </h3>
      <p class="mcheck__desc">
        Total printing hours on this printer. Check the nozzle if prints start to string or look thin.
      </p>
      <span class="mcheck__status">Nothing to do · {{ printHours === null ? 'Hours unavailable' : `${printHours} h printed` }}</span>
    </div>

    <p
      v-if="!checks.length"
      class="mchecks__empty"
    >
      This printer has no checks to run from here yet.
    </p>
    <p
      v-else-if="checksBlocked && !runningId"
      class="mchecks__blocked"
    >
      <frame-icon
        name="lock"
        small
      />
      {{ checksBlocked }}
    </p>

    <manual-probe-recovery
      v-model="manualProbeDialogOpen"
    />
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import MaintenanceMixin from '@/mixins/maintenance'
import ControlCard from '@/components/control/ControlCard.vue'
import ControlTaskFold from '@/components/control/ControlTaskFold.vue'
import ControlTuning from '@/components/control/ControlTuning.vue'
import ControlOutputs from '@/components/control/ControlOutputs.vue'
import MaintenanceResult from './MaintenanceResult.vue'
import ProbeCard from './ProbeCard.vue'
import ManualProbeDialog from '@/components/common/ManualProbeDialog.vue'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'

/**
 * Maintenance's list: each check with what it's for, when it last ran here
 * and whether it's due, and a button to run it. First layer height opens
 * the paper test as soon as Klipper asks for it.
 */
@Component({ components: { ControlCard, ControlTaskFold, ControlTuning, ControlOutputs, MaintenanceResult, ProbeCard, ManualProbeDialog } })
export default class MaintenanceChecks extends Mixins(MaintenanceMixin, BrowserMixin) {
  manualProbeDialogOpen = false

  get bedTo (): string { return scopedPath('/tune', activeSlug()) }
  get hasProbe (): boolean { return !!this.$store.getters['printer/getProbe'] }

  @Watch('isManualProbeActive')
  onManualProbe (active: boolean) {
    if (active && this.klippyReady && !this.printerPrinting && !this.printerPaused) this.manualProbeDialogOpen = true
  }

  @Watch('evidence', { immediate: true })
  onEvidence () {
    this.recordIfDone()
  }
}
</script>

<style lang="scss" scoped>
  .mchecks { gap: 8px; }
  .mchecks__row + .mchecks__row { border-top: 1px solid var(--m3d-border); }
  .mchecks__save { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; background: var(--m3d-accent-soft); }
  .mcheck__title { margin: 12px 0 4px; font-size: 15px; }
  .mcheck__desc, .mchecks__empty, .mchecks__blocked { margin: 4px 0 12px; color: var(--m3d-text-muted); font-size: 13px; }
  .mcheck__status { font-size: 13px; }
</style>
