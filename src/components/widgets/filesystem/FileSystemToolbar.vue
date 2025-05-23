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
      v-if="klippyReady && !loading && lowOnSpace"
      bottom
    >
      <template #activator="{ on, attrs }">
        <app-btn
          v-bind="attrs"
          icon
          text
          color="warning"
          v-on="on"
        >
          <v-icon color="warning">
            $error
          </v-icon>
        </app-btn>
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
        <app-btn
          v-bind="attrs"
          icon
          text
          color="error"
          v-on="on"
        >
          <v-icon color="error">
            $warning
          </v-icon>
        </app-btn>
      </template>
      <slot>
        <span>{{ $t('app.file_system.tooltip.root_disabled', { root }) }}</span>
      </slot>
    </v-tooltip>

    <app-thumbnail-size
      v-if="['gcodes', 'timelapse'].includes(root)"
      v-model="thumbnailSize"
    />

    <app-column-picker
      v-if="headers && canConfigure"
      :key-name="`${root}_${name}`"
      :headers="headers"
    />

    <div>
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            :disabled="disabled"
            icon
            text
            @click="$emit('go-to-file')"
            v-on="on"
          >
            <v-icon>$magnify</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('app.general.btn.go_to_file') }}</span>
      </v-tooltip>
    </div>

    <file-system-filter-menu
      v-if="hasFilterTypes"
      :root="root"
      :disabled="disabled"
      @change="$emit('filter', $event)"
    />

    <file-system-add-menu
      v-if="!readonly"
      :root="root"
      :disabled="disabled"
      @add-file="$emit('add-file')"
      @add-dir="$emit('add-dir')"
      @upload="handleUpload"
    />

    <div>
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            :disabled="disabled"
            icon
            text
            @click="$emit('refresh')"
            v-on="on"
          >
            <v-icon>$refresh</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('app.general.btn.refresh') }}</span>
      </v-tooltip>
    </div>

    <div
      style="max-width: 160px;"
      class="ml-1"
    >
      <v-text-field
        v-model="searchModel"
        :disabled="disabled"
        outlined
        dense
        single-line
        hide-details
        spellcheck="false"
        append-icon="$magnify"
        @focus="$event.target.select()"
      />
    </div>

    <template
      v-if="roots && roots.length > 1"
      #extension
    >
      <v-tabs show-arrows>
        <v-tab
          v-for="(root, index) in roots"
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
import { Component, Prop, Mixins, PropSync } from 'vue-property-decorator'
import StatesMixin from '@/mixins/state'
import FileSystemAddMenu from './FileSystemAddMenu.vue'
import FileSystemFilterMenu from './FileSystemFilterMenu.vue'
import type { AppDataTableHeader } from '@/types'
import type { RootProperties } from '@/store/files/types'

@Component({
  components: {
    FileSystemAddMenu,
    FileSystemFilterMenu
  }
})
export default class FileSystemToolbar extends Mixins(StatesMixin) {
  // The currently active root.
  @Prop({ type: String, required: true })
  readonly root!: string

  @Prop({ type: String, required: true })
  readonly name!: string

  // Can be a list of roots, or a single root.
  @Prop({ type: Array })
  readonly roots?: string[]

  // Currently defined list of headers.
  @Prop({ type: Array })
  readonly headers?: AppDataTableHeader[]

  // The current path
  @Prop({ type: String })
  readonly path!: string

  // If the controls are disabled or not.
  @Prop({ type: Boolean })
  readonly disabled?: boolean

  // If the fs is loading or not.
  @Prop({ type: Boolean })
  readonly loading?: boolean

  @PropSync('search', { type: String, default: '' })
  searchModel!: string

  get readonly () {
    return this.rootProperties.readonly
  }

  get canConfigure () {
    return this.rootProperties.canConfigure
  }

  get hasFilterTypes () {
    return this.rootProperties.filterTypes.length > 0
  }

  get lowOnSpace (): boolean {
    return this.$typedGetters['files/getDiskUsage'](this.root)?.lowOnSpace ?? false
  }

  // Properties of the current root.
  get rootProperties (): RootProperties {
    return this.$typedGetters['files/getRootProperties'](this.root)
  }

  get thumbnailSize (): number {
    return this.$typedState.config.uiSettings.thumbnailSizes[this.root] ?? 32
  }

  set thumbnailSize (value: number) {
    this.$typedDispatch('config/updateThumbnailSizes', { name: this.root, size: value })
  }

  handleUpload (files: FileList | File[], print: boolean) {
    this.$emit('upload', files, print)
  }
}
</script>
