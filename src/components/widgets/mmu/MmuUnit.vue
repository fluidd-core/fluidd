<template>
  <v-container class="unit-container">
    <div class="spool-row">
      <div
        v-for="(g, index) in unitGateRange"
        :key="`gate_${g}`"
        class="gate"
        @contextmenu.prevent="openContextMenu(g, $event)"
        @click="selectGate(g)"
      >
        <div :class="clipSpoolClass">
          <v-menu
            v-model="gateMenuVisible[g]"
            :disabled="g === gate"
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
                :disabled="editGateMap != null && editGateMap.length > 0"
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
                <div
                  v-for="(line, idx) in gateTooltip(g)"
                  :key="idx"
                  class="spool-tooltip-line"
                  :class="{
                    'spool-tooltip-title': idx === 0
                  }"
                >
                  {{ line }}
                </div>
              </v-tooltip>
            </template>

            <v-list
              dense
              @mouseleave="closeContextMenu"
            >
              <v-subheader class="compact-subheader">
                Gate {{ g }}
              </v-subheader>
              <v-divider />
              <v-list-item
                v-for="(item, i) in contextMenuItems"
                :key="i"
              >
                <v-btn
                  small
                  style="width: 100%"
                  :disabled="!klippyReady || !canSend"
                  :loading="hasWait(item.loading)"
                  @click="contextMenuCommand(item.command, item.loading, g)"
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
            v-if="(editGateMap && editGateSelected === g) || (!editGateMap && gate === g)"
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
      <div
        v-if="showBypass"
        class="gate"
        @contextmenu.prevent="openContextMenu(-2, $event)"
        @click="selectBypass()"
      >
        <div :class="clipSpoolClass">
          <mmu-spool
            :width="$filters.getPixelsString(spoolWidth)"
            :class="spoolClass(TOOL_GATE_BYPASS)"
            :gate-index="TOOL_GATE_BYPASS"
            :edit-gate-map="editGateMap"
            :edit-gate-selected="editGateSelected"
          />
          <div
            v-if="gate === TOOL_GATE_BYPASS"
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
          :class="gateStatusClass(TOOL_GATE_BYPASS)"
          :gate-index="TOOL_GATE_BYPASS"
          :edit-gate-map="editGateMap"
          :edit-gate-selected="editGateSelected"
        />
      </div>
    </div>

    <div
      class="logo-row"
      :style="{
        'max-width': `${logoRowWidth}px`
      }"
    >
      <div
        v-if="showLogos && vendorLogo"
        class="mmu-logo"
        :style="{
          height: `${logoHeight}px`
        }"
      >
        <inline-svg
          :src="vendorLogoUrl"
          height="100%"
          @error="vendorLogo = 'HappyHare'"
        />
      </div>
      <div class="unit-info">
        <div class="unit-name">
          <span v-if="showName">{{ unitDisplayName }}</span>
        </div>
        <div
          v-if="unitClimateInfo"
          class="unit-climate"
        >
          {{ unitClimateInfo }}
        </div>
      </div>
    </div>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import StateMixin from '@/mixins/state'
import MmuMixin from '@/mixins/mmu'
import type { MmuGateDetails } from '@/types'
import type { Sensor } from '@/store/printer/types'
import MmuSpool from '@/components/widgets/mmu/MmuSpool.vue'
import MmuGateStatus from '@/components/widgets/mmu/MmuGateStatus.vue'

