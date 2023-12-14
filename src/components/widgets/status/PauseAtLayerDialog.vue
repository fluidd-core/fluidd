<template>
  <app-dialog
    v-model="open"
    :title="$t('app.general.label.pause_at_layer')"
    max-width="450"
    :save-button-text="$t('app.general.btn.accept')"
    @save="sendAccept"
  >
    <div class="overflow-y-auto">
      <template v-if="setPauseNextLayerMacro">
        <app-setting :title="$t('app.general.label.pause_at_next_layer')">
          <v-switch
            v-model="pauseNextLayer.enable"
            class="mt-0"
            hide-details
          />
        </app-setting>

        <template v-if="pauseNextLayer.enable">
          <v-divider />

          <app-setting :title="$t('app.general.label.command')">
            <v-combobox
              v-model="pauseNextLayer.call"
              :items="['PAUSE', 'M600']"
              hide-details="auto"
              filled
              dense
            />
          </app-setting>
        </template>
      </template>

      <v-divider v-if="setPauseNextLayerMacro && setPauseAtLayerMacro" />

      <template v-if="setPauseAtLayerMacro">
        <app-setting :title="$t('app.general.label.pause_at_layer_number')">
          <v-switch
            v-model="pauseAtLayer.enable"
            class="mt-0"
            hide-details
          />
        </app-setting>

        <template v-if="pauseAtLayer.enable">
          <v-divider />

          <app-setting :title="$t('app.general.label.layer')">
            <v-text-field
              v-model="pauseAtLayer.layer"
              type="number"
              :rules="[
                $rules.required,
                $rules.numberValid,
                $rules.numberGreaterThan(currentLayer),
                $rules.numberLessThanOrEqual(totalLayers)
              ]"
              hide-details="auto"
              filled
              dense
            />
          </app-setting>

          <v-divider />

          <app-setting :title="$t('app.general.label.command')">
            <v-combobox
              v-model="pauseAtLayer.call"
              :items="['PAUSE', 'M600']"
              hide-details="auto"
              filled
              dense
            />
          </app-setting>
        </template>
      </template>
    </div>
  </app-dialog>
</template>

<script lang="ts">
import StateMixin from '@/mixins/state'
import type { Macro } from '@/store/macros/types'
import { Component, VModel, Mixins } from 'vue-property-decorator'

type PauseNextLayer = {
  enable: boolean,
  call: string
}
type PauseAtLayer = {
  enable: boolean,
  call: string,
  layer: number
}
type PrintStatsMacroVariables = {
  pause_next_layer?: PauseNextLayer
  pause_at_layer?: PauseAtLayer,
}

@Component({})
export default class PauseAtLayerDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  pauseNextLayer: PauseNextLayer = {
    enable: false,
    call: 'PAUSE'
  }

  pauseAtLayer: PauseAtLayer = {
    enable: false,
    call: 'PAUSE',
    layer: 0
  }

  get setPauseNextLayerMacro () : Macro | undefined {
    return this.$store.getters['macros/getMacroByName']('set_pause_next_layer') as Macro | undefined
  }

  get setPauseAtLayerMacro () : Macro | undefined {
    return this.$store.getters['macros/getMacroByName']('set_pause_at_layer') as Macro | undefined
  }

  get setPrintStatsInfoMacro () : Macro | undefined {
    return this.$store.getters['macros/getMacroByName']('set_print_stats_info') as Macro | undefined
  }

  get printStatsMacroVariables () {
    const variables: PrintStatsMacroVariables = this.setPrintStatsInfoMacro?.variables ?? {}

    return variables
  }

  get currentLayer () {
    return this.$store.state.printer.printer.print_stats.info?.current_layer ?? 0
  }

  get totalLayers () {
    return this.$store.state.printer.printer.print_stats.info?.total_layer ?? 0
  }

  sendAccept () {
    const gcodes: string[] = []

    if (this.setPauseNextLayerMacro) {
      if (this.pauseNextLayer.enable) {
        gcodes.push(`SET_PAUSE_NEXT_LAYER ENABLE=1 MACRO="${this.pauseNextLayer.call}"`)
      } else {
        gcodes.push('SET_PAUSE_NEXT_LAYER ENABLE=0')
      }
    }

    if (this.setPauseAtLayerMacro) {
      if (this.pauseAtLayer.enable) {
        gcodes.push(`SET_PAUSE_AT_LAYER ENABLE=1 LAYER=${this.pauseAtLayer.layer} MACRO="${this.pauseAtLayer.call}"`)
      } else {
        gcodes.push('SET_PAUSE_AT_LAYER ENABLE=0')
      }
    }

    this.sendGcode(gcodes.join('\n'))

    this.open = false
  }

  mounted () {
    const { pause_at_layer, pause_next_layer } = this.printStatsMacroVariables

    this.pauseNextLayer = {
      ...this.pauseNextLayer,
      ...pause_next_layer
    }
    this.pauseAtLayer = {
      ...this.pauseAtLayer,
      ...pause_at_layer
    }
  }
}
</script>
