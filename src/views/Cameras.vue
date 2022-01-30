<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown" justify="center">
    <v-col cols="12" lg="8" class="fill-height">
      <router-view v-if="authenticated && socketConnected" />
      <div v-if="$route.matched.length === 1">
        <camera-card
          :expandable="false"
          :collapsable="false"
          :layoutPath="null"
        ></camera-card>
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

import CameraCard from '@/components/widgets/camera/CameraCard.vue'

@Component({
  components: {
    CameraCard
  }
})
export default class Cameras extends Mixins(StateMixin) {
}
</script>
