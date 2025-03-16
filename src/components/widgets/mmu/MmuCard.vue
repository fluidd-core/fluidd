<template>
  <collapsable-card
    :title="title"
    :icon="mdiMulticast"
    draggable
    layout-path="dashboard.mmu-card"
  >
    <template #menu>
      <v-menu
        bottom
        left
        offset-y
        transition="slide-y-transition"
        min-width="220"
        :close-on-content-click="false"
      >
        <template #activator="{ on, attrs, value }">
          <app-btn
            small
            v-bind="attrs"
            class="me-1 my-1"
            v-on="on"
          >
            <v-icon
              small
              class="me-1"
            >
              $tools
            </v-icon>
            Tools
            <v-icon
              small
              class="ms-1"
              :class="{ 'rotate-180': value }"
            >
              $chevronDown
            </v-icon>
          </app-btn>
        </template>
        <v-list dense>
          <v-list-item
            :disabled="!enabled"
            :class="{ 'mmu-disabled': !enabled }"
            @click="showEditTtgMapDialog = true"
          >
            <v-list-item-icon>
              <v-icon left>
                {{ mdiStateMachine }}
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.mmu.btn.edit_ttg_map') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item
            :disabled="!enabled"
            :class="{ 'mmu-disabled': !enabled }"
            @click="showEditGateMapDialog = true"
          >
            <v-list-item-icon>
              <v-icon left>
                {{ mdiDatabaseEdit }}
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.mmu.btn.edit_gate_map') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item
            :disabled="!enabled || !canSend"
            :class="{ 'mmu-disabled': !enabled }"
            @click="showRecoverStateDialog = true"
          >
            <v-list-item-icon>
              <v-icon left>
                {{ mdiCogRefresh }}
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.mmu.btn.recover_state') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item
            :disabled="!enabled || !canSend"
            :class="{ 'mmu-disabled': !enabled }"
            @click="showMaintenanceDialog = true"
          >
            <v-list-item-icon>
              <v-icon left>
                {{ mdiWrenchCog }}
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.mmu.btn.mmu_maintenance') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-divider class="my-2" />
          <v-list-item
            :disabled="!enabled"
            :class="{ 'mmu-disabled': !enabled }"
            :loading="hasWait($waits.onMmuStats)"
            @click="sendGcode('MMU_STATS SHOWCOUNTS=1', $waits.onMmuStats)"
          >
            <v-list-item-icon>
              <v-icon left>
                {{ mdiNoteText }}
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.mmu.btn.print_stats') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item
            :disabled="!enabled || spoolmanSupport === 'off'"
            :class="{ 'mmu-disabled': !enabled || spoolmanSupport === 'off' }"
            :loading="hasWait($waits.onMmuSpoolman)"
            @click="handleSyncSpoolman()"
          >
            <v-list-item-icon>
              <v-icon left>
                {{ mdiRefresh }}
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.mmu.btn.sync_spoolman') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item
            :disabled="!enabled || !canSend"
            :class="{ 'mmu-disabled': !enabled }"
            :loading="hasWait($waits.onMmuCheckGates)"
            @click="sendGcode('MMU_CHECK_GATES', $waits.onMmuCheckGates)"
          >
            <v-list-item-icon>
              <v-icon left>
                {{ mdiCheckAll }}
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.mmu.btn.check_all_gates') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
      <mmu-settings />
    </template>

    <div :class="{ 'mmu-disabled': !enabled }">
      <v-container
        fluid
        pa-2
      >
        <v-row align="start">
          <mmu-machine />
        </v-row>
        <v-row align="start">
          <v-col
            :cols="col1Size"
            class="pt-0 d-flex flex-column align-center justify-center"
          >
            <div class="text--disabled smaller-font min-height-text">
              {{ toolchangeText }}
            </div>
            <div class="min-height-text">
              {{ statusText }}
            </div>
            <mmu-filament-status />
            <template v-if="showClogDetection">
              <mmu-clog-meter
                v-if="hasEncoder"
                width="40%"
              />
              <div class="text--disabled">
                {{ $t('app.mmu.label.clog_detection') }}
              </div>
            </template>
          </v-col>
          <v-col
            :cols="12 - col1Size"
            class="d-flex flex-column align-center justify-center"
          >
            <template v-if="showDetails">
              <v-row
                class="pb-3 pt-0"
                style="align-self: flex-start; width: 100%"
              >
                <v-col class="pa-0">
                  <mmu-gate-summary :gate-index="gate" />
                </v-col>
              </v-row>
            </template>
            <v-divider style="width: 100%" />
            <mmu-controls />
            <v-divider style="width: 100%" />
            <template v-if="showTtgMap">
              <mmu-ttg-map
                :start-y="20"
                width="75%"
                :map="ttgMap"
                :groups="endlessSpoolGroups"
                :selected-tool="tool"
                :selected-gate="gate"
                @click="showEditTtgMapDialog = true"
              />
              <div class="text--disabled">
                {{ $t('app.mmu.label.tool_mapping') }}
              </div>
            </template>
          </v-col>
        </v-row>
        <v-row>
          <v-divider />
        </v-row>
        <v-row v-if="reasonForPause">
          <v-col
            cols="auto"
            class="d-flex align-center justify-center"
          >
            <v-icon class="error-icon">
              {{ mdiInformationOutline }}
            </v-icon>
          </v-col>
          <v-col class="d-flex align-center">
            <div>
              <div class="text--secondary">
                <strong>Last Error</strong>
              </div>
              <div class="text--disabled smaller-font">
                {{ reasonForPause }}
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <mmu-recover-state-dialog
      :show-dialog="showRecoverStateDialog"
      @close="showRecoverStateDialog = false"
    />
    <mmu-edit-ttg-map-dialog
      :show-dialog="showEditTtgMapDialog"
      @close="showEditTtgMapDialog = false"
    />
    <mmu-maintenance-dialog
      :show-dialog="showMaintenanceDialog"
      @close="showMaintenanceDialog = false"
    />
    <mmu-edit-gate-map-dialog
      :show-dialog="showEditGateMapDialog"
      @close="showEditGateMapDialog = false"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import MmuMixin from '@/mixins/mmu'
