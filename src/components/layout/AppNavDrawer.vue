<template>
  <v-navigation-drawer
    v-model="open"
    :color="$vuetify.theme.currentTheme.drawer"
    :mini-variant="isOuterMini"
    :floating="isOuterFloating"
    :width="outerDrawerWidth"
    disable-resize-watcher
    clipped
    app
  >
    <v-row
      class="fill-height"
      no-gutters
    >
      <v-navigation-drawer
        :color="$vuetify.theme.currentTheme.drawer"
        :mini-variant="isInnerMini"
        :value="open"
        disable-resize-watcher
        class="pb-16 pb-sm-0"
        @mouseleave.native="hoverExpanded = false"
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
          <!-- Home link (pinned at top, not draggable) -->
          <app-nav-item
            v-if="homeLink"
            :icon="homeLink.icon"
            :exact="homeLink.exact"
            :to="homeLink.to"
            :hide-tooltip="isSidebarExpanded"
          >
            {{ $t(homeLink.title) }}
          </app-nav-item>

          <!-- Divider between Home and draggable system links -->
          <v-divider
            v-if="homeLink && systemLinksLocal.length > 0"
            class="my-1"
            :style="{ borderColor: $vuetify.theme.currentTheme.primary }"
          />

          <!-- Draggable system links (excluding Home) -->
          <app-draggable
            v-model="systemLinksLocal"
            :options="{ handle: false, dataIdAttr: 'data-id' }"
            @sorted="handleSystemLinkSorted"
          >
            <app-nav-item
              v-for="item in systemLinksLocal"
              :key="item.id"
              :data-id="item.id"
              :icon="item.icon"
              :exact="item.exact"
              :to="item.to"
              :hide-tooltip="isSidebarExpanded"
              @contextmenu="openContextMenu(item, 'system', $event)"
            >
              {{ $t(item.title) }}
            </app-nav-item>
          </app-draggable>

          <!-- Hamburger menu for collapsed system links -->
          <v-menu
            v-if="collapsedSystemLinkItems.length > 0"
            v-model="moreMenuOpen"
            right
            offset-x
            :close-on-content-click="true"
          >
            <template #activator="{ on, attrs }">
              <v-list-item
                link
                color="secondary"
                v-bind="attrs"
                v-on="on"
                @click="bookmarksMenuOpen = false"
                @contextmenu.prevent="openActivatorContextMenu('more', $event)"
              >
                <v-list-item-icon>
                  <v-icon>$menuAlt</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ $t('app.general.title.more') }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
            <v-list dense>
              <v-list-item
                v-for="item in collapsedSystemLinkItems"
                :key="item.id"
                :to="{ name: item.to }"
                @contextmenu.prevent="openContextMenu(item, 'system', $event, 'more-menu')"
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

          <!-- Divider between system links and custom links -->
          <v-divider
            v-if="customLinksLocal.length > 0 || collapsedCustomLinkItems.length > 0"
            class="my-1"
            :style="{ borderColor: $vuetify.theme.currentTheme.primary }"
          />

          <!-- Bookmarks popup for collapsed custom links -->
          <v-menu
            v-if="collapsedCustomLinkItems.length > 0"
            v-model="bookmarksMenuOpen"
            right
            offset-x
            :close-on-content-click="true"
          >
            <template #activator="{ on, attrs }">
              <v-list-item
                link
                color="secondary"
                v-bind="attrs"
                v-on="on"
                @click="moreMenuOpen = false"
                @contextmenu.prevent="openActivatorContextMenu('bookmarks', $event)"
              >
                <v-list-item-icon>
                  <v-icon>$bookmarkMultiple</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ $t('app.general.title.bookmarks') }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
            <v-list dense>
              <v-list-item
                v-for="link in collapsedCustomLinkItems"
                :key="link.id"
                :href="openNavLinksInNewTab ? undefined : resolveCustomLinkUrl(link.url)"
                @click="handleCustomLinkClick($event, link)"
                @contextmenu.prevent="openContextMenu(link, 'custom', $event, 'bookmarks-menu')"
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
            :options="customLinkDragOptions"
            @start="handleCustomLinkDragStart"
            @sorted="handleCustomLinkSorted"
          >
            <app-nav-external-item
              v-for="link in customLinksLocal"
              :key="link.id"
              :data-id="link.id"
              :icon="`$${link.icon}`"
              :custom-icon="link.customIcon"
              :custom-image="link.customImage"
              :color="link.color"
              :url="link.url"
              :confirm="confirmOnNavLink"
              :new-tab="openNavLinksInNewTab"
              :hide-tooltip="isSidebarExpanded"
              @click.native="collapseSidebar"
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

          <!-- Activator context menu (for More / Bookmarks icons) -->
          <v-menu
            v-model="activatorContextMenu.open"
            transition="slide-y-transition"
            :position-x="activatorContextMenu.x"
            :position-y="activatorContextMenu.y"
            min-width="180"
            absolute
            right
            :z-index="10"
          >
            <v-list dense>
              <v-list-item @click="showAllInSidebar">
                <v-list-item-icon>
                  <v-icon>$eye</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ $t('app.general.label.show_all_in_sidebar') }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item
                v-if="activatorContextMenu.source === 'bookmarks'"
                @click="openAddLinkDialog"
              >
                <v-list-item-icon>
                  <v-icon>$plus</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ $t('app.setting.btn.add_nav_link') }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-divider
            class="my-1"
            :style="{ borderColor: $vuetify.theme.currentTheme.primary }"
          />

          <!-- Settings link (always last, not draggable) -->
          <app-nav-item
            icon="$cog"
            to="settings"
            :hide-tooltip="isSidebarExpanded"
          >
            {{ $t('app.general.title.settings') }}
          </app-nav-item>
        </div>

        <template
          v-if="socketConnected && authenticated && !isMobileViewport"
          #append
        >
          <v-tooltip
            right
            :disabled="isSidebarExpanded"
          >
            <template #activator="{ attrs, on }">
              <v-list-item
                link
                :color="layoutMode ? 'primary' : 'secondary'"
                v-bind="attrs"
                v-on="on"
                @click="handleLayoutButtonClick"
                @mouseenter="hoverExpanded = true; closePopupMenus()"
              >
                <v-list-item-icon>
                  <v-icon :color="layoutMode ? 'primary' : undefined">
                    $apps
                  </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{ $t('app.general.btn.adjust_layout') }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
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
import { Component, Mixins, VModel, Watch, PropSync } from 'vue-property-decorator'

