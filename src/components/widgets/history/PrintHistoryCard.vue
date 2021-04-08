<template>
  <collapsable-card
    :title="$t('app.general.title.history')"
    :sub-title="$t('app.history.msg.load_count', { num: this.$globals.JOB_HISTORY_LOAD })"
    icon="$history">
    <job-history></job-history>

    <template v-slot:menu>
      <app-btn
        @click="handleLoadAll"
        small
        class="ma-1">
        <v-icon small left>$download</v-icon>
        <span>{{ $t('app.general.btn.load_all') }}</span>
      </app-btn>
      <app-btn
        @click="handleRemoveAll"
        small
        class="ma-1">
        <v-icon small left>$delete</v-icon>
        <span>{{ $t('app.general.btn.remove_all') }}</span>
      </app-btn>
    </template>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import JobHistory from '@/components/widgets/history/JobHistory.vue'
import { SocketActions } from '@/socketActions'

@Component({
  components: {
    JobHistory
  }
})
export default class PrinterHistoryCard extends Vue {
  handleRemoveAll () {
    this.$confirm(
      this.$tc('app.history.msg.confirm'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )
      .then(res => {
        if (res) {
          SocketActions.serverHistoryDeleteJob('all')
        }
      })
  }

  handleLoadAll () {
    SocketActions.serverHistoryList()
  }
}
</script>
