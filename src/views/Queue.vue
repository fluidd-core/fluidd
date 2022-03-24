<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col cols="12">
      <collapsable-card
        :title="$t('app.general.title.jobs')"
        card-key="JobsPage"
        icon="$files"
        :draggable="false"
      >
        <file-system
          :roots="'gcodes'"
          name="jobs"
          bulk-actions
          :max-height="816"
        />
        <job-queue-card />
      </collapsable-card>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import JobQueueCard from '@/components/widgets/queue/QueueCard.vue'
import SystemControl from '@/components/common/SystemControl.vue'

@Component({
  components: {
    FileSystem,
    SystemControl,
    JobQueueCard
  }
})
export default class History extends Mixins(StateMixin) {
  get breakpoint () {
    if (this.$vuetify.breakpoint.mdAndDown) {
      return 12
    }
    return 6
  }

  get supportsHistory () {
    return this.$store.getters['server/componentSupport']('history')
  }
}
</script>
