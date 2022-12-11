<template>
  <v-menu
    v-model="open"
    transition="slide-y-transition"
    :position-x="positionX"
    :position-y="positionY"
    min-width="180"
    absolute
    right
  >
    <v-list dense>
      <v-list-item
        link
        @click="$emit('remove', job)"
      >
        <v-list-item-icon>
          <v-icon>
            $delete
          </v-icon>
        </v-list-item-icon>
        <v-list-item-title>{{ $t('app.general.btn.remove') }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'
import { QueuedJob } from '@/store/jobQueue/types'

@Component({})
export default class FileSystemContextMenu extends Vue {
  @VModel({ type: Boolean, default: false })
    open!: boolean

  @Prop({ type: Number, required: true })
  readonly positionX!: number

  @Prop({ type: Number, required: true })
  readonly positionY!: number

  @Prop({ type: Object, required: true })
  readonly job!: QueuedJob
}
</script>
