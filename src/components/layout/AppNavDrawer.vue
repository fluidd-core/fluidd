<template>
  <v-navigation-drawer
    v-model="open"
    :color="$vuetify.theme.currentTheme.drawer"
    :mini-variant="!showSubNavigation"
    :floating="!showSubNavigation"
    clipped
    app
  >
    <v-row
      class="fill-height"
      no-gutters
    >
      <v-navigation-drawer
        :color="$vuetify.theme.currentTheme.drawer"
        mini-variant
        :value="open"
        class="pb-16 pb-sm-0"
      >
        <div
          v-if="isMobileViewport"
          :style="`height: ${$globals.HEADER_HEIGHT}px;`"
          class="app-icon"
        >
          <router-link :to="{ name: 'home' }">
            <app-icon />
          </router-link>
        </div>

        <div
          v-if="socketConnected && authenticated"
          class="nav-items"
        >
          <!-- Draggable system links -->
          <app-draggable
            v-model="systemLinksLocal"
            :options="{ handle: '' }"
            @end="handleSystemLinkDragEnd"
          >
            <app-nav-item
              v-for="item in systemLinksLocal"
              :key="item.id"
              :icon="item.icon"
              :exact="item.exact"
              :to="item.to"
              @contextmenu="openContextMenu(item, 'system', $event)"
            >
              {{ $t(item.title) }}
            </app-nav-item>
          </app-draggable>

          <!-- Hamburger menu for collapsed system links -->
          <v-menu
            v-if="collapsedSystemLinkItems.length > 0"
            right
            offset-x
            :close-on-content-click="true"
          >
            <template #activator="{ on, attrs }">
              <v-tooltip
                right
                :disabled="isMobileViewport"
              >
                <template #activator="{ attrs: tooltipAttrs, on: tooltipOn }">
                  <v-list-item
                    link
                    color="secondary"
                    v-bind="{ ...attrs, ...tooltipAttrs }"
                    v-on="{ ...on, ...tooltipOn }"
                  >
                    <v-list-item-icon>
                      <v-icon>$menuAlt</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>{{ $t('app.general.title.more') }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </template>
                <span>{{ $t('app.general.title.more') }}</span>
              </v-tooltip>
            </template>
            <v-list dense>
              <v-list-item
                v-for="item in collapsedSystemLinkItems"
                :key="item.id"
                :to="{ name: item.to }"
                @contextmenu.prevent="openContextMenu(item, 'system', $event)"
              >
                <v-list-item-icon>
                  <v-icon>{{ item.icon }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ $t(item.title) }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-menu>

          <!-- Bookmarks popup for collapsed custom links -->
          <v-menu
            v-if="collapsedCustomLinkItems.length > 0"
            right
            offset-x
            :close-on-content-click="true"
          >
            <template #activator="{ on, attrs }">
              <v-tooltip
                right
                :disabled="isMobileViewport"
              >
                <template #activator="{ attrs: tooltipAttrs, on: tooltipOn }">
                  <v-list-item
                    link
                    color="secondary"
                    v-bind="{ ...attrs, ...tooltipAttrs }"
                    v-on="{ ...on, ...tooltipOn }"
                  >
                    <v-list-item-icon>
                      <v-icon>$bookmarkMultiple</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>{{ $t('app.general.title.bookmarks') }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </template>
                <span>{{ $t('app.general.title.bookmarks') }}</span>
              </v-tooltip>
            </template>
            <v-list dense>
              <v-list-item
                v-for="link in collapsedCustomLinkItems"
                :key="link.id"
                :href="resolveCustomLinkUrl(link.url)"
                :target="openNavLinksInNewTab ? '_blank' : '_self'"
                @contextmenu.prevent="openContextMenu(link, 'custom', $event)"
              >
                <v-list-item-icon>
                  <app-nav-link-icon
                    :icon="`$${link.icon}`"
                    :custom-icon="link.customIcon"
                    :custom-image="link.customImage"
                    :color="resolveColor(link.color)"
                  />
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ link.title }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-menu>

          <!-- Draggable custom links -->
          <app-draggable
            v-model="customLinksLocal"
            :options="{ handle: '' }"
            @end="handleCustomLinkDragEnd"
          >
            <app-nav-external-item
              v-for="link in customLinksLocal"
              :key="link.id"
              :icon="`$${link.icon}`"
              :custom-icon="link.customIcon"
              :custom-image="link.customImage"
              :color="link.color"
              :url="link.url"
              :confirm="confirmOnNavLink"
              :new-tab="openNavLinksInNewTab"
              @contextmenu="openContextMenu(link, 'custom', $event)"
            >
              {{ link.title }}
            </app-nav-external-item>
          </app-draggable>

          <!-- Unified context menu -->
          <v-menu
            v-model="contextMenuState.open"
            transition="slide-y-transition"
            :position-x="contextMenuState.x"
            :position-y="contextMenuState.y"
            min-width="180"
            absolute
            right
            :z-index="10"
          >
            <v-list dense>
              <!-- Collapse / Show toggle (all types) -->
              <v-list-item
                v-if="contextMenuState.item"
                @click="toggleContextItemCollapse"
              >
                <v-list-item-icon>
                  <v-icon>
                    {{ isContextItemCollapsed ? '$eye' : '$eyeOff' }}
                  </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>
                    <template v-if="isContextItemCollapsed">
                      {{ $t('app.general.label.show_in_sidebar') }}
                    </template>
                    <template v-else-if="contextMenuState.type === 'system'">
                      {{ $t('app.general.label.collapse_to_more_menu') }}
                    </template>
                    <template v-else>
                      {{ $t('app.general.label.collapse_to_bookmarks') }}
                    </template>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>

              <!-- Edit (custom non-theme only) -->
              <v-list-item
                v-if="contextMenuState.item && contextMenuState.type === 'custom' && !isContextItemThemeLink"
                @click="handleContextEdit"
              >
                <v-list-item-icon>
                  <v-icon>$pencil</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ $t('app.general.btn.edit') }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>

              <!-- Delete (custom non-theme only) -->
              <v-list-item
                v-if="contextMenuState.item && contextMenuState.type === 'custom' && !isContextItemThemeLink"
                @click="handleContextDelete"
              >
                <v-list-item-icon>
                  <v-icon>$delete</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ $t('app.general.btn.delete') }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>

              <!-- Hide (theme links only) -->
              <v-list-item
                v-if="contextMenuState.item && contextMenuState.type === 'custom' && isContextItemThemeLink"
                @click="handleContextHideThemeLink"
              >
                <v-list-item-icon>
                  <v-icon>$eyeOff</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ $t('app.general.btn.hide') }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-menu>

          <!-- Settings link (always last, not draggable) -->
          <app-nav-item
            icon="$cog"
            to="settings"
          >
            {{ $t('app.general.title.settings') }}
          </app-nav-item>
        </div>

        <template
          v-if="socketConnected && authenticated && !isMobileViewport && canEditLayout"
          #append
        >
          <v-tooltip right>
            <template #activator="{ attrs, on }">
              <app-btn
                icon
                large
                :color="layoutMode ? 'primary' : undefined"
                style="margin: 6px"
                v-bind="attrs"
                v-on="on"
                @click="layoutMode = !layoutMode"
              >
                <v-icon>$apps</v-icon>
              </app-btn>
            </template>
            <span>
              {{ $t('app.general.btn.adjust_layout') }}
            </span>
          </v-tooltip>
        </template>
      </v-navigation-drawer>

      <router-view
        v-if="showSubNavigation"
        name="navigation"
      />
    </v-row>

    <nav-link-dialog
      v-if="editDialogState.active"
      v-model="editDialogState.active"
      :link="editDialogState.link"
      @save="handleSaveLink"
    />
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Mixins, VModel, Watch } from 'vue-property-decorator'

