<template>
  <v-container class="unit-container">
    <div class="spool-row">
      <div
        v-for="(g, index) in displayGates"
        :key="`gate_${g}`"
        class="gate"
        :class="{ 'gate--menu': showContextMenu }"
        @click="handleClickGate(g, $event)"
        @contextmenu.prevent
      >
        <div
          class="clip-spool"
          :style="{ 'max-height': `${clipHeight}px` }"
        >
          <v-menu
            v-model="gateMenuVisible[g]"
            :position-x="menuX"
            :position-y="menuY"
            :close-on-content-click="false"
            :open-on-click="false"
            transition="slide-y-transition"
            absolute
            offset-y
          >
            <template #activator="{ attrs: menuAttrs }">
              <v-tooltip
                top
                :open-delay="500"
                :disabled="!showDetails"
                content-class="spool-tooltip"
              >
                <template #activator="{ on: tooltipOn, attrs: tooltipAttrs }">
                  <div
                    v-bind="{ ...menuAttrs, ...tooltipAttrs }"
                    v-on="{ ...tooltipOn }"
                  >
                    <mmu-spool
                      :width="$filters.getPixelsString(spoolWidth)"
                      :class="spoolClass(g)"
                      :gate-index="g"
                      :edit-gate-map="editGateMap"
                      :edit-gate-selected="editGateSelected"
                    />
                  </div>
                </template>

                <div class="spool-tooltip">
                  <div
                    v-if="tooltipTitle(g)"
                    class="d-block font-weight-bold"
                  >
                    {{ tooltipTitle(g) }}
                  </div>
                  <div>{{ tooltipText(g) }}</div>
                </div>
              </v-tooltip>
            </template>

            <v-list
              dense
              @mouseleave="closeContextMenu"
            >
              <v-subheader class="compact-subheader d-block text-subtitle-2 text-center mb-0 h-auto pb-2">
                {{ contextMenuHeader(g) }}
              </v-subheader>
              <v-divider />
              <v-list-item
                v-for="(item, i) in contextMenuItems(g)"
                :key="i"
              >
                <v-btn
                  small
                  style="width: 100%"
                  :disabled="isItemDisabled(item, g)"
                  :loading="item.wait && hasWait(item.wait)"
                  @click="runMenuItem(item, g)"
                >
                  <v-icon left>
                    {{ item.icon }}
                  </v-icon>
                  {{ item.label }}
                </v-btn>
              </v-list-item>
            </v-list>
          </v-menu>

          <div
            v-if="isSelectedGate(g)"
            style="position: absolute; bottom: 0%; left: 0%; width: 100%; height: auto; background: none;"
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 80 60"
            >
              <defs>
                <clipPath id="clip-half">
                  <rect
                    x="0"
                    y="0"
                    width="80"
                    height="60"
                  />
                </clipPath>
                <radialGradient
                  id="spotlight"
                  cx="50%"
                  cy="70%"
                  r="50%"
                  fx="50%"
                  fy="100%"
                >
                  <stop
                    offset="0%"
                    style="stop-color:rgba(255, 255, 255, 0.9); stop-opacity:1"
                  />
                  <stop
                    offset="100%"
                    style="stop-color:rgba(255, 255, 0, 0); stop-opacity:0"
                  />
                </radialGradient>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="url(#spotlight)"
                clip-path="url(#clip-half)"
              />
            </svg>
          </div>
        </div>

        <mmu-gate-status
          :class="gateStatusClass(index)"
          :gate-index="g"
          :edit-gate-map="editGateMap"
          :edit-gate-selected="editGateSelected"
        />
      </div>
    </div>

    <mmu-unit-footer
      class="pt-0 position-relative"
      :style="footerStyle"
      :show-details="showDetails"
      :show-footer="showFooter"
      :unit-index="unitIndex"
    />
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import StateMixin from '@/mixins/state'
import MmuMixin from '@/mixins/mmu'
import type { MmuGateDetails } from '@/types'
import MmuSpool from '@/components/widgets/mmu/MmuSpool.vue'
import MmuGateStatus from '@/components/widgets/mmu/MmuGateStatus.vue'
import MmuUnitFooter from '@/components/widgets/mmu/MmuUnitFooter.vue'

type MenuDisabled =
  | boolean
  | ((gate: number) => boolean)

type MenuAction =
  | { kind: 'gcode', command: string }
  | { kind: 'call', fn: (gate: number) => void }

type ContextMenuItem = {
  icon: string
  label: string
  wait?: string
  disabled?: MenuDisabled
  action: MenuAction
}

@Component({
  components: { MmuSpool, MmuGateStatus, MmuUnitFooter },
})
export default class MmuUnit extends Mixins(BrowserMixin, StateMixin, MmuMixin) {
  @Prop({ required: false, default: 0 })
  readonly unitIndex!: number

