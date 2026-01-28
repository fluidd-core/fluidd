<template>
  <v-tooltip
    right
    :disabled="isMobileViewport"
  >
    <template #activator="{ attrs, on }">
      <v-list-item
        :href="resolvedUrl"
        :target="newTab ? '_blank' : '_self'"
        link
        color="secondary"
        v-bind="attrs"
        v-on="on"
        @click="confirm ? handleConfirmClick($event) : undefined"
        @contextmenu.prevent="$emit('contextmenu', $event)"
      >
        <v-list-item-icon>
          <app-nav-link-icon
            :icon="icon"
            :custom-icon="customIcon"
            :custom-image="customImage"
            :color="resolvedColor"
          />
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title><slot /></v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </template>
    <span>
      <slot />
    </span>
  </v-tooltip>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import type { SvgIconPath } from '@/store/config/types'

import BrowserMixin from '@/mixins/browser'

@Component({})
export default class AppNavExternalItem extends Mixins(BrowserMixin) {
  @Prop({ type: String, required: true })
  readonly url!: string

  @Prop({ type: String })
  readonly icon?: string

  @Prop({ type: [String, Array] })
  readonly customIcon?: string | SvgIconPath[]

  @Prop({ type: String })
  readonly customImage?: string

  @Prop({ type: String })
  readonly color?: string

  @Prop({ type: Boolean, default: false })
  readonly confirm!: boolean

  @Prop({ type: Boolean, default: false })
  readonly newTab!: boolean

  get resolvedUrl (): string {
    if (this.url.startsWith('/')) {
      return `${window.location.origin}${this.url}`
    }
    return this.url
  }

  get resolvedColor (): string | undefined {
    return this.color === 'theme'
      ? this.$vuetify.theme.currentTheme.primary?.toString()
      : this.color
  }

  async handleConfirmClick (e: Event) {
    e.preventDefault()
    const result = await this.$confirm(
      this.$t('app.general.simple_form.msg.confirm_open_nav_link', { url: this.resolvedUrl }).toString(),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$warning' }
    )
    if (result) {
      window.open(this.resolvedUrl, this.newTab ? '_blank' : '_self')
    }
  }
}
</script>
