<template>
  <collapsable-card
    :title="$t('app.general.title.endstops')"
    :sub-title="$t('app.endstop.msg.subtitle')"
    icon="$expandHorizontal"
  >
    <template #collapse-button>
      <app-btn
        color=""
        fab
        x-small
        text
        @click="queryEndstops"
      >
        <v-icon>$refresh</v-icon>
      </app-btn>
    </template>
    <v-card-text v-if="hasEndStops">
      <v-layout
        v-for="(item, name) in endStops"
        :key="name"
        align-center
        justify-start
        class="py-1"
      >
        <span class="focus--text mr-5">{{ name }}</span>
        <v-chip
          :color="(item === 'open') ? 'secondary' : 'warning'"
          class="ml-2"
          small
          label
        >
          <v-icon
            small
            left
          >
            {{ (item === 'open') ? '$blankCircle' : '$markedCircle' }}
          </v-icon>
          {{ $t('app.endstop.label.' + item.toLowerCase()) }}
        </v-chip>
      </v-layout>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'

@Component({
  components: {}
})
export default class EndStopsCard extends Mixins(StateMixin) {
  get endStops () {
    return this.$store.getters['printer/getEndstops']
  }

  // Default state is an empty object.
  get hasEndStops () {
    return (Object.keys(this.endStops).length > 0)
  }

  queryEndstops () {
    SocketActions.printerQueryEndstops()
  }

  destroyed () {
    this.$store.commit('printer/setClearEndStops')
  }
}
</script>
