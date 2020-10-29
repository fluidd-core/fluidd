<template>
  <collapsable-card
    title="Console"
    icon="$console"
    :height="400"
    :collapsed="true">

    <console-widget></console-widget>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PrintStatusWidget from '@/components/widgets/PrintStatusWidget.vue'
import UtilsMixin from '@/mixins/utils'
import ConsoleWidget from '@/components/widgets/ConsoleWidget.vue'

@Component({
  components: {
    PrintStatusWidget,
    ConsoleWidget
  }
})
export default class ConsoleCard extends Mixins(UtilsMixin) {}
</script>
