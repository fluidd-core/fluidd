<template>
  <app-btn-group class="d-inline">
    <app-btn
      v-if="!printerPaused"
      :loading="hasWait($waits.onPrintPause)"
      :disabled="hasWait([$waits.onPrintCancel, $waits.onPrintResume, $waits.onPrintPause])"
      small
      class="ml-1"
      @click="$emit('pause')"
    >
      <v-icon
        small
        left
      >
        $pause
      </v-icon>
      <span>{{ $t('app.general.btn.pause') }}</span>
    </app-btn>

    <app-btn
      v-else
      :loading="hasWait($waits.onPrintResume)"
      :disabled="hasWait([$waits.onPrintCancel, $waits.onPrintResume, $waits.onPrintPause])"
      small
      class="ml-1"
      @click="$emit('resume')"
    >
      <v-icon
        small
        left
      >
        $resume
      </v-icon>
      <span>{{ $t('app.general.btn.resume') }}</span>
    </app-btn>

    <v-menu
      v-if="hasLayersFromPrintStats && hasPrintAtLayerMacros"
      left
      offset-y
      transition="slide-y-transition"
    >
      <template #activator="{ on, attrs, value }">
        <app-btn
          v-bind="attrs"
          small
          class="px-0 mr-1"
          min-width="24"
          v-on="on"
        >
          <v-icon
            small
            :class="{ 'rotate-180': value }"
          >
            $chevronDown
          </v-icon>
        </app-btn>
      </template>
      <v-list dense>
        <v-list-item @click="$emit('pauseAtLayer')">
          <v-list-item-title>
            <v-icon
              small
              left
            >
              $pause
            </v-icon>
            {{ $t('app.general.label.pause_at_layer') }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </app-btn-group>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Macro } from '@/store/macros/types'

@Component({})
export default class PauseResumeBtn extends Mixins(StateMixin) {
  get hasLayersFromPrintStats () {
    const printStatsInfo = this.$store.state.printer.printer.print_stats.info
    const layersFromPrintStats = printStatsInfo?.total_layer
    const layerFromPrintStats = printStatsInfo?.current_layer

    return (
      typeof (layersFromPrintStats) === 'number' &&
      typeof (layerFromPrintStats) === 'number'
    )
  }

  get hasPrintAtLayerMacros () {
    const macros = this.$store.getters['macros/getMacros'] as Macro[]

    const hasPauseAtLayerMacros = macros
      .some(macro => ['set_pause_at_layer', 'set_pause_next_layer'].includes(macro.name))

    if (!hasPauseAtLayerMacros) {
      return false
    }

    const setPrintStatsInfoMacro = macros
      .find(macro => macro.name === 'set_print_stats_info')

    const setPrintStatsInfoVariables = setPrintStatsInfoMacro?.variables ?? {}

    return (
      'pause_next_layer' in setPrintStatsInfoVariables &&
      'pause_at_layer' in setPrintStatsInfoVariables
    )
  }
}
</script>
