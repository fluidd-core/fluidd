<template>
  <div class="muon-account">
    <app-btn
      v-if="!account && !printerUser"
      small
      outlined
      class="muon-account__sign-in"
      @click="dialog = true"
    >
      Sign in
    </app-btn>

    <v-menu
      v-else
      v-model="menu"
      bottom
      left
      offset-y
      nudge-bottom="8"
      min-width="280"
      content-class="muon-account__menu"
    >
      <template #activator="{ on, attrs }">
        <button
          type="button"
          class="muon-account__avatar"
          aria-label="Account"
          data-tid="account"
          v-bind="attrs"
          v-on="on"
        >
          <span class="muon-account__initials">{{ initials }}</span>
        </button>
      </template>
      <v-list dense>
        <template v-if="account">
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="font-weight-medium">
                {{ account.name }}
              </v-list-item-title>
              <v-list-item-subtitle>{{ account.email }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-divider />
        </template>
        <v-list-item
          to="/"
          exact
        >
          <v-list-item-icon>
            <frame-icon name="printers" />
          </v-list-item-icon>
          <v-list-item-title>All printers</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="account"
          @click="linkDialog = true"
        >
          <v-list-item-icon>
            <v-icon small>
              {{ icons.link }}
            </v-icon>
          </v-list-item-icon>
          <v-list-item-title>Link a printer</v-list-item-title>
        </v-list-item>
        <v-list-item @click="openKeys">
          <v-list-item-icon>
            <frame-icon name="keyboard" />
          </v-list-item-icon>
          <v-list-item-title>Keyboard shortcuts</v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-list-item
          v-if="account"
          @click="doSignOut"
        >
          <v-list-item-icon>
            <v-icon small>
              {{ icons.signOut }}
            </v-icon>
          </v-list-item-icon>
          <v-list-item-title>Sign out of Muon3D</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-else
          data-tid="account-sign-in"
          @click="dialog = true"
        >
          <v-list-item-icon>
            <v-icon small>
              {{ icons.account }}
            </v-icon>
          </v-list-item-icon>
          <v-list-item-title>Sign in to Muon3D</v-list-item-title>
        </v-list-item>
      </v-list>
      <app-user-menu @click="menu = false" />
    </v-menu>

    <cloud-account-dialog
      v-if="dialog"
      v-model="dialog"
    />
    <link-printer-dialog
      v-if="linkDialog"
      v-model="linkDialog"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { cloudState, signOut } from '@/services/muon-cloud/state'
import { activationState } from '@/services/muon-cloud/activate'
import { EventBus } from '@/eventBus'
import CloudAccountDialog from './CloudAccountDialog.vue'
import LinkPrinterDialog from './LinkPrinterDialog.vue'
import AppUserMenu from '@/components/layout/AppUserMenu.vue'

/** A trusted client or an API key has no name to show, password or log out. */
const NAMELESS_USERS = ['_TRUSTED_USER_', '_API__API_KEY_USER_USER_']

/**
 * The person: their Muon3D account, and the printer's own login when it
 * has one (password, accounts, log out), with every printer and the keys.
 */
@Component({ components: { CloudAccountDialog, LinkPrinterDialog, AppUserMenu } })
export default class CloudAccountMenu extends Vue {
  dialog = false
  linkDialog = false
  menu = false
  icons = {
    account: '$accountCircle',
    link: '$linkPrinter',
    signOut: '$logout'
  }

  /** Signed in to this printer by name (Moonraker's own login). */
  get printerUser (): string | null {
    const user = this.$store.getters['auth/getCurrentUser'] as { username: string } | null
    if (!user || NAMELESS_USERS.includes(user.username)) return null
    return user.username
  }

  openKeys () {
    this.menu = false
    EventBus.bus.$emit('keyboard-shortcuts')
  }

  get account () {
    return cloudState.account
  }

  get initials () {
    const name = cloudState.account?.name || cloudState.account?.email || this.printerUser || '?'
    return name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('')
  }

  async doSignOut () {
    const wasCloud = cloudState.activePrinterId !== null || activationState.switching !== null
    const navigating = await signOut()
    if (wasCloud && !navigating) window.location.reload()
  }
}
</script>

<style lang="scss" scoped>
  .muon-account {
    display: flex;
    align-items: center;
  }

  .muon-account__avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;

    &:hover {
      background: var(--m3d-hover);
    }
  }

  .muon-account__initials {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #3d5a58;
    color: #dff5f3;
    font-size: 13px;
    font-weight: 600;
  }
</style>

<style lang="scss">
  .muon-account__menu {
    border-radius: 18px !important;
    background: var(--m3d-surface) !important;

    .v-list-item__icon {
      align-self: center;
      color: var(--m3d-text-muted);
    }
  }
</style>
