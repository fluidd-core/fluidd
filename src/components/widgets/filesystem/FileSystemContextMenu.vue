<template>
  <v-menu
    transition="slide-x-transition"
    :value="open"
    @input="$emit('update:open', $event)"
    :position-x="positionX"
    :position-y="positionY"
    min-width="180"
    absolute
    right>

    <v-card>
      <v-row align="center" justify="center" no-gutters>
        <v-col>
          <v-list
            dense>
            <v-list-item
              link
              @click="$emit('print', file)"
              v-if="file.type !== 'directory' && rootProperties.accepts.includes('.' + file.extension) && rootProperties.canPrint">
              <v-list-item-icon>
                <v-icon>$printer</v-icon>
              </v-list-item-icon>
              <v-list-item-title>
                Print
                </v-list-item-title>
            </v-list-item>
            <v-list-item
              link
              @click="$emit('preheat', file)"
              v-if="canPreheat"
            >
              <v-list-item-icon>
                <v-icon>$fire</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t('app.general.btn.preheat') }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              link
              @click="$emit('edit', file)"
              v-if="file.type !== 'directory' && rootProperties.canEdit && !isMobile">
              <v-list-item-icon>
                <v-icon>$pencil</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t('app.general.btn.edit') }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              link
              @click="$emit('view', file)"
              v-if="file.type !== 'directory' && rootProperties.canView && !isMobile">
              <v-list-item-icon>
                <v-icon>$magnify</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t('app.general.btn.view') }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              link
              @click="$emit('download', file)"
              v-if="file.type !== 'directory'">
              <v-list-item-icon>
                <v-icon >$download</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t('app.general.btn.download') }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              link
              @click="$emit('rename', file)"
              v-if="!rootProperties.readonly">
              <v-list-item-icon>
                <v-icon>$rename</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t('app.general.btn.rename') }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              link
              @click="$emit('remove', file)"
              v-if="!rootProperties.readonly">
              <v-list-item-icon>
                <v-icon>$delete</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t('app.general.btn.remove') }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-col>
        <v-col class="px-2 d-none d-sm-flex" v-if="file.thumbnails && file.thumbnails.length">
          <img
            class="mr-2 ml-2"
            :src="getThumbUrl(file.thumbnails, file.path, true)"
            :height="150"
          />
        </v-col>
      </v-row>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import FilesMixin from '@/mixins/files'
import StateMixin from '@/mixins/state'
import { AppFile, AppFileWithMeta } from '@/store/files/types'

/**
 * NOTE: Generally, moonraker expects the paths to include the root.
 */
@Component({})
export default class FileSystemContextMenu extends Mixins(StateMixin, FilesMixin) {
  @Prop({ type: String, required: true })
  root!: string

  @Prop({ type: Boolean, default: false })
  open!: boolean

  @Prop({ type: Object, required: true })
  file!: AppFile | AppFileWithMeta

  @Prop({ type: Number, required: true })
  positionX!: number

  @Prop({ type: Number, required: true })
  positionY!: number

  get rootProperties () {
    return this.$store.getters['files/getRootProperties'](this.root)
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  get canPreheat () {
    return (
      'first_layer_extr_temp' in this.file &&
      'first_layer_bed_temp' in this.file &&
      !this.printerPrinting &&
      !this.printerPaused &&
      this.klippyReady
    )
  }
}
</script>
