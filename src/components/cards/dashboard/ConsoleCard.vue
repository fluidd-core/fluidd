<template>
  <collapsable-card
    title="Console"
    icon="$console"
    cardClasses="mb-2 mb-sm-4 d-flex flex-column"
    contentClasses="flex-grow-1 flow-shrink-0"
    :height="450"
    :collapsed="true">

    <console-widget
      :items="items"
    ></console-widget>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PrintStatusWidget from '@/components/widgets/PrintStatusWidget.vue'
import UtilsMixin from '@/mixins/utils'
import ConsoleWidget from '@/components/widgets/ConsoleWidget.vue'
import { ConsoleEntry } from '@/store/socket/types'

@Component({
  components: {
    PrintStatusWidget,
    ConsoleWidget
  }
})
export default class ConsoleCard extends Mixins(UtilsMixin) {
  get items (): ConsoleEntry[] {
    return this.$store.state.socket.console
  }
}
</script>
