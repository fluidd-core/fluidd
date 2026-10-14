<template>
  <header
    class="app-page-header"
    :class="{ 'app-page-header--phone': isMobileViewport }"
  >
    <div class="app-page-header__row">
      <h1
        class="app-page-header__title"
        data-tid="page-title"
      >
        {{ title }}
      </h1>
      <div class="app-page-header__actions">
        <button
          v-if="canEditLayout"
          type="button"
          class="app-page-header__btn"
          data-tid="edit-layout"
          @click="editLayout"
        >
          <frame-icon
            name="layout"
            small
          />
          Edit layout
        </button>
      </div>
    </div>
    <nav
      v-if="tabs.length > 1"
      class="app-page-header__tabs"
      :aria-label="`${title} pages`"
    >
      <router-link
        v-for="page in tabs"
        :key="page.path"
        :to="pageTo(page)"
        class="app-page-header__tab"
        :class="{ 'app-page-header__tab--on': isOn(page) }"
        :aria-current="isOn(page) ? 'page' : undefined"
      >
        {{ page.label }}
      </router-link>
    </nav>
  </header>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FrameMixin from '@/mixins/frame'
import BrowserMixin from '@/mixins/browser'
import { pageMatches, type SectionPage } from '@/router/printerSections'

/**
 * A printer page's title on the left and its own actions on the right,
 * with the section's pages as tabs under it (Jobs: Jobs, Preview, History,
 * Timelapse).
 */
@Component({})
export default class AppPageTitle extends Mixins(FrameMixin, BrowserMixin) {
  get title (): string {
    return this.currentSection?.label ?? this.$route.name ?? ''
  }

  get tabs (): SectionPage[] {
    return this.currentSection ? this.pagesOf(this.currentSection) : []
  }

  isOn (page: SectionPage): boolean {
    return pageMatches(this.currentPage, page.path)
  }

  /** The overview and its charts are the pages laid out from cards. */
  get canEditLayout (): boolean {
    return !this.isMobileViewport && !this.$store.state.config.layoutMode &&
      ['/', '/diagnostics'].includes(this.currentPage)
  }

  editLayout () {
    this.$store.commit('config/setLayoutMode', true)
  }
}
</script>

<style lang="scss" scoped>
  .app-page-header {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 4px 4px 20px;
  }

  .app-page-header__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
  }

  .app-page-header__title {
    overflow: hidden;
    margin: 0;
    color: var(--m3d-text);
    font-family: var(--m3d-font-title, var(--m3d-font-sans));
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.015em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-page-header__actions {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
  }

  .app-page-header__btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 16px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;

    &:hover {
      background: var(--m3d-hover);
    }
  }

  .app-page-header__tabs {
    display: flex;
    gap: 2px;
    align-self: flex-start;
    max-width: 100%;
    padding: 3px;
    overflow-x: auto;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    scrollbar-width: none;
  }

  .app-page-header__tab {
    display: inline-flex;
    flex: none;
    align-items: center;
    height: 34px;
    padding: 0 14px;
    border-radius: 9px;
    color: var(--m3d-text-muted) !important;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;

    &:hover {
      color: var(--m3d-text) !important;
    }
  }

  .app-page-header__tab--on {
    background: var(--m3d-fill-strong, var(--m3d-border-strong));
    color: var(--m3d-text) !important;
  }

  .app-page-header--phone {
    gap: 12px;
    padding: 4px 4px 14px;

    .app-page-header__title {
      font-size: 30px;
    }

    .app-page-header__tab {
      height: 36px;
    }
  }
</style>