import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import type { CustomNavLink } from '@/store/config/types'
import NavLinkDialog from '@/components/settings/navigation/NavLinkDialog.vue'

interface SystemNavItem {
  id: string
  icon: string
  to: string
  title: string
  exact?: boolean
  enabled: boolean
}

@Component({
  components: { NavLinkDialog }
})
export default class AppNavDrawer extends Mixins(StateMixin, BrowserMixin) {
  @VModel({ type: Boolean })
  open?: boolean

  contextMenuState = {
    open: false,
    x: 0,
    y: 0,
    item: null as (SystemNavItem | CustomNavLink) | null,
    type: '' as 'system' | 'custom' | ''
  }

  editDialogState: any = {
    active: false,
    link: null
  }

  systemLinksLocal: SystemNavItem[] = []
  customLinksLocal: CustomNavLink[] = []

  @Watch('visibleSystemLinks', { immediate: true, deep: true })
  onVisibleSystemLinksChange (val: SystemNavItem[]) {
    this.systemLinksLocal = [...val]
  }

  @Watch('visibleCustomLinks', { immediate: true, deep: true })
  onVisibleCustomLinksChange (val: CustomNavLink[]) {
    this.customLinksLocal = [...val]
  }

  get supportsHistory (): boolean {
    return this.$typedGetters['server/componentSupport']('history')
  }

