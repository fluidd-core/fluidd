<template>
  <app-dialog
    v-model="screwsTiltAdjustDialogOpen"
    :title="$t('app.tool.title.screws_tilt_adjust')"
    max-width="500"
    @save="retry"
  >
    <v-card-text class="pa-0">
      <v-simple-table>
        <thead>
          <tr>
            <th>{{ $t('app.general.label.name') }}</th>
            <th class="text-right">
              Z
            </th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="screw in screwsTiltAdjust.screws"
            :key="screw.name"
          >
            <td>
              {{ screw.prettyName }}<br>
              <small class="secondary--text">{{ `X = ${screw.x}, Y = ${screw.y}` }}</small>
            </td>
            <td class="focus--text text-right">
              <small
                v-if="screw.relativeZ"
                class="secondary--text"
              >({{ screw.relativeZ.toFixed(4) }})</small>
              {{ screw.z.toFixed(4) }}
            </td>
            <td class="text-right">
              <v-chip
                v-if="screw.is_base"
                small
                label
              >
                {{ $t('app.bedmesh.label.base') }}
              </v-chip>
              <v-chip
                v-else
                :color="screw.adjustMinutes < 6 ? 'success' : 'error'"
                small
                label
              >
                <v-icon
                  left
                  small
                >
                  {{ screw.adjustMinutes === 0 ? '$success' : screw.sign === 'CW' ? '$zRotateClockwise' : '$zRotateCounterclockwise' }}
                </v-icon>
                {{ screw.adjust }}
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-simple-table>
    </v-card-text>

    <template #actions>
      <v-spacer />

      <app-btn
        color="primary"
        type="submit"
      >
        {{ $t('app.general.btn.retry') }}
      </app-btn>
    </template>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import type { ScrewsTiltAdjust } from '@/store/printer/types'

@Component({})
export default class ScrewsTiltAdjustDialog extends Mixins(StateMixin, ToolheadMixin) {
  get screwsTiltAdjust (): ScrewsTiltAdjust {
    return this.$typedGetters['printer/getScrewsTiltAdjust']
  }

  get showScrewsTiltAdjustDialogAutomatically (): boolean {
    return this.$typedState.config.uiSettings.general.showScrewsTiltAdjustDialogAutomatically
  }

  @Watch('hasScrewsTiltAdjustResults')
  onHasScrewsTiltAdjustResults (value: boolean) {
    this.screwsTiltAdjustDialogOpen = (
      value &&
      this.showScrewsTiltAdjustDialogAutomatically &&
      this.klippyReady &&
      !this.printerPrinting
    )
  }

  @Watch('screwsTiltAdjustDialogOpen')
  onScrewsTiltAdjustDialogOpen (value: boolean) {
    if (!value) {
      this.$typedCommit('printer/setClearScrewsTiltAdjust')
    }
  }

  retry () {
    this.sendGcode('SCREWS_TILT_CALCULATE', this.$waits.onBedScrewsCalculate)
    this.screwsTiltAdjustDialogOpen = false
  }
}
</script>
