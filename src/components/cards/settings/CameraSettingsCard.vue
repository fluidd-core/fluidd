<template>
  <collapsable-card
    title="Camera"
    cardKey="CameraSettings"
    icon="$camera">
    <v-card-text>
      <v-switch
        class="mt-0"
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
        class="mb-4"
        label="Flip vertically"
        hide-details
        v-model="flipY">
      </v-switch>
      <v-select
        label="Stream type"
        hide-details="auto"
        :items="[{ text: 'mjpgstreamer', value: 'mjpgstreamer' }, { text: 'ip camera', value: 'ipcamera' }]"
        v-model="streamType">
      </v-select>
      <v-text-field
        class="mt-5"
        filled
        label="Camera URL"
        v-model="url"
      ></v-text-field>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class CameraSettingsCard extends Mixins(UtilsMixin) {
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

  get streamType () {
    return this.$store.state.config.fileConfig.camera.type
  }

  set streamType (value: string) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.camera.type', value })
  }
}
</script>
