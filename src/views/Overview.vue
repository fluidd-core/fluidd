<template>
  <div
    class="overview"
    data-tid="overview-page"
  >
    <div class="overview__top">
      <overview-stage class="overview__stage" />
      <div>
        <overview-this-print v-if="busy" />
        <overview-print-something v-else />
        <div
          v-if="busy"
          class="overview__actions"
        >
          <button
            type="button"
            class="cbtn cbtn--grow"
            data-tid="overview-pause"
            :disabled="!controlReady"
            @click="pauseCurrent"
          >
            {{ printerPaused ? 'Resume' : 'Pause' }}
          </button>
          <button
            type="button"
            class="cbtn cbtn--grow cbtn--danger"
            data-tid="overview-stop"
            :disabled="!controlReady"
            @click="stopCurrent"
          >
            Stop print
          </button>
          <button
            v-if="hasObjects"
            type="button"
            class="cbtn"
            @click="objectsOpen = !objectsOpen"
          >
            Objects
          </button>
        </div>
      </div>
    </div>
    <overview-tiles :phone="isMobileViewport" />
    <div class="overview__customise">
      <button
        type="button"
        class="cbtn"
        :aria-expanded="editing ? 'true' : 'false'"
        aria-controls="overview-layout-editor"
        @click="toggleEditing"
      >
        {{ editing ? 'Done' : 'Customise Overview' }}
      </button>
      <span>{{ rememberingLayout ? (accountId ? 'Your arrangement follows your account.' : 'Your arrangement stays in this browser.') : 'These choices last for this visit.' }}</span>
    </div>
    <overview-cards
      v-if="editing"
      id="overview-layout-editor"
      :value="layout"
      :unavailable="unavailable"
      @input="chooseLayout"
    />
    <p
      v-if="preferences.state.layoutError || preferences.state.error"
      role="alert"
    >
      {{ preferences.state.layoutError || preferences.state.error }}
      <button
        type="button"
        class="ov-card__link"
        @click="retryLayout"
      >
        Try again
      </button>
    </p>
    <div class="overview__cards">
      <template v-for="card in shownCards">
        <section
          v-if="unavailable[card.id]"
          :key="card.id"
          class="ov-card"
          :data-card="card.id"
        >
          <h2 class="ov-card__title">
            {{ card.title }}
          </h2><p>{{ unavailable[card.id] }}</p>
        </section>
        <div
          v-else
          :key="card.id"
          :class="{ 'overview__wide': card.size === 'wide' }"
          :data-card="card.id"
        >
          <overview-temps
            v-if="card.id === 'temperatures'"
            :phone="isMobileViewport"
          />
          <overview-quick-actions v-else-if="card.id === 'quick-actions'" />
          <overview-live-tune v-else-if="card.id === 'live-tune'" />
          <overview-console v-else-if="card.id === 'console'" />
          <control-macros v-else-if="card.id === 'macros'" />
          <overview-objects v-else-if="card.id === 'objects'" />
          <maintenance-checks v-else-if="card.id === 'checks'" />
          <section
            v-else-if="card.id === 'chart'"
            class="ov-card"
          >
            <h2 class="ov-card__title">
              Chart
            </h2>
            <diagnostics-card
              v-for="config in diagnosticCharts"
              :key="config.id"
              :config="config"
              bare
            />
          </section>
          <section
            v-else
            class="ov-card"
          >
            <h2 class="ov-card__title">
              {{ card.title }}
            </h2>
            <template v-if="card.id === 'queue'">
              <b>{{ queue[0] ? queue[0].filename : 'Nothing queued' }}</b>
              <span v-if="queue.length">{{ queue.length }} queued. Starting follows the printer's queue settings.</span>
              <router-link
                class="ov-card__link"
                :to="pagePath('/jobs')"
              >
                Open queue
              </router-link>
            </template>
            <template v-if="card.id === 'camera'">
              <camera-item :camera="cameras[0]" /><router-link
                class="ov-card__link"
                :to="pagePath('/camera')"
              >
                Open camera
              </router-link>
            </template>
            <template v-if="card.id === 'bed'">
              <span>{{ meshRecorded ? 'A bed measurement is recorded.' : 'No bed measurement is recorded.' }}</span><router-link
                class="ov-card__link"
                :to="pagePath('/tune')"
              >
                Open Bed
              </router-link>
            </template>
            <template v-if="card.id === 'spool'">
              <span>{{ spoolFact }}</span><material-picker />
            </template>
          </section>
        </div>
      </template>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import BrowserMixin from '@/mixins/browser'