  get supportsTimelapse (): boolean {
    return this.$typedGetters['server/componentSupport']('timelapse')
  }

  get customNavLinks (): CustomNavLink[] {
    return this.$typedGetters['config/getCustomNavLinks']
  }

  get confirmOnNavLink (): boolean {
    return this.$typedState.config.uiSettings.navigation?.confirmOnNavLink ?? false
  }

  get openNavLinksInNewTab (): boolean {
    return this.$typedState.config.uiSettings.navigation?.openNavLinksInNewTab ?? false
  }

  get enableDiagnostics (): boolean {
    return this.$typedState.config.uiSettings.general.enableDiagnostics
  }

  get allSystemLinks (): SystemNavItem[] {
    return [
      { id: 'home', icon: '$dash', to: 'home', title: 'app.general.title.home', exact: true, enabled: true },
      { id: 'console', icon: '$console', to: 'console', title: 'app.general.title.console', enabled: true },
      { id: 'gcode_preview', icon: '$cubeScan', to: 'gcode_preview', title: 'app.general.title.gcode_preview', enabled: true },
      { id: 'jobs', icon: '$files', to: 'jobs', title: 'app.general.title.jobs', enabled: true },
      { id: 'history', icon: '$history', to: 'history', title: 'app.general.title.history', enabled: this.supportsHistory },
      { id: 'timelapse', icon: '$video', to: 'timelapse', title: 'app.general.title.timelapse', enabled: this.supportsTimelapse },
      { id: 'tune', icon: '$tune', to: 'tune', title: 'app.general.title.tune', enabled: true },
      { id: 'diagnostics', icon: '$chart', to: 'diagnostics', title: 'app.general.title.diagnostics', enabled: this.enableDiagnostics },
      { id: 'configure', icon: '$codeJson', to: 'configure', title: 'app.general.title.configure', enabled: true },
      { id: 'system', icon: '$desktopTower', to: 'system', title: 'app.general.title.system', enabled: true }
    ]
  }

  // --- System link ordering ---

  get systemLinkOrder (): string[] {
    return this.$typedState.config.uiSettings.navigation?.systemLinkOrder ?? []
  }

  get orderedAllSystemLinks (): SystemNavItem[] {
    const order = this.systemLinkOrder
    const all = this.allSystemLinks
    if (order.length === 0) return all

    const ordered: SystemNavItem[] = []
    const remaining = [...all]

    for (const id of order) {
      const idx = remaining.findIndex(item => item.id === id)
      if (idx !== -1) {
        ordered.push(remaining.splice(idx, 1)[0])
      }
    }

    return [...ordered, ...remaining]
  }

  get collapsedSystemLinks (): string[] {
    return this.$typedState.config.uiSettings.navigation?.collapsedSystemLinks ?? []
  }

  get visibleSystemLinks (): SystemNavItem[] {
    return this.orderedAllSystemLinks.filter(item => item.enabled && !this.collapsedSystemLinks.includes(item.id))
  }

  get collapsedSystemLinkItems (): SystemNavItem[] {
    return this.orderedAllSystemLinks.filter(item => item.enabled && this.collapsedSystemLinks.includes(item.id))
  }

  // --- Custom link collapsing ---

  get collapsedCustomLinks (): string[] {
    return this.$typedState.config.uiSettings.navigation?.collapsedCustomLinks ?? []
  }

  get visibleCustomLinks (): CustomNavLink[] {
    return this.customNavLinks.filter(link => !this.collapsedCustomLinks.includes(link.id))
  }

  get collapsedCustomLinkItems (): CustomNavLink[] {
    const items = this.customNavLinks.filter(link => this.collapsedCustomLinks.includes(link.id))
    // Theme links always at the bottom
    const db = items.filter(link => !link.id.startsWith('preset-'))
    const theme = items.filter(link => link.id.startsWith('preset-'))
    return [...db, ...theme]
  }

  // --- Context menu helpers ---

