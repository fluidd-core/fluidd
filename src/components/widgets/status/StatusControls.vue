<template>
  <app-btn-collapse-group>
    <div>
      <app-btn
        @click="cancelPrint()"
        v-if="printerPrinting || printerPaused"
        :loading="hasWait($waits.onPrintCancel)"
        :disabled="hasWait([$waits.onPrintCancel, $waits.onPrintResume, $waits.onPrintPause])"
        small
        class="ma-1"
      >
        <v-icon
          small
          left
        >
          $cancelled
        </v-icon>
        <span>{{ $t('app.general.btn.cancel') }}</span>
      </app-btn>

      <app-btn
        @click="pausePrint()"
        v-if="printerPrinting && !printerPaused"
        :loading="hasWait($waits.onPrintPause)"
        :disabled="printerPaused || hasWait([$waits.onPrintCancel, $waits.onPrintResume, $waits.onPrintPause])"
        small
        class="ma-1"
      >
        <v-icon
          small
          left
        >
          $pause
        </v-icon>
        <span>{{ $t('app.general.btn.pause') }}</span>
      </app-btn>

      <app-btn
        @click="resumePrint()"
        v-if="printerPaused"
        :loading="hasWait($waits.onPrintResume)"
        :disabled="printerPrinting || hasWait([$waits.onPrintCancel, $waits.onPrintResume, $waits.onPrintPause])"
        small
        class="ma-1"
      >
        <v-icon
          small
          left
        >
          $resume
        </v-icon>
        <span>{{ $t('app.general.btn.resume') }}</span>
      </app-btn>

      <app-btn
        @click="resetFile()"
        v-if="!printerPrinting && !printerPaused && filename"
        small
        class="ma-1"
      >
        <v-icon
          small
          left
        >
          $refresh
        </v-icon>
        <span>{{ $t('app.general.btn.reset_file') }}</span>
      </app-btn>

      <app-btn
        v-if="!supportsHistoryComponent && !printerPrinting && !printerPaused && filename"
        @click="$emit('print', filename)"
        small
        class="ma-1"
      >
        <v-icon
          small
          left
        >
          $reprint
        </v-icon>
        <span>{{ $t('app.general.btn.reprint') }}</span>
      </app-btn>
    </div>
  </app-btn-collapse-group>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'
import JobHistoryItemStatus from '@/components/widgets/history/JobHistoryItemStatus.vue'

@Component({
  components: {
    JobHistoryItemStatus
  }
})
export default class StatusControls extends Mixins(StateMixin) {
  get filename () {
    return this.$store.state.printer.printer.print_stats.filename
  }

  get supportsHistoryComponent () {
    return this.$store.getters['server/componentSupport']('history')
  }

  cancelPrint () {
    this.$tc('app.general.simple_form.msg.confirm')
    this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )
      .then(res => {
        if (res) {
          SocketActions.printerPrintCancel()
          this.addConsoleEntry('CANCEL_PRINT')
        }
      })
  }

  pausePrint () {
    SocketActions.printerPrintPause()
    this.addConsoleEntry('PAUSE')
  }

  resumePrint () {
    SocketActions.printerPrintResume()
    this.addConsoleEntry('RESUME')
  }

  resetFile () {
    this.sendGcode('SDCARD_RESET_FILE')
  }
}
</script>
