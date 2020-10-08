<template>
  <v-card class="mb-4">
    <v-card-title >
      <v-icon large left>mdi-printer-3d</v-icon>
      <span class="font-weight-light">
        {{ printerState }}
        <span class="font-weight-light text-subtitle-2 ml-4">{{ printerMessage }}</span>
      </span>

      <v-spacer />
      <img v-if="printerPrinting && thumbnail" :src="'data:image/gif;base64,'+thumbnail.data" height="36px" />
    </v-card-title>

    <print-status-widget></print-status-widget>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PrintStatusWidget from '@/components/widgets/PrintStatusWidget.vue'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    PrintStatusWidget
  }
})
export default class StatusCard extends Mixins(UtilsMixin) {
  get printerMessage () {
    return this.$store.state.socket.printer.display_status.message
  }

  get thumbnail () {
    return this.$store.state.socket.printer.current_file.thumbnails[1]
  }
}
</script>
