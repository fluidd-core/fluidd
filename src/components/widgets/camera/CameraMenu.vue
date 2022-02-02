<template>
  <v-menu
    bottom
    left
    offset-y
    transition="slide-y-transition"
    :min-width="150"
  >
  <template v-slot:activator="{ on, attrs, value }">
    <app-btn
      v-bind="attrs" v-on="on"
      small
    >
      <v-icon small class="mr-1">$camera</v-icon>
      {{ activeCamera }}
      <v-icon small class="ml-1" :class="{ 'rotate-180': value }">$chevronDown</v-icon>
    </app-btn>
  </template>
  <v-list
    dense>
    <v-list-item
      @click="$emit('select', 'all')"
      link
      dense
    >
      <v-list-item-title>
        <v-icon small left color="secondary">$camera</v-icon>
        {{ $t('app.general.btn.all') }}
      </v-list-item-title>
    </v-list-item>

    <v-list-item
      v-for="item of cameras"
      :key="item.id"
      @click="$emit('select', item.id)"
      link
      dense
    >
      <v-list-item-title>
        <v-icon small left color="secondary">$camera</v-icon>
        {{ item.name }}
      </v-list-item-title>
    </v-list-item>
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
