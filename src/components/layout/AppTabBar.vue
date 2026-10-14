<template>
  <!-- Static wrapper: each bar stacks on its own, so the E-STOP can sit above
       drawers and dialogs while the tabs sit under them. -->
  <div class="app-tab-bar">
    <nav
      class="app-tab-bar__tabs"
      :aria-label="$tc('app.general.title.nav_print')"
    >
      <router-link
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        :exact="tab.exact"
        class="app-tab-bar__tab"
        active-class="app-tab-bar__tab--active"
      >
        <v-icon>{{ tab.icon }}</v-icon>
        <span class="app-tab-bar__label">{{ tab.label }}</span>
      </router-link>

      <button
        type="button"
        class="app-tab-bar__tab"
        :class="{ 'app-tab-bar__tab--active': moreActive }"
        @click="$emit('more')"
      >
        <v-icon>$dots</v-icon>
        <span class="app-tab-bar__label">{{ $t('app.general.btn.more') }}</span>
      </button>
    </nav>

    <button
      type="button"
      class="app-tab-bar__estop"
      :aria-label="$tc('app.general.tooltip.estop')"
      @click="emergencyStop()"
    >
      <v-icon>$estop</v-icon>
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'

type Tab = {
  to: string;
  icon: string;
  label: string;
  exact?: boolean;
}

// The phone navigation for the glass style, after the iOS tab bar: the three
// places used mid-print, More for the rest (the navigation drawer), and the
// E-STOP on its own beside them.
@Component({})
export default class AppTabBar extends Mixins(StateMixin) {
  get tabs (): Tab[] {
    const slug = activeSlug()
    return [
      { to: scopedPath('/', slug), icon: '$dash', label: this.$t('app.general.title.home').toString(), exact: true },
      { to: scopedPath('/jobs', slug), icon: '$files', label: this.$t('app.general.title.jobs').toString() },
      { to: scopedPath('/console', slug), icon: '$console', label: this.$t('app.general.title.console').toString() }
    ]
  }

  get moreActive (): boolean {
    const path = this.$route.path

    return !this.tabs.some(tab => tab.exact ? path === tab.to : path.startsWith(tab.to))
  }
}
</script>

<style lang="scss" scoped>
  .app-tab-bar__tabs,
  .app-tab-bar__estop {
    position: fixed;
    bottom: calc(12px + env(safe-area-inset-bottom));
    height: 62px;
    -webkit-tap-highlight-color: transparent;
  }

  .app-tab-bar__tabs {
    z-index: 5;
    left: 12px;
    right: calc(12px + 62px + 10px);
    display: flex;
    align-items: stretch;
    padding: 4px;
    border-radius: 999px;
    background: var(--m3d-glass);
    backdrop-filter: var(--m3d-glass-filter);
    -webkit-backdrop-filter: var(--m3d-glass-filter);
    box-shadow: var(--m3d-glass-rim), var(--m3d-glass-edge), var(--m3d-shadow-float);
  }

  .app-tab-bar__tab {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 0;
    border-radius: 999px;
    color: var(--m3d-text);
    text-decoration: none;
    transition: background-color var(--m3d-duration-fast) var(--m3d-ease), transform var(--m3d-duration-base) var(--m3d-spring);

    .v-icon {
      color: inherit;
      font-size: 24px;
    }

    &:active {
      transform: scale(0.94);
    }
  }

  .app-tab-bar__tab--active {
    background: var(--m3d-fill);
    color: var(--m3d-accent);
  }

  .app-tab-bar__label {
    overflow: hidden;
    max-width: 100%;
    font-size: 0.625rem;
    font-weight: 600;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // Above every drawer and dialog, as the flat style's phone E-STOP is.
  .app-tab-bar__estop {
    z-index: 2000;
    right: 12px;
    width: 62px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--m3d-estop);
    box-shadow: var(--m3d-glass-rim), var(--m3d-shadow-float);
    transition: transform var(--m3d-duration-base) var(--m3d-spring), filter var(--m3d-duration-fast) var(--m3d-ease);

    .v-icon {
      color: #fff;
      font-size: 28px;
    }

    &:active {
      transform: scale(0.92);
      filter: brightness(0.9);
    }
  }

  .app-tab-bar__tab:focus-visible,
  .app-tab-bar__estop:focus-visible {
    outline: 3px solid var(--m3d-focus-ring);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .app-tab-bar__tab:active,
    .app-tab-bar__estop:active {
      transform: none;
    }
  }
</style>
