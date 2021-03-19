<template>
  <collapsable-card
    title="Job History"
    icon="$history">
    <job-history></job-history>

    <template v-slot:menu>
      <btn
        @click="handleRemoveAll"
        small
        class="ma-1">
        <v-icon small left>$delete</v-icon>
        <span>Remove All</span>
      </btn>
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
    this.$confirm('Are you sure? This will clear all history, and printer statistics.')
      .then(res => {
        if (res) {
          SocketActions.serverHistoryDeleteJob('all')
        }
      })
  }
}
</script>
