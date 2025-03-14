<template>
  <div>
    <v-subheader id="browser">
      {{ $t('app.setting.title.file_browser') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting :title="$t('app.setting.label.text_sort_order')">
        <v-select
          v-model="textSortOrder"
          filled
          dense
          hide-details="auto"
          :items="availableTextSortOrders"
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.setting.label.drag_and_drop_functionality_for_files_and_folders')"
      >
        <v-switch
          v-model="filesAndFoldersDragAndDrop"
          hide-details
          @click.native.stop
        />
      </app-setting>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { TextSortOrder } from '@/store/config/types'

@Component({})
export default class FileEditorSettings extends Vue {
  get textSortOrder (): TextSortOrder {
    return this.$typedState.config.uiSettings.general.textSortOrder
  }

  set textSortOrder (value: TextSortOrder) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.textSortOrder',
      value,
      server: true
    })
  }

  get availableTextSortOrders () {
    return [
      {
        value: 'default',
        text: this.$t('app.general.label.default')
      },
      {
        value: 'numeric-prefix',
        text: this.$t('app.general.label.numeric_prefix_sort')
      },
      {
        value: 'version',
        text: this.$t('app.general.label.version_sort')
      }
    ]
  }

  get filesAndFoldersDragAndDrop (): boolean {
    return this.$typedState.config.uiSettings.general.filesAndFoldersDragAndDrop
  }

  set filesAndFoldersDragAndDrop (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.filesAndFoldersDragAndDrop',
      value,
      server: true
    })
  }
}
</script>
