<template>
  <v-tooltip :bottom="bottom" :top="top" :left="left" :right="right">
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        v-on="on"
        :small="small"
        :x-small="xSmall"
        class="ml-2"
        icon>
        <v-icon
          :small="small"
          :x-small="xSmall">
          $help
        </v-icon>
      </v-btn>
    </template>
    <slot>
      <span v-html="tooltip"></span>
    </slot>
  </v-tooltip>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class BtnToolheadMove extends Vue {
  @Prop({ type: String, required: false })
  tooltip!: string

  @Prop({ type: Boolean, default: false })
  top!: boolean

  @Prop({ type: Boolean, default: false })
  bottom!: boolean

  @Prop({ type: Boolean, default: false })
  left!: boolean

  @Prop({ type: Boolean, default: false })
  right!: boolean

  @Prop({ type: Boolean, default: false })
  small!: boolean

  @Prop({ type: Boolean, default: false })
  xSmall!: boolean
}
</script>
