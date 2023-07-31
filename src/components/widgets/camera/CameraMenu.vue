<template>
  <v-menu
    bottom
    left
    offset-y
    transition="slide-y-transition"
    min-width="150"
  >
    <template #activator="{ on, attrs, value }">
      <app-btn
        v-bind="attrs"
        small
        class="ms-1 my-1"
        v-on="on"
      >
        <v-icon
          small
          class="mr-1"
        >
          $camera
        </v-icon>
        {{ activeCamera }}
        <v-icon
          small
          class="ml-1"
          :class="{ 'rotate-180': value }"
        >
          $chevronDown
        </v-icon>
      </app-btn>
    </template>
    <v-list dense>
      <v-list-item
        v-for="camera of availableCameras"
        :key="camera.uid"
        @click="$emit('select', camera.uid)"
      >
        <v-list-item-icon>
          <v-icon>
            $camera
          </v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            {{ camera.name }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { WebcamConfig } from '@/store/webcams/types'

@Component({})
export default class CamerasMenu extends Mixins(StateMixin) {
  get activeCamera () {
    const activeWebcam = this.$store.state.webcams.activeWebcam as string
    const camera = this.$store.getters['webcams/getWebcamById'](activeWebcam) as WebcamConfig | undefined

    return !camera
      ? this.$t('app.general.btn.all')
      : camera.name
  }

  get enabledWebcams (): WebcamConfig[] {
    return this.$store.getters['webcams/getEnabledWebcams'] as WebcamConfig[]
  }

  get availableCameras (): Pick<WebcamConfig, 'uid' | 'name'>[] {
    return [
      {
        uid: 'all',
        name: this.$t('app.general.btn.all').toString()
      },
      ...this.enabledWebcams
    ]
  }
}
</script>
