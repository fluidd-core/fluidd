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
        v-if="autoScrollPaused"
        icon
        @click="consoleElement.scrollToLatest()"
      >
        <v-icon dense>
          {{ flipLayout ? '$up' : '$down' }}
        </v-icon>
      </app-btn>

      <app-btn
        v-if="!fullscreen"
        icon
        @click="$filters.routeTo({ name: 'console' })"
      >
        <v-icon dense>
          $fullScreen
        </v-icon>
      </app-btn>

      <app-btn
        icon
        @click="handleClear"
      >
        <v-icon dense>
          $delete
        </v-icon>
      </app-btn>

      <v-menu
        bottom
        left
        offset-y
        transition="slide-y-transition"
        :close-on-content-click="false"
      >
        <template #activator="{ on, attrs }">
          <app-btn
            icon
            v-bind="attrs"
            v-on="on"
          >
            <v-icon dense>
              $cog
            </v-icon>
          </app-btn>
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
      :items="items"
      :fullscreen="fullscreen"
      @update:auto-scroll-paused="autoScrollPaused = $event"
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

  autoScrollPaused = false

  get filters (): ConsoleFilter[] {
    return this.$typedState.console.consoleFilters
  }

  get hideTempWaits (): boolean {
    return this.$typedState.config.uiSettings.general.hideTempWaits
  }

  set hideTempWaits (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.hideTempWaits',
      value,
      server: true
    })
  }

  get flipLayout (): boolean {
    return this.$typedState.config.uiSettings.general.flipConsoleLayout
  }

  set flipLayout (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.flipConsoleLayout',
      value,
      server: true
    })
  }

  get items (): ConsoleEntry[] {
    return this.$typedGetters['console/getConsoleEntries']
  }

  get inLayout (): boolean {
    return (this.$typedState.config.layoutMode)
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
    this.$typedDispatch('console/onClear')
  }

  handleToggleFilter (filter: ConsoleFilter) {
    this.$typedDispatch('console/onSaveFilter', {
      ...filter,
      enabled: !filter.enabled
    })
  }
}
</script>
