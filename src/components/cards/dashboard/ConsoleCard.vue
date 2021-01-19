<template>
  <collapsable-card
    :title="$t('Console')"
    icon="$console"
    cardClasses="mb-2 mb-sm-4 d-flex flex-column"
    contentClasses="flex-grow-1 flow-shrink-0"
    menuBreakpoint="none"
    menuIcon="$cog"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    @enabled="$emit('enabled', $event)"
    @collapsed="handleCollapseChange">

    <template v-slot:menu>
      <v-checkbox
        v-model="hideTempWaits"
        color="primary"
        class="ma-2"
        hide-details
        :label="$t('Hide temp waits')"
      >
      </v-checkbox>
    </template>

    <console-widget
      ref="console"
      pad-bottom
      :items="items"
      :height="300"
    ></console-widget>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import PrintStatusWidget from '@/components/widgets/PrintStatusWidget.vue'
import StateMixin from '@/mixins/state'
import ConsoleWidget from '@/components/widgets/ConsoleWidget.vue'
import { ConsoleEntry } from '@/store/console/types'

@Component({
  components: {
    PrintStatusWidget,
    ConsoleWidget
  }
})
export default class ConsoleCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

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

  get consoleComponent (): ConsoleWidget {
    return this.$refs.console as ConsoleWidget
  }

  @Watch('inLayout')
  inLayoutChange (inLayout: boolean) {
    if (!inLayout) {
      this.consoleComponent.scrollToBottom()
    }
  }

  handleCollapseChange (collapsed: boolean) {
    if (!collapsed) {
      this.consoleComponent.scrollToBottom()
    }
  }
}
</script>
