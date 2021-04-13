<template>
  <v-menu
    bottom
    left
    offset-y
    transition="slide-x-transition"
  >
    <template v-slot:activator="{ on, attrs, value }">
      <app-btn
        small
        v-bind="attrs"
        v-on="on"
        class="ma-1"
      >
        <v-icon small left>
          $reprint
        </v-icon>
        {{ $t('app.general.btn.reprint') }}
        <v-icon small class="ml-1" v-if="value">$chevronUp</v-icon>
        <v-icon small class="ml-1" v-else>$chevronDown</v-icon>
      </app-btn>
    </template>

    <v-card flat>
      <v-card-text class="pa-2">
        <div class="file-system">
          <v-simple-table dense>
            <tbody>
              <tr
                v-for="job in history"
                :key="job.job_id"
                @click="$emit('print', job.filename)"
                class="row-select">
                <td class="text-no-wrap">
                  <v-icon
                    v-if="!job.metadata.thumbnails || !job.metadata.thumbnails.length"
                    small
                    color="grey darken-2">
                    $fileDocument
                  </v-icon>
                  <img
                    v-if="job.metadata.thumbnails && job.metadata.thumbnails.length"
                    class="file-icon-thumb"
                    :src="getThumbUrl(job.metadata.thumbnails, getFilePaths(job.filename).path)"
                    :width="16"
                  />
                </td>
                <td class="grey--text">
                  <span>
                    <job-history-item-status :job="job" dense></job-history-item-status>
                    {{ getFilePaths(job.filename).filename }}
                  </span>
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FilesMixin from '@/mixins/files'
import { getFilePaths } from '@/store/helpers'
import JobHistoryItemStatus from '@/components/widgets/history/JobHistoryItemStatus.vue'

@Component({
  components: {
    JobHistoryItemStatus
  }
})
export default class ReprintMenu extends Mixins(FilesMixin) {
  get history () {
    return this.$store.getters['history/getUniqueHistory'](3)
  }

  getFilePaths (filename: string) {
    return getFilePaths(filename, 'gcodes')
  }
}
</script>
