<template>
  <div>
    <v-row class="my-3">
      <v-col class="pl-6 pr-0 pt-0 pb-0 d-flex flex-column">
        <v-tooltip
          top
          :disabled="spoolId === 0"
        >
          <template #activator="{ on, attr }">
            <span
              class="d-flex align-center justify-center"
              v-bind="attr"
              v-on="on"
            >
              <afc-filament-reel
                :percent="spoolPercent"
                :color="spoolColor"
                class="filamentSpool cursor-pointer"
                @click-spool="onFilamentClick"
              />
            </span>
          </template>
          <span>
            #{{ spoolId }} | {{ spoolVendor }}
            <br>
            {{ spoolFilamentName }}
          </span>
        </v-tooltip>
        <afc-unit-lane-filament-dialog
          v-model="showFilamentDialog"
          :name="name"
          @close="showFilamentDialog = false"
          @cancel="showFilamentDialog = false"
        />
      </v-col>
      <v-col class="pr-6 pl-2 pt-0 pb-0 d-flex flex-column justify-space-between align-end">
        <v-btn
          v-if="afcShowLaneInfinite"
          x-small
          @click="showInfintiyDialog = true"
        >
          <v-icon
            v-if="runoutLane === 'NONE'"
            color="error"
            small
          >
            {{ afcIconInfintiy }}
          </v-icon>
          <template v-else>
            {{ runoutLane }}
          </template>
        </v-btn>
        <afc-unit-lane-infinite-dialog
          v-model="showInfintiyDialog"
          :name="name"
          @cancel="showInfintiyDialog = false"
          @close="showInfintiyDialog = false"
        />
        <span class="font-weight-bold">
          {{ spoolMaterial }}
        </span>
        <span class="text--disabled">
          {{ spoolRemainingWeightOutput }}
        </span>
        <v-tooltip
          v-if="tdPresent"
          top
        >
          <template #activator="{ on, attr }">
            <span
              v-if="tdPresent"
              class="d-flex align-center justify-center text--disable"
              v-bind="attr"
              v-on="on"
            >
              TD - {{ td }}
            </span>
          </template>
          <span>
            Color - #{{ tdColor }}
          </span>
        </v-tooltip>
      </v-col>
    </v-row>
    <v-row
      v-if="afcShowFilamentName"
      class="mb-0 mt-n3"
    >
      <v-col class="px-6 pt-1">
        <div class="position-relative pb-4">
          <span class="position-absolute text-truncate text-truncate-element text-center">
            {{ spoolFilamentName }}
          </span>
        </div>
      </v-col>
    </v-row>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import type { Spool, SpoolSelectionDialogState } from '@/store/spoolman/types'
import { afcIconInfintiy } from '@/plugins/afcIcons'
import AfcUnitLaneInfiniteDialog from '@/components/widgets/afc/dialogs/AfcUnitLaneInfiniteDialog.vue'
import AfcUnitLaneFilamentDialog from '@/components/widgets/afc/dialogs/AfcUnitLaneFilamentDialog.vue'
import AfcFilamentReel from './AfcFilamentReel.vue'

@Component({
  components: {
    AfcUnitLaneFilamentDialog,
    AfcUnitLaneInfiniteDialog,
    AfcFilamentReel
  },
})
export default class AfcCardUnitLaneBody extends Mixins(StateMixin, AfcMixin) {
  afcIconInfintiy = afcIconInfintiy

  @Prop({ type: String, required: true }) readonly name!: string

  showInfintiyDialog = false
  showSpoolmanDialog = false
  showFilamentDialog = false
  spoolmanSelection = false

  get lane () {
    return this.getAfcLaneObject(this.name)
  }

  get runoutLane (): string {
    return this.lane?.runout_lane ?? 'NONE'
  }

  get spoolId (): number {
    return Number(this.lane?.spool_id || '0')
  }

  get spool (): Spool | null {
    if (this.spoolId === 0) return null

    return this.$typedGetters['spoolman/getSpoolById'](this.spoolId) ?? null
  }

  get spoolColor (): string {
    if (this.afc?.td1_present && this.afcShowTd1Color) {
      return `#${this.lane?.td1_color}`
    }
    return this.lane?.color || '#000000'
  }

  get spoolRemainingWeight (): number {
    return Math.round(this.lane?.weight ?? 0)
  }

  get spoolRemainingWeightOutput (): string {
    return `${this.spoolRemainingWeight} g`
  }

  get spoolFullWeight (): number {
    return this.spool?.initial_weight ?? 1000
  }

  get spoolPercent (): number {
    if (this.spoolFullWeight === 0) return 100

    return Math.round((this.spoolRemainingWeight / this.spoolFullWeight) * 100)
  }

  get spoolMaterial (): string {
    return this.lane?.material || '--'
  }

  get spoolVendor (): string {
    return this.spool?.filament?.vendor?.name ?? 'Unknown'
  }

  get spoolFilamentName (): string {
    if (this.afcExistsSpoolman) {
      return this.spool?.filament?.name ?? 'Unknown'
    } else {
      return ''
    }
  }

  get tdPresent (): boolean {
    return (
      this.lane?.td1_td != null &&
      this.lane.td1_td.length > 0
    )
  }

  get td (): string {
    return this.lane?.td1_td || ''
  }

  get tdColor (): string {
    return this.lane?.td1_color || ''
  }

  handleSelectSpool () {
    this.spoolmanSelection = true
    this.$typedCommit('spoolman/setDialogState', {
      show: true,
      spoolSelectionOnly: true,
      selectedSpoolId: this.spoolId
    })
  }

  @Watch('$typedState.spoolman.dialog')
  onSpoolmanChanged (newDialog: SpoolSelectionDialogState) {
    let gcode = `SET_SPOOL_ID LANE=${this.name} SPOOL_ID=`
    if (this.spoolmanSelection) {
      if (newDialog.selectedSpoolId != null) {
        gcode = gcode + newDialog.selectedSpoolId
      }

      // Only send gcode once selection is closed
      if (!newDialog.show && newDialog.selectedSpoolId !== this.spoolId) {
        this.sendGcode(gcode)
        this.spoolmanSelection = false
      }
    }
  }

  onFilamentClick () {
    if (this.afcExistsSpoolman) {
      this.handleSelectSpool()
      return
    }

    this.showFilamentDialog = true
  }
}
</script>

<style scoped>
.filamentSpool {
  max-width: 38px;
}

.text-truncate-element {
  left: 0;
  right: 0;
}

.position-absolute {
    position: absolute !important;
}

.position-relative {
    position: relative !important;
}
</style>
