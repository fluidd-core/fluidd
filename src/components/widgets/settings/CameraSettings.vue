<template>
  <div>
    <v-subheader id="camera">Camera</v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">
      <v-list
        color="transparent"
      >

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Enable</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-switch
              class="mt-0"
              hide-details="auto"
              v-model="enabled">
            </v-switch>
          </v-list-item-action>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Flip horizontally</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
          <v-switch
            hide-details
            v-model="flipX">
          </v-switch>
          </v-list-item-action>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Flip vertically</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-switch
              class="mb-4"
              hide-details
              v-model="flipY">
            </v-switch>
          </v-list-item-action>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Stream type</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-select
              filled
              dense
              hide-details="auto"
              :items="[{ text: 'mjpgstreamer', value: 'mjpgstreamer' }, { text: 'ip camera', value: 'ipcamera' }]"
              v-model="streamType">
            </v-select>
          </v-list-item-action>
        </v-list-item>

        <v-divider />

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Camera URL</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-text-field
              class="mt-5"
              filled
              dense
              single-line
              hide-details
              ref="cameraUrl"
              :value="url"
              @change="setUrl"
              :rules="cameraUrlRules"
            ></v-text-field>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({
  components: {}
})
export default class CameraSettingsCard extends Mixins(StateMixin) {
  @Ref('cameraUrl') readonly cameraUrlElement!: any

  cameraUrlRules = [
    (v: string) => !!v || 'Required'
  ]

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
    if (this.cameraUrlElement.valid) {
      this.$store.dispatch('config/saveByPath', {
        path: 'uiSettings.camera.url',
        value,
        server: true
      })
    }
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