import { SocketActions } from '@/api/socketActions'
import { cloudState } from '@/services/muon-cloud/state'
import { storedToken } from '@/services/muon-cloud/api'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import { controlPreferenceStore } from '@/services/account/control-preferences'
import { REMEMBER_CONTROL_FOLDS, type ControlPreferenceStore } from '@/services/control/preferences'
import { cardLayout, cardUnavailable, overviewCards, type OverviewCapabilities } from '@/services/overview/cards'
import type { WebcamConfig } from '@/store/webcams/types'
import type { HistoryItem } from '@/store/history/types'
import type { DiagnosticsCardConfig } from '@/store/diagnostics/types'
import OverviewStage from '@/components/overview/OverviewStage.vue'
import OverviewThisPrint from '@/components/overview/OverviewThisPrint.vue'
import OverviewPrintSomething from '@/components/overview/OverviewPrintSomething.vue'
import OverviewTiles from '@/components/overview/OverviewTiles.vue'
import OverviewTemps from '@/components/overview/OverviewTemps.vue'
import OverviewQuickActions from '@/components/overview/OverviewQuickActions.vue'
import OverviewLiveTune from '@/components/overview/OverviewLiveTune.vue'
import OverviewConsole from '@/components/overview/OverviewConsole.vue'
import OverviewCards from '@/components/overview/OverviewCards.vue'
import OverviewObjects from '@/components/overview/OverviewObjects.vue'
import MaterialPicker from '@/components/overview/MaterialPicker.vue'

@Component({
  components: {
    OverviewStage,
    OverviewThisPrint,
    OverviewPrintSomething,
    OverviewTiles,
    OverviewTemps,
    OverviewQuickActions,
    OverviewLiveTune,
    OverviewConsole,
    OverviewCards,
    OverviewObjects,
    MaterialPicker,
    ControlMacros: () => import('@/components/control/ControlMacros.vue'),
    DiagnosticsCard: () => import('@/components/widgets/diagnostics/DiagnosticsCard.vue'),
    MaintenanceChecks: () => import('@/components/maintenance/MaintenanceChecks.vue'),
    CameraItem: () => import('@/components/widgets/camera/CameraItem.vue')
  }
})
export default class Overview extends Mixins(OverviewMixin, BrowserMixin) {
  @Prop({ type: Object }) readonly preferenceStore?: ControlPreferenceStore
  editing = false
  editorContext = ''
  objectsOpen = false
  visitCards: string[] | null = null
  get preferences () { return this.preferenceStore ?? controlPreferenceStore }
  get accountId (): string { return cloudState.account?.id ?? '' }
  get printerId (): string { return isManagedApiUrl(this.$store.state.config.apiUrl) && printerTransportBinding.remote ? cloudState.activePrinterId ?? '' : '' }
  get layoutContext (): string { return `${this.panelTarget}|${this.printerId}` }
  get rememberingLayout (): boolean { return !!this.printerId && REMEMBER_CONTROL_FOLDS }
  get layout (): string[] { return cardLayout(this.rememberingLayout ? this.preferences.state.layout : this.visitCards) }
  get hasObjects (): boolean { return !!this.$store.state.printer.printer.exclude_object?.objects?.length }
  get meshRecorded (): boolean { return !!this.$store.state.printer.printer.bed_mesh?.mesh_matrix?.length }
  get cameras (): WebcamConfig[] { return this.$store.getters['webcams/getEnabledWebcams'] ?? [] }
  get diagnosticCharts (): DiagnosticsCardConfig[] { return Object.values(this.$store.state.layout?.layouts?.diagnostics ?? {}).flat().filter((c: any) => c.enabled) as DiagnosticsCardConfig[] }
  get unavailable (): Record<string, string> {
    const printer = this.$store.state.printer.printer
    const components: string[] = this.$store.state.server?.info?.components ?? []
    const commands = Object.keys(this.$store.getters['printer/getAvailableCommands'] ?? {})
    const capabilities: OverviewCapabilities = {
      temperatures: !!(this.heaters.length || (this.$store.getters['printer/getSensors'] ?? []).length),
      // Availability follows authority, not a transient Klipper state. The
      // controls themselves keep enforcing readiness when a command is sent.
      control: this.commandControlAvailable,
      queue: components.includes('job_queue'),
      camera: !!this.cameras.length,
      macros: Object.keys(printer).some(key => key.startsWith('gcode_macro ')),
      // The lazy Console route and Tools navigation support managed printers;
      // typed commands inside it independently enforce role and connection.
      console: true,
      bedMesh: !!printer.bed_mesh,
      calibration: commands.some(command => /CALIBRATE|TUNE/.test(command)),
      diagnostics: !!this.$store.state.config.uiSettings.general.enableDiagnostics && !!this.diagnosticCharts.length,
      objects: !!printer.exclude_object,
      filament: this.savesMaterial || this.materialChoices.length > 0 || !!this.loadedMaterial || !!this.printingWith || components.includes('spoolman')
    }
    const result: Record<string, string> = {}
    for (const card of overviewCards) {
      const explanation = cardUnavailable(card.id, capabilities)
      if (explanation) result[card.id] = explanation
    }
    return result
  }

