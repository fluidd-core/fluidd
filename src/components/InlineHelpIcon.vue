<template>
  <v-tooltip :bottom="bottom" :top="top" :left="left" :right="right">
    <template v-slot:activator="{ on, attrs }">
      <btn
        :small="small"
        v-bind="attrs"
        v-on="on"
        class="ml-2"
        :color="type"
        icon>
        <v-icon
        :small="small"
        >
          {{ (type === 'error' || type === 'warning') ? '$alert' : '$help' }}
        </v-icon>
      </btn>
    </template>
    <slot>
      <span v-html="tooltip"></span>
    </slot>
  </v-tooltip>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class InlineHelp extends Vue {
  @Prop({ type: String, required: false })
  tooltip!: string

  @Prop({ type: String, default: 'primary' })
  type!: string

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
}
</script>
