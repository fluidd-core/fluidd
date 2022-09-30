<template>
  <collapsable-card
    :title="$t('app.general.title.endstops')"
    :sub-title="$t('app.endstop.msg.subtitle')"
    icon="$expandHorizontal"
  >
    <template #collapse-button>
      <app-btn
        :loading="hasWait($waits.onQueryEndstops) || hasWait($waits.onQueryProbe)"
        color=""
        fab
        x-small
        text
        @click="queryEndstops"
      >
        <v-icon>$refresh</v-icon>
      </app-btn>
    </template>
    <v-simple-table v-if="hasEndstops">
      <tbody>
        <tr
          v-for="item in endstopsAndProbes"
          :key="item.name"
        >
          <td>
            <span class="focus--text">{{ item.name }}</span>
          </td>
          <td>
            <v-chip
              :color="(item.state === 'open') ? 'secondary' : 'warning'"
              small
              label
            >
              <v-icon
                small
                left
              >
                {{ (item.state === 'open') ? '$blankCircle' : '$markedCircle' }}
              </v-icon>
              {{ $t('app.endstop.label.' + item.state.toLowerCase()) }}
            </v-chip>
          </td>
        </tr>
      </tbody>
    </v-simple-table>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'
import { Endstop, Probe } from '@/store/printer/types'

@Component({
  components: {}
})
export default class EndStopsCard extends Mixins(StateMixin) {
  get endstops (): Endstop[] {
    return this.$store.getters['printer/getEndstops']
  }

  get probe (): Probe {
    return this.$store.getters['printer/getProbe']
  }

  get endstopsAndProbes () {
    const endstopsAndProbes = [...this.endstops]

    if (this.hasProbe) {
      endstopsAndProbes.push({
        name: 'Probe',
        state: this.probe.last_query ? 'triggered' : 'open'
      })
    }

    return endstopsAndProbes
  }

  // Default state is an empty object.
  get hasEndstops () {
    return this.endstops.length > 0
  }

  get hasProbe () {
    return this.probe !== undefined
  }

  queryEndstops () {
    SocketActions.printerQueryEndstops()

    if (this.hasProbe) {
      this.sendGcode('QUERY_PROBE', this.$waits.onQueryProbe)
    }
  }

  destroyed () {
    this.$store.commit('printer/setClearEndStops')
  }
}
</script>
