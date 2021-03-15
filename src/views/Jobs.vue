<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">
    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" class="pt-0">
        <v-card
          color="tertiary"
          class="filesystem-wrapper">

          <v-card-title class="quaternary rounded-t py-1">
            <v-icon left>$files</v-icon>
            <span class="font-weight-light">Jobs</span>
          </v-card-title>

          <file-system
            :roots="'gcodes'">
          </file-system>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
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
