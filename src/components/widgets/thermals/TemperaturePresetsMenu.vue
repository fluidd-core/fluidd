<template>
  <v-menu
    bottom
    left
    offset-y
    transition="slide-y-transition"
    min-width="150"
  >
    <template #activator="{ on, attrs, value }">
      <app-btn
        :disabled="!klippyReady"
        v-bind="attrs"
        small
        class="me-1 my-1"
        v-on="on"
      >
        <v-icon
          small
          class="me-1"
        >
          $fire
        </v-icon>
        {{ $t('app.general.btn.presets') }}
        <v-icon
          small
          class="ms-1"
          :class="{ 'rotate-180': value }"
        >
          $chevronDown
        </v-icon>
      </app-btn>
    </template>
    <v-list dense>
      <v-list-item @click="$emit('applyOff')">
        <v-list-item-icon>
          <v-icon color="info">
            $snowflake
          </v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            {{ $t('app.general.btn.heaters_off') }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <template v-for="(preset, i) of presets">
        <v-list-item
          :key="`preset${i}`"
          @click="$emit('applyPreset', preset)"
        >
          <v-list-item-icon>
            <v-icon color="error">
              $fire
            </v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ preset.name }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { TemperaturePreset } from '@/store/config/types'

@Component({})
export default class TemperaturePresetsMenu extends Mixins(StateMixin) {
  get presets (): TemperaturePreset[] {
    return this.$typedGetters['config/getTempPresets']
  }
}
</script>
