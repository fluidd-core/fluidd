<template>
  <v-menu
    v-model="menu"
    offset-y
    left
    nudge-bottom="6"
    content-class="m3-notes__menu"
    :max-width="isMobileViewport ? 340 : 420"
    :min-width="isMobileViewport ? 300 : 380"
    :close-on-content-click="false"
  >
    <template #activator="{ on, attrs }">
      <button
        type="button"
        class="m3-notes__bell"
        :class="`m3-notes__bell--${tone}`"
        :aria-label="notificationsCounter ? `Notifications, ${notificationsCounter} new` : 'Notifications'"
        :title="$t('app.general.tooltip.notifications')"
        data-tid="notifications-open"
        v-bind="attrs"
        v-on="on"
      >
        <frame-icon
          name="bell"
          :class="{ wiggle: tone === 'error' }"
        />
        <span
          v-if="notificationsCounter"
          class="m3-notes__count"
        >{{ notificationsCounter }}</span>
      </button>
    </template>

    <div
      class="m3-notes"
      data-tid="notifications"
    >
      <header class="m3-notes__head">
        <b>Notifications</b>
        <button
          v-if="clearableNotifications.length"
          type="button"
          class="m3-notes__clear"
          data-tid="notifications-clear-all"
          @click="handleClearAll"
        >
          Clear all
        </button>
      </header>

      <p
        v-if="notifications.length === 0"
        class="m3-notes__empty"
      >
        Nothing new. The printer's warnings and news about this page show up here.
      </p>

      <ul
        v-else
        class="m3-notes__list"
      >
        <li
          v-for="n in notifications"
          :key="`notification-${n.id}`"
          class="m3-note"
          :class="`m3-note--${n.type}`"
        >
          <span class="m3-note__dot" />
          <div class="m3-note__body">
            <b
              class="m3-note__title"
              v-html="n.title"
            />
            <span
              v-if="n.description"
              class="m3-note__desc"
              v-html="n.description"
            />
            <span class="m3-note__time">{{ $filters.formatRelativeTimeToNow(n.timestamp * 1000) }}</span>
            <div
              v-if="n.to"
              class="m3-note__links"
            >
              <router-link
                v-if="!n.to.startsWith('http')"
                :to="n.to"
                class="m3-note__link"
                @click.native="menu = false"
              >
                {{ n.btnText || 'Show me' }}
              </router-link>
              <a
                v-else
                :href="n.to"
                target="_blank"
                rel="noopener"
                class="m3-note__link"
                @click="menu = false"
              >
                {{ n.btnText || 'Read more' }}
              </a>
              <app-announcement-dismiss-menu
                v-if="n.type === 'announcement'"
                @dismiss="handleAnnouncementDismiss(n, $event)"
              />
            </div>
          </div>
          <span
            v-if="n.suffix"
            class="m3-note__suffix"
            v-html="n.suffix"
          />
          <button
            v-if="n.clear"
            type="button"
            class="m3-note__x"
            aria-label="Dismiss"
            @click="handleClear(n)"
          >
            <frame-icon
              name="x"
              small
            />
          </button>
        </li>
      </ul>
    </div>
  </v-menu>
</template>

