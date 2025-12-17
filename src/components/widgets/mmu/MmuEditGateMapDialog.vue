<template>
  <div>
    <app-dialog
      v-model="open"
      width="800"
      title-shadow
      :fullscreen="isMobileViewport"
      :title="$t('app.mmu.title.edit_gate_map')"
      @save="commit"
      @cancel="close"
    >
      <!-- UPPER SECTION -->
      <v-card-subtitle v-if="editGateMap.length > 0">
        <v-container
          fluid
          pa-2
        >
          <!-- HEADER -->
          <v-row>
            <v-col
              cols="8"
              class="d-flex justify-start align-center no-padding"
            >
              {{ $t('app.mmu.msg.select_gate') }}
            </v-col>
            <v-col
              cols="4"
              class="d-flex justify-end no-padding"
            >
              <v-btn
                small
                color="secondary"
                class="small-font"
                :loading="hasWait($waits.onMmuTtgMap)"
                @click="resetGateMap()"
              >
                {{ $t('app.mmu.label.reset') }}
              </v-btn>
            </v-col>
          </v-row>

          <!-- DISPLAY GATES -->
          <v-row align="start">
            <v-col class="d-flex justify-start align-center no-padding">
              <mmu-machine
                :show-context-menu="false"
                :edit-gate-map="editGateMap"
                :edit-gate-selected="editGateSelected"
                @select-gate="selectGate"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-card-subtitle>

      <v-divider />

      <!-- LOWER SECTION -->
      <v-card-text class="px-4 pb-4">
        <div class="fixed-area">
          <transition name="fade">
            <div
              v-if="editGateSelected === -1"
              class="overlay-text"
            >
              {{ $t('app.mmu.msg.select_gate') }}
            </div>
          </transition>

          <transition name="fade">
            <v-container
              v-if="editGateSelected !== -1"
              fluid
              pa-2
            >
              <v-row class="ms-0 me-0 mb-4">
                <v-col
                  class="d-flex justify-start align-center no-padding small-font text--secondary"
                >
                  <div v-if="spoolmanSupport === SPOOLMAN_PULL">
                    {{
                      $t('app.mmu.msg.spoolman_pull', {
                        mode: spoolmanSupport,
                      })
                    }}
                  </div>
                  <div v-else-if="spoolmanSupport === SPOOLMAN_OFF">
                    {{
                      $t('app.mmu.msg.spoolman_off', {
                        mode: spoolmanSupport,
                      })
                    }}
                  </div>
                  <div v-else>
                    {{
                      $t('app.mmu.msg.spoolman_other', {
                        mode: spoolmanSupport,
                      })
                    }}
                  </div>
                </v-col>
              </v-row>

              <!-- GATE DETAILS-->
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                  class="d-flex flex-column justify-start align-left no-padding pt-3"
                  style="height: 100%"
                >
                  <v-row>
                    <v-col
                      cols="6"
                      class="pt-5 ps-6"
                    >
                      <v-switch
                        v-model="useSpoolman"
                        :label="$t('app.mmu.label.spoolman')"
                        :disabled="
                          spoolmanSupport === SPOOLMAN_PULL ||
                            spoolmanSupport === SPOOLMAN_OFF
                        "
                        hide-details
                        class="short-switch"
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="spoolId"
                        type="number"
                        class="force-spin-buttons"
                        :label="$t('app.mmu.label.spoolman_id')"
                        :rules="spoolIdRules()"
                        :disabled="
                          !useSpoolman ||
                            spoolmanSupport === SPOOLMAN_PULL ||
                            spoolmanSupport === SPOOLMAN_OFF
                        "
                        :hide-spin-buttons="
                          !useSpoolman ||
                            spoolmanSupport === SPOOLMAN_PULL ||
                            spoolmanSupport === SPOOLMAN_OFF
                        "
                        outlined
                        dense
                        @blur="adjustSpoolId"
                      />
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col
                      cols="12"
                      class="ps-6"
                    >
                      <v-text-field
                        v-model.trim="editGateMap[editGateSelected].filamentName"
                        :label="$t('app.mmu.label.filament_name')"
                        :disabled="useSpoolman || spoolmanSupport === SPOOLMAN_PULL"
                        outlined
                        dense
                        clearable
                        hide-details
                        @blur="adjustName"
                      />
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col
                      cols="6"
                      class="ps-6"
                    >
                      <v-text-field
                        v-model.trim="editGateMap[editGateSelected].material"
                        :label="$t('app.mmu.label.material')"
                        :disabled="useSpoolman || spoolmanSupport === SPOOLMAN_PULL"
                        outlined
                        dense
                        clearable
                        hide-details
                        @blur="adjustMaterial"
                      />
                    </v-col>
                    <v-col cols="2" />
                    <v-col cols="4">
                      <v-text-field
                        v-model="editGateMap[editGateSelected].temperature"
                        type="number"
                        :label="$t('app.mmu.label.temperature')"
                        :disabled="useSpoolman || spoolmanSupport === SPOOLMAN_PULL"
                        :hide-spin-buttons="
                          useSpoolman || spoolmanSupport === SPOOLMAN_PULL
                        "
                        suffix="°C"
                        :rules="temperatureRules()"
                        outlined
                        dense
                        hide-details
                        @blur="adjustTemperature"
                      />
                    </v-col>
                  </v-row>

                  <v-row class="pt-3 pb-3 ps-3">
                    <v-divider />
                  </v-row>

                  <v-row>
                    <v-col
                      cols="12"
                      class="ps-6"
                    >
                      <v-switch
                        v-model="selectedGateStatus"
                        :label="selectedGateStatusLabel"
                        hide-details
                        class="short-switch"
                      />
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12">
                      <v-subheader class="speed-slider-subheader ps-6 pe-1">
                        <v-icon
                          small
                          class="mr-2"
                        >
                          $mmuLoadSpeed
                        </v-icon>
                        <span>{{ $t('app.mmu.label.load_speed') }}</span>
                        <v-spacer />
                        <v-text-field
                          v-model="editGateMap[editGateSelected].speedOverride"
                          type="number"
                          suffix="%"
                          hide-spin-buttons
                          hide-details
                          outlined
                          dense
                          readonly
                          class="_slider-input d-flex align-center pt-1"
                        >
                          <template #append>
                            <v-icon
                              small
                              @click="resetSpeed()"
                            >
                              $mmuResetSpeed
                            </v-icon>
                          </template>
                        </v-text-field>
                      </v-subheader>

                      <v-card-text class="pb-0 pe-0 pt-1 d-flex align-center">
                        <v-slider
                          v-model="editGateMap[editGateSelected].speedOverride"
                          :min="10"
                          :max="150"
                          hide-details
                        >
                          <template #prepend>
                            <v-icon @click="decrementSpeed">
                              $mmuDecrementSpeed
                            </v-icon>
                          </template>
                          <template #append>
                            <v-icon @click="incrementSpeed">
                              $mmuIncrementSpeed
                            </v-icon>
                          </template>
                        </v-slider>
                      </v-card-text>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-spacer />
                  </v-row>
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                  class="d-flex flex-column justify-start align-center no-padding pt-3"
                >
                  <div v-if="!useSpoolman">
                    <v-color-picker
                      v-model="editGateMap[editGateSelected].color"
                      hide-inputs
                      swatches-max-height="120px"
                      show-swatches
                      mode="hexa"
                      show-alpha
                      hide-opacity="false"
                    />
                  </div>
                  <div v-else>
                    <div
                      :class="!spoolIdExists ? 'no-spool' : ''"
                      style="align-items: center;"
                    >
                      <v-icon
                        :color="spoolmanColor"
                        size="120px"
                        class="spool-icon"
                        @click="handleSelectSpool()"
                      >
                        $filament
                      </v-icon>
                      <div class="pt-4">
                        {{ spoolmanLastUsed }}
                      </div>
                      <div>
                        <strong>{{ spoolmanRemainingWeight }}</strong>
                        <small class="ml-1">/ {{ spoolmanTotalWeight }}</small>
                      </div>
                    </div>
                    <div style="padding-top: 12px">
                      <v-btn
                        block
                        color="secondary"
                        class="spoolman-btn"
                        @click="handleSelectSpool()"
                      >
                        <v-icon>
                          $mmuChooseSpool
                        </v-icon>
                        {{ $t('app.mmu.label.choose_spool') }}
                      </v-btn>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </transition>
        </div>
      </v-card-text>
    </app-dialog>
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins, VModel, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import StateMixin from '@/mixins/state'
import MmuMixin from '@/mixins/mmu'
import type { MmuGateDetails } from '@/types'
import type { Spool, SpoolSelectionDialogState } from '@/store/spoolman/types'
import MmuMachine from '@/components/widgets/mmu/MmuMachine.vue'

