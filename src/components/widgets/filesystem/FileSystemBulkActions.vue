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
      v-if="root === 'gcodes'"
      bottom
    >
      <template #activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          fab
          small
          text
          v-on="on"
          @click="$emit('enqueue')"
        >
          <v-icon>
            $enqueueJob
          </v-icon>
        </v-btn>
      </template>
      <span>{{ $t('app.general.btn.add_to_queue') }}</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          fab
          small
          text
          v-on="on"
          @click="$emit('create-zip')"
        >
          <v-icon>
            $fileZipAdd
          </v-icon>
        </v-btn>
      </template>
      <span>{{ $t('app.general.btn.create_zip_archive') }}</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          fab
          small
          text
          v-on="on"
          @click="$emit('remove')"
        >
          <v-icon>
            $delete
          </v-icon>
        </v-btn>
      </template>
      <span>{{ $t('app.general.btn.delete') }}</span>
    </v-tooltip>
  </v-toolbar>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StatesMixin from '@/mixins/state'

@Component({})
export default class FileSystemBulkActions extends Mixins(StatesMixin) {
  @Prop({ type: String, required: true })
  readonly root!: string

  // The current path
  @Prop({ type: String })
  readonly path!: string
}
</script>
