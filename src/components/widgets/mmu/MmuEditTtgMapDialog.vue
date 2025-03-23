<template>
  <app-dialog
    v-model="open"
    width="800"
    title-shadow
    :fullscreen="isMobileViewport"
    :title="$t('app.mmu.title.edit_ttg_map')"
    :save-button-text="file ? $t('app.general.btn.print') : $t('app.mmu.label.save')"
    @save="commit"
    @cancel="close"
  >
    <!-- UPPER SECTION -->
    <v-card-subtitle>
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
            <span v-if="allTools">{{ $t('app.mmu.msg.map_tools') }}</span>
            <span v-else>{{ $t('app.mmu.msg.map_slicer_tools') }}</span>
          </v-col>
          <v-col
            cols="4"
            class="d-flex flex-column align-end no-padding"
          >
            <v-container>
              <v-row class="justify-end pa-0">
                <v-col class="d-flex align-center justify-end no-padding pr-6">
                  <div class="mr-4">
                    {{ $t('app.mmu.label.all_tools') }}
                  </div>
                  <v-switch
                    v-model="allTools"
                    :disabled="allToolsDisabled"
                    hide-details
                    class="short-switch"
                  />
                </v-col>
              </v-row>
              <v-row
                v-if="!allToolsDisabled && macroVarsAutomapStrategy !== 'none'"
                class="justify-end pa-0"
              >
                <v-col class="d-flex align-center justify-end no-padding pr-6">
                  <div class="mr-4">
                    {{ $t('app.mmu.label.skip_automap') }}
                  </div>
                  <v-switch
                    v-model="skipAutomap"
                    :disabled="allToolsDisabled"
                    hide-details
                    class="short-switch"
                  />
                </v-col>
              </v-row>
            </v-container>
          </v-col>
        </v-row>

        <!-- DISPLAY TOOLS -->
        <v-row>
          <v-col :cols="isMobileViewport ? 12 : 9">
            <v-row>
              <template v-for="(g, t) in localTtgMap">
                <v-col
                  v-if="toolMetaData[t].inUse || allTools"
                  :key="t"
                  cols="1"
                  class="no-padding min-width-card"
                >
                  <v-card
                    :class="toolCardClass(t)"
                    @click="selectTool(t)"
                  >
                    <v-card-title class="justify-center">
                      {{ toolText(t) }}
                    </v-card-title>
                    <v-card-text>
                      <v-container
                        fluid
                        pa-2
                      >
                        <v-row>
                          <v-col
                            cols="5"
                            class="no-padding"
                          >
                            <mmu-spool
                              :gate-index="g"
                              :show-percent="false"
                              width="100%"
                            />
                          </v-col>
                          <v-col
                            cols="7"
                            class="d-flex flex-column no-padding pr-1 pt-2"
                          >
                            <div class="small-font text-center">
                              Gate
                            </div>
                            <div class="text-center">
                              #{{ g }}
                            </div>
                            <v-spacer />
                            <v-divider />
                            <div class="text-start no-break">
                              <strong>&infin;&nbsp;</strong>
                              <span class="tiny-font">{{ esSpoolsText(g) }}</span>
                            </div>
                          </v-col>
                        </v-row>
                      </v-container>
                    </v-card-text>
                  </v-card>
                </v-col>
              </template>
            </v-row>
          </v-col>

          <!-- TTG MAP -->
          <v-col
            :cols="isMobileViewport ? 6 : 3"
            class="d-flex flex-column align-center justify-center pa-0 min-width-map"
          >
            <mmu-ttg-map
              :map="localTtgMap"
              :groups="localEndlessSpoolGroups"
              :selected-tool="selectedTool"
              :selected-gate="selectedGate"
            />
            <v-btn
              small
              color="secondary"
              class="small-font"
              :loading="hasWait($waits.onMmuTtgMap)"
              @click="resetTtgMap()"
            >
              {{ $t('app.mmu.label.reset') }}
            </v-btn>
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
            v-if="selectedTool === -1"
            class="overlay-text"
          >
            {{ $t('app.mmu.msg.select_tool') }}
          </div>
        </transition>

        <transition name="fade">
          <v-container v-if="selectedTool !== -1">
            <v-row>
              <!-- SLICER TOOL -->
              <v-col
                cols="4"
                class="d-flex align-center justify-center"
              >
                <v-list-item v-if="selectedTool !== -1">
                  <v-list-item-content
                    v-if="
                      toolMetaData[selectedTool] && referencedTools.includes(selectedTool)
                    "
                  >
                    <div class="text-overline">
                      {{ $t('app.mmu.label.slicer_expects') }}
                    </div>
                    <v-divider />
                    <div class="mb-2 mt-2">
                      <span
                        class="tool-swatch mr-1"
                        :style="'background-color: ' + toolColor"
                      />
                      {{ toolText(selectedTool) }}
                    </div>
                    <v-list-item-title class="wrap-tool-name">
                      {{ toolNameText }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ toolDetailsText }}
                    </v-list-item-subtitle>
                    <div style="height: 100px">
                      <v-alert
                        v-if="alerts"
                        text
                        dense
                        color="warning"
                        class="mt-4 mx-0 pl-2 pr-2 alert-text"
                      >
                        <div
                          v-for="alert in alerts"
                          :key="alert"
                        >
                          {{ alert }}
                        </div>
                      </v-alert>
                    </div>
                  </v-list-item-content>
                  <v-list-item-content v-else>
                    <v-list-item-subtitle class="wrap-tool-name">
                      <div
                        v-if="toolMetaData[selectedTool] || referencedTools.length > 0"
                      >
                        {{
                          $t('app.mmu.msg.tool_not_used', {
                            tool: toolText(selectedTool),
                          })
                        }}
                      </div>
                      <div v-else>
                        {{
                          $t('app.mmu.msg.no_slicer_info', {
                            tool: toolText(selectedTool),
                          })
                        }}
                      </div>
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-col>

              <v-col
                cols="1"
                class="d-flex justify-start align-center"
              >
                <div
                  v-if="selectedTool !== -1"
                  class="triangle"
                />
              </v-col>

              <!-- GATE CHOOSER -->
              <v-col
                cols="7"
                class="drop-down-table"
              >
                <v-data-table
                  :headers="gateTableHeaders"
                  :items="gateItems"
                  item-key="index"
                  sort-by="index"
                  :items-per-page="-1"
                  hide-default-footer
                >
                  <template #no-data>
                    <div class="text-center">
                      {{ $t('app.mmu.msg.no_gate_gate') }}
                    </div>
                  </template>

                  <template #item="{ item }">
                    <mmu-gate-dialog-row
                      :key="item.index"
                      :ref="`row-${item.index}`"
                      :details="item"
                      :selected-es-group="localEndlessSpoolGroups[selectedGate] ?? null"
                      :selected-gate="selectedGate ?? null"
                      @select-gate="selectGate"
                      @select-es="selectEndlessSpool"
                    />
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-container>
        </transition>
      </div>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import StateMixin from '@/mixins/state'
