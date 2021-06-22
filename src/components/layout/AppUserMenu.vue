<template>
  <v-menu
    :nudge-width="260"
    offset-y
    :close-delay="300"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        v-on="on"
        fab text small
        @click="$emit('drawer')">
        <v-icon>$account</v-icon>
      </v-btn>
    </template>

    <v-card>
      <v-card-text class="text-center">
        <div>
          <v-icon large>$account</v-icon>
        </div>
        <span class="text-h5">{{ currentUser }}</span>

        <div class="mt-3" v-if="!isTrustedOnly">
          <app-btn small @click="$emit('change-password')">Change password</app-btn>
        </div>
      </v-card-text>

      <v-divider />

      <v-list class="py-0">
        <v-list-item
          dense
          @click="$filters.routeTo($router, '/settings#auth')"
        >
          <v-list-item-icon>
            <v-icon>$addAccount</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Manage accounts</v-list-item-title>
        </v-list-item>

        <v-divider v-if="!isTrustedOnly" />

        <v-list-item v-if="!isTrustedOnly">
          <v-list-item-content class="justify-center">
            <app-btn @click="handleLogout">Logout</app-btn>
          </v-list-item-content>
        </v-list-item>
      </v-list>

    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { startCase, capitalize } from 'lodash'

@Component({})
export default class AppNotificationMenu extends Vue {
  get user () {
    return this.$store.getters['auth/getCurrentUser']
  }

  get currentUser () {
    if (!this.user) return ''
    if (
      this.user.username === '_TRUSTED_USER_' ||
      this.user.username === '_API__API_KEY_USER_USER_'
    ) {
      return capitalize(startCase(this.user.username))
    } else {
      return this.user.username
    }
  }

  get isTrustedOnly () {
    if (!this.user) return false
    return (
      this.user.username === '_TRUSTED_USER_' ||
      this.user.username === '_API__API_KEY_USER_USER_'
    )
  }

  async handleLogout () {
    await this.$store.dispatch('auth/checkTrust')
  }
}
</script>
