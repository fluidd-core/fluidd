<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col cols="12">
      <collapsable-card
        :title="$t('app.general.title.timelapse')"
        icon="$video"
        :draggable="false"
      >
        <file-system
          :roots="'timelapse'"
          name="timelapse"
          bulk-actions
          :max-height="816"
          :timelapse-browser="true"
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
export default class Timelapse extends Mixins(StateMixin) {
}
</script>
