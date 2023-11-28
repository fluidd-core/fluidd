<template>
  <collapsable-card
    :title="$t('app.general.title.console')"
    icon="$console"
    :help-tooltip="$t('app.console.tooltip.help')"
    card-classes="d-flex flex-column"
    content-classes="flex-grow-1 flow-shrink-0"
    menu-breakpoint="none"
    menu-icon="$cog"
    :draggable="!fullscreen"
    :collapsable="!fullscreen"
    layout-path="dashboard.console-card"
    @collapsed="handleCollapseChange"
  >
    <template #menu>
      <app-btn
        v-if="scrollingPaused"
        color=""
        fab
        x-small
        text
        class="ms-1 my-1"
        @click="consoleElement.scrollToLatest(true)"
      >
        <v-icon>{{ flipLayout ? '$up' : '$down' }}</v-icon>
      </app-btn>

      <app-btn
        v-if="!fullscreen"
        color=""
        fab
        x-small
        text
        class="ms-1 my-1"
        @click="$filters.routeTo($router, '/console')"
      >
        <v-icon>$fullScreen</v-icon>
      </app-btn>

      <app-btn
        color=""
        fab
        x-small
        text
        class="ms-1 my-1"
        @click="handleClear"
      >
        <v-icon>$delete</v-icon>
      </app-btn>

      <v-menu
        bottom
        left
        offset-y
        transition="slide-y-transition"
        :close-on-content-click="false"
      >
        <template #activator="{ on, attrs }">
          <v-btn
            fab
            x-small
            text
            v-bind="attrs"
            class="ms-1 my-1"
            v-on="on"
          >
            <v-icon>
              $cog
            </v-icon>
          </v-btn>
        </template>

        <v-list dense>
          <v-list-item @click="hideTempWaits = !hideTempWaits">
            <v-list-item-action class="my-0">
              <v-checkbox :input-value="hideTempWaits" />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.console.label.hide_temp_waits') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item @click="autoScroll = !autoScroll">
            <v-list-item-action class="my-0">
              <v-checkbox :input-value="autoScroll" />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.console.label.auto_scroll') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item @click="flipLayout = !flipLayout">
            <v-list-item-action class="my-0">
              <v-checkbox :input-value="flipLayout" />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.console.label.flip_layout') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <template v-if="filters && filters.length">
            <v-divider />

            <v-list-item
              v-for="filter in filters"
              :key="filter.id"
              @click="handleToggleFilter(filter)"
            >
              <v-list-item-action class="my-0">
                <v-checkbox :input-value="filter.enabled" />
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>
                  {{ filter.name }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-list>
      </v-menu>
    </template>

    <console
      ref="console"
      :scrolling-paused.sync="scrollingPaused"
      :items="items"
      :fullscreen="fullscreen"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Ref } from 'vue-property-decorator'
import Console from './Console.vue'
import type { ConsoleEntry, ConsoleFilter } from '@/store/console/types'

@Component({
  components: {
    Console
  }
})
export default class ConsoleCard extends Vue {
  @Prop({ type: Boolean })
  readonly fullscreen?: boolean

  @Ref('console')
  readonly consoleElement!: Console

  scrollingPaused = false

  get filters (): ConsoleFilter[] {
    return this.$store.getters['console/getFilters'] as ConsoleFilter[]
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

    this.consoleElement.flipLayout = value
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
      this.consoleElement.scrollToLatest(true)
    }
  }

  @Watch('inLayout')
  inLayoutChange (inLayout: boolean) {
    if (!inLayout) {
      this.consoleElement.scrollToLatest()
    }
  }

  handleCollapseChange (collapsed: boolean) {
    if (!collapsed) {
      this.consoleElement.scrollToLatest()
    }
  }

  handleClear () {
    this.$store.dispatch('console/onClear')
  }

  handleToggleFilter (filter: ConsoleFilter) {
    this.$store.dispatch('console/onSaveFilter', {
      ...filter,
      enabled: !filter.enabled
    })
  }
}
</script>