@Component({
  components: { MmuSpool, MmuGateStatus },
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

  gateMenuVisible: Record<number, boolean> = {}

  vendorLogo = ''
  closeTimeout: number | null = null
  menuX = 0
  menuY = 0

  @Watch('unit', { immediate: true })
  onUnit (value: number) {
    this.vendorLogo = this.unitDetails(value).vendor
  }

  get vendorLogoUrl (): string | null {
    return `${import.meta.env.BASE_URL}img/mmu/mmu_${this.vendorLogo}.svg`
  }

  get unitDisplayName (): string {
    const name = this.unitDetails(this.unitIndex).name
    return `#${this.unitIndex + 1} ${name}`
  }

  get printerSensors (): Sensor[] {
    return this.$typedGetters['printer/getSensors']
  }

  get unitClimateInfo (): string {
    const unit = this.unitDetails(this.unitIndex)

    // Handle missing or quoted sensor name
    const sensorName = unit.environmentSensor?.replace(/^"(.*)"$/, '$1')
    if (!sensorName) return ''

    const sensor = this.printerSensors.find(s => s.key === sensorName)
    if (!sensor) return ''

    const parts: string[] = []

    if (sensor.temperature != null) {
      parts.push(`${sensor.temperature.toFixed(0)}°C`)
    }

    if (sensor.humidity != null) {
      parts.push(`${sensor.humidity.toFixed(0)}%`)
    }

    return parts.join(' / ')
  }

  get unitGateRange (): number[] {
    const unitDetails = this.unitDetails(this.unitIndex)
    return Array.from({ length: unitDetails.numGates }, (v, k) => k + unitDetails.firstGate)
  }

  get spoolWidth (): number {
    if (this.numGates <= 8) {
      return 56
    } else if (this.numGates <= 16) {
      return 48
    }
    return 40
  }

  get logoRowWidth (): number {
    return this.spoolWidth * (this.unitGateRange.length + (this.showBypass ? 1 : 0))
  }

  get clipSpoolClass (): string[] {
    const classes = ['clip-spool']
    if (this.numGates <= 8) {
      classes.push('clip-large')
    } else if (this.numGates <= 16) {
      classes.push('clip-medium')
    } else {
      classes.push('clip-small')
    }
    return classes
  }

  get logoHeight (): number {
    return this.spoolWidth - 8
  }

  get showName (): boolean {
    return this.$typedState.config.uiSettings.mmu.showName
  }

  get showLogos (): boolean {
    return this.$typedState.config.uiSettings.mmu.showLogos
  }

  get showBypass (): boolean {
    return !this.editGateMap && this.unitDetails(this.unitIndex).hasBypass && this.hasBypass
  }

  gateTooltip (gate: number): string[] {
    const details = this.gateDetails(gate)
    if (details.status === this.GATE_EMPTY) {
      return [this.$t('app.mmu.tooltip.empty').toString()]
    }
    const ret = []

    ret.push(details.filamentName)

    const tempStr = details.temperature > 0
      ? ` | ${details.temperature}°C`
      : ''
    ret.push(details.material + tempStr)

    if (details.color && details.color !== '#808182E3') {
      const color = details.color
      ret.push(
        this.$t('app.mmu.tooltip.color').toString() +
                    ': ' +
                    color.substring(0, 7) +
                    (color.length > 7 && color.substring(7, 9) !== 'FF' ? color.substring(7, 9) : '')
      )
    }

    if (details.spoolId && details.spoolId > 0) {
      ret.push(this.$t('app.mmu.tooltip.spoolid').toString() + ': ' + details.spoolId)
    }

    return ret
  }

  gateStatusClass (gate: number): string[] {
    const firstGate = gate === 0
    const lastGate = (gate === this.unitGateRange.length - 1 && !this.showBypass) || gate === this.TOOL_GATE_BYPASS
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

  selectGate (gate: number) {
    if (this.editGateMap) {
      this.$emit('select-gate', gate)
    } else if (!this.isPrinting) {
      this.sendGcode('MMU_SELECT GATE=' + gate)
    }
  }

  selectBypass () {
    if (this.editGateMap) {
      this.$emit('select-gate', this.TOOL_GATE_BYPASS)
    } else if (!this.isPrinting) {
      this.sendGcode('MMU_SELECT BYPASS=1')
    }
  }

  // Gate context menu handling...

  get contextMenuItems () {
    return [
      {
        icon: '$mmuSelectGate',
        command: 'MMU_SELECT',
        label: this.$t('app.mmu.btn.select').toString(),
        loading: this.$waits.onMmuSelect
      },
      {
        icon: '$mmuPreload',
        command: 'MMU_PRELOAD',
        label: this.$t('app.mmu.btn.preload').toString(),
        loading: this.$waits.onMmuPreload
      },
      {
        icon: '$mmuEject',
        command: 'MMU_EJECT',
        label: this.$t('app.mmu.btn.eject').toString(),
        loading: this.$waits.onMmuEject
      }
    ]
  }

  contextMenuCommand (command: string, loading: string, gate: number) {
    this.sendGcode(`${command} GATE=${gate}`, loading)
  }

  openContextMenu (gate: number, e: MouseEvent) {
    if (gate < 0 || gate === this.gate || !this.showContextMenu) {
      this.closeContextMenu()
      return
    }
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
    line-height: 1.2em;
    padding: 4px 8px;
}

.spool-tooltip-title {
    font-weight: bold;
}

.spool-tooltip-line {
    white-space: nowrap;
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
    padding-top: 2px;
    padding-bottom: 2px;
    position: relative;
    z-index: 1;
}

.logo-row {
    display: flex;
}

.mmu-logo {
    padding: 4px 12px 8px 0px;
    fill: currentColor;
    stroke: currentColor;
    opacity: 0.7;
}

.unit-info {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
}

.unit-name {
    display: flex;
    align-items: flex-end;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    padding: 8px 0 0 0;
}

.unit-climate {
    font-size: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-align: right;
    padding: 0px;
    opacity: 0.8;
}

.gate-status-row-dark-theme {
    box-shadow: inset 0px 4px 4px -4px #ffffff80;
    background-image: linear-gradient(to bottom, #3c3c3c 0%, #2c2c2c 100%);
}

.gate-status-row-light-theme {
    box-shadow: inset 0px 4px 4px -4px #ffffff80;
    background-image: linear-gradient(to bottom, #d0d0d0 0%, #f0f0f0ff 100%);
}

.first-gate {
    border-radius: 8px 0 0px 10px;
    margin-left: -16px;
    padding-left: 16px;
}

.last-gate {
    border-radius: 0 8px 10px 0px;
    margin-right: -16px;
    padding-right: 16px;
}

.first-gate.last-gate {
    border-radius: 8px 8px 10px 10px;
}

.clip-spool {
    position: relative;
    margin-top: 8px;
}

.clip-small {
    max-height: 73px;
}

.clip-medium {
    max-height: 88px;
}

.clip-large {
    max-height: 100px;
}

.gate {
    font-size: 0px;
    border-radius: 12px;
    line-height: 1em;
    cursor: pointer;
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
