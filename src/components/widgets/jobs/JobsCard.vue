<template>
  <collapsable-card
    :title="$t('app.general.title.jobs')"
    icon="$files"
    draggable
    layout-path="dashboard.jobs-card"
    :help-tooltip="$t('app.general.tooltip.file_browser_help')"
  >
    <template #menu>
      <app-btn
        icon
        @click="$filters.routeTo({ name: 'jobs' })"
      >
        <v-icon dense>
          $fullScreen
        </v-icon>
      </app-btn>
    </template>

    <file-system
      roots="gcodes"
      name="dashboard"
      dense
      :height="400"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'

@Component({
  components: {
    FileSystem
  }
})
export default class JobsCard extends Vue {
}
</script>