  @Prop({ required: false, default: null })
  readonly editGateMap!: MmuGateDetails[] | null

  @Prop({ required: false, default: -1 })
  readonly editGateSelected!: number

  @Prop({ required: false, default: true })
  readonly showContextMenu!: boolean

  @Prop({ required: false, default: true })
  readonly showDetails!: boolean

  @Prop({ required: false, default: true })
  readonly showFooter!: boolean

  @Prop({ required: false, default: false })
  readonly hideBypass!: boolean

  gateMenuVisible: Record<number, boolean> = {}

  closeTimeout: number | null = null
  menuX = 0
  menuY = 0

  get mmuMachineUnit () {
    return this.unitDetails(this.unitIndex)
  }

  get unitGateRange (): number[] {
    if (this.unitIndex < 0) return []
    return Array.from({ length: this.mmuMachineUnit.numGates }, (v, k) => k + this.mmuMachineUnit.firstGate)
  }

  get displayGates (): number[] {
    const gates = this.unitGateRange
    return this.showBypass ? [...gates, this.TOOL_GATE_BYPASS] : gates
  }

  isSelectedGate (g: number): boolean {
    return (this.editGateMap && this.editGateSelected === g) || (!this.editGateMap && this.gate === g)
  }

  get clipHeight (): number {
    return Math.trunc(this.spoolWidth * 1.6)
  }

  get showBypass () {
    if (this.hideBypass) return false
    if (this.unitIndex < 0) return true

    return this.mmuMachineUnit.hasBypass
  }

  contextMenuHeader (gate: number): string {
    if (gate >= 0) return this.$t('app.mmu.label.gate') + ' ' + gate
    return 'Bypass'
  }

  tooltipTitle (gate: number): string | null {
    const details = this.gateDetails(gate)
    if (details.status === this.GATE_EMPTY) return null

    return details.filamentName
  }

  tooltipText (gate: number): string {
    const details = this.gateDetails(gate)
    if (details.status === this.GATE_EMPTY) {
      return this.$t('app.mmu.tooltip.empty').toString()
    }
    const output = []

    const tempStr = details.temperature > 0
      ? ` | ${details.temperature}°C`
      : ''
    output.push(details.material + tempStr)

    if (details.color && details.color !== '#808182E3') {
      const color = details.color
      output.push(
        this.$t('app.mmu.tooltip.color').toString() +
                    ': ' +
                    color.substring(0, 7) +
                    (color.length > 7 && color.substring(7, 9) !== 'FF' ? color.substring(7, 9) : '')
      )
    }

    if (details.spoolId && details.spoolId > 0) {
      output.push(this.$t('app.mmu.tooltip.spoolid').toString() + ': ' + details.spoolId)
    }

    return output.join('\n')
  }

  gateStatusClass (index: number): string[] {
    const firstGate = (this.unitIndex < 0 || index === 0)
    const lastGate = index === (this.displayGates.length - 1)

    const classes = ['gate-status-row']
    if (firstGate) classes.push('first-gate')
    if (lastGate) classes.push('last-gate')
    classes.push(this.$vuetify.theme.dark ? 'gate-status-row-dark-theme' : 'gate-status-row-light-theme')
    return classes
  }

  spoolClass (gate: number): string[] {
    const classes = []
    if ((this.editGateMap && this.editGateSelected === gate) || (!this.editGateMap && this.gate === gate)) {
      classes.push('highlight-spool')
    } else {
      if (!this.isMobileViewport) classes.push('hover-effect')
      if (this.editGateMap) {
        classes.push('unhighlight-spool')
      }
    }
    return classes
  }

  get footerStyle () {
    const numSpools = this.mmuMachineUnit.numGates + (this.showBypass ? 1 : 0)
    const maxWidth = this.spoolWidth * numSpools + 32
    return { maxWidth: `${maxWidth}px` }
  }

  // Gate context menu handling...

  private isItemDisabled (item: ContextMenuItem, gate: number): boolean {
    if (!this.klippyReady) return true
    if (!item.disabled) return false
    return typeof item.disabled === 'function' ? item.disabled(gate) : item.disabled
  }

  private runMenuItem (item: ContextMenuItem, gate: number) {
    if (this.isItemDisabled(item, gate)) return

    this.closeContextMenu()

    if (item.action.kind === 'gcode') {
      this.sendGcode(`${item.action.command} GATE=${gate}`, item.wait)
    } else {
      item.action.fn(gate)
    }
  }

  contextMenuItems (gate: number): ContextMenuItem[] {
    const items = this.allContextMenuItems
    if (gate < 0) return items.slice(0, 1)
    return items
  }

