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
        v-model="textSearch"
        :disabled="disabled"
        @keyup="$emit('update:search', textSearch);"
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
        <span>{{ $t('app.file_system.tooltip.low_on_space') }}</span>
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
        <span>{{ $t('app.file_system.tooltip.disabled') }}</span>
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

    <file-system-filter-menu
      v-if="!readonly && root === 'gcodes' && supportsHistoryComponent"
      :root="root"
      :disabled="disabled"
      @change="$emit('filter', $event)"
    >
    </file-system-filter-menu>

    <file-system-menu
      v-if="!readonly"
      :root="root"
      :disabled="disabled"
      @add-file="$emit('add-file')"
      @add-dir="$emit('add-dir')"
      @upload="handleUpload"
    >
    </file-system-menu>

    <app-column-picker
      v-if="headers && rootProperties.canConfigure"
      :key-name="`${root}_${name}`"
      :headers="headers"
    ></app-column-picker>

    <template
      v-if="roots.length > 1"
      v-slot:extension
    >
      <v-tabs>
        <v-tab
          v-for="(root, index) in registeredRoots"
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
import FileSystemFilterMenu from './FileSystemFilterMenu.vue'
import { AppTableHeader } from '@/types'

@Component({
  components: {
    FileSystemMenu,
    FileSystemFilterMenu
  }
})
export default class FileSystemToolbar extends Mixins(StatesMixin) {
  // The currently active root.
  @Prop({ type: String, required: true })
  root!: string

  @Prop({ type: String, required: false })
  name!: string;

  // Can be a list of roots, or a single root.
  @Prop({ type: Array, required: false })
  roots!: string[];

  // Currently defined list of headers.
  @Prop({ type: Array, required: false })
  headers!: AppTableHeader[];

  // The current path
  @Prop({ type: String, required: false })
  path!: string;

  // If the controls are disabled or not.
  @Prop({ type: Boolean, default: false })
  disabled!: boolean

  // If the fs is loading or not.
  @Prop({ type: Boolean, default: false })
  loading!: boolean

  @Prop({ type: String, default: '' })
  search!: string

  textSearch = ''

  get readonly () {
    return this.$store.getters['files/getRootProperties'](this.root).readonly
  }

  get lowOnSpace () {
    if (!this.klippyReady) return false
    return this.$store.getters['files/getLowOnSpace']
  }

  get supportsHistoryComponent () {
    return this.$store.getters['server/componentSupport']('history')
  }

  // Properties of the current root.
  get rootProperties () {
    return this.$store.getters['files/getRootProperties'](this.root)
  }

  mounted () {
    this.textSearch = this.search
  }

  // Only show roots that have been registered.
  get registeredRoots () {
    return this.roots.filter(r => this.$store.state.server.info.registered_directories.includes(r))
  }

  handleUpload (files: FileList | File[], print: boolean) {
    this.$emit('upload', files, print)
  }
}
</script>
