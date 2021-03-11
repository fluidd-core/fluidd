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
        :value="url"
        @change="setUrl"
      ></v-text-field>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({
  components: {}
})
export default class CameraSettingsCard extends Mixins(StateMixin) {
  get enabled () {
    return this.$store.state.config.uiSettings.camera.enabled
  }

  set enabled (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.camera.enabled',
      value,
      server: true
    })
  }

  get url () {
    return this.$store.state.config.uiSettings.camera.url
  }

  setUrl (value: string) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.camera.url',
      value,
      server: true
    })
  }

  get flipX () {
    return this.$store.state.config.uiSettings.camera.flipX
  }

  set flipX (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.camera.flipX',
      value,
      server: true
    })
  }

  get flipY () {
    return this.$store.state.config.uiSettings.camera.flipY
  }

  set flipY (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.camera.flipY',
      value,
      server: true
    })
  }

  get streamType () {
    return this.$store.state.config.uiSettings.camera.type
  }

  set streamType (value: string) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.camera.type',
      value,
      server: true
    })
  }
}
</script>
