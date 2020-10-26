<template>
  <v-card color="tertiary" class="mb-4">
    <v-card-title class="quaternary font-weight-light"><v-icon left>{{ icons.camera }}</v-icon> Camera</v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-text-field
        filled
        label="Camera URL"
        v-model="cameraUrl"
      ></v-text-field>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class CameraSettingsWidget extends Mixins(UtilsMixin) {
  get cameraUrl () {
    return this.$store.state.config.fileConfig.camera.url
  }

  set cameraUrl (value: string) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.camera.url', value })
  }
}
</script>
