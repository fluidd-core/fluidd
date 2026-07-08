<template>
  <div>
    <v-subheader id="aliases">
      {{ $t('app.setting.title.aliases') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting :title="$t('app.setting.label.aliases')">
        <template #sub-title>
          {{ $t('app.setting.tooltip.aliases') }}
        </template>
      </app-setting>

      <template v-if="items.length">
        <v-divider />

        <template v-for="(item, index) in items">
          <app-setting
            :key="item.key"
            :title="item.defaultPrettyName"
            :sub-title="item.key"
          >
            <v-text-field
              :value="aliases[item.key] || ''"
              :placeholder="item.defaultPrettyName"
              :aria-label="item.defaultPrettyName"
              :maxlength="ALIAS_MAX_LENGTH"
              spellcheck="false"
              filled
              dense
              hide-details
              clearable
              @change="handleChange(item, $event)"
            />
          </app-setting>

          <v-divider
            v-if="index < items.length - 1"
            :key="`divider-${item.key}`"
          />
        </template>
      </template>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { Fan, Led, OutputPin, Heater, Sensor } from '@/store/printer/types'

// Shared cap on an alias length (UI-enforced; display-only value).
const ALIAS_MAX_LENGTH = 64

interface AliasItem {
  key: string;
  // True pre-alias default name (shown as the placeholder). Sourced from the
  // getter's `defaultPrettyName`, NOT re-derived, so the fan→'Part Fan' and
  // tmc2240 special-cases stay correct even while an alias is active.
  defaultPrettyName: string;
}

@Component({})
export default class AliasSettings extends Vue {
  readonly ALIAS_MAX_LENGTH = ALIAS_MAX_LENGTH

  // Read live from the store so async DB load (mergeWith) and external changes
  // stay reflected in every row's text field.
  get aliases (): Record<string, string> {
    return this.$typedState.config.uiSettings.dashboard.aliases
  }

  // All aliasable Klipper objects: fans, output pins, LEDs, heaters and sensors.
  // Uses the ARRAY getters — getOutputs is curried and must not be spread.
  get items (): AliasItem[] {
    const fans: Fan[] = this.$typedGetters['printer/getAllFans']
    const pins: OutputPin[] = this.$typedGetters['printer/getAllPins']
    const leds: Led[] = this.$typedGetters['printer/getAllLeds']
    const heaters: Heater[] = this.$typedGetters['printer/getHeaters']
    const sensors: Sensor[] = this.$typedGetters['printer/getSensors']

    const groups = [...fans, ...pins, ...leds, ...heaters, ...sensors]

    // Dedup by full config key (defensive; getter key-groups are disjoint).
    const seen = new Set<string>()

    return groups
      .filter((item) => {
        if (!item?.key || seen.has(item.key)) return false
        seen.add(item.key)
        return true
      })
      .map((item): AliasItem => ({
        key: item.key,
        defaultPrettyName: item.defaultPrettyName ?? item.prettyName
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }

  handleChange (item: AliasItem, value: string | null) {
    const name = (value ?? '').trim()

    if (name) {
      this.$typedDispatch('config/updateAlias', { key: item.key, name })
    } else {
      this.$typedDispatch('config/removeAlias', { key: item.key })
    }
  }
}
</script>
