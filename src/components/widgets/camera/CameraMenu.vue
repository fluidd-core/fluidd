<template>
  <v-menu
    bottom
    left
    offset-y
    transition="slide-y-transition"
    :min-width="150"
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
      <v-list-item @click="$emit('select', 'all')">
        <v-list-item-icon>
          <v-icon>
            $camera
          </v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            {{ $t('app.general.btn.all') }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <template v-for="item of cameras">
        <v-list-item
          :key="item.id"
          @click="$emit('select', item.id)"
        >
          <v-list-item-icon>
            <v-icon>
              $camera
            </v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ item.name }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class CamerasMenu extends Mixins(StateMixin) {
  get activeCamera () {
    let id = this.$store.getters['cameras/getActiveCamera']
    const camera = this.$store.getters['cameras/getCameraById'](id)

    // If no cam was found, the active id probably no longer exists - so
    // we'll set it to all.
    if (!camera) id = 'all'

    return (id === 'all')
      ? this.$t('app.general.btn.all')
      : camera.name
  }

  get cameras () {
    return this.$store.getters['cameras/getEnabledCameras']
  }
}
</script>
