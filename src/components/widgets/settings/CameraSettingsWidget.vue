<template>
  <v-card color="tertiary" class="mb-4">
    <v-card-title class="quaternary font-weight-light"><v-icon left>$camera</v-icon> Camera</v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-switch
        label="Enabled"
        hide-details
        v-model="enabled">
      </v-switch>
      <v-switch
        label="Flip horizontally"
        hide-details
        v-model="flipX">
      </v-switch>
      <v-switch
        label="Flip vertically"
        hide-details
        v-model="flipY">
      </v-switch>
      <v-text-field
        class="mt-5"
        filled
        label="Camera URL"
        v-model="url"
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
  get enabled () {
    return this.$store.state.config.fileConfig.camera.enabled
  }

  set enabled (value: boolean) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.camera.enabled', value })
  }

  get url () {
    return this.$store.state.config.fileConfig.camera.url
  }

  set url (value: string) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.camera.url', value })
  }

  get flipX () {
    return this.$store.state.config.fileConfig.camera.flipX
  }

  set flipX (value: boolean) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.camera.flipX', value })
  }

  get flipY () {
    return this.$store.state.config.fileConfig.camera.flipY
  }

  set flipY (value: boolean) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.camera.flipY', value })
  }
}
</script>
