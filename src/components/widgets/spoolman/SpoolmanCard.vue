<template>
  <collapsable-card
    :title="$tc('app.spoolman.title.spoolman')"
    icon="$filament"
    draggable
    layout-path="dashboard.spoolman-card"
  >
    <template #menu>
      <app-btn
        small
        class="ms-1 my-1"
        @click="handleSelectSpool"
      >
        {{ $t('app.spoolman.label.change_spool') }}
      </app-btn>
    </template>

    <v-progress-linear
      v-if="activeSpool && $vuetify.breakpoint.lgAndDown"
      value="100"
      :height="6"
      :color="`#${activeSpool.filament.color_hex ?? ($vuetify.theme.dark ? 'fff' : '000')}`"
    />

    <v-card-text>
      <v-row>
        <template v-if="activeSpool">
          <v-col align-self="center">
            <status-label
              :label="$t('app.spoolman.label.vendor')"
              :label-width="labelWidth"
            >
              <span>{{ activeSpool.filament.vendor?.name || '-' }}</span>
            </status-label>
            <status-label
              :label="$t('app.spoolman.label.filament_name')"
              :label-width="labelWidth"
            >
              <span>{{ activeSpool.filament.name }}</span>
            </status-label>
            <status-label
              :label="$t('app.spoolman.label.remaining_weight')"
              :label-width="labelWidth"
            >
              <span>
                {{ $filters.getReadableWeightString(activeSpool.remaining_weight) }}
                <small>/ {{ $filters.getReadableWeightString(activeSpool.filament.weight) }}</small>
              </span>
            </status-label>
            <status-label
              :label="$t('app.spoolman.label.location')"
              :label-width="labelWidth"
            >
              <span>{{ activeSpool.location || '-' }}</span>
            </status-label>
          </v-col>
          <v-col align-self="center">
            <status-label
              :label="$t('app.spoolman.label.material')"
              :label-width="labelWidth"
            >
              <span>{{ activeSpool.filament.material || '-' }}</span>
            </status-label>
            <status-label
              :label="$t('app.spoolman.label.lot_nr')"
              :label-width="labelWidth"
            >
              <span>{{ activeSpool.lot_nr || '-' }}</span>
            </status-label>
            <status-label
              :label="$t('app.spoolman.label.first_used')"
              :label-width="labelWidth"
            >
              <span>{{
                activeSpool.first_used ? $filters.formatRelativeTimeToNow(activeSpool.first_used) : $tc('app.setting.label.never')
              }}</span>
            </status-label>
            <status-label
              :label="$t('app.spoolman.label.comment')"
              :label-width="labelWidth"
            >
              <span>{{ activeSpool.comment || '-' }}</span>
            </status-label>
          </v-col>
        </template>

        <v-col
          v-else
          align-self="center"
        >
          {{ $t('app.spoolman.msg.tracking_inactive') }}
        </v-col>

        <v-col
          v-if="$vuetify.breakpoint.xl"
          cols="auto"
          align-self="center"
          class="pa-0"
        >
          <v-icon
            :color="`#${activeSpool?.filament.color_hex ?? ($vuetify.theme.dark ? 'fff' : '000')}`"
            :size="activeSpool ? '110px' : '55px'"
          >
            {{ activeSpool ? '$filament' : '$progressQuestion' }}
          </v-icon>
        </v-col>
      </v-row>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Spool } from '@/store/spoolman/types'
import StatusLabel from '@/components/widgets/status/StatusLabel.vue'

@Component({
  components: { StatusLabel }
})
export default class SpoolmanCard extends Mixins(StateMixin) {
  labelWidth = '86px'

  handleSelectSpool () {
    this.$store.commit('spoolman/setDialogState', { show: true })
  }

  get supportsSpoolman () {
    return this.$store.getters['spoolman/getSupported']
  }

  get activeSpool (): Spool | null {
    return this.$store.getters['spoolman/getActiveSpool']
  }
}
</script>
