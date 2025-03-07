<template>
  <app-btn-group
    divided
    class="me-1 my-1"
  >
    <app-btn
      v-if="!printerPaused"
      :loading="hasWait($waits.onPrintPause)"
      :disabled="hasWait([$waits.onPrintCancel, $waits.onPrintResume, $waits.onPrintPause])"
      small
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
          class="px-0"
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
          <v-list-item-icon>
            <v-icon>
              $pause
            </v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t('app.general.label.pause_at_layer') }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>
  </app-btn-group>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { Macro } from '@/store/macros/types'

@Component({})
export default class PauseResumeBtn extends Mixins(StateMixin) {
  get hasLayersFromPrintStats () {
    const { total_layer, current_layer } = this.$store.state.printer.printer.print_stats?.info ?? {}

    return (
      typeof (total_layer) === 'number' &&
      typeof (current_layer) === 'number'
    )
  }

  get hasPauseAtLayerMacros () {
    const macro: Macro | undefined = this.$store.getters['macros/getMacroByName'](
      'SET_PAUSE_NEXT_LAYER',
      'SET_PAUSE_AT_LAYER'
    )

    return macro != null
  }

  get setPrintStatsInfoMacro (): Macro | undefined {
    return this.$store.getters['macros/getMacroByName']('SET_PRINT_STATS_INFO')
  }

  get hasPrintAtLayerMacros () {
    if (!this.hasPauseAtLayerMacros) {
      return false
    }

    const setPrintStatsInfoVariables = this.setPrintStatsInfoMacro?.variables ?? {}

    return (
      'pause_next_layer' in setPrintStatsInfoVariables &&
      'pause_at_layer' in setPrintStatsInfoVariables
    )
  }
}
</script>