  get isContextItemCollapsed (): boolean {
    const item = this.contextMenuState.item
    if (!item) return false
    if (this.contextMenuState.type === 'system') {
      return this.collapsedSystemLinks.includes(item.id)
    }
    return this.collapsedCustomLinks.includes(item.id)
  }

  get isContextItemThemeLink (): boolean {
    const item = this.contextMenuState.item
    if (!item) return false
    return item.id.startsWith('preset-')
  }

  // --- Context menu ---

  openContextMenu (item: SystemNavItem | CustomNavLink, type: 'system' | 'custom', event: MouseEvent) {
    this.contextMenuState.open = false
    this.$nextTick(() => {
      this.contextMenuState.item = item
      this.contextMenuState.type = type
      this.contextMenuState.x = event.clientX
      this.contextMenuState.y = event.clientY
      this.$nextTick(() => {
        this.contextMenuState.open = true
      })
    })
  }

  toggleContextItemCollapse () {
    const item = this.contextMenuState.item
    if (!item) return
    if (this.contextMenuState.type === 'system') {
      this.toggleSystemLinkCollapse(item.id)
    } else {
      this.toggleCustomLinkCollapse(item.id)
    }
  }

  toggleSystemLinkCollapse (id: string) {
    const collapsed = new Set(this.collapsedSystemLinks)
    if (collapsed.has(id)) {
      collapsed.delete(id)
    } else {
      collapsed.add(id)
    }
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.navigation.collapsedSystemLinks',
      value: [...collapsed],
      server: true
    })
  }

  toggleCustomLinkCollapse (id: string) {
    const collapsed = new Set(this.collapsedCustomLinks)
    if (collapsed.has(id)) {
      collapsed.delete(id)
    } else {
      collapsed.add(id)
    }
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.navigation.collapsedCustomLinks',
      value: [...collapsed],
      server: true
    })
  }

  // --- Drag handlers ---

  handleSystemLinkDragEnd () {
    const visibleIds = this.systemLinksLocal.map(item => item.id)
    const collapsedIds = this.collapsedSystemLinkItems.map(item => item.id)
    const fullOrder = [...visibleIds, ...collapsedIds]
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.navigation.systemLinkOrder',
      value: fullOrder,
      server: true
    })
  }

  handleCustomLinkDragEnd () {
    this.customLinksLocal.forEach((link, index) => {
      const updated = { ...link, position: index }
      this.$typedDispatch('config/updateCustomNavLink', updated)
    })
  }

  // --- Edit / Delete from context menu ---

  handleContextEdit () {
    const item = this.contextMenuState.item as CustomNavLink
    if (!item) return
    this.editDialogState = {
      active: true,
      link: { ...item }
    }
  }

  async handleContextDelete () {
    const item = this.contextMenuState.item as CustomNavLink
    if (!item) return
    const result = await this.$confirm(
      this.$t('app.general.simple_form.msg.confirm_remove_nav_link', { name: item.title }).toString(),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )
    if (result) {
      this.$typedDispatch('config/removeCustomNavLink', { id: item.id })
    }
  }

  handleContextHideThemeLink () {
    const item = this.contextMenuState.item as CustomNavLink
    if (!item) return
    const hidden = new Set(this.$typedState.config.uiSettings.navigation?.hiddenThemeLinks || [])
    hidden.add(item.id)
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.navigation.hiddenThemeLinks',
      value: [...hidden],
      server: true
    })
  }

  handleSaveLink (link: CustomNavLink) {
    this.$typedDispatch('config/updateCustomNavLink', link)
  }

  // --- Helpers ---

  resolveCustomLinkUrl (url: string): string {
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`
    }
    return url
  }

  resolveColor (color?: string): string | undefined {
    return color === 'theme'
      ? this.$vuetify.theme.currentTheme.primary?.toString()
      : color
  }

  // --- Layout ---

  get hasSubNavigation () {
    return this.$route.meta?.hasSubNavigation ?? false
  }

  get showSubNavigation () {
    return this.hasSubNavigation && this.socketConnected && this.authenticated
  }

  get canEditLayout () {
    return this.$route.meta?.dashboard ?? false
  }

  get layoutMode (): boolean {
    return this.$typedState.config.layoutMode
  }

  set layoutMode (val: boolean) {
    this.$typedCommit('config/setLayoutMode', val)
  }
}
</script>

<style lang="scss" scoped>
  .app-icon {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  :deep(.v-navigation-drawer.no-subnav > .v-navigation-drawer__border) {
     display: none;
  }
</style>