import MmuMixin from '@/mixins/mmu'
import { SocketActions } from '@/api/socketActions'
import type { AppFileWithMeta } from '@/store/files/types'
import type { SlicerToolDetails, MmuGateDetails } from '@/types'
import Vue from 'vue'
import MmuSpool from '@/components/widgets/mmu/MmuSpool.vue'
import MmuTtgMap from '@/components/widgets/mmu/MmuTtgMap.vue'
import MmuGateDialogRow from '@/components/widgets/mmu/MmuGateDialogRow.vue'

@Component({
  components: { MmuSpool, MmuTtgMap, MmuGateDialogRow },
})
export default class MmuEditTtgMapDialog extends Mixins(BrowserMixin, StateMixin, MmuMixin) {
  private localTtgMap: number[] = []
  private localEndlessSpoolGroups: number[] = []
  private localGateMap: MmuGateDetails[] = []
  private toolMetaData: SlicerToolDetails[] = []
  private referencedTools: number[] = []
  private allTools: boolean = true
  private allToolsDisabled: boolean = false
  private skipAutomap: boolean = false

  private selectedTool: number = -1
  private selectedGate: number = -1

  get open (): boolean {
    return this.$typedState.mmu.dialog.show
  }

  set open (val: boolean) {
    this.$typedCommit('mmu/setDialogState', {
      ...this.$typedState.spoolman.dialog,
      show: val
    })
  }

  get filename (): string | undefined {
    return this.$typedState.mmu.dialog.filename
  }

  get file (): AppFileWithMeta | null {
    return (
      this.filename != null &&
      this.$typedGetters['files/getFile']('gcodes', this.filename)
    ) || null
  }

  @Watch('ttgMap')
  onTtgMapChanged (): void {
    this.initialize()
  }

  @Watch('endlessSpoolGroups')
  onEndlessSpoolGroupsChanged (): void {
    this.initialize()
  }

  @Watch('open')
  onOpenChanged (): void {
    this.initialize()
  }

