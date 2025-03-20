<template>
  <v-tooltip
    :bottom="bottom"
    :top="top"
    :left="left"
    :right="right"
  >
    <template #activator="{ on, attrs }">
      <v-icon
        :color="type"
        class="ml-2"
        v-bind="{...$attrs, attrs}"
        v-on="{...$listeners, ...on}"
      >
        {{ (type === 'error' || type === 'warning') ? '$warning' : '$help' }}
      </v-icon>
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
  @Prop({ type: String })
  readonly tooltip?: string

  @Prop({ type: String, default: 'primary' })
  readonly type!: string

  @Prop({ type: Boolean })
  readonly top?: boolean

  @Prop({ type: Boolean })
  readonly bottom?: boolean

  @Prop({ type: Boolean })
  readonly left?: boolean

  @Prop({ type: Boolean })
  readonly right?: boolean
}
</script>
