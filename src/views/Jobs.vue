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
      </collapsable-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'

@Component({
  components: {
    FileSystem
  }
})
export default class Configuration extends Mixins(StateMixin) {
}
</script>
