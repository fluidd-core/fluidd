<template>
  <app-dialog
    v-model="open"
    :title="$t('app.general.label.pause_at_layer')"
    max-width="450"
    :save-button-text="$t('app.general.btn.accept')"
    @save="sendAccept"
  >
    <v-card-text class="pa-0">
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
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import StateMixin from '@/mixins/state'
import type { Macro } from '@/store/macros/types'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'
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
    return this.$typedGetters['macros/getMacroByName']('SET_PAUSE_NEXT_LAYER')
  }

  get setPauseAtLayerMacro () : Macro | undefined {
    return this.$typedGetters['macros/getMacroByName']('SET_PAUSE_AT_LAYER')
  }

  get setPrintStatsInfoMacro () : Macro | undefined {
    return this.$typedGetters['macros/getMacroByName']('SET_PRINT_STATS_INFO')
  }

  get printStatsMacroVariables () {
    const variables: PrintStatsMacroVariables = this.setPrintStatsInfoMacro?.variables ?? {}

    return variables
  }

  get currentLayer (): number {
    return this.$typedState.printer.printer.print_stats?.info?.current_layer ?? 0
  }

  get totalLayers (): number {
    return this.$typedState.printer.printer.print_stats?.info?.total_layer ?? 0
  }

  sendAccept () {
    const gcodes: string[] = []

    if (this.setPauseNextLayerMacro) {
      if (this.pauseNextLayer.enable) {
        gcodes.push(`SET_PAUSE_NEXT_LAYER ENABLE=1 MACRO=${encodeGcodeParamValue(this.pauseNextLayer.call)}`)
      } else {
        gcodes.push('SET_PAUSE_NEXT_LAYER ENABLE=0')
      }
    }

    if (this.setPauseAtLayerMacro) {
      if (this.pauseAtLayer.enable) {
        gcodes.push(`SET_PAUSE_AT_LAYER ENABLE=1 LAYER=${this.pauseAtLayer.layer} MACRO=${encodeGcodeParamValue(this.pauseAtLayer.call)}`)
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
