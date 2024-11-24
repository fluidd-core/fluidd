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
      <v-list-item @click="$emit('multiply', job)">
        <v-list-item-icon>
          <v-icon>
            $duplicate
          </v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.btn.multiply') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item @click="$emit('remove', job)">
        <v-list-item-icon>
          <v-icon>
            $delete
          </v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.btn.remove') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'
import type { QueuedJob } from '@/store/jobQueue/types'

@Component({})
export default class JobQueueContextMenu extends Vue {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Number, required: true })
  readonly positionX!: number

  @Prop({ type: Number, required: true })
  readonly positionY!: number

  @Prop({ type: [Object, Array], required: true })
  readonly job!: QueuedJob | QueuedJob[]
}
</script>
