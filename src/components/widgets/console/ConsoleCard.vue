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
        v-if="!fullscreen"
        icon
        @click="$filters.routeTo({ name: 'console' })"
      >
        <v-icon dense>
          $fullScreen
        </v-icon>
      </app-btn>
    </template>

    <console-toolbar
      :auto-scroll-paused="autoScrollPaused"
      :flip-layout.sync="flipLayout"
      :search.sync="search"
      @clear="handleClear"
      @scrollToLatest="consoleBrowserElement.scrollToLatest()"
    />

    <console-browser
      ref="consoleBrowser"
      :items="items"
      :search="search"
      :fullscreen="fullscreen"
      @update:auto-scroll-paused="autoScrollPaused = $event"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Ref } from 'vue-property-decorator'
import ConsoleBrowser from './ConsoleBrowser.vue'
import ConsoleToolbar from './ConsoleToolbar.vue'
import type { ConsoleEntry } from '@/store/console/types'

@Component({
  components: {
    ConsoleBrowser,
    ConsoleToolbar
  }
})
export default class ConsoleCard extends Vue {
  @Prop({ type: Boolean })
  readonly fullscreen?: boolean

  @Ref('consoleBrowser')
  readonly consoleBrowserElement!: ConsoleBrowser

  autoScrollPaused = false

  get search (): string {
    return this.$typedState.console.consoleSearch
  }

  set search (value: string) {
    this.$typedCommit('console/setConsoleSearch', value)
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
      this.consoleBrowserElement.scrollToLatest()
    }
  }

  handleCollapseChange (collapsed: boolean) {
    if (!collapsed) {
      this.consoleBrowserElement.scrollToLatest()
    }
  }

  handleClear () {
    this.$typedDispatch('console/onClear')
  }
}
</script>
