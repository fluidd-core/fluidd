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
        class="me-1 my-1"
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
            class="me-1 my-1"
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
          <v-col
            v-for="(fields, i) in selectedCardFields"
            :key="`spoolman-card-col-${i}`"
            align-self="center"
          >
            <template v-for="field in fields">
              <status-label
                :key="`spoolman-card-${field}`"
                :label="$t(`app.spoolman.label.${field}`)"
                :label-width="labelWidth"
              >
                <template v-if="field === 'remaining_weight'">
                  <span v-if="remainingFilamentUnit === 'weight'">
                    {{ $filters.getReadableWeightString(activeSpool.remaining_weight) }}
                    <small>/ {{ $filters.getReadableWeightString(activeSpool.filament.weight) }}</small>
                  </span>
                  <span v-else-if="remainingFilamentUnit === 'length'">
                    {{ $filters.getReadableLengthString(activeSpool.remaining_length) }}
                    <small>/ {{ $filters.getReadableLengthString($filters.convertFilamentWeightToLength(activeSpool.filament.weight ?? 0, activeSpool.filament.density, activeSpool.filament.diameter)) }}</small>
                  </span>
                </template>

                <template v-else-if="field === 'used_weight'">
                  <span v-if="remainingFilamentUnit === 'weight'">
                    {{ $filters.getReadableWeightString(activeSpool.used_weight) }}
                    <small>/ {{ $filters.getReadableWeightString(activeSpool.filament.weight) }}</small>
                  </span>
                  <span v-else-if="remainingFilamentUnit === 'length'">
                    {{ $filters.getReadableLengthString(activeSpool.used_length) }}
                    <small>/ {{ $filters.getReadableLengthString($filters.convertFilamentWeightToLength(activeSpool.filament.weight ?? 0, activeSpool.filament.density, activeSpool.filament.diameter)) }}</small>
                  </span>
                </template>

                <span v-else>{{ getFormattedField(field) }}</span>
              </status-label>
            </template>
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
import type { SpoolmanRemainingFilamentUnit } from '@/store/config/types'

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

  get selectedCardFields (): string[][] {
    const fields = this.$store.state.config.uiSettings.spoolman.selectedCardFields
    const columnCount = fields.length > 1 ? 2 : 1
    const elementsPerColumn = Math.ceil(fields.length / columnCount)
    return new Array(columnCount).fill(undefined).map((_, i) => fields.slice(i * elementsPerColumn, (i + 1) * elementsPerColumn))
  }

  get activeSpool (): Spool | undefined {
    if (!this.isConnected) return undefined
    return this.$store.getters['spoolman/getActiveSpool']
  }

  get currency (): string | undefined {
    return this.$store.state.spoolman.currency
  }

  get isConnected (): boolean {
    return this.$store.state.spoolman.connected
  }

  get targetableMacros (): MacroWithSpoolId[] {
    const macros: Macro[] = this.$store.getters['macros/getMacros']

    return macros
      .filter((macro): macro is MacroWithSpoolId => macro.variables != null && 'spool_id' in macro.variables)
      .map(macro => ({
        ...macro,
        name: macro.name.toUpperCase()
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  get remainingFilamentUnit (): SpoolmanRemainingFilamentUnit {
    return this.$store.state.config.uiSettings.spoolman.remainingFilamentUnit
  }

  getSpoolById (id: number): Spool | undefined {
    return this.$store.getters['spoolman/getSpoolById'](id)
  }

  getSpoolColor (spool?: Spool) {
    return `#${spool?.filament.color_hex ?? (this.$vuetify.theme.dark ? 'fff' : '000')}`
  }

  getFormattedField (field: string) {
    if (!this.activeSpool) return '-'

    switch (field) {
      case 'vendor':
        return this.activeSpool.filament.vendor?.name || '-'

      case 'filament_name':
        return this.activeSpool.filament.name

      case 'material':
        return this.activeSpool.filament.material || '-'

      case 'first_used':
        return this.activeSpool.first_used ? this.$filters.formatRelativeTimeToNow(this.activeSpool.first_used) : this.$tc('app.setting.label.never')

      case 'last_used':
        return this.activeSpool.last_used ? this.$filters.formatRelativeTimeToNow(this.activeSpool.last_used) : this.$tc('app.setting.label.never')

      case 'price':
        return [
          this.activeSpool.filament.price?.toFixed(2),
          this.currency
        ].filter(x => x != null).join(' ') || '-'

      case 'density':
        return this.activeSpool.filament.density || '-'

      case 'extruder_temp':
        return this.activeSpool.filament.settings_extruder_temp || '-'

      case 'bed_temp':
        return this.activeSpool.filament.settings_bed_temp || '-'

      default:
        return this.activeSpool[field as keyof Spool] || '-'
    }
  }
}
</script>
