<template>
  <v-menu
    bottom
    left
    offset-y
    transition="slide-y-transition"
    :min-width="150"
  >
    <template #activator="{ on, attrs, value }">
      <app-btn
        v-bind="attrs"
        x-small
        v-on="on"
      >
        <v-icon
          x-small
          class="mr-1"
        >
          $snooze
        </v-icon>
        {{ $t('app.general.btn.snooze') }}
        <v-icon
          x-small
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
        v-for="(preset) of presets"
        :key="preset.delay"
        link
        dense
        @click="$emit('dismiss', preset.delay)"
      >
        <v-list-item-title>
          <v-icon
            small
            left
          >
            $clock
          </v-icon>
          {{ preset.label }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class AppAnnouncementDismissMenu extends Mixins(StateMixin) {
  get presets () {
    return [
      { hours: 1 },
      { days: 1 },
      { days: 7 }
    ].map(v => {
      const duration = this.$dayjs.duration(v)

      return ({
        label: duration.humanize(),
        delay: duration.asSeconds()
      })
    })
  }
}
</script>
