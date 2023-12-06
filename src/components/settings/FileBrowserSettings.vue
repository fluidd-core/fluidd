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
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class FileEditorSettings extends Vue {
  get textSortOrder () {
    return this.$store.state.config.uiSettings.general.textSortOrder
  }

  set textSortOrder (value: string) {
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
}
</script>