  private initialize () {
    if (this.open) {
      this.localTtgMap = Array.from(this.ttgMap)
      this.localEndlessSpoolGroups = Array.from(this.endlessSpoolGroups)
      this.localGateMap = Array.from(this.gateMap)

      // Form tool meta data either from gcode file if starting print or from Happy Hare
      // slicer tool map after print start (should be the same info!)

      this.toolMetaData = []
      this.referencedTools = []
      for (let i = 0; i < this.ttgMap.length; i++) {
        this.toolMetaData[i] = this.toolDetails(i, this.file)
        if (this.toolMetaData[i]?.inUse) this.referencedTools.push(i)
      }

      if (this.referencedTools.length > 0) {
        this.allTools = false
        this.allToolsDisabled = false
      } else {
        this.allTools = true
        this.allToolsDisabled = true
      }
      this.selectedTool = -1
      this.selectedGate = -1
    }
    this.skipAutomap = false
  }

  @Watch('allTools')
  onAllToolsChanged (): void {
    this.selectedTool = -1
    this.selectedGate = -1
  }

  private toolCardClass (tool: number): string[] {
    const classes = []
    classes.push('no-padding')
    classes.push(this.$vuetify.theme.dark ? 'card-dark-theme' : 'card-light-theme')
    if (this.selectedTool === tool) classes.push('selected-card')
    if (this.selectedTool !== tool && this.selectedTool >= 0) classes.push('disabled-card')
    return classes
  }

  get gateItems () {
    if (this.selectedTool < 0) return []
    return this.gateMap
  }

  get gateTableHeaders () {
    if (this.selectedTool < 0) return []
    return [
      {
        text: this.$t('app.mmu.label.gate'),
        align: 'start',
        value: 'index',
        sortable: false,
      },
      {
        text: '',
        align: 'center',
        sortable: false,
      },
      {
        text: this.$t('app.mmu.label.filament_info'),
        align: 'start',
        sortable: false,
      },
      {
        text: this.$t('app.mmu.label.endless_spool'),
        align: 'center',
        sortable: false,
      },
    ]
  }

  private selectTool (tool: number) {
    if (this.selectedTool === tool) {
      this.selectedTool = -1
      this.selectedGate = -1
    } else {
      this.selectedTool = tool
      this.selectedGate = this.localTtgMap[tool]
      this.scrollToGateRow(this.selectedGate)
    }
  }

  private selectGate (gate: number) {
    this.selectedGate = gate
    Vue.set(this.localTtgMap, this.selectedTool, gate)
  }

  private selectEndlessSpool (gate: number) {
    if (this.selectedGate !== -1 && this.selectedGate !== gate) {
      // Adjust EndlessSpool groups if gate already selected
      let group = this.localEndlessSpoolGroups[this.selectedGate]
      if (this.localEndlessSpoolGroups[gate] === group) {
        // Unselect (restore original group number if possible)
        let newGroup = this.endlessSpoolGroups[gate]
        if (newGroup === group) {
          const usedGroups = new Set(this.localEndlessSpoolGroups)
          let i = 0
          while (usedGroups.has(i)) i++
          newGroup = i
        }
        group = newGroup
      }
      Vue.set(this.localEndlessSpoolGroups, gate, group)
      this.localGateMap[gate].endlessSpoolGroup = group
    }
  }

