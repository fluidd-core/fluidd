<template>
  <div>
    <v-toolbar dense>
      <v-row no-gutters>
        <v-col>
          <v-tabs
            v-model="tab"
            background-color="transparent"
          >
            <v-tab
              key="status"
              :disabled="(!printerPrinting && !printerPaused) && filename === ''"
            >
              Status
            </v-tab>
            <v-tab
              v-if="supportsHistoryComponent"
              key="reprint"
            >
              Re-print
            </v-tab>
          </v-tabs>
        </v-col>

        <v-col cols="auto" align-self="center">
          <status-controls
            @print="handlePrint($event)">
          </status-controls>
        </v-col>
      </v-row>
    </v-toolbar>

    <v-tabs-items
      v-model="tab"
      style="background-color: transparent;"
    >
      <v-tab-item
        key="status"
      >
        <status-tab></status-tab>
      </v-tab-item>

      <v-tab-item
        v-if="supportsHistoryComponent"
        key="reprint"
      >
        <reprint-tab
          @print="handlePrint($event)">
        </reprint-tab>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'
import StatusControls from './StatusControls.vue'
import StatusTab from './StatusTab.vue'
import ReprintTab from './ReprintTab.vue'

@Component({
  components: {
    StatusTab,
    ReprintTab,
    StatusControls
  }
})
export default class PrintStatus extends Mixins(StateMixin) {
  tab = 0

  get supportsHistoryComponent () {
    return this.$store.getters['server/componentSupport']('history')
  }

  get filename () {
    return this.$store.state.printer.printer.print_stats.filename || ''
  }

  @Watch('filename')
  onPrinterPrinting (val: string) {
    this.init(val)
  }

  mounted () {
    this.init(this.filename)
  }

  init (filename: string) {
    if (filename !== '') {
      this.tab = 0
    } else {
      this.tab = 1
    }
  }

  handlePrint (filename: string) {
    SocketActions.printerPrintStart(filename)
  }
}
</script>

<style lang="scss" scoped>
  ::v-deep .v-toolbar .v-toolbar__content {
    padding-left: 0 !important;
  }
</style>
