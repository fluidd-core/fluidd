<template>
  <collapsable-card
    :title="$t('app.general.title.jobs')"
    icon="$files"
    :draggable="!fullscreen"
    :collapsable="!fullscreen"
    layout-path="dashboard.jobs-card"
    :help-tooltip="$t('app.general.tooltip.file_browser_help')"
  >
    <template #menu>
      <app-btn
        v-if="!fullscreen"
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
      :dense="!fullscreen"
      :bulk-actions="fullscreen"
      :class="{
        'full-screen': fullscreen,
        'partial-screen': !fullscreen
      }"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'

@Component({
  components: {
    FileSystem
  }
})
export default class JobsCard extends Vue {
  @Prop({ type: Boolean })
  readonly fullscreen?: boolean
}
</script>

<style lang="scss" scoped>
  .full-screen {
    height: calc(100vh - 190px);
    height: calc(100svh - 190px);
  }

  .partial-screen {
    height: 400px;
  }
</style>
