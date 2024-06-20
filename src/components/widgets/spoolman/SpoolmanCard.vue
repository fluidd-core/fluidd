<template>
  <collapsable-card
    :title="$tc('app.spoolman.title.spoolman')"
    icon="$filament"
    draggable
    layout-path="dashboard.spoolman-card"
  >
    <template #menu>
      <app-btn
        v-if="!targetableMacros.length"
        small
        class="ms-1 my-1"
        :disabled="!isConnected"
        @click="() => handleSelectSpool()"
      >
        {{ $t('app.spoolman.label.change_spool') }}
      </app-btn>

      <v-menu
        v-else
        bottom
        left
        offset-y
        transition="slide-y-transition"
        min-width="150"
      >
        <template #activator="{ on, attrs, value }">
          <app-btn
            v-bind="attrs"
            small
            class="ms-1 my-1"
            :disabled="!isConnected"
            v-on="on"
          >
            {{ $t('app.spoolman.label.change_spool') }}
            <v-icon
              small
              class="ml-1"
              :class="{ 'rotate-180': value }"
            >
              $chevronDown
            </v-icon>
          </app-btn>
        </template>
        <v-list dense>
          <v-list-item @click="() => handleSelectSpool()">
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.spoolman.label.active_spool') }}
              </v-list-item-title>
            </v-list-item-content>

            <v-list-item-icon
              v-if="activeSpool"
            >
              <v-icon
                :color="getSpoolColor(activeSpool)"
                class="spool-icon"
              >
                $filament
              </v-icon>
            </v-list-item-icon>
          </v-list-item>

          <template v-for="macro of targetableMacros">
            <v-list-item
              :key="macro.name"
              :class="{primary: macro.variables?.active}"
              @click="() => handleSelectSpool(macro)"
            >
              <v-list-item-content>
                <v-list-item-title>
                  {{ macro.name }}
                </v-list-item-title>
              </v-list-item-content>

              <v-list-item-icon
                v-if="macro.variables.spool_id"
              >
                <v-icon
                  :color="getSpoolColor(getSpoolById(macro.variables.spool_id))"
                  class="spool-icon"
                >
                  $filament
                </v-icon>
              </v-list-item-icon>
            </v-list-item>
          </template>
        </v-list>
      </v-menu>
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
              <span v-if="remainingFilamentUnit === 'weight'">
                {{ $filters.getReadableWeightString(activeSpool.remaining_weight) }}
                <small>/ {{ $filters.getReadableWeightString(activeSpool.filament.weight) }}</small>
              </span>
              <span v-else-if="remainingFilamentUnit === 'length'">
                {{ $filters.getReadableLengthString(activeSpool.remaining_length) }}
                <small>/ {{ $filters.getReadableLengthString($filters.convertFilamentWeightToLength(activeSpool.filament.weight ?? 0, activeSpool.filament.density, activeSpool.filament.diameter)) }}</small>
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
          v-else-if="isConnected"
          align-self="center"
        >
          {{ $t('app.spoolman.msg.tracking_inactive') }}
        </v-col>

        <v-col
          v-else
          align-self="center"
        >
          {{ $t('app.spoolman.msg.not_connected') }}
        </v-col>

        <v-col
          v-if="$vuetify.breakpoint.xl"
          cols="auto"
          align-self="center"
          class="pa-0"
        >
          <v-icon
            v-if="activeSpool"
            :color="getSpoolColor(activeSpool)"
            size="110px"
            class="spool-icon"
          >
            $filament
          </v-icon>
          <v-icon
            v-else-if="isConnected"
            size="55px"
          >
            $progressQuestion
          </v-icon>
          <v-icon
            v-else
            color="warning"
            size="55px"
          >
            $warning
          </v-icon>
        </v-col>
      </v-row>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { MacroWithSpoolId, Spool } from '@/store/spoolman/types'
import StatusLabel from '@/components/widgets/status/StatusLabel.vue'
import type { Macro } from '@/store/macros/types'

@Component({
  components: { StatusLabel }
})
export default class SpoolmanCard extends Mixins(StateMixin) {
  labelWidth = '86px'

  handleSelectSpool (targetMacro?: Macro) {
    this.$store.commit('spoolman/setDialogState', {
      show: true,
      targetMacro: targetMacro?.name
    })
  }

  get activeSpool (): Spool | null {
    if (!this.isConnected) return null
    return this.$store.getters['spoolman/getActiveSpool']
  }

  get isConnected (): boolean {
    return this.$store.getters['spoolman/getConnected']
  }

  get targetableMacros (): MacroWithSpoolId[] {
    const macros = this.$store.getters['macros/getMacros'] as Macro[]

    return macros
      .filter((macro): macro is MacroWithSpoolId => macro.variables != null && 'spool_id' in macro.variables)
      .map(macro => ({
        ...macro,
        name: macro.name.toUpperCase()
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  get remainingFilamentUnit () {
    return this.$store.state.config.uiSettings.spoolman.remainingFilamentUnit
  }

  getSpoolById (id: number): Spool | undefined {
    return this.$store.getters['spoolman/getSpoolById'](id)
  }

  getSpoolColor (spool?: Spool) {
    return `#${spool?.filament.color_hex ?? (this.$vuetify.theme.dark ? 'fff' : '000')}`
  }
}
</script>
