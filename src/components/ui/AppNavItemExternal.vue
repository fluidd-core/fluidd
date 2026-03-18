<template>
  <v-tooltip
    right
    :disabled="isMobileViewport"
  >
    <template #activator="{ attrs, on }">
      <v-list-item
        :href="href"
        :target="target"
        link
        color="secondary"
        v-bind="attrs"
        v-on="on"
      >
        <v-list-item-icon>
          <v-icon>{{ icon || '$link' }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>{{ title }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </template>
    <span>{{ title }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { Component as VueComponent, Prop } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'
import BrowserMixin from '@/mixins/browser'

@VueComponent({})
export default class AppNavItemExternal extends mixins(BrowserMixin) {
  @Prop({ type: String, required: true })
  readonly title!: string

  @Prop({ type: String, required: true })
  readonly href!: string

  @Prop({ type: String, default: '_self' })
  readonly target!: string

  @Prop({ type: String, default: '' })
  readonly icon!: string
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';
</style>
