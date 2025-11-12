<template>
  <collapsable-card
    :title="$t('app.system_info.label.mcu_information', {mcu: mcu.prettyName})"
    icon="$chip"
  >
    <template #menu>
      <app-btn
        icon
        @click="showMcuInformationDialog"
      >
        <v-icon dense>
          $viewHeadline
        </v-icon>
      </app-btn>
    </template>

    <v-simple-table dense>
      <tbody>
        <tr v-if="mcuConstants.MCU">
          <th>{{ $t('app.system_info.label.micro_controller') }}</th>
          <td>{{ mcuConstants.MCU }}</td>
        </tr>
        <tr v-if="mcuConstants.CLOCK_FREQ">
          <th>{{ $t('app.system_info.label.frequency') }}</th>
          <td>{{ $filters.getReadableFrequencyString(+mcuConstants.CLOCK_FREQ) }}</td>
        </tr>
        <tr v-if="klippyApp.isKalico && mcu.app">
          <th>{{ $t('app.system_info.label.application') }}</th>
          <td>{{ mcu.app }}</td>
        </tr>
        <tr v-if="mcu.mcu_version">
          <th>{{ $t('app.system_info.label.version') }}</th>
          <td>{{ mcu.mcu_version }}</td>
        </tr>
        <tr v-if="klippyApp.isKalico && mcu.non_critical_disconnected != null">
          <th>{{ $t('app.system_info.label.non_critical_connection') }}</th>
          <td>
            <v-chip
              :color="mcu.non_critical_disconnected ? 'error' : 'success'"
              small
              label
            >
              <v-icon
                small
                left
              >
                {{ mcu.non_critical_disconnected ? '$blankCircle' : '$markedCircle' }}
              </v-icon>
              {{
                mcu.non_critical_disconnected
                  ? $t('app.general.label.disconnected')
                  : $t('app.general.label.connected')
              }}
            </v-chip>
          </td>
        </tr>
      </tbody>
    </v-simple-table>

    <mcu-information-dialog
      v-if="mcuInformationDialogOpen"
      v-model="mcuInformationDialogOpen"
      :mcu="mcu"
    />
  </collapsable-card>
</template>

<script lang="ts">
import McuInformationDialog from './McuInformationDialog.vue'
import type { KlippyApp, MCU } from '@/store/printer/types'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
  components: {
    McuInformationDialog
  }
})
export default class PrinterStatsCard extends Vue {
  @Prop({ type: Object, required: true })
  readonly mcu!: MCU

  get klippyApp (): KlippyApp {
    return this.$typedGetters['printer/getKlippyApp']
  }

  get mcuConstants (): Record<string, string | number> {
    return this.mcu.mcu_constants || {}
  }

  mcuInformationDialogOpen = false

  showMcuInformationDialog () {
    this.mcuInformationDialogOpen = true
  }
}
</script>
