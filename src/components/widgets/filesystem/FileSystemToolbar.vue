<template>
  <v-toolbar
    dense
  >
    <v-toolbar-title class="grey--text text--lighten-1 d-none d-sm-block">
      <div class="file-path">&lrm;/{{ path }}</div>
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <div style="max-width: 160px;" class="mr-1">
      <v-text-field
        v-model="search"
        :disabled="disabled"
        @keyup="$emit('update:search', search);"
        outlined
        dense
        single-line
        hide-details
        append-icon="$magnify">
      </v-text-field>
    </div>

    <v-tooltip bottom v-if="lowOnSpace && !loading">
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          v-on="on"
          fab
          text
          small
          color="warning">
          <v-icon color="warning">$error</v-icon>
        </v-btn>
      </template>
      <slot>
        <span>Low on disk space</span>
      </slot>
    </v-tooltip>

    <v-tooltip bottom v-if="disabled && !loading">
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          v-on="on"
          fab
          text
          small
          color="error">
          <v-icon color="error">$error</v-icon>
        </v-btn>
      </template>
      <slot>
        <span>Filesystem disabled. Reconnect klipper.</span>
      </slot>
    </v-tooltip>

    <v-btn
      @click="$emit('refresh')"
      :disabled="disabled"
      fab
      small
      text>
      <v-icon>$refresh</v-icon>
    </v-btn>

    <file-system-menu
      v-if="!readonly"
      :root="root"
      :disabled="disabled"
      @add-file="$emit('add-file')"
      @add-dir="$emit('add-dir')"
      @upload="handleUpload"
    >
    </file-system-menu>

    <template
      v-if="roots.length > 1"
      v-slot:extension
    >
      <v-tabs>
        <v-tab
          v-for="(root, index) in roots"
          :key="index"
          @change="$emit('root-change', root)">
          {{ root }}
        </v-tab>
      </v-tabs>
    </template>
  </v-toolbar>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import StatesMixin from '@/mixins/state'
import FileSystemMenu from './FileSystemMenu.vue'

@Component({
  components: {
    FileSystemMenu
  }
})
export default class FileSystemToolbar extends Mixins(StatesMixin) {
  // The currently active root.
  @Prop({ type: String, required: true })
  root!: string

  // Can be a list of roots, or a single root.
  @Prop({ type: Array, required: false })
  roots!: string[];

  // The current path
  @Prop({ type: String, required: false })
  path!: string;

  // If the controls are disabled or not.
  @Prop({ type: Boolean, default: false })
  disabled!: boolean

  // If the fs is loading or not.
  @Prop({ type: Boolean, default: false })
  loading!: boolean

  search = ''

  get readonly () {
    return this.$store.getters['files/getRootProperties'](this.root).readonly
  }

  get lowOnSpace () {
    if (!this.klippyReady) return false
    return this.$store.getters['files/getLowOnSpace']
  }

  handleUpload (files: FileList, print: boolean) {
    this.$emit('upload', files, print)
  }
}
</script>
