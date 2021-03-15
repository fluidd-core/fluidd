<template>
  <div>
    <v-simple-table>
      <tbody>
        <tr v-for="job in history" :key="job.job_id">
          <td>
            <img
              v-if="job.metadata.thumbnails && job.metadata.thumbnails.length"
              class="mr-1 file-icon-thumb"
              :src="getThumb(job.metadata.thumbnails).data"
              :width="16"
            />
            {{ job.filename }}
          </td>
          <td>
            <!-- last printed: {{ $filters.formatFileDateTime(job.start_time, 'll') }} -->
             <!-- - duration: {{ $filters.formatCounterTime(job.print_duration) }} -->
             - end state: {{ job.status }}
          </td>
        </tr>
      </tbody>
    </v-simple-table>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FilesMixin from '@/mixins/files'

@Component({})
export default class ReprintList extends Mixins(FilesMixin) {
  get history () {
    // this should allow you to;
    // if no history plugin, or no history.. reprint the last file if loaded
    // via print_stats.filename or;
    // if history plugin, with history.. reprint last file AND
    // expand to a list of previous prints.
    return this.$store.getters['history/getHistory'](3)
  }
}
</script>
