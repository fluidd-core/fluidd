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

    <v-card-text>
      <v-row>
        <template v-if="currentSpool">
          <v-col align-self="center">
            <status-label
              :label="$t('app.spoolman.label.vendor')"
              :label-width="labelWidth"
            >
              <span>{{ currentSpool.filament.vendor.name }}</span>
            </status-label>
            <status-label
              :label="$t('app.spoolman.label.filament_name')"
              :label-width="labelWidth"
            >
              <span>{{ currentSpool.filament.name }}</span>
            </status-label>
            <status-label
              :label="$t('app.spoolman.label.remaining_weight')"
              :label-width="labelWidth"
            >
              <span>
                {{ $filters.getReadableWeightString(currentSpool.remaining_weight) }}
                <small>/ {{ $filters.getReadableWeightString(currentSpool.filament.weight) }}</small>
              </span>
            </status-label>
            <status-label
              :label="$t('app.spoolman.label.location')"
              :label-width="labelWidth"
            >
              <span>{{ currentSpool.location || '-' }}</span>
            </status-label>
          </v-col>
          <v-col align-self="center">
            <status-label
                :label="$t('app.spoolman.label.material')"
                :label-width="labelWidth"
            >
              <span>{{ currentSpool.filament.material }}</span>
            </status-label>
            <status-label
                :label="$t('app.spoolman.label.lot_nr')"
                :label-width="labelWidth"
            >
              <span>{{ currentSpool.lot_nr || '-' }}</span>
            </status-label>
            <status-label
              :label="$t('app.spoolman.label.first_used')"
              :label-width="labelWidth"
            >
              <span>{{ currentSpool.first_used ? $filters.formatRelativeTimeToNow(currentSpool.first_used) : $tc('app.setting.label.never') }}</span>
            </status-label>
            <status-label
              :label="$t('app.spoolman.label.comment')"
              :label-width="labelWidth"
            >
              <span>{{ currentSpool.comment || '-' }}</span>
            </status-label>
          </v-col>
        </template>

        <v-col v-else>
          no spool
        </v-col>

        <v-col
          v-if="$vuetify.breakpoint.lgAndUp"
          cols="auto"
          align-self="center"
          class="pa-0"
        >
          <v-icon
            :color="currentSpool ? `#${currentSpool.filament.color_hex}` : 'black'"
            size="110px"
          >
            $filament
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
    this.$store.state.spoolman.dialog = { show: true }
  }

  get supportsSpoolman () {
    return this.$store.getters['spoolman/getSupported']
  }

  get currentSpool (): Spool | null {
    return this.$store.getters['spoolman/getActiveSpool']
  }
}
</script>
