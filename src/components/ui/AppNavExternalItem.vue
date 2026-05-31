<template>
  <v-tooltip
    right
    :disabled="isMobileViewport || hideTooltip"
  >
    <template #activator="{ attrs, on }">
      <v-list-item
        :href="newTab ? undefined : resolvedUrl"
        :data-id="dataId"
        link
        color="secondary"
        v-bind="attrs"
        v-on="on"
        @click="handleClick($event)"
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
import { isSafeNavLinkUrl } from '@/util/nav-link'

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

  @Prop({ type: Boolean, default: false })
  readonly hideTooltip!: boolean

  @Prop({ type: String })
  readonly dataId?: string

  get resolvedUrl (): string {
    // Defend at the sink: never resolve an unsafe (script-capable) URL, regardless of source.
    if (!isSafeNavLinkUrl(this.url)) {
      return '#'
    }
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

  handleClick (e: Event) {
    if (!isSafeNavLinkUrl(this.url)) {
      // Unsafe URL resolves to '#'; suppress navigation entirely rather than scroll/hash.
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (this.newTab) {
      // New tab - use anchor element for reliable cross-browser behavior
      e.preventDefault()
      e.stopPropagation()
      const a = document.createElement('a')
      a.href = this.resolvedUrl
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else if (this.confirm) {
      // Same window with confirm
      e.preventDefault()
      this.handleConfirmNavigation()
    }
    // If neither newTab nor confirm, let the href handle it naturally
  }

  async handleConfirmNavigation () {
    const result = await this.$confirm(
      this.$t('app.general.simple_form.msg.confirm_open_nav_link', { url: this.resolvedUrl }).toString(),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$warning' }
    )
    if (result) {
      window.location.href = this.resolvedUrl
    }
  }
}
</script>