  private scrollToGateRow (gate: number) {
    this.$nextTick(() => {
      const targetRow = this.$refs[`row-${gate}`] as Vue | undefined
      if (targetRow && 'scrollIntoView' in targetRow.$el) {
        targetRow.$el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    })
  }

  private handleEscapePress (event: KeyboardEvent) {
    if (event.key === 'Escape' || event.keyCode === 27) {
      this.selectedTool = -1
      this.selectedGate = -1
    }
  }

  private esSpoolsText (gate: number): string {
    const esGates: number[] = []
    const group = this.localEndlessSpoolGroups[gate]
    this.localEndlessSpoolGroups.forEach((g, index) => {
      const cIndex = (gate + index) % this.localEndlessSpoolGroups.length
      if (this.localEndlessSpoolGroups[cIndex] === group && cIndex !== gate) {
        esGates.push(cIndex)
      }
    })
    if (esGates.length) return esGates.join(',')
    return 'none'
  }

  // Slicer tool...

  get toolNameText (): string {
    return this.toolMetaData[this.selectedTool].name
  }

  get toolDetailsText (): string {
    const toolMaterialText = this.toolMetaData[this.selectedTool].material
    let toolTempText = null
    if (this.toolMetaData[this.selectedTool].temp >= 0) {
      toolTempText = this.toolMetaData[this.selectedTool].temp + '\u00B0' + 'C'
    }
    return [toolMaterialText, toolTempText].filter((v) => v !== null).join(' | ')
  }

  get toolColor (): string {
    return this.toolMetaData[this.selectedTool].color
  }

  get alerts (): string[] | null {
    const maxTempDiff = 5
    const maxColorDiff = 16000
    const alerts = []

    if (
      this.toolMetaData[this.selectedTool].material.toUpperCase() !==
            this.gateDetails(this.selectedGate).material.toUpperCase()
    ) {
      alerts.push('\u2022 ' + this.$t('app.mmu.msg.material'))
    }

    if (
      Math.abs(this.toolMetaData[this.selectedTool].temp - this.gateDetails(this.selectedGate).temperature) >
            maxTempDiff
    ) {
      alerts.push('\u2022 ' + this.$t('app.mmu.msg.temperature'))
    }

    const rgb1 = this.hexToRgb(this.fromColorString(this.toolMetaData[this.selectedTool].color))
    const rgb2 = this.hexToRgb(this.fromColorString(this.gateDetails(this.selectedGate).color))
    const colorDifference = this.weightedEuclideanDistance(rgb1, rgb2)
    if (colorDifference > maxColorDiff) {
      alerts.push('\u2022 ' + this.$t('app.mmu.msg.color'))
    }

    if (alerts.length > 0) {
      alerts.unshift(this.$t('app.mmu.msg.mismatch'))
      return alerts.map(alert => alert.toString())
    }
    return null
  }

  private hexToRgb (hex: string): number[] {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return [r, g, b]
  }

  private weightedEuclideanDistance (
    color1: number[],
    color2: number[],
    weights: number[] = [0.3, 0.59, 0.11]
  ): number {
    return color1.reduce((acc, curr, i) => acc + weights[i] * (curr - color2[i]) ** 2, 0)
  }

  // Actions...

  async resetTtgMap () {
    const result = await this.$confirm(
      this.$tc('app.mmu.msg.reset_ttg_map_confirmation', 1),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) this.executeResetTtgMap()
  }

  executeResetTtgMap () {
    this.initialize()
    this.sendGcode('MMU_TTG_MAP RESET=1')
  }

  close () {
    this.selectedTool = -1
    this.selectedGate = -1
    this.open = false
  }

  async commit () {
    const mapStr = this.localTtgMap.join(',')
    const esGrpStr = this.localEndlessSpoolGroups.join(',')
    let cmd = 'MMU_SLICER_TOOL_MAP SKIP_AUTOMAP=' + (this.skipAutomap ? 1 : 0)
    this.sendGcode(cmd)
    cmd = `MMU_TTG_MAP MAP="${mapStr}" QUIET=1`
    this.sendGcode(cmd)
    cmd = `MMU_ENDLESS_SPOOL GROUPS="${esGrpStr}" QUIET=1`
    this.sendGcode(cmd)

    // Mimick Fluidd workflow: If called prior to print, start print now
    if (this.file) {
      await SocketActions.printerPrintStart(this.file.filename)
      if (this.$route.name !== 'home') {
        this.$router.push({ name: 'home' })
      }
    }
    this.close()
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
.card-light-theme {
    background: #f0f0f0;
}

.card-dark-theme {
    background: #2c2c2c;
}

.selected-card {
    background: #595959 !important;
}

.disabled-card {
    opacity: 0.5;
}

.small-font {
    font-size: 0.8em;
}

.tiny-font {
    font-size: 0.8em;
    line-height: 0.8em;
}

.no-break {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.no-padding {
    padding: 3px;
}

.min-width-card {
    min-width: 96px;
}

.min-width-map {
    min-width: 180px;
}

.no-padding .v-card__title,
.no-padding .v-card__subtitle,
.no-padding .v-card__text {
    padding: 0px;
    line-height: 1em;
}

.short-switch {
    padding-top: 0px;
    margin-top: 0px;
    margin-bottom: 2px;
}

.scrollable-table {
    overflow-y: auto;
}

.fixed-area {
    height: 300px;
    position: relative;
}

.drop-down-table {
    height: 300px;
    overflow-y: auto;
}

.wrap-tool-name {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
}

.tool-swatch {
    display: inline-block;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 1px solid lightgray;
    vertical-align: middle;
}

.triangle {
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 40px 0 40px 15px;
    border-color: transparent transparent transparent #595959;
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

.alert-text {
    font-size: 1em;
}
</style>
