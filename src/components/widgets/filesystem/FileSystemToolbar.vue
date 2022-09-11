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

    <v-tooltip
      v-if="lowOnSpace && !loading"
      bottom
    >
      <template #activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          fab
          text
          small
          color="warning"
          v-on="on"
        >
          <v-icon color="warning">
            $error
          </v-icon>
        </v-btn>
      </template>
      <slot>
        <span>{{ $t('app.file_system.tooltip.low_on_space') }}</span>
      </slot>
    </v-tooltip>

    <v-tooltip
      v-if="disabled && !loading"
      bottom
    >
      <template #activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          fab
          text
          small
          color="error"
          v-on="on"
        >
          <v-icon color="error">
            $warning
          </v-icon>
        </v-btn>
      </template>
      <slot>
        <span>{{ $t('app.file_system.tooltip.root_disabled', { root }) }}</span>
      </slot>
    </v-tooltip>

    <app-btn-collapse-group
      v-if="['gcodes', 'timelapse'].includes(root)"
      :collapsed="true"
      menu-icon="$menu"
      size="small"
    >
      <app-slider
        v-model="thumbnailSize"
        :label="$t('app.general.label.thumbnail_size')"
        :min="32"
        :max="128"
        :step="16"
        suffix="px"
      />
    </app-btn-collapse-group>

    <app-column-picker
      v-if="headers && rootProperties.canConfigure"
      :key-name="`${root}_${name}`"
      :headers="headers"
    />

    <file-system-filter-menu
      v-if="hasFilterMenu"
      :root="root"
      :disabled="disabled"
      @change="$emit('filter', $event)"
    />

    <file-system-menu
      v-if="!readonly || canCreateDirectory"
      :root="root"
      :disabled="disabled"
      @add-file="$emit('add-file')"
      @add-dir="$emit('add-dir')"
      @upload="handleUpload"
    />

    <v-btn
      :disabled="disabled"
      fab
      small
      text
      @click="$emit('refresh')"
    >
      <v-icon>$refresh</v-icon>
    </v-btn>

    <div
      style="max-width: 160px;"
      class="ml-1"
    >
      <v-text-field
        v-model="textSearch"
        :disabled="disabled"
        outlined
        dense
        single-line
        hide-details
        append-icon="$magnify"
        @keyup="$emit('update:search', textSearch);"
      />
    </div>

    <template
      v-if="roots.length > 1"
      #extension
    >
      <v-tabs>
        <v-tab
          v-for="(root, index) in registeredRoots"
          :key="index"
          @change="$emit('root-change', root)"
        >
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
import AppBtnCollapseGroup from '@/components/ui/AppBtnCollapseGroup.vue'

@Component({
  components: {
    AppBtnCollapseGroup,
    FileSystemMenu,
    FileSystemFilterMenu
  }
})
export default class FileSystemToolbar extends Mixins(StatesMixin) {
  // The currently active root.
  @Prop({ type: String, required: true })
  readonly root!: string

  @Prop({ type: String, required: false })
  readonly name!: string

  // Can be a list of roots, or a single root.
  @Prop({ type: Array, required: false })
  readonly roots!: string[]

  // Currently defined list of headers.
  @Prop({ type: Array, required: false })
  readonly headers!: AppTableHeader[]

  // The current path
  @Prop({ type: String, required: false })
  readonly path!: string

  // If the controls are disabled or not.
  @Prop({ type: Boolean, default: false })
  readonly disabled!: boolean

  // If the fs is loading or not.
  @Prop({ type: Boolean, default: false })
  readonly loading!: boolean

  @Prop({ type: String, default: '' })
  readonly search!: string

  textSearch = ''

  get readonly () {
    return this.$store.getters['files/getRootProperties'](this.root).readonly
  }

  get canCreateDirectory () {
    return this.$store.getters['files/getRootProperties'](this.root).canCreateDirectory
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

  // Only show roots that have been registered.
  get registeredRoots () {
    return this.roots.filter(r => this.$store.state.server.info.registered_directories.includes(r))
  }

  get hasFilterMenu () {
    if (!this.readonly) {
      switch (this.root) {
        case 'gcodes':
          return this.supportsHistoryComponent
        case 'config':
          return true
      }
    }
    return false
  }

  get thumbnailSize () {
    return this.$store.state.config.uiSettings.general.thumbnailSize
  }

  set thumbnailSize (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.thumbnailSize',
      value,
      server: true
    })
  }

  mounted () {
    this.textSearch = this.search
  }

  handleUpload (files: FileList | File[], print: boolean) {
    this.$emit('upload', files, print)
  }
}
</script>
