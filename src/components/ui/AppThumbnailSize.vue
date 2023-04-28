<template>
  <v-menu
    bottom
    left
    offset-y
    transition="slide-y-transition"
    min-width="150"
    :close-on-content-click="false"
  >
    <template #activator="{ on: menu, attrs }">
      <v-tooltip bottom>
        <template #activator="{ on: tooltip }">
          <v-btn
            :disabled="disabled"
            fab
            small
            text
            v-bind="attrs"
            v-on="{ ...tooltip, ...menu }"
          >
            <v-icon>
              $imageSizeSelectLarge
            </v-icon>
          </v-btn>
        </template>
        <span>{{ $t('app.general.btn.thumbnail_size') }}</span>
      </v-tooltip>
    </template>
    <v-sheet class="pa-2">
      <app-named-slider
        v-model="thumbnailSize"
        class="ma-1"
        :label="$t('app.general.label.thumbnail_size')"
        :min="32"
        :max="192"
        :step="16"
        :reset-value="32"
        suffix="px"
      />
    </v-sheet>
  </v-menu>
</template>

<script lang="ts">
import { Component, Prop, VModel, Vue } from 'vue-property-decorator'

@Component({})
export default class FileSystemToolbar extends Vue {
  @VModel({ type: Number, required: true })
    thumbnailSize!: number

  @Prop({ type: Boolean, default: false })
  readonly disabled!: boolean
}
</script>