import {
  mdiMulticast,
  mdiAutoFix,
  mdiCheckAll,
  mdiWrenchCog,
  mdiCogRefresh,
  mdiDatabaseEdit,
  mdiStateMachine,
  mdiNoteText,
  mdiInformationOutline,
  mdiRefresh,
} from '@mdi/js'
import MmuMachine from '@/components/widgets/mmu/MmuMachine.vue'
import MmuFilamentStatus from '@/components/widgets/mmu/MmuFilamentStatus.vue'
import MmuTtgMap from '@/components/widgets/mmu/MmuTtgMap.vue'
import MmuControls from '@/components/widgets/mmu/MmuControls.vue'
import MmuGateSummary from '@/components/widgets/mmu/MmuGateSummary.vue'
import MmuClogMeter from '@/components/widgets/mmu/MmuClogMeter.vue'
import MmuSettings from '@/components/widgets/mmu/MmuSettings.vue'
import MmuRecoverStateDialog from '@/components/widgets/mmu/MmuRecoverStateDialog.vue'
import MmuEditTtgMapDialog from '@/components/widgets/mmu/MmuEditTtgMapDialog.vue'
import MmuEditGateMapDialog from '@/components/widgets/mmu/MmuEditGateMapDialog.vue'
import MmuMaintenanceDialog from '@/components/widgets/mmu/MmuMaintenanceDialog.vue'

@Component({
  components: {
    MmuMachine,
    MmuFilamentStatus,
    MmuTtgMap,
    MmuControls,
    MmuGateSummary,
    MmuClogMeter,
    MmuSettings,
    MmuRecoverStateDialog,
    MmuEditTtgMapDialog,
    MmuEditGateMapDialog,
    MmuMaintenanceDialog,
  },
})
export default class MmuCard extends Mixins(StateMixin, MmuMixin) {
  mdiMulticast = mdiMulticast
  mdiAutoFix = mdiAutoFix
  mdiCheckAll = mdiCheckAll
  mdiWrenchCog = mdiWrenchCog
  mdiCogRefresh = mdiCogRefresh
  mdiDatabaseEdit = mdiDatabaseEdit
  mdiStateMachine = mdiStateMachine
  mdiNoteText = mdiNoteText
  mdiInformationOutline = mdiInformationOutline
  mdiRefresh = mdiRefresh

  showRecoverStateDialog = false
  showEditTtgMapDialog = false
  showEditGateMapDialog = false
  showMaintenanceDialog = false

  get col1Size (): number {
    if (this.$typedState.config.uiSettings.mmu.largeFilamentStatus) return 6
    return 5
  }

  get title (): string {
    const headline = this.$tc('app.mmu.title.headline')
    if (!this.enabled) {
      return `${headline} (disabled)`
    }
    return headline
  }

  get showClogDetection (): boolean {
    return !this.hasEncoder || !!this.$typedState.config.uiSettings.mmu.showClogDetection
  }

  get showTtgMap (): boolean {
    return this.$typedState.config.uiSettings.mmu.showTtgMap
  }

  get showDetails (): boolean {
    return this.$typedState.config.uiSettings.mmu.showDetails
  }

  get statusText (): string {
    let posStr: string = ''
    if (['complete', 'error', 'cancelled', 'started'].includes(this.printState)) {
      posStr = this.capitalize(this.printState)
    } else if (this.action === 'Idle') {
      if (this.printState === 'printing') {
        posStr = `Printing (${this.numToolchanges}`
        if (this.slicerToolMap.total_toolchanges) posStr += `/${this.slicerToolMap.total_toolchanges}`
        posStr += ' swaps)'
      } else {
        posStr = this.filament !== 'Unloaded' ? `Filament: ${this.filamentPosition}mm` : 'Filament: Unloaded'
      }
    } else if (this.action === 'Loading' || this.action === 'Unloading') {
      posStr = `${this.action}: ${this.filamentPosition}mm`
    } else {
      posStr = this.action
    }
    return posStr
  }

  private capitalize (str: string): string {
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  handleSyncSpoolman () {
    this.sendGcode('MMU_SPOOLMAN REFRESH=1 QUIET=1', this.$waits.onMmuSpoolman)
  }
}
</script>

<style scoped>
.mmu-disabled {
    pointer-events: none !important;
    opacity: 0.5 !important;
}

.error-icon {
    color: red;
}

.smaller-font {
    font-size: 0.8em;
}

.min-height-text {
    min-height: 1.2em;
    line-height: 1.2em;
}
</style>
