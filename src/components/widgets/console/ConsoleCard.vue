<template>
  <collapsable-card
    :title="$t('app.general.title.console')"
    icon="$console"
    card-classes="d-flex flex-column"
    content-classes="flex-grow-1 flow-shrink-0"
    menu-breakpoint="none"
    menu-icon="$cog"
    :draggable="true"
    layout-path="dashboard.console-card"
    @collapsed="handleCollapseChange"
  >
    <template v-slot:title>
      <v-icon left>
        $console
      </v-icon>
      <span class="font-weight-light">{{ $t('app.general.title.console') }}</span>
      <app-inline-help
        bottom
        small
        :tooltip="$t('app.console.placeholder.command')"
      />
    </template>

    <template v-slot:menu>
      <app-btn
        v-if="scrollingPaused"
        @click="console.scrollToLatest(true)"
        color=""
        fab
        x-small
        text
      >
        <v-icon>{{ flipLayout ? '$up' : '$down' }}</v-icon>
      </app-btn>

      <app-btn-collapse-group
        :collapsed="true"
        menu-icon="$cog"
      >
        <v-checkbox
          v-model="hideTempWaits"
          :label="$t('app.console.label.hide_temp_waits')"
          color="primary"
          hide-details
          class="mx-2 mt-2"
        />
        <v-checkbox
          v-model="autoScroll"
          :label="$t('app.console.label.auto_scroll')"
          color="primary"
          hide-details
          class="mx-2 mb-2"
        />
        <v-checkbox
          v-model="flipLayout"
          :label="$t('app.console.label.flip_layout')"
          color="primary"
          hide-details
          class="mx-2 mb-2"
        />

        <template v-for="(filter, index) in filters">
          <v-divider
            :key="index"
            v-if="index === 0"
          />
          <v-checkbox
            v-model="filter.enabled"
            :label="filter.name"
            :key="filter.id"
            color="primary"
            hide-details
            class="mx-2 mt-2"
          />
        </template>
      </app-btn-collapse-group>
    </template>

    <console
      ref="console"
      :scrolling-paused.sync="scrollingPaused"
      :items="items"
      :height="300"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import Console from './Console.vue'
import { ConsoleEntry } from '@/store/console/types'

@Component({
  components: {
    Console
  }
})
export default class ConsoleCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  @Ref('console') console!: Console

  scrollingPaused = false

  get filters () {
    return this.$store.getters['console/getFilters']
  }

  get hideTempWaits (): boolean {
    return this.$store.state.config.uiSettings.general.hideTempWaits
  }

  set hideTempWaits (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.hideTempWaits',
      value,
      server: true
    })
  }

  get flipLayout (): boolean {
    return this.$store.state.config.uiSettings.general.flipConsoleLayout
  }

  set flipLayout (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.flipConsoleLayout',
      value,
      server: true
    })

    this.console.flipLayout = value
  }

  get items (): ConsoleEntry[] {
    return this.$store.getters['console/getConsoleEntries']
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  get autoScroll () {
    return this.$store.state.console.autoScroll
  }

  set autoScroll (value: boolean) {
    this.$store.dispatch('console/onUpdateAutoScroll', value)
    if (value) {
      this.console.scrollToLatest()
    }
  }

  @Watch('inLayout')
  inLayoutChange (inLayout: boolean) {
    if (!inLayout) {
      this.console.scrollToLatest()
    }
  }

  handleCollapseChange (collapsed: boolean) {
    if (!collapsed) {
      this.console.scrollToLatest()
    }
  }
}
</script>
