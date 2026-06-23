<template>
  <div>
    <v-row class="my-3">
      <v-col class="pl-6 pr-0 pt-0 pb-0 d-flex flex-column">
        <v-tooltip
          top
          :disabled="!spoolId"
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
                class="filamentSpool"
                @click-spool="onFilamentClick"
              />
            </span>
          </template>
          <span>
            <strong>ID #{{ spoolId }}</strong>
            <br>
            <template v-if="spoolFilamentVendor">{{ spoolFilamentVendor }} — </template>{{ spoolFilamentName }}
            <template v-if="spoolMaterial">
              <br>
              {{ spoolMaterial }}
              <template v-if="spoolExtruderTemp != null">
                | {{ spoolExtruderTemp }}°C
              </template>
              <template v-if="spoolBedTemp != null">
                | {{ spoolBedTemp }}°C
              </template>
            </template>
            <template v-if="spoolRemainingWeight != null">
              <br>
              {{ $t('app.afc.WeightRemaining', { weight: Math.round(spoolRemainingWeight) }) }}
              <template v-if="spoolUsedWeight != null">
                ({{ $t('app.afc.WeightUsed', { weight: Math.round(spoolUsedWeight) }) }})
              </template>
            </template>
          </span>
        </v-tooltip>
        <afc-unit-lane-filament-dialog
          v-model="showFilamentDialog"
          :name="name"
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
            $afcIconInfinity
          </v-icon>
          <template v-else>
            {{ runoutLane }}
          </template>
        </v-btn>
        <afc-unit-lane-infinite-dialog
          v-model="showInfintiyDialog"
          :name="name"
        />
        <span class="font-weight-bold">
          {{ spoolMaterial || '--' }}
        </span>
        <span class="text--disabled">
          <template v-if="spoolRemainingWeight != null">{{ Math.round(spoolRemainingWeight) }} g</template>
          <template v-else>--</template>
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
          <a
            v-if="spoolUrl"
            :href="spoolUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="position-absolute text-truncate text-truncate-element text-center text-decoration-none filament-link"
          >{{ spoolFilamentName }}</a>
          <span
            v-else
            class="position-absolute text-truncate text-truncate-element text-center"
          >{{ spoolFilamentName }}</span>
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
  @Prop({ type: String, required: true })
  readonly name!: string

  showInfintiyDialog = false
  showSpoolmanDialog = false
  showFilamentDialog = false
  spoolmanSelection = false

  get lane (): Klipper.AfcLaneState | undefined {
    return this.getAfcLaneObject(this.name)
  }

  get runoutLane (): string {
    return this.lane?.runout_lane ?? 'NONE'
  }

  get spoolId (): number | undefined {
    return this.lane?.spool_id ?? undefined
  }

  get spool (): Spool | null {
    if (!this.spoolId) return null

    return this.$typedGetters['spoolman/getSpoolById'](this.spoolId) ?? null
  }

  get spoolColor (): string {
    if (
      this.afc?.td1_present &&
      this.lane?.td1_color &&
      this.afcShowTd1Color
    ) {
      return `#${this.lane.td1_color}`
    }

    return this.lane?.color || '#000000'
  }

  get spoolRemainingWeight (): number | undefined {
    return this.spool?.remaining_weight ?? this.lane?.weight
  }

  get spoolFullWeight (): number | undefined {
    return this.spool?.initial_weight ?? this.lane?.initial_weight
  }

  get spoolPercent (): number {
    if (this.spoolRemainingWeight == null || this.spoolFullWeight == null) return 100
    if (this.spoolFullWeight === 0) return 100

    return Math.round((this.spoolRemainingWeight / this.spoolFullWeight) * 100)
  }

  get spoolMaterial (): string {
    return this.spool?.filament?.material ?? this.lane?.material ?? ''
  }

  get spoolFilamentVendor (): string | undefined {
    return this.spool?.filament?.vendor?.name
  }

  get spoolFilamentName (): string | undefined {
    return this.spool?.filament?.name ||
      this.lane?.filament_name ||
      undefined
  }

  get spoolUrl (): string | undefined {
    const base: string | undefined = this.$typedGetters['spoolman/getSpoolmanUrl']
    if (!base || !this.spoolId) return undefined
    return `${base.replace(/\/$/, '')}/spool/show/${this.spoolId}`
  }

  get spoolExtruderTemp (): number | undefined {
    return this.spool?.filament?.settings_extruder_temp
  }

  get spoolBedTemp (): number | undefined {
    return this.spool?.filament?.settings_bed_temp
  }

  get spoolUsedWeight (): number | undefined {
    return this.spool?.used_weight
  }

  get tdPresent (): boolean {
    return !!this.lane?.td1_td
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
  onSpoolmanChanged (dialog: SpoolSelectionDialogState) {
    if (
      !dialog.show &&
      this.spoolmanSelection
    ) {
      this.spoolmanSelection = false

      if (dialog.selectedSpoolId !== this.spoolId) {
        this.sendGcode(`SET_SPOOL_ID LANE=${this.name} SPOOL_ID=${dialog.selectedSpoolId ?? ''}`)
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
  cursor: pointer;
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

.filament-link {
  color: inherit !important;
  cursor: pointer;
}

.filament-link:hover,
.filament-link:focus {
  text-decoration: underline !important;
}
</style>
