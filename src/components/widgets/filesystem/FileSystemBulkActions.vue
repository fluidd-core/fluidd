<template>
  <v-toolbar
    dense
  >
    <v-toolbar-title class="d-none d-sm-block">
      <div class="file-path">
        &lrm;/{{ path }}
      </div>
    </v-toolbar-title>

    <v-spacer />

    <v-tooltip bottom>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          fab
          small
          text
          v-bind="attrs"
          v-on="on"
          @click="$emit('remove')"
        >
          <v-icon>
            $delete
          </v-icon>
        </v-btn>
      </template>
      <slot>
        <span>Delete</span>
      </slot>
    </v-tooltip>

    <!-- <v-tooltip bottom>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          fab small text
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>
            $move
          </v-icon>
        </v-btn>
      </template>
      <slot>
        <span>Move to</span>
      </slot>
    </v-tooltip> -->
  </v-toolbar>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StatesMixin from '@/mixins/state'
import FileSystemMenu from './FileSystemMenu.vue'
import FileSystemFilterMenu from './FileSystemFilterMenu.vue'

@Component({
  components: {
    FileSystemMenu,
    FileSystemFilterMenu
  }
})
export default class FileSystemBulkActions extends Mixins(StatesMixin) {
  // The current path
  @Prop({ type: String, required: false })
  path!: string;
}
</script>
