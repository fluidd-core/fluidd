<template>
  <collapsable-card
    :title="$t('app.general.title.history')"
    icon="$history"
  >
    <job-history />

    <template #menu>
      <app-btn-collapse-group>
        <app-btn
          small
          class="ma-1"
          @click="handleLoadAll"
        >
          <v-icon
            small
            left
          >
            $download
          </v-icon>
          <span>{{ $t('app.general.btn.load_all') }}</span>
        </app-btn>
        <app-btn
          small
          class="ma-1"
          @click="handleRemoveAll"
        >
          <v-icon
            small
            left
          >
            $delete
          </v-icon>
          <span>{{ $t('app.general.btn.remove_all') }}</span>
        </app-btn>
      </app-btn-collapse-group>
    </template>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import JobHistory from '@/components/widgets/history/JobHistory.vue'
import { SocketActions } from '@/api/socketActions'

@Component({
  components: {
    JobHistory
  }
})
export default class PrinterHistoryCard extends Vue {
  handleRemoveAll () {
    this.$confirm(
      this.$tc('app.history.msg.confirm_jobs'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )
      .then(res => {
        if (res) {
          SocketActions.serverHistoryDeleteJob('all')
        }
      })
  }

  handleLoadAll () {
    SocketActions.serverHistoryList({ limit: 0 })
  }
}
</script>
