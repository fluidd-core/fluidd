<template>
  <collapsable-card
    :title="$t('app.general.title.endstops')"
    :sub-title="$t('app.endstop.msg.subtitle')"
    icon="$expandHorizontal"
  >
    <template #collapse-button>
      <app-btn
        :loading="hasWait($waits.onQueryEndstops) || hasWait($waits.onQueryProbe)"
        icon
        @click="queryEndstops"
      >
        <v-icon dense>
          $refresh
        </v-icon>
      </app-btn>
    </template>
    <v-simple-table v-if="hasEndstops">
      <tbody>
        <tr
          v-for="item in endstopsAndProbes"
          :key="item.name"
        >
          <td>
            {{ item.prettyName }}
          </td>
          <td>
            <v-chip
              :color="item.state ? 'warning' : 'secondary'"
              small
              label
            >
              <v-icon
                small
                left
              >
                {{ item.state ? '$markedCircle' : '$blankCircle' }}
              </v-icon>
              <template v-if="item.state">
                {{ $t('app.endstop.states.label.triggered') }}
              </template>
              <template v-else>
                {{ $t('app.endstop.states.label.open') }}
              </template>
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
import type { Endstop, Probe } from '@/store/printer/types'

@Component({
  components: {}
})
export default class EndStopsCard extends Mixins(StateMixin) {
  get endstops (): Endstop[] {
    return this.$store.getters['printer/getEndstops']
  }

  get hasSteppers () {
    return this.$store.getters['printer/getSteppers'].length > 0
  }

  get probe (): Probe | undefined {
    return this.$store.getters['printer/getProbe']
  }

  get endstopsAndProbes () {
    const endstopsAndProbes = [...this.endstops]

    const probe = this.probe

    if (probe != null) {
      endstopsAndProbes.push({
        name: probe.name,
        prettyName: probe.prettyName,
        state: probe.last_query
      })
    }

    return endstopsAndProbes
  }

  get hasEndstops () {
    return this.endstops.length > 0
  }

  queryEndstops () {
    if (this.hasSteppers) {
      SocketActions.printerQueryEndstops()
    }

    if (this.probe !== undefined) {
      this.sendGcode('QUERY_PROBE', this.$waits.onQueryProbe)
    }
  }

  destroyed () {
    this.$store.commit('printer/setClearEndStops')
  }
}
</script>
