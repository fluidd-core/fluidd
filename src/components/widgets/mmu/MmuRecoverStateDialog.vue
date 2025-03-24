<template>
  <app-dialog
    v-model="open"
    width="600"
    title-shadow
    :fullscreen="isMobileViewport"
    :title="$t('app.mmu.title.recover_state')"
    :save-button-text="$t('app.mmu.label.ok')"
    @save="commit"
  >
    <v-card-subtitle>
      {{ $t('app.mmu.msg.recover_intro') }}
    </v-card-subtitle>

    <v-card-text>
      <v-row class="fixed-height">
        <v-col class="col-1" />
        <v-col class="col-5 d-flex justify-center">
          <v-row class="d-flex flex-row">
            <v-col class="d-flex justify-center flex-column">
              <span class="settings-row-title">Tool</span>
              <span class="settings-row-subtitle">
                {{ $t('app.mmu.msg.set_tool') }}
              </span>
            </v-col>
          </v-row>
        </v-col>
        <v-col class="col-5 d-flex justify-end align-center">
          <v-select
            v-model="selectedTool"
            :items="toolsList"
            :error-messages="toolErrorMessage"
            outlined
            dense
          />
        </v-col>
      </v-row>
      <v-divider class="my-2" />
      <v-row class="fixed-height">
        <v-col class="col-1" />
        <v-col class="col-5 d-flex justify-center">
          <v-row class="d-flex flex-row">
            <v-col class="d-flex justify-center flex-column">
              <span class="settings-row-title">Gate</span>
              <span class="settings-row-subtitle">
                {{ $t('app.mmu.msg.set_gate') }}
              </span>
            </v-col>
          </v-row>
        </v-col>
        <v-col class="col-5 d-flex justify-end align-center">
          <v-select
            v-model="selectedGate"
            :items="gatesList"
            :error-messages="gateErrorMessage"
            outlined
            dense
          />
        </v-col>
      </v-row>
      <v-divider class="my-2" />
      <v-row class="fixed-height">
        <v-col class="col-1" />
        <v-col class="col-5 d-flex justify-center">
          <v-row class="d-flex flex-row">
            <v-col class="d-flex justify-center flex-column">
              <span class="settings-row-title">Filament Position</span>
              <span class="settings-row-subtitle">
                {{ $t('app.mmu.msg.filament_loaded') }}
              </span>
            </v-col>
          </v-row>
        </v-col>
        <v-col class="col-5 d-flex justify-end align-center">
          <v-select
            v-model="selectedPos"
            :items="posList"
            :error-messages="posErrorMessage"
            outlined
            dense
          />
        </v-col>
      </v-row>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins, VModel, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import StateMixin from '@/mixins/state'
import MmuMixin from '@/mixins/mmu'
import type { MmuUnitKey } from '@/store/printer/types'
import isKeyOf from '@/util/is-key-of'

@Component({})
export default class MmuRecoverStateDialog extends Mixins(BrowserMixin, StateMixin, MmuMixin) {
  @VModel({ required: true })
  open!: boolean

  private localGate: number = -1
  private localTool: number = -1
  private localFilamentPos: number = -1

  @Watch('open')
  onShowDialogChanged (newValue: boolean): void {
    if (newValue) {
      this.localGate = this.gate
      this.localTool = this.tool
      this.localFilamentPos = this.filamentPos
    }
  }

  get selectedTool (): string {
    if (this.localTool === this.TOOL_GATE_UNKNOWN) {
      return 'Unknown'
    } else if (this.localTool === this.TOOL_GATE_BYPASS) {
      return 'Bypass'
    }
    return `T${this.localTool}`
  }

  set selectedTool (newTool: string) {
    const index = this.toolsList.findIndex((item) => item === newTool)
    if (index === this.numGates) {
      this.localTool = this.TOOL_GATE_BYPASS
    } else {
      this.localTool = index
    }
  }

  get toolsList (): string[] {
    const tools: string[] = []
    for (let i = 0; i < this.numGates; i++) {
      tools.push(`T${i}`)
    }
    if (this.hasBypass) tools.push('Bypass')
    return tools
  }

  get toolErrorMessage () {
    if (this.localTool === this.TOOL_GATE_UNKNOWN) {
      return this.$t('app.mmu.msg.no_tool')
    } else if (this.localGate === this.TOOL_GATE_BYPASS && this.localTool !== this.TOOL_GATE_BYPASS) {
      return this.$t('app.mmu.msg.gate_bypass')
    }
    return ''
  }