import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import type { CustomNavLink } from '@/store/config/types'
import NavLinkDialog from '@/components/settings/navigation/NavLinkDialog.vue'
import { Globals } from '@/globals'
import { eventTargetIsContentEditable, keyboardEventToKeyboardShortcut } from '@/util/event-helpers'
import isKeyOf from '@/util/is-key-of'

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

  @PropSync('sidebarExpanded', { type: Boolean, default: false })
  syncedSidebarExpanded!: boolean

  contextMenuState = {
    open: false,
    x: 0,
    y: 0,
    item: null as (SystemNavItem | CustomNavLink) | null,
    type: '' as 'system' | 'custom' | '',
    source: '' as 'sidebar' | 'more-menu' | 'bookmarks-menu' | ''
  }

  editDialogState: any = {
    active: false,
    link: null
  }

  moreMenuOpen = false
  bookmarksMenuOpen = false
  hoverExpanded = false
  activatorContextMenu = {
    open: false,
    x: 0,
    y: 0,
    source: '' as 'more' | 'bookmarks' | ''
  }

  systemLinksLocal: SystemNavItem[] = []
  customLinksLocal: CustomNavLink[] = []
  isCustomLinksDragging = false

  @Watch('visibleSystemLinks', { immediate: true })
  onVisibleSystemLinksChange (val: SystemNavItem[]) {
    this.systemLinksLocal = [...val]
  }

  @Watch('visibleCustomLinks', { immediate: true })
  onVisibleCustomLinksChange (val: CustomNavLink[]) {
    console.log('[WATCHER] visibleCustomLinks changed:', val.map(l => `${l.title}(pos:${l.position}, id:${l.id.substring(0, 15)})`))
    // Don't overwrite during drag - wait for drag to finish
    if (!this.isCustomLinksDragging) {
      // Filter out any null/undefined items to ensure clean array
      this.customLinksLocal = val.filter(link => link != null)
      console.log('[WATCHER] Updated customLinksLocal')
    } else {
      console.log('[WATCHER] Skipped update - dragging in progress')
    }
  }

  // Computed for safe rendering - filters any undefined items that might
  // appear during drag operations due to SortableJS array manipulation
  get safeCustomLinksLocal (): CustomNavLink[] {
    return this.customLinksLocal.filter(link => link != null)
  }

  @Watch('$route')
  onRouteChange () {
    this.hoverExpanded = false
  }

  mounted () {
    document.addEventListener('click', this.handleDocumentClick, true)
    window.addEventListener('keydown', this.handleKeyDown, false)
  }

  beforeDestroy () {
    document.removeEventListener('click', this.handleDocumentClick, true)
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  get enableKeyboardShortcuts (): boolean {
    return this.$typedState.config.uiSettings.general.enableKeyboardShortcuts
  }

  handleKeyDown (event: KeyboardEvent) {
    if (!this.enableKeyboardShortcuts) return
    if (eventTargetIsContentEditable(event)) return

    const shortcut = keyboardEventToKeyboardShortcut(event)

    // Find matching system nav item by keyboard shortcut
    for (const item of this.allSystemLinks) {
      if (!item.enabled) continue
      const routeName = item.to as keyof typeof Globals.KEYBOARD_SHORTCUTS
      if (isKeyOf(routeName, Globals.KEYBOARD_SHORTCUTS)) {
        const accelerator = Globals.KEYBOARD_SHORTCUTS[routeName]
        if (shortcut === accelerator && this.$route.name !== item.to) {
          event.preventDefault()
          this.$router.push({ name: item.to })
          return
        }
      }
    }
  }

  handleDocumentClick (event: MouseEvent) {
    if (!this.hoverExpanded) return
    if (event.button !== 0) return
    const target = event.target as Node
    const el = this.$el as HTMLElement
    if (el && el.contains(target)) return
    const logo = document.querySelector('.toolbar-logo')
    if (logo && logo.contains(target)) return
    const menuContent = (target as HTMLElement).closest?.('.v-menu__content')
    if (menuContent) return
    this.hoverExpanded = false
  }

  collapseSidebar () {
    this.hoverExpanded = false
  }

  handleCustomLinkClick (e: Event, link: CustomNavLink) {
    this.collapseSidebar()
    const url = this.resolveCustomLinkUrl(link.url)

    if (this.openNavLinksInNewTab) {
      // New tab - use anchor element for reliable cross-browser behavior
      e.preventDefault()
      e.stopPropagation()
      const a = document.createElement('a')
      a.href = url
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else if (this.confirmOnNavLink) {
      // Same window with confirm
      e.preventDefault()
      this.handleConfirmNavigation(url)
    }
    // If neither, let the href handle it naturally
  }

  async handleConfirmNavigation (url: string) {
    const result = await this.$confirm(
      this.$t('app.general.simple_form.msg.confirm_open_nav_link', { url }).toString(),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$warning' }
    )
    if (result) {
      window.location.href = url
    }
  }

  closePopupMenus () {
    this.moreMenuOpen = false
    this.bookmarksMenuOpen = false
  }

  openActivatorContextMenu (source: 'more' | 'bookmarks', event: MouseEvent) {
    this.activatorContextMenu.open = false
    this.$nextTick(() => {
      this.activatorContextMenu.source = source
      this.activatorContextMenu.x = event.clientX
      this.activatorContextMenu.y = event.clientY
      this.$nextTick(() => {
        this.activatorContextMenu.open = true
      })
    })
  }

  showAllInSidebar () {
    if (this.activatorContextMenu.source === 'more') {
      this.$typedDispatch('config/saveByPath', {
        path: 'uiSettings.navigation.collapsedSystemLinks',
        value: [],
        server: true
      })
    } else if (this.activatorContextMenu.source === 'bookmarks') {
      this.$typedDispatch('config/saveByPath', {
        path: 'uiSettings.navigation.collapsedCustomLinks',
        value: [],
        server: true
      })
    }
  }

  openAddLinkDialog () {
    this.editDialogState = {
      active: true,
      link: null
    }
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
    return this.$typedState.config.uiSettings.navigation?.openNavLinksInNewTab ?? true
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

  get homeLink (): SystemNavItem | undefined {
    return this.allSystemLinks.find(item => item.id === 'home' && item.enabled)
  }

  get visibleSystemLinks (): SystemNavItem[] {
    // Exclude 'home' - it's rendered separately and pinned at top
    return this.orderedAllSystemLinks.filter(item =>
      item.id !== 'home' && item.enabled && !this.collapsedSystemLinks.includes(item.id)
    )
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

  // SortableJS options - filtering of extra DOM elements happens in AppDraggable
  get customLinkDragOptions () {
    return {
      // Set handle to false to allow dragging from anywhere (not just .handle elements)
      handle: false as any,
      dataIdAttr: 'data-id'
    }
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

  openContextMenu (item: SystemNavItem | CustomNavLink, type: 'system' | 'custom', event: MouseEvent, source: 'sidebar' | 'more-menu' | 'bookmarks-menu' = 'sidebar') {
    if (type === 'system' && item.id === 'home') return
    this.contextMenuState.open = false
    this.$nextTick(() => {
      this.contextMenuState.item = item
      this.contextMenuState.type = type
      this.contextMenuState.source = source
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
    const source = this.contextMenuState.source
    if (this.contextMenuState.type === 'system') {
      this.toggleSystemLinkCollapse(item.id)
    } else {
      this.toggleCustomLinkCollapse(item.id)
    }
    if (source === 'more-menu' || source === 'bookmarks-menu') {
      this.$nextTick(() => {
        if (source === 'more-menu' && this.collapsedSystemLinkItems.length > 0) {
          this.moreMenuOpen = true
        } else if (source === 'bookmarks-menu' && this.collapsedCustomLinkItems.length > 0) {
          this.bookmarksMenuOpen = true
        }
      })
    }
  }

  toggleSystemLinkCollapse (id: string) {
    if (id === 'home') return
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

  handleSystemLinkSorted (sortedIds: string[]) {
    console.log('[SYSTEM SORTED] sortedIds:', sortedIds)
    // Filter out 'home' (it's always pinned at top) and combine with collapsed links
    const visibleIds = sortedIds.filter(id => id !== 'home')
    const collapsedIds = this.collapsedSystemLinkItems.map(item => item.id).filter(id => id !== 'home')
    const fullOrder = [...visibleIds, ...collapsedIds]
    console.log('[SYSTEM SORTED] Saving order:', fullOrder)
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.navigation.systemLinkOrder',
      value: fullOrder,
      server: true
    })
  }

  handleCustomLinkDragStart () {
    this.isCustomLinksDragging = true
    console.log('[DRAG START] customLinksLocal order:', this.customLinksLocal.map(l => l?.title || 'undefined'))
  }

  handleCustomLinkSorted (sortedIds: string[]) {
    console.log('[SORTED] sortedIds:', sortedIds)

    // Collect theme link positions and DB link position updates
    const themeLinkPositions: Record<string, number> = {}
    const dbLinkPositions: { id: string; position: number }[] = []

    // Assign positions to visible links based on sorted order (0, 1, 2, ...)
    sortedIds.forEach((id, index) => {
      console.log(`[SORTED] Visible Index ${index}: id ${id.substring(0, 12)}...`)
      if (id.startsWith('preset-')) {
        themeLinkPositions[id] = index
      } else {
        dbLinkPositions.push({ id, position: index })
      }
    })

    // Collapsed links get positions AFTER all visible links
    // This prevents position conflicts between visible and collapsed links
    const collapsedStartPosition = sortedIds.length
    this.collapsedCustomLinkItems.forEach((link, index) => {
      const position = collapsedStartPosition + index
      console.log(`[SORTED] Collapsed Index ${position}: id ${link.id.substring(0, 12)}...`)
      if (link.id.startsWith('preset-')) {
        themeLinkPositions[link.id] = position
      } else {
        dbLinkPositions.push({ id: link.id, position })
      }
    })

    console.log('[SORTED] Saving DB positions:', dbLinkPositions)
    console.log('[SORTED] Saving theme positions:', themeLinkPositions)

    // Batch update DB link positions (single mutation + single DB write)
    if (dbLinkPositions.length > 0) {
      this.$typedDispatch('config/updateCustomNavLinkPositions', dbLinkPositions)
    }

    // Save theme link positions if any exist
    if (Object.keys(themeLinkPositions).length > 0) {
      this.$typedDispatch('config/updateThemeLinkPositions', themeLinkPositions)
    }

    // Allow watcher to sync again after store is updated
    this.$nextTick(() => {
      this.isCustomLinksDragging = false
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

  get isInnerMini (): boolean {
    return !this.isSidebarExpanded
  }

  get isOuterMini (): boolean {
    if (this.showSubNavigation) return false
    return !this.isSidebarExpanded
  }

  get isOuterFloating (): boolean {
    if (this.showSubNavigation) return false
    return !this.isSidebarExpanded
  }

  get isSidebarExpanded (): boolean {
    return this.syncedSidebarExpanded || this.hoverExpanded
  }

  get outerDrawerWidth (): number | undefined {
    if (this.showSubNavigation && this.isSidebarExpanded) {
      return 456
    }
    return undefined
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

  handleLayoutButtonClick () {
    if (this.canEditLayout) {
      this.layoutMode = !this.layoutMode
    } else {
      this.$router.push({ name: 'home' })
      this.$nextTick(() => {
        this.layoutMode = true
      })
    }
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

  // GPU acceleration hints for smoother transitions
  :deep(.v-navigation-drawer) {
    will-change: width, transform;
  }

  :deep(.v-navigation-drawer__content) {
    will-change: transform;
  }
</style>