  get shownCards () {
    const selected = this.objectsOpen && this.hasObjects && !this.layout.includes('objects') ? [...this.layout, 'objects'] : this.layout
    return selected.map(id => overviewCards.find(c => c.id === id)!).filter(c => c.when === 'always' || (c.when === 'idle' ? !this.busy : this.busy))
  }

  @Watch('layoutContext', { immediate: true })
  refreshLayout () {
    this.visitCards = null; this.objectsOpen = false; this.editing = false; this.editorContext = ''
    return this.preferences.select({ accountId: this.accountId || null, printerId: this.printerId || null, token: this.accountId ? storedToken() : null })
  }

  mounted () { window.addEventListener('focus', this.refreshSavedLayout); document.addEventListener('visibilitychange', this.onVisible) }
  beforeDestroy () { window.removeEventListener('focus', this.refreshSavedLayout); document.removeEventListener('visibilitychange', this.onVisible) }
  refreshSavedLayout () { if (this.printerId) return this.preferences.select({ accountId: this.accountId || null, printerId: this.printerId, token: this.accountId ? storedToken() : null }) }
  onVisible () { if (!document.hidden) this.refreshSavedLayout() }
  toggleEditing () { this.editing = !this.editing; this.editorContext = this.editing ? this.layoutContext : '' }
  chooseLayout (cards: string[] | null) { if (!this.editing || this.editorContext !== this.layoutContext) return; this.visitCards = cards; if (this.rememberingLayout) { this.refreshSavedLayout(); return this.preferences.setLayout(cards) } }
  retryLayout () { this.refreshSavedLayout(); return this.preferences.retry() }
  pauseCurrent () { if (this.controlReady && (this.printerPrinting || this.printerPaused)) this.printerPaused ? this.resumePrint() : this.pausePrint() }
  async stopCurrent () {
    if (!this.controlReady || !(this.printerPrinting || this.printerPaused)) return
    const target = this.panelTarget
    const file = this.jobFile
    const duration = this.printStats.total_duration ?? 0
    const job = this.$store.state.history?.jobs?.find((j: HistoryItem) => j.status === 'in_progress' && j.filename === file)?.job_id
    const ok = await this.$confirm('The print stops and cannot be picked up again. Remove it from the plate before the next print.', { title: 'Stop this print?', buttonTrueText: 'Stop print', danger: true })
    const sameJob = job === this.$store.state.history?.jobs?.find((j: HistoryItem) => j.status === 'in_progress' && j.filename === this.jobFile)?.job_id
    if (ok && sameJob && target === this.panelTarget && file === this.jobFile && (this.printStats.total_duration ?? 0) >= duration && this.controlReady && (this.printerPrinting || this.printerPaused)) SocketActions.printerPrintCancel()
  }
}
</script>
<style lang="scss" scoped>
.overview { display: flex; flex-direction: column; gap: 16px; }
.overview__top, .overview__cards { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 16px; }
.overview__stage { min-height: 350px; }
.overview__wide { grid-column: 1 / -1; }
.overview__actions, .overview__customise { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.overview__actions .cbtn { min-height: 44px; }
.overview__customise { align-items: center; color: var(--m3d-text-subtle); font-size: 12px; }
@media (max-width: 899px) { .overview__top, .overview__cards { grid-template-columns: minmax(0, 1fr); } .overview__stage { min-height: 280px; } }
</style>
<style lang="scss">
  // The card every Overview panel is.
  .overview {
    .ov-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
      padding: 20px;
      border-radius: 22px;
      background: var(--m3d-surface);
      color: var(--m3d-text);
    }

    .ov-card__head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px 12px;
    }

    .ov-card__title {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }

    .ov-card__aside {
      color: var(--m3d-text-subtle);
      font-size: 12px;
    }

    .ov-card__link {
      color: var(--m3d-accent) !important;
      font-size: 13px;
      text-decoration: none;
    }
  }
</style>
