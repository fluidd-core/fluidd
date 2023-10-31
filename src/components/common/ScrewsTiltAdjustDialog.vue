<template>
  <app-dialog
    v-model="open"
    :title="$t('app.tool.title.screws_tilt_adjust')"
    max-width="500"
    @save="retry"
  >
    <div class="overflow-y-auto">
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
    </div>

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
import { Component, Mixins, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import type { ScrewsTiltAdjust } from '@/store/printer/types'

@Component({})
export default class ScrewsTiltAdjustDialog extends Mixins(StateMixin, ToolheadMixin) {
  @VModel({ type: Boolean, default: false })
    open!: boolean

  get screwsTiltAdjust (): ScrewsTiltAdjust {
    return this.$store.getters['printer/getScrewsTiltAdjust'] as ScrewsTiltAdjust
  }

  retry () {
    this.sendGcode('SCREWS_TILT_CALCULATE', this.$waits.onBedScrewsCalculate)
    this.open = false
  }

  destroyed () {
    this.$store.commit('printer/setClearScrewsTiltAdjust')
  }
}
</script>
