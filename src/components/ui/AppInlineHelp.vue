<template>
  <v-tooltip
    :bottom="bottom"
    :top="top"
    :left="left"
    :right="right"
  >
    <template #activator="{ on, attrs }">
      <app-btn
        :small="small"
        v-bind="attrs"
        class="ml-2"
        :color="type"
        icon
        v-on="on"
      >
        <v-icon
          :small="small"
        >
          {{ (type === 'error' || type === 'warning') ? '$warning' : '$help' }}
        </v-icon>
      </app-btn>
    </template>
    <slot>
      <span v-html="tooltip" />
    </slot>
  </v-tooltip>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class AppInlineHelp extends Vue {
  @Prop({ type: String, required: false })
  public tooltip!: string

  @Prop({ type: String, default: 'primary' })
  public type!: string

  @Prop({ type: Boolean, default: false })
  public top!: boolean

  @Prop({ type: Boolean, default: false })
  public bottom!: boolean

  @Prop({ type: Boolean, default: false })
  public left!: boolean

  @Prop({ type: Boolean, default: false })
  public right!: boolean

  @Prop({ type: Boolean, default: false })
  public small!: boolean
}
</script>
