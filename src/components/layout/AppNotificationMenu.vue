<template>
  <v-menu
    v-model="menu"
    offset-y
    left
    :max-width="(isMobile) ? 220 : 420"
    :close-on-content-click="false"
    :close-delay="300"
  >
    <template #activator="{ on, attrs }">
      <v-badge
        :value="notificationsCounter"
        :content="notificationsCounter"
        offset-x="17"
        offset-y="17"
        bordered
        overlap
        :color="badgeColor"
      >
        <v-btn
          v-bind="attrs"
          fab
          small
          class="mx-1"
          :color="color"
          :elevation="0"
          v-on="on"
        >
          <v-icon :class="{ 'wiggle': color === 'error'}">
            $bell
          </v-icon>
        </v-btn>
      </v-badge>
    </template>

    <v-card>
      <v-list
        class="py-0 overflow-y-auto app-notifications"
        style="max-height: 90vh"
      >
        <v-list-item
          v-if="notifications.length === 0"
        >
          <v-list-item-content>
            <v-list-item-title>{{ $t('app.general.label.no_notifications') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          v-if="notifications.length > 0"
          :disabled="clearableNotifications.length <= 0"
          @click="handleClearAll"
        >
          <v-list-item-content>
            <v-list-item-title>{{ $t('app.general.label.clear_all') }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action class="notification-clear-all">
            <v-icon small>
              $close
            </v-icon>
          </v-list-item-action>
        </v-list-item>
        <v-divider v-if="notifications.length > 0" />

        <template
          v-for="(n, i) in notifications"
        >
          <v-list-item
            :key="`notification-${n.id}`"
            :three-line="true"
            :class="classes(n)"
          >
            <v-list-item-content>
              <v-list-item-title v-html="n.title" />
              <v-list-item-subtitle
                v-if="n.description"
                class="notification-description"
                v-html="n.description"
              />
              <v-list-item-subtitle class="notification-timestamp">
                {{ $filters.formatDateTime(n.timestamp) }}
              </v-list-item-subtitle>
              <v-list-item-subtitle v-if="n.to">
                <app-btn
                  v-if="!n.to.startsWith('http')"
                  x-small
                  :to="n.to"
                  class="mr-1"
                  @click="menu = false"
                  v-html="(n.btnText) ? n.btnText : $t('app.general.btn.more_information')"
                />
                <app-btn
                  v-else
                  x-small
                  :href="n.to"
                  target="_blank"
                  class="mr-1"
                  @click="menu = false"
                  v-html="(n.btnText) ? n.btnText : $t('app.general.btn.more_information')"
                />

                <app-announcement-dismiss-menu
                  v-if="n.type === 'announcement'"
                  @dismiss="handleAnnouncementDismiss(n, $event)"
                />
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action
              v-if="n.suffix"
              class="notification-suffix"
            >
              <v-icon
                v-if="n.suffixIcon"
                :color="color"
                v-html="n.suffixIcon"
              />
              <div
                class="notification-temp"
                v-html="n.suffix"
              />
            </v-list-item-action>
            <v-list-item-action
              v-if="n.clear"
              class="notification-clear"
              @click="handleClear(n)"
            >
              <v-btn
                icon
                small
              >
                <v-icon small>
                  $close
                </v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>

          <v-divider
            v-if="i < notifications.length - 1"
            :key="`divider-${n.id}`"
          />
        </template>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { AppNotification } from '@/store/notifications/types'
import { Component, Vue } from 'vue-property-decorator'
import AppAnnouncementDismissMenu from './AppAnnouncementDismissMenu.vue'

@Component({
  components: {
    AppAnnouncementDismissMenu
  }
})
export default class AppNotificationMenu extends Vue {
  menu = false

  get notifications (): AppNotification[] {
    return this.$store.getters['notifications/getNotifications']
  }

  get notificationsCounter (): number {
    const notifications: AppNotification[] = this.notifications.filter(n => !n.noCount)
    return notifications.length
  }

  get clearableNotifications (): AppNotification[] {
    const notifications: AppNotification[] = this.$store.getters['notifications/getNotifications']
    return notifications.filter(n => n.clear)
  }

  /**
   * Color is determined by type. Pull the highest weighted type.
   */
  get color () {
    if (this.notifications.length <= 0) return 'transparent'
    let c = 'transparent'
    for (const n of this.notifications) {
      if (n.type === 'warning' && c !== 'error') c = 'warning'
      if (n.type === 'error' && c !== 'error') {
        c = 'error'
        break
      }
    }
    return c
  }

  get badgeColor () {
    if (this.color === 'transparent') return 'info'
    return this.color
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  /**
   * If no defined icon, pull from a standard set based on notification type.
   */
  icon (n: AppNotification) {
    if (n.icon) return n.icon
    switch (n.type) {
      case 'info':
      case 'success':
      case 'announcement':
        return '$info'
      case 'warning':
        return '$warning'
    }
    return '$error'
  }

  classes (n: AppNotification) {
    return `notification-${n.type}`
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
  @import '~vuetify/src/styles/styles.sass';

  ::v-deep .app-notifications .v-list-item__action.notification-suffix,
  ::v-deep .app-notifications .v-list-item__action.notification-clear {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    align-self: stretch !important;
    border-left: thin solid rgba(map-get($shades, 'white'), 0.12);
  }

  ::v-deep .app-notifications .v-list-item__action.notification-suffix {
    padding: 0 0 0 12px;
  }

  ::v-deep .app-notifications .v-list-item__action.notification-clear {
    padding: 0 0 0 8px;
    margin-right: -8px;
  }

::v-deep .app-notifications .v-list-item__action.notification-clear-all {
    margin-right: -8px;
  }

  ::v-deep .app-notifications .v-list-item .v-list-item__subtitle.notification-timestamp {
    color: rgba(255, 255, 255, 0.47);
  }

  .theme--light ::v-deep .app-notifications .v-list-item .v-list-item__subtitle.notification-timestamp {
    color: rgba(0, 0, 0, 0.47);
  }

  ::v-deep .app-notifications .v-list-item .v-list-item__subtitle.notification-description {
    font-style: italic;
    color: rgba(255, 255, 255, 0.60);
  }

  .theme--light ::v-deep .app-notifications .v-list-item .v-list-item__subtitle.notification-description {
    color: rgba(0, 0, 0, 0.60);
  }

  ::v-deep .notification-success,
  ::v-deep .notification-info,
  ::v-deep .notification-warning,
  ::v-deep .notification-error,
  ::v-deep .notification-announcement {
    border-left: solid 3px;
  }

  ::v-deep .notification-success {
    border-color: var(--v-success-base);
  }
  ::v-deep .notification-info,
  ::v-deep .notification-announcement {
    border-color: var(--v-info-base);
  }
  ::v-deep .notification-warning {
    border-color: var(--v-warning-base);
  }
  ::v-deep .notification-error {
    border-color: var(--v-error-base);
  }
  ::v-deep .notification-temp {
    font-size: 1.5rem;
  }
</style>
