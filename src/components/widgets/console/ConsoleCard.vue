<template>
  <collapsable-card
    :title="$t('app.general.title.console')"
    icon="$console"
    cardClasses="mb-2 mb-sm-4 d-flex flex-column"
    contentClasses="flex-grow-1 flow-shrink-0"
    menuBreakpoint="none"
    menuIcon="$cog"
    :draggable="true"
    :layout-path="`dashboard.${$options.name}`"
    @collapsed="handleCollapseChange">

    <template v-slot:title>
      <v-icon left>$console</v-icon>
      <span class="font-weight-light">{{ $t('app.general.title.console') }}</span>
      <app-inline-help
        bottom
        small
        :tooltip="$t('app.console.placeholder.command')"
      ></app-inline-help>
    </template>

    <template v-slot:menu>
      <v-checkbox
        v-model="hideTempWaits"
        color="primary"
        class="ma-2"
        hide-details
        :label="$t('app.console.label.hide_temp_waits')"
      >
      </v-checkbox>
    </template>

    <console
      ref="console"
      :items="items"
      :height="300"
    ></console>

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

  get items (): ConsoleEntry[] {
    return this.$store.getters['console/getConsoleEntries']
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  @Watch('inLayout')
  inLayoutChange (inLayout: boolean) {
    if (!inLayout) {
      this.console.scrollToBottom()
    }
  }

  handleCollapseChange (collapsed: boolean) {
    if (!collapsed) {
      this.console.scrollToBottom()
    }
  }
}
</script>