  get selectedGate (): string {
    if (this.localGate === this.TOOL_GATE_UNKNOWN) {
      return 'Unknown'
    } else if (this.localGate === this.TOOL_GATE_BYPASS) {
      return 'Bypass'
    }
    return `${this.gateIndexText(this.localGate)}`
  }

  set selectedGate (newGate: string) {
    const index = this.gatesList.findIndex((item) => item === newGate)
    if (index === this.numGates) {
      this.localGate = this.TOOL_GATE_BYPASS
    } else {
      this.localGate = index
    }
  }

  get gatesList (): string[] {
    const gates: string[] = []
    for (let gate = 0; gate < this.numGates; gate++) {
      gates.push(this.gateIndexText(gate))
    }
    if (this.hasBypass) gates.push('Bypass')
    return gates
  }

  get gateErrorMessage () {
    if (this.localGate === this.TOOL_GATE_UNKNOWN) {
      return this.$t('app.mmu.msg.no_gate')
    } else if (this.localTool === this.TOOL_GATE_BYPASS && this.localGate !== this.TOOL_GATE_BYPASS) {
      return this.$t('app.mmu.msg.tool_bypass')
    } else if (this.localGate >= 0 && this.ttgMap[this.localGate] !== this.localTool) {
      const msg = this.$t('app.mmu.msg.remap', { tool: `T${this.localTool}` })
      return `${this.$t('app.mmu.msg.warning_prefix')} ${msg}`
    }
    return ''
  }

  private gateIndexText (gateIndex: number): string {
    const mmuMachine = this.$typedState.printer.printer?.mmu_machine

    if (mmuMachine != null && mmuMachine.num_units > 1) {
      for (let i = 0; i < mmuMachine.num_units; i++) {
        const unitRef = `unit_${i}` as MmuUnitKey

        if (isKeyOf(unitRef, mmuMachine)) {
          const unit = mmuMachine[unitRef]

          if (
            i > 0 &&
            unit != null &&
            gateIndex >= unit.first_gate &&
            gateIndex < unit.first_gate + unit.num_gates
          ) {
            return `${gateIndex} (unit #${i + 1})`
          }
        }
      }
    }

    return `${gateIndex}`
  }

  get selectedPos (): string {
    if (this.localFilamentPos === this.FILAMENT_POS_UNLOADED) {
      return 'UNLOADED'
    } else if (this.localFilamentPos === this.FILAMENT_POS_LOADED) {
      return 'LOADED'
    }
    return 'UNKNOWN'
  }

  set selectedPos (newPos: string) {
    if (newPos === 'UNLOADED') {
      this.localFilamentPos = this.FILAMENT_POS_UNLOADED
    } else if (newPos === 'LOADED') {
      this.localFilamentPos = this.FILAMENT_POS_LOADED
    } else {
      this.localFilamentPos = this.FILAMENT_POS_UNKNOWN
    }
  }

  get posList (): string[] {
    return ['UNKNOWN', 'UNLOADED', 'LOADED']
  }

  get posErrorMessage () {
    if (this.localFilamentPos === this.FILAMENT_POS_UNKNOWN) {
      return `${this.$t('app.mmu.msg.warning_prefix')} ${this.$t('app.mmu.msg.no_position')}`
    }
    return ''
  }

  get okDisabled (): boolean {
    const tError =
            this.toolErrorMessage !== '' &&
            !this.toolErrorMessage.toString().startsWith(this.$t('app.mmu.msg.warning_prefix').toString())
    const gError =
            this.gateErrorMessage !== '' &&
            !this.gateErrorMessage.toString().startsWith(this.$t('app.mmu.msg.warning_prefix').toString())
    const pError =
            this.posErrorMessage !== '' &&
            !this.posErrorMessage.toString().startsWith(this.$t('app.mmu.msg.warning_prefix').toString())
    return tError || gError || pError
  }

  commit () {
    let cmd = `MMU_RECOVER TOOL=${this.localTool} GATE=${this.localGate}`
    if (this.localFilamentPos === this.FILAMENT_POS_UNLOADED) {
      cmd += ' LOADED=0'
    } else if (this.localFilamentPos === this.FILAMENT_POS_LOADED) {
      cmd += ' LOADED=1'
    }
    this.sendGcode(cmd)
    this.open = false
  }
}
</script>

<style scoped>
.settings-row-title {
    display: block;
    width: 100%;
    font-weight: bold;
}

.settings-row-subtitle {
    display: block;
    font-size: 0.8em;
    line-height: 1.3;
    margin-top: 3px;
}

.fixed-height {
    min-height: 100px;
}
</style>
