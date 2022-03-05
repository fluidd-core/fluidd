<template>
  <v-menu
    bottom
    left
    offset-y
    transition="slide-y-transition"
    :min-width="150"
  >
    <template v-slot:activator="{ on, attrs, value }">
      <app-btn
        :disabled="!klippyReady"
        v-bind="attrs"
        v-on="on"
        small
      >
        <v-icon
          small
          class="mr-1"
        >
          $fire
        </v-icon>
        {{ $t('app.general.btn.presets') }}
        <v-icon
          small
          class="ml-1"
          :class="{ 'rotate-180': value }"
        >
          $chevronDown
        </v-icon>
      </app-btn>
    </template>
    <v-list
      dense
    >
      <v-list-item
        @click="$emit('applyOff')"
        link
        dense
      >
        <v-list-item-title>
          <v-icon
            small
            left
            color="info"
          >
            $snowflakeAlert
          </v-icon>
          {{ $t('app.general.btn.heaters_off') }}
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-for="(preset) of presets"
        :key="preset.index"
        @click="$emit('applyPreset', preset)"
        link
        dense
      >
        <v-list-item-title>
          <v-icon
            small
            left
            color="error"
          >
            $fire
          </v-icon>
          {{ preset.name }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class TemperaturePresetsMenu extends Mixins(StateMixin) {
  get presets () {
    return this.$store.getters['config/getTempPresets']
  }
}
</script>
