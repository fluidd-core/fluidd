<template>
  <v-toolbar
    color="tertiary"
    dense
  >
    <v-toolbar-title class="grey--text text--lighten-1 d-none d-sm-block">
      <div class="file-path">&lrm;/{{ path }}</div>
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <div style="max-width: 160px;" class="mr-1">
      <v-text-field
        v-model="search"
        @keyup="$emit('update:search', search);"
        outlined
        dense
        single-line
        hide-details
        append-icon="$magnify">
      </v-text-field>
    </div>

    <v-btn
      @click="$emit('refresh')"
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
import { Component, Prop, Vue } from 'vue-property-decorator'
import FileSystemMenu from './FileSystemMenu.vue'

@Component({
  components: {
    FileSystemMenu
  }
})
export default class FileSystemToolbar extends Vue {
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

  search = ''

  get readonly () {
    return this.$store.getters['files/getRootProperties'](this.root).readonly
  }

  handleUpload (files: FileList, print: boolean) {
    this.$emit('upload', files, print)
  }
}
</script>
