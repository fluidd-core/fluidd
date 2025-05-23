<template>
  <v-container class="unit-container">
    <div class="spool-row">
      <div
        v-for="(g, index) in unitGateRange"
        :key="`gate_${g}`"
        class="gate"
        @click="selectGate(g)"
      >
        <div :class="clipSpoolClass">
          <v-menu
            v-model="gateMenuVisible[g]"
            :disabled="g === gate || !unitDetails(unitIndex).multiGear"
            :close-on-content-click="false"
            transition="slide-y-transition"
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

            <v-list dense>
              <v-subheader class="compact-subheader">
                Gate {{ g }}
              </v-subheader>
              <v-divider />
              <v-list-item>
                <v-btn
                  small
                  style="width: 100%"
                  :disabled="!klippyReady || !canSend"
                  :loading="hasWait($waits.onMmuSelect)"
                  @click="sendGcode(`MMU_SELECT GATE=${g}`, $waits.onMmuSelect)"
                >
                  <v-icon left>
                    $mmuSelectGate
                  </v-icon>
                  {{ $t('app.mmu.btn.select') }}
                </v-btn>
              </v-list-item>
              <v-list-item>
                <v-btn
                  small
                  style="width: 100%"
                  :disabled="!klippyReady || !canSend || ![GATE_UNKNOWN, GATE_EMPTY].includes(gateDetails(g).status)"
                  :loading="hasWait($waits.onMmuPreload)"
                  @click="sendGcode(`MMU_PRELOAD GATE=${g}`, $waits.onMmuPreload)"
                >
                  <v-icon left>
                    $mmuPreload
                  </v-icon>
                  {{ $t('app.mmu.btn.preload') }}
                </v-btn>
              </v-list-item>
              <v-list-item>
                <v-btn
                  small
                  style="width: 100%"
                  :disabled="!klippyReady || !canSend"
                  :loading="hasWait($waits.onMmuEject)"
                  @click="sendGcode(`MMU_EJECT GATE=${g}`, $waits.onMmuEject)"
                >
                  <v-icon left>
                    $mmuEject
                  </v-icon>
                  {{ $t('app.mmu.btn.eject') }}
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
          @error="vendorLogo = 'HappyHare'"
        />
      </div>
      <div class="unit-name">
        {{ unitDisplayName }}
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

  gateMenuVisible: Record<number, boolean> = {}
  gateMenuTimer: ReturnType<typeof setTimeout> | null = null

  vendorLogo = ''

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
    if (firstGate) classes.push('first-gate' + (this.isFirefox() ? '-firefox' : ''))
    if (lastGate) classes.push('last-gate' + (this.isFirefox() ? '-firefox' : ''))
    classes.push(this.$vuetify.theme.dark ? 'gate-status-row-dark-theme' : 'gate-status-row-light-theme')
    return classes
  }

  isFirefox (): boolean {
    return navigator.userAgent.indexOf('Firefox') !== -1
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
      if (
        this.unitDetails(this.unitIndex).multiGear &&
                gate !== this.gate &&
                ![this.FILAMENT_POS_UNLOADED, this.FILAMENT_POS_UNKNOWN].includes(this.filamentPos)
      ) {
        if (this.gateMenuTimer) clearTimeout(this.gateMenuTimer)
        this.gateMenuTimer = setTimeout(() => {
          Object.keys(this.gateMenuVisible).forEach(key => {
            this.$set(this.gateMenuVisible, Number(key), false)
          })
        }, 3000)
        this.$set(this.gateMenuVisible, gate, true)
      } else {
        if (this.gateMenuTimer) clearTimeout(this.gateMenuTimer)
        this.sendGcode('MMU_SELECT GATE=' + gate)
      }
    }
  }

  selectBypass () {
    if (this.editGateMap) {
      this.$emit('select-gate', this.TOOL_GATE_BYPASS)
    } else if (!this.isPrinting) {
      this.sendGcode('MMU_SELECT BYPASS=1')
    }
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
    padding-top: 4px;
    padding-bottom: 8px;
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

.unit-name {
    display: flex;
    align-items: center;
    font-size: 12px;
    white-space: nowrap;
    margin-right: -12px;
    overflow: hidden;
    padding: 0px 0px 4px 0px;
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

.last-gate-firefox {
    border-radius: 0 8px 10px 0px;
    padding-right: 16px;
}

.first-gate-firefox {
    border-radius: 8px 0 0px 10px;
    margin-left: -16px;
    padding-left: 16px;
    margin-right: 16px;
}

.first-gate-firefox.last-gate-firefox {
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
