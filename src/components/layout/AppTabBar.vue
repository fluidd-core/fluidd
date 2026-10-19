<template>
  <div class="app-tab-bar">
    <nav
      class="app-tab-bar__tabs"
      aria-label="Pages"
      :style="{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }"
    >
      <router-link
        v-for="tab in tabs"
        :key="tab.id"
        :to="sectionTo(tab)"
        class="app-tab-bar__tab"
        :class="{ 'app-tab-bar__tab--on': currentSection === tab }"
        :aria-current="currentSection === tab ? 'page' : undefined"
        :data-tid="`tab-${tab.id}`"
      >
        <frame-icon
          :name="tab.icon"
          large
        />
        <span class="app-tab-bar__label">{{ tab.label }}</span>
      </router-link>

      <button
        type="button"
        class="app-tab-bar__tab"
        :class="{ 'app-tab-bar__tab--on': moreActive }"
        data-tid="tab-more"
        @click="more = true"
      >
        <frame-icon
          name="more"
          large
        />
        <span class="app-tab-bar__label">More</span>
      </button>
    </nav>

    <v-bottom-sheet
      v-model="more"
      content-class="app-tab-bar__sheet"
    >
      <div class="app-more">
        <div class="app-more__title">
          More
        </div>
        <div class="app-more__list">
          <router-link
            v-for="section in moreSections"
            :key="section.id"
            :to="sectionTo(section)"
            class="app-more__row"
            :class="{ 'app-more__row--on': currentSection === section }"
            :data-tid="`more-${section.id}`"
            @click.native="more = false"
          >
            <frame-icon :name="section.icon" />
            <span class="app-more__label">{{ section.label }}</span>
            <frame-icon
              name="chevronRight"
              small
              class="app-more__chevron"
            />
          </router-link>

          <div
            v-if="toolSections.length"
            class="app-more__tools"
            role="group"
            aria-label="Tools"
          >
            <div class="app-more__group-label">
              Tools
            </div>
            <router-link
              v-for="section in toolSections"
              :key="section.id"
              :to="sectionTo(section)"
              class="app-more__row"
              :class="{ 'app-more__row--on': currentSection === section }"
              :data-tid="`more-${section.id}`"
              @click.native="more = false"
            >
              <frame-icon :name="section.icon" />
              <span class="app-more__label">{{ section.label }}</span>
              <frame-icon
                name="chevronRight"
                small
                class="app-more__chevron"
              />
            </router-link>
          </div>

          <router-link
            to="/"
            class="app-more__row"
            data-tid="more-all-printers"
            @click.native="more = false"
          >
            <frame-icon name="printers" />
            <span class="app-more__label">All printers</span>
            <frame-icon
              name="chevronRight"
              small
              class="app-more__chevron"
            />
          </router-link>

          <router-link
            to="/library"
            class="app-more__row"
            data-tid="more-library"
            @click.native="more = false"
          >
            <frame-icon name="library" />
            <span class="app-more__label">Library</span>
            <frame-icon
              name="chevronRight"
              small
              class="app-more__chevron"
            />
          </router-link>
        </div>
        <div class="app-more__account">
          <cloud-account-menu />
        </div>
      </div>
    </v-bottom-sheet>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FrameMixin from '@/mixins/frame'
import type { Section, SectionId } from '@/router/printerSections'
import { probeSlicer } from '@/services/slicer-bridge/slicerUrl'
import CloudAccountMenu from '@/components/muon-cloud/CloudAccountMenu.vue'

/** The pages used while printing get a tab each; the rest are in More. */
const TAB_SECTIONS: SectionId[] = ['overview', 'jobs', 'control', 'slice']

/**
 * The phone's pages: tabs for the ones used while printing, More for the
 * rest as a sheet that slides up. STOP is in the top bar, not here.
 */
@Component({ components: { CloudAccountMenu } })
export default class AppTabBar extends Mixins(FrameMixin) {
  more = false

  created () {
    probeSlicer()
  }

  get tabs (): Section[] {
    return this.sections.filter(s => TAB_SECTIONS.includes(s.id))
  }

  get moreSections (): Section[] {
    return this.sections.filter(s => !TAB_SECTIONS.includes(s.id) && s.group !== 'tools')
  }

  get toolSections (): Section[] {
    return this.sections.filter(s => s.group === 'tools')
  }

  get moreActive (): boolean {
    return !!this.currentSection && !this.tabs.includes(this.currentSection)
  }
}
</script>

<style lang="scss" scoped>
  .app-tab-bar__tabs {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 5;
    display: grid;
    padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--m3d-border);
    background: var(--m3d-glass-thick, var(--m3d-surface));
    -webkit-backdrop-filter: blur(28px) saturate(1.9);
    backdrop-filter: blur(28px) saturate(1.9);
    -webkit-tap-highlight-color: transparent;
  }

  .app-tab-bar__tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-width: 0;
    min-height: 48px;
    color: var(--m3d-text-subtle) !important;
    font-size: 10px;
    font-weight: 600;
    text-decoration: none;
  }

  .app-tab-bar__tab--on {
    color: var(--m3d-accent) !important;
  }

  .app-tab-bar__label {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-more {
    max-height: calc(100vh - 64px);
    overflow-y: auto;
    padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
    border-radius: 22px 22px 0 0;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .app-more__title {
    padding: 0 4px 8px;
    font-size: 17px;
    font-weight: 600;
  }

  .app-more__list > * + *,
  .app-more__tools > .app-more__row + .app-more__row {
    border-top: 1px solid var(--m3d-border);
  }

  .app-more__group-label {
    padding: 12px 4px 4px;
    color: var(--m3d-text-subtle);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .app-more__row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 52px;
    padding: 8px 4px;
    color: var(--m3d-text) !important;
    font-size: 15px;
    text-align: left;
    text-decoration: none;

    .frame-icon {
      color: var(--m3d-text-muted);
    }
  }

  .app-more__row--on .frame-icon:first-child {
    color: var(--m3d-accent);
  }

  .app-more__label {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-width: 0;
  }

  .app-more__hint {
    color: var(--m3d-text-muted);
    font-size: 12px;
  }
  .app-more__account {
    display: flex;
    justify-content: flex-end;
    padding-top: 12px;
  }
</style>

<style lang="scss">
  .app-tab-bar__sheet {
    border-radius: 22px 22px 0 0 !important;
  }
</style>
