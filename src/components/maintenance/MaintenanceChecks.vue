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
      class="mcheck"
      :class="{ 'mcheck--phone': isMobileViewport }"
      :data-tid="`check-${row.id}`"
    >
      <span
        class="mcheck__icon"
        :class="`mcheck__icon--${row.status.tone}`"
      >
        <frame-icon :name="row.icon" />
      </span>
      <div class="mcheck__text">
        <h3 class="mcheck__title">
          {{ row.title }}
        </h3>
        <p class="mcheck__desc">
          {{ row.description }}
        </p>
      </div>
      <span
        class="mcheck__status"
        :class="`mcheck__status--${row.status.tone}`"
      >
        {{ runningId === row.id ? 'Running…' : row.status.text }}
      </span>
      <button
        type="button"
        class="cbtn mcheck__btn"
        :class="{ 'cbtn--primary': row.status.due }"
        :disabled="!!checksBlocked"
        :title="checksBlocked || undefined"
        @click="runCheck(row)"
      >
        {{ row.action }}
      </button>
    </div>

    <div
      v-if="printHours !== null"
      class="mcheck"
      :class="{ 'mcheck--phone': isMobileViewport }"
      data-tid="check-nozzle"
    >
      <span class="mcheck__icon mcheck__icon--off">
        <frame-icon name="nozzle" />
      </span>
      <div class="mcheck__text">
        <h3 class="mcheck__title">
          Nozzle
        </h3>
        <p class="mcheck__desc">
          {{ printHours }} {{ printHours === 1 ? 'hour' : 'hours' }} of printing on this printer. Swap the nozzle if prints start to string or look thin.
        </p>
      </div>
      <span class="mcheck__status mcheck__status--off">
        {{ pro ? `${printHours} h printed` : 'Nothing to do' }}
      </span>
      <span />
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

    <manual-probe-dialog
      v-if="manualProbeDialogOpen"
      v-model="manualProbeDialogOpen"
    />
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import MaintenanceMixin from '@/mixins/maintenance'
import ControlCard from '@/components/control/ControlCard.vue'

/**
 * Maintenance's list: each check with what it's for, when it last ran here
 * and whether it's due, and a button to run it. First layer height opens
 * the paper test as soon as Klipper asks for it.
 */
@Component({ components: { ControlCard } })
export default class MaintenanceChecks extends Mixins(MaintenanceMixin, BrowserMixin) {
  manualProbeDialogOpen = false

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
  .mchecks {
    gap: 0;
    padding: 8px 20px;
  }

  .mchecks__save {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 12px 0 4px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--m3d-accent-soft);
    font-size: 14px;
  }

  .mcheck {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 190px 120px;
    align-items: center;
    gap: 14px;
    min-height: 76px;
    padding: 10px 0;

    & + & {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .mcheck--phone {
    grid-template-columns: 40px minmax(0, 1fr);
    grid-template-areas:
      'icon text'
      '. status'
      '. btn';
    gap: 8px 14px;

    .mcheck__icon { grid-area: icon; align-self: start; }
    .mcheck__text { grid-area: text; }
    .mcheck__status { grid-area: status; }
    .mcheck__btn { grid-area: btn; justify-self: start; }
  }

  .mcheck__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .mcheck__icon--ok {
    background: color-mix(in srgb, var(--m3d-success) 14%, transparent);
    color: var(--m3d-success);
  }

  .mcheck__icon--warn {
    background: color-mix(in srgb, var(--m3d-warning) 16%, transparent);
    color: var(--m3d-warning);
  }

  .mcheck__text {
    min-width: 0;
  }

  .mcheck__title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }

  .mcheck__desc {
    margin: 2px 0 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
    line-height: 1.4;
  }

  .mcheck__status {
    font-size: 13px;
  }

  .mcheck__status--ok { color: var(--m3d-success); }
  .mcheck__status--warn { color: var(--m3d-warning); }
  .mcheck__status--off { color: var(--m3d-text-muted); }

  .mchecks__empty,
  .mchecks__blocked {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    padding: 12px 0;
    color: var(--m3d-text-subtle);
    font-size: 13px;
  }
</style>
