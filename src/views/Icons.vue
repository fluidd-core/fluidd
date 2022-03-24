<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col cols="12">
      <h1>All configured icons</h1>

      <v-tooltip
        v-for="icon in icons"
        :key="icon"
        class="d-inline-block"
        top
      >
        <template #activator="{ attrs, on }">
          <v-icon
            v-bind="attrs"
            class="ma-2"
            v-on="on"
          >
            ${{ icon }}
          </v-icon>
        </template>
        {{ icon }}
      </v-tooltip>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Icons } from '@/globals'

@Component({})
export default class Configure extends Mixins(StateMixin) {
  get icons () {
    return Object.keys(Icons)
  }
}
</script>
