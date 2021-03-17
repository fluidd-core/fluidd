<template>
  <v-card flat>
    <v-card-text class="pa-2">
      <div class="file-system">
        <v-simple-table>
          <tbody>
            <tr
              v-for="job in history"
              :key="job.job_id"
              @click="$emit('print', job.filename)">
              <td class="text-no-wrap">
                <v-icon
                  v-if="!job.metadata.thumbnails || !job.metadata.thumbnails.length"
                  small
                  color="grey darken-2"
                  class="mr-2">
                  $fileDocument
                </v-icon>
                <img
                  v-if="job.metadata.thumbnails && job.metadata.thumbnails.length"
                  class="mr-2 file-icon-thumb"
                  :src="getThumbUrl(job.metadata.thumbnails, job.path)"
                  :width="24"
                />
              </td>
              <td class="grey--text">
                <span>
                  {{ job.name }}
                </span>
              </td>
              <td class="grey--text">
                <span>
                  {{ $filters.formatFileDateTime(job.start_time) }}
                </span>
              </td>
              <td class="text-right">
                <job-history-item-status :job="job"></job-history-item-status>
              </td>
            </tr>
          </tbody>
        </v-simple-table>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import JobHistoryItemStatus from './JobHistoryItemStatus.vue'
import FilesMixin from '@/mixins/files'

@Component({
  components: {
    JobHistoryItemStatus
  }
})
export default class ReprintMenu extends Mixins(FilesMixin) {
  get history () {
    return this.$store.getters['history/getUniqueHistory'](2)
  }
}
</script>
