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
      v-if="canAddToQueue"
      bottom
    >
      <template #activator="{ on, attrs }">
        <app-btn
          v-bind="attrs"
          icon
          text
          v-on="on"
          @click="$emit('enqueue', selected)"
        >
          <v-icon>
            $enqueueJob
          </v-icon>
        </app-btn>
      </template>
      <span>{{ $t('app.general.btn.add_to_queue') }}</span>
    </v-tooltip>

    <v-tooltip
      v-if="canRefreshMetadata"
      bottom
    >
      <template #activator="{ on, attrs }">
        <app-btn
          v-bind="attrs"
          icon
          text
          v-on="on"
          @click="$emit('refresh-metadata', selected)"
        >
          <v-icon>
            $sync
          </v-icon>
        </app-btn>
      </template>
      <span>{{ $t('app.general.btn.refresh_metadata') }}</span>
    </v-tooltip>

    <v-tooltip
      v-if="canPerformTimeAnalysys"
      bottom
    >
      <template #activator="{ on, attrs }">
        <app-btn
          v-bind="attrs"
          icon
          text
          v-on="on"
          @click="$emit('perform-time-analysis', selected)"
        >
          <v-icon>
            $stopwatch
          </v-icon>
        </app-btn>
      </template>
      <span>{{ $t('app.general.btn.perform_time_analysis') }}</span>
    </v-tooltip>

    <v-tooltip
      v-if="canCreateZip"
      bottom
    >
      <template #activator="{ on, attrs }">
        <app-btn
          v-bind="attrs"
          icon
          text
          v-on="on"
          @click="$emit('create-zip', selected)"
        >
          <v-icon>
            $fileZipAdd
          </v-icon>
        </app-btn>
      </template>
      <span>{{ $t('app.general.btn.create_zip_archive') }}</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <app-btn
          v-bind="attrs"
          icon
          text
          v-on="on"
          @click="$emit('remove', selected)"
        >
          <v-icon>
            $delete
          </v-icon>
        </app-btn>
      </template>
      <span>{{ $t('app.general.btn.delete') }}</span>
    </v-tooltip>
  </v-toolbar>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StatesMixin from '@/mixins/state'
import type { FileBrowserEntry, RootProperties } from '@/store/files/types'

@Component({})
export default class FileSystemBulkActions extends Mixins(StatesMixin) {
  @Prop({ type: String, required: true })
  readonly root!: string

  // The current path
  @Prop({ type: String })
  readonly path!: string

  @Prop({ type: [Object, Array], required: true })
  readonly selected!: FileBrowserEntry[]

  get rootProperties (): RootProperties {
    return this.$typedGetters['files/getRootProperties'](this.root)
  }

  get canCreateZip (): boolean {
    return (
      (
        this.selected.length > 1 ||
        this.selected[0].type !== 'file' ||
        this.selected[0].extension !== '.zip'
      ) &&
      !this.rootProperties.readonly &&
      this.$typedGetters['server/getIsMinApiVersion']('1.1.0')
    )
  }

  get isGcodesRootWithAcceptedFiles () {
    return (
      this.root === 'gcodes' &&
      this.selected.some(x =>
        x.type !== 'directory' &&
        this.rootProperties.accepts.includes(x.extension)
      )
    )
  }

  get canAddToQueue (): boolean {
    return (
      this.isGcodesRootWithAcceptedFiles &&
      this.$typedGetters['server/componentSupport']('job_queue')
    )
  }

  get canRefreshMetadata (): boolean {
    return (
      this.isGcodesRootWithAcceptedFiles
    )
  }

  get canPerformTimeAnalysys (): boolean {
    return (
      this.isGcodesRootWithAcceptedFiles &&
      this.$typedGetters['server/componentSupport']('analysis')
    )
  }
}
</script>