@Component({
  components: { MmuMachine }
})
export default class MmuEditGateMapDialog extends Mixins(BrowserMixin, StateMixin, MmuMixin) {
  @VModel({ required: true })
  open!: boolean

  private editGateMap: MmuGateDetails[] = []
  private editGateSelected: number = -1

  @Watch('open')
  onOpenChanged () {
    this.initialize()
  }

  @Watch('gateMap')
  onGateMapChanged () {
    this.initialize()
  }

  private initialize () {
    if (this.open) {
      this.editGateMap = Array.from(this.gateMap)
    } else {
      this.editGateMap = []
    }
    this.editGateSelected = -1
  }

  private selectGate (gate: number) {
    if (this.editGateSelected !== -1) this.adjustSpoolId() // Get rid of null possibility
    if (this.editGateSelected === gate) {
      this.editGateSelected = -1
    } else {
      this.editGateSelected = gate

      // Clean up stale spool_id's
      if (this.spoolmanSupport === this.SPOOLMAN_OFF) {
        this.editGateMap[this.editGateSelected].spoolId = -1
      }
    }
  }

  private handleEscapePress (event: KeyboardEvent) {
    if (event.key === 'Escape' || event.keyCode === 27) {
      this.editGateSelected = -1
    }
  }

  private adjustName () {
    const filamentName = this.editGateMap[this.editGateSelected].filamentName ?? ''
    this.editGateMap[this.editGateSelected].filamentName = filamentName.trim().replace(/[#'"]/g, '')
  }

  private adjustMaterial () {
    const material = this.editGateMap[this.editGateSelected].material ?? ''
    this.editGateMap[this.editGateSelected].material = material.trim().replace(/[#'"]/g, '')
  }

  get spoolId (): number | null {
    if (!this.editGateMap || !this.editGateMap[this.editGateSelected]) {
      return null
    }
    return this.editGateMap[this.editGateSelected].spoolId
  }

  set spoolId (newSpoolIdStr: string | null) {
    const newSpoolId = newSpoolIdStr ? parseInt(newSpoolIdStr) : null
    this.editGateMap[this.editGateSelected].spoolId = newSpoolId !== null && !Number.isNaN(newSpoolId) ? newSpoolId : null
  }

  @Watch('spoolId')
  onSpoolIdChanged (newSpoolId: number | null) {
    if (newSpoolId !== null && newSpoolId > 0) {
      const spool = this.spoolmanSpool(newSpoolId)
      this.editGateMap[this.editGateSelected].filamentName =
                spool?.filament?.name ?? this.$t('app.mmu.label.unknown').toString()
      this.editGateMap[this.editGateSelected].material =
                spool?.filament?.material ?? this.$t('app.mmu.label.unknown').toString()
      const color = this.fromColorString(spool?.filament?.color_hex ?? '')
      this.editGateMap[this.editGateSelected].color = color
      this.editGateMap[this.editGateSelected].temperature = spool?.filament?.settings_extruder_temp ?? -1
    }
  }

  private spoolIdRules () {
    const spools: Spool[] = this.$typedGetters['spoolman/getAvailableSpools']
    return [
      (v: number) => {
        if (!v || v <= 0) return true
        const spoolExists = spools.some((spool) => spool.id === v) ?? null
        return spoolExists ? true : this.$t('app.mmu.msg.no_matching_spool')
      }
    ]
  }

  private adjustSpoolId () {
    const spoolId = this.editGateMap[this.editGateSelected].spoolId ?? -1
    this.editGateMap[this.editGateSelected].spoolId = spoolId
  }

  get spoolIdExists (): boolean {
    const spools: Spool[] = this.$typedGetters['spoolman/getAvailableSpools']
    return spools.some((spool) => spool.id === this.spoolId)
  }

  get temperature (): number {
    return this.editGateMap[this.editGateSelected].temperature
  }

  set temperature (newTemperatureStr: string) {
    const newTemperature = newTemperatureStr ? parseInt(newTemperatureStr) : -1
    this.editGateMap[this.editGateSelected].temperature = Number.isNaN(newTemperature) ? -1 : newTemperature
  }

  private temperatureRules () {
    return [
      (v: string | number) => {
        const num = parseFloat(String(v))
        return !Number.isNaN(num) && num >= 100 && num <= 290
          ? true
          : this.$t('app.mmu.msg.bad_temperature')
      }
    ]
  }

  private adjustTemperature () {
    const temp = this.editGateMap[this.editGateSelected].temperature
    if (temp < 100) {
      this.editGateMap[this.editGateSelected].temperature = 100
    } else if (temp > 290) {
      this.editGateMap[this.editGateSelected].temperature = 290
    }
  }

  get useSpoolman (): boolean {
    const spoolId = this.editGateMap[this.editGateSelected].spoolId
    return spoolId === null || spoolId > 0
  }

  set useSpoolman (newValue) {
    if (!newValue) {
      this.editGateMap[this.editGateSelected].spoolId = -1
    } else {
      this.editGateMap[this.editGateSelected].spoolId = null
    }
  }

  get selectedGateStatus (): boolean {
    return (
      this.editGateMap[this.editGateSelected].status === 1 || this.editGateMap[this.editGateSelected].status === 2
    )
  }

  set selectedGateStatus (value: boolean) {
    this.editGateMap[this.editGateSelected].status = value ? this.GATE_AVAILABLE : this.GATE_EMPTY
  }

  get selectedGateStatusLabel (): string {
    const status = this.editGateMap[this.editGateSelected].status
    if (status === this.GATE_UNKNOWN) {
      return this.$t('app.mmu.msg.filament_unknown').toString()
    } else if (status === this.GATE_EMPTY) {
      return this.$t('app.mmu.msg.filament_empty').toString()
    }
    return this.$t('app.mmu.msg.filament_available').toString()
  }

  handleSelectSpool () {
    this.$typedCommit('spoolman/setDialogState', {
      show: true,
      spoolSelectionOnly: true
    })
  }

  @Watch('$typedState.spoolman.dialog')
  onSpoolmanChanged (newDialog: SpoolSelectionDialogState) {
    if (newDialog.selectedSpoolId != null) {
      this.editGateMap[this.editGateSelected].spoolId = newDialog.selectedSpoolId
    }
  }

  get spoolmanColor (): string {
    const spoolId = this.editGateMap[this.editGateSelected].spoolId ?? -1
    const spool = this.spoolmanSpool(spoolId)
    return spool?.filament.color_hex ?? '#000'
  }

  get spoolmanRemainingWeight () {
    const spoolId = this.editGateMap[this.editGateSelected].spoolId ?? -1
    const spool = this.spoolmanSpool(spoolId)
    if (spool) {
      const remaining = spool.remaining_weight ?? 0
      return `${remaining.toFixed(0)}g`
    }
    return '-'
  }

  get spoolmanTotalWeight () {
    const spoolId = this.editGateMap[this.editGateSelected].spoolId ?? -1
    const spool = this.spoolmanSpool(spoolId)
    if (spool) {
      // Technically this is what spoolman implements but not available in Fluidd:
      //   let total = spool.initial_weight ?? spool.filament?.weight ?? 0
      const total = spool.filament?.weight ?? 0
      if (total < 1000) {
        return `${total.toFixed(0)}g`
      }

      let totalRound = Math.round(total / 1000)
      if (totalRound !== total / 1000) {
        totalRound = Math.round(total / 100) / 10
      }
      return `${totalRound}kg`
    }
    return '-'
  }

  get spoolmanLastUsed () {
    const spoolId = this.editGateMap[this.editGateSelected].spoolId ?? -1
    const spool = this.spoolmanSpool(spoolId)
    let usedStr = '-'

    if (spool) {
      const lastUsed = spool.last_used
      if (!lastUsed) {
        usedStr = this.$t('app.mmu.label.spoolman_never').toString()
      } else {
        const date = new Date(lastUsed)
        const now = new Date()
        const diff = now.getTime() - date.getTime()

        if (diff <= 1000 * 60 * 60 * 24) return this.$t('app.mmu.label.spoolman_today')
        if (diff <= 1000 * 60 * 60 * 24 * 2) return this.$t('app.mmu.label.spoolman_yesterday')
        if (diff <= 1000 * 60 * 60 * 24 * 14) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24))
          usedStr = this.$t('app.mmu.label.spoolman_days_ago', { days }).toString()
        }
        usedStr = date.toLocaleDateString()
      }
    }
    return `${this.$t('app.mmu.label.spoolman_last_used')}: ${usedStr}`
  }

  decrementSpeed (): void {
    let value = this.editGateMap[this.editGateSelected].speedOverride
    value = value > 10 ? Math.round(value - 10) : 10
    this.editGateMap[this.editGateSelected].speedOverride = value
  }

  incrementSpeed (): void {
    let value = this.editGateMap[this.editGateSelected].speedOverride
    value = value < 150 ? Math.round(value + 10) : 150
    this.editGateMap[this.editGateSelected].speedOverride = value
  }

  private resetSpeed (): void {
    this.editGateMap[this.editGateSelected].speedOverride = 100
  }

  // Actions...

  async resetGateMap () {
    const result = await this.$confirm(
      this.$tc('app.mmu.msg.reset_gate_map_confirmation', 1),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) this.executeResetGateMap()
  }

  executeResetGateMap () {
    this.initialize()
    this.sendGcode('MMU_GATE_MAP RESET=1', this.$waits.onMmuGateMap)
  }

  close () {
    this.editGateMap = []
    this.editGateSelected = -1
    this.open = false
  }

  commit () {
    if (this.editGateSelected !== -1) this.adjustSpoolId() // Get rid of null possibility
    const mapStr = this.generateMapString(this.editGateMap)
    const cmd = `MMU_GATE_MAP MAP="${mapStr}" QUIET=1`
    this.sendGcode(cmd)
    this.close()
  }

  private generateMapString (gateMap: MmuGateDetails[]) {
        type GateDetails = {
          status: number
          spool_id: number | null
          material: string
          color: string
          name: string
          temp: number
          speed_override: number
        }
        const mapObject: Record<number, GateDetails> = {}
        gateMap.forEach((gate) => {
          mapObject[gate.index] = {
            status: gate.status ?? this.GATE_UNKNOWN,
            spool_id: gate.spoolId ?? -1,
            material: gate.material ?? '',
            color: gate.color.replace(this.NO_FILAMENT_COLOR, '').replace('#', ''),
            name: gate.filamentName ?? '',
            temp: gate.temperature ?? -1,
            speed_override: gate.speedOverride ?? 100,
          }
        })
        const jsonString = JSON.stringify(mapObject)
          .replace(/"(\d+)":/g, '$1: ')
          .replace(/"/g, "'")
        return jsonString
  }

  mounted () {
    document.addEventListener('keydown', this.handleEscapePress)
  }

  beforeDestroy () {
    document.removeEventListener('keydown', this.handleEscapePress)
  }
}
</script>

<style scoped>
.small-font {
    font-size: 0.8em;
}

.no-padding {
    padding: 0px;
}

.no-spool {
    opacity: 0.3;
}

.fixed-area {
    min-height: 420px;
    position: relative;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter,
.fade-leave-to {
    opacity: 0;
}

.overlay-text {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.short-switch {
    padding-top: 0px;
    margin-top: 0px;
    margin-bottom: 2px;
}

.speed-slider-subheader {
    height: auto;
}

._slider-input {
    min-width: 5.2rem;
    max-width: 5.2rem;
    margin-left: 12px;
}

._slider-input >>> .v-input__slot {
    min-height: 1rem !important;
}

._slider-input >>> .v-text-field__slot input {
    padding-top: 4px;
    padding-bottom: 4px;
}

._slider-input >>> .v-input__append-inner {
    margin: auto -5px auto 0 !important;
}

.spoolman-btn {
    width: 160px;
    overflow: hidden;
    font-size: 0.8em;
}
.spoolman-btn .v-icon {
    margin-right: 4px;
}

</style>
