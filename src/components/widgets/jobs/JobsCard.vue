<template>
  <collapsable-card
    :title="$t('app.general.title.jobs')"
    icon="$files"
    :draggable="true"
    layout-path="dashboard.jobs-card"
  >
    <template #menu>
      <app-btn
        color=""
        fab
        small
        text
        @click="$filters.routeTo($router, '/jobs')"
      >
        <v-icon>$fullScreen</v-icon>
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
import { Component, Mixins, Prop } from 'vue-property-decorator'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import StateMixin from '@/mixins/state'

@Component({
  components: {
    FileSystem
  }
})
export default class JobsCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