<script lang="ts">
import type { AppNotification } from '@/store/notifications/types'
import isSetAppBadgeSupported from '@/util/is-set-app-badge-supported'
import { Component, Watch, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import AppAnnouncementDismissMenu from './AppAnnouncementDismissMenu.vue'

/**
 * The bell in the header and what's behind it: the printer's warnings and
 * Fluidd's news, newest first, each with a time, a way to it when it has
 * one, and ✕ for those that can go.
 */
@Component({
  components: {
    AppAnnouncementDismissMenu
  }
})
export default class AppNotificationMenu extends Mixins(BrowserMixin) {
  menu = false

  get notifications (): AppNotification[] {
    return this.$store.getters['notifications/getNotifications']
  }

  get notificationsCounter (): number {
    const notifications: AppNotification[] = this.notifications.filter(n => !n.noCount)
    return notifications.length
  }

  @Watch('notificationsCounter')
  onNotificationsCounter (value: number) {
    if (isSetAppBadgeSupported(navigator)) {
      navigator.setAppBadge(value)
    }
  }

  get clearableNotifications (): AppNotification[] {
    const notifications: AppNotification[] = this.$store.getters['notifications/getNotifications']
    return notifications.filter(n => n.clear)
  }

  /** The bell takes the colour of the worst one: error, then warning. */
  get tone (): 'error' | 'warning' | 'info' | 'none' {
    if (this.notifications.length <= 0) return 'none'
    if (this.notifications.some(n => n.type === 'error')) return 'error'
    if (this.notifications.some(n => n.type === 'warning')) return 'warning'
    return 'info'
  }

  handleClear (n: AppNotification) {
    this.$store.dispatch('notifications/clearNotification', n)
  }

  handleClearAll () {
    this.$store.dispatch('notifications/clearAll')
  }

  handleAnnouncementDismiss (n: AppNotification, wake_time: number) {
    if (n && wake_time) {
      this.$store.dispatch('announcements/dismiss', {
        entry_id: n.id,
        wake_time
      })

      this.menu = false
    }
  }
}
</script>

<style lang="scss" scoped>
  .m3-notes__bell {
    position: relative;
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    color: var(--m3d-text-muted);

    &:hover {
      background: var(--m3d-hover);
      color: var(--m3d-text);
    }
  }

  .m3-notes__bell--warning {
    color: var(--m3d-warning);
  }

  .m3-notes__bell--error {
    color: var(--m3d-danger);
  }

  .m3-notes__count {
    position: absolute;
    top: 3px;
    right: 2px;
    min-width: 17px;
    height: 17px;
    padding: 0 4px;
    border-radius: 999px;
    background: var(--m3d-accent);
    color: var(--m3d-on-accent, #00201e);
    font-size: 11px;
    font-weight: 700;
    line-height: 17px;
    text-align: center;
  }

  .m3-notes__bell--warning .m3-notes__count {
    background: var(--m3d-warning);
    color: #1d1300;
  }

  .m3-notes__bell--error .m3-notes__count {
    background: var(--m3d-danger);
    color: #fff;
  }

  .m3-notes {
    display: flex;
    flex-direction: column;
    max-height: min(80vh, 640px);
    padding: 6px;
    color: var(--m3d-text);
  }

  .m3-notes__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 10px 8px;

    b {
      font-size: 15px;
      font-weight: 600;
    }
  }

  .m3-notes__clear {
    padding: 4px 10px;
    border-radius: 999px;
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 600;

    &:hover {
      background: var(--m3d-accent-soft);
    }
  }

  .m3-notes__empty {
    margin: 0;
    padding: 4px 10px 12px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .m3-notes__list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }

  .m3-note {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px;
    border-radius: 12px;

    &:hover {
      background: var(--m3d-hover);
    }
  }

  .m3-note__dot {
    flex: none;
    width: 8px;
    height: 8px;
    margin-top: 6px;
    border-radius: 50%;
    background: var(--m3d-accent);
  }

  .m3-note--success .m3-note__dot { background: var(--m3d-success); }
  .m3-note--warning .m3-note__dot { background: var(--m3d-warning); }
  .m3-note--error .m3-note__dot { background: var(--m3d-danger); }

  .m3-note__body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .m3-note__title {
    font-size: 14px;
    font-weight: 600;
  }

  .m3-note__desc {
    display: -webkit-box;
    overflow: hidden;
    color: var(--m3d-text-muted);
    font-size: 13px;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 5;
  }

  .m3-note__time {
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .m3-note__links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
  }

  .m3-note__link {
    display: inline-flex;
    align-items: center;
    height: 28px;
    padding: 0 12px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text) !important;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }

  .m3-note__suffix {
    flex: none;
    color: var(--m3d-text-muted);
    font-size: 20px;
    font-variant-numeric: tabular-nums;
  }

  .m3-note__x {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    color: var(--m3d-text-subtle);

    &:hover {
      background: var(--m3d-surface-2);
      color: var(--m3d-text);
    }
  }
</style>