  get allContextMenuItems (): ContextMenuItem[] {
    const isLoaded = this.filamentPos === this.FILAMENT_POS_LOADED
    const canCrossload = this.unitDetails(this.unitIndex).canCrossload

    const items: ContextMenuItem[] = [
      {
        icon: '$mmuSelectGate',
        label: this.$t('app.mmu.btn.select').toString(),
        action: { kind: 'call', fn: (gate) => this.selectGate(gate) },
        disabled: (gate) => !this.canSend || gate === this.gate || this.isPrinting || isLoaded,
      },
      {
        icon: '$mmuEditGateMap',
        label: this.$t('app.mmu.btn.edit_gate_map').toString(),
        action: { kind: 'call', fn: (gate) => this.editFilament(gate) },
      },
      {
        icon: '$mmuPreload',
        label: this.$t('app.mmu.btn.preload').toString(),
        wait: this.$waits.onMmuPreload,
        action: { kind: 'gcode', command: 'MMU_PRELOAD' },
        disabled: (gate) =>
          !this.canSend ||
            (gate === this.gate && !canCrossload) ||
            (gate === this.gate && isLoaded),
      },
      {
        icon: '$mmuEject',
        label: this.$t('app.mmu.btn.eject').toString(),
        wait: this.$waits.onMmuEject,
        action: { kind: 'gcode', command: 'MMU_EJECT' },
        disabled: (gate) => !this.canSend || (gate !== this.gate && !canCrossload),
      },
      {
        icon: '$mmuChangeTool',
        label: this.$t('app.mmu.btn.change_tool').toString(),
        wait: this.$waits.onMmuChangeTool,
        action: { kind: 'gcode', command: 'MMU_CHANGE_TOOL' },
        disabled: (gate) => !this.canSend || gate === this.gate || this.isPrinting,
      },
    ]

    return items
  }

  private selectGate (gate: number) {
    this.$emit('select-gate', gate)
  }

  private editFilament (gate: number) {
    this.$emit('edit-filament', gate)
  }

  handleClickGate (gate: number, e: MouseEvent) {
    if (this.showContextMenu) return this.openContextMenu(gate, e)
    this.selectGate(gate)
  }

  openContextMenu (gate: number, e: MouseEvent) {
    e.preventDefault()

    this.menuX = e.clientX - 20
    this.menuY = e.clientY - 20

    this.closeContextMenu()

    this.$set(this.gateMenuVisible, gate, true)
    this.closeTimeout = window.setTimeout(() => {
      this.closeContextMenu()
    }, 6000)
  }

  closeContextMenu () {
    this.clearCloseTimeout()
    Object.keys(this.gateMenuVisible).forEach(key => {
      this.$set(this.gateMenuVisible, Number(key), false)
    })
  }

  clearCloseTimeout () {
    if (this.closeTimeout === null) return
    clearTimeout(this.closeTimeout)
    this.closeTimeout = null
  }

  beforeDestroy () {
    this.clearCloseTimeout()
  }
}
</script>

<style scoped>
.unit-container {
    padding: 0;
}

.spool-tooltip {
    max-width: 180px;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.spool-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    padding: 8px 0px 0px 0px;
    gap: 0px;
}

.gate-status-row {
    box-shadow: inset 0px 4px 4px -4px #ffffff80;
    padding-top: 2px;
    padding-bottom: 2px;
    position: relative;
    z-index: 1;
}

.gate-status-row-dark-theme {
    background-image: linear-gradient(to bottom, #3c3c3c 0%, #2c2c2c 100%);
}

.gate-status-row-light-theme {
    background-image: linear-gradient(to bottom, #d0d0d0 0%, #f0f0f0ff 100%);
}

.first-gate {
    border-radius: 8px 0 0 0;
    margin-left: -16px;
    padding-left: 16px;
}

.last-gate {
    border-radius: 0 8px 0 0;
    margin-right: -16px;
    padding-right: 16px;
}

.first-gate.last-gate {
    border-radius: 8px 8px 0 0;
}

.clip-spool {
    position: relative;
    margin-top: 8px;
}

.gate {
    font-size: 0px;
    border-radius: 12px;
    line-height: 1em;
    cursor: pointer;
}

.gate--menu {
    cursor: context-menu;
}

.highlight-spool {
    transform: translateY(-8px);
    opacity: 1;
}

.unhighlight-spool {
    opacity: 0.4;
}

.hover-effect {
    transition: transform 0.2s ease-in-out;
}

.hover-effect:hover {
    transform: translateY(-5px);
    opacity: 1;
}

.v-list--dense .compact-subheader {
    height: auto;
    padding-bottom: 4px;
    display: block;
    text-align: center;
}
</style>
