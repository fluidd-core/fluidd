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
      min-width="320"
      max-width="352"
      content-class="muon-account__menu"
    >
      <template #activator="{ on, attrs }">
        <button
          type="button"
          class="muon-account__avatar"
          :class="{ 'muon-account__avatar--open': menu }"
          aria-label="Account"
          data-tid="account"
          v-bind="attrs"
          v-on="on"
        >
          <span class="muon-account__initials">{{ initials }}</span>
        </button>
      </template>
      <div
        class="acct-menu"
        role="menu"
        aria-label="Account"
      >
        <!-- A printer's own page (KAN-532 §2.1): the account's settings open on the console. -->
        <template v-if="printerPage">
          <span class="acct-menu__caps">Muon3D account</span>
          <template v-if="account">
            <div class="acct-menu__who">
              <span class="acct-menu__avatar">{{ initials }}</span>
              <span class="acct-menu__names">
                <b>{{ account.name }}</b>
                <span>{{ account.email }}</span>
              </span>
            </div>
            <p class="acct-menu__note">
              <frame-icon
                name="info"
                small
              />You're on {{ printerName }}'s own page. Your account settings, passkeys and Library open on {{ consoleHost }}.
            </p>
            <a
              :href="consoleUrl('/account')"
              target="_blank"
              rel="noopener"
              class="acct-menu__item"
              role="menuitem"
              data-tid="account-manage"
              @click="menu = false"
            >
              <frame-icon
                name="user"
                small
              />Manage your account<frame-icon
                name="external"
                small
                class="acct-menu__out"
              />
            </a>
            <a
              :href="consoleUrl('/library')"
              target="_blank"
              rel="noopener"
              class="acct-menu__item"
              role="menuitem"
              @click="menu = false"
            >
              <frame-icon
                name="library"
                small
              />Your Library<frame-icon
                name="external"
                small
                class="acct-menu__out"
              />
            </a>
            <button
              type="button"
              class="acct-menu__item"
              role="menuitem"
              data-tid="account-sign-out"
              @click="doSignOut"
            >
              <frame-icon
                name="logout"
                small
              />Sign out of Muon3D on this page
            </button>
          </template>
          <button
            v-else
            type="button"
            class="acct-menu__item"
            role="menuitem"
            data-tid="account-sign-in"
            @click="menu = false; dialog = true"
          >
            <frame-icon
              name="signIn"
              small
            />Sign in to Muon3D
          </button>
          <template v-if="printerConnected">
            <div class="acct-menu__rule" />
            <span class="acct-menu__caps">This printer</span>
            <router-link
              :to="accessTo"
              class="acct-menu__item"
              role="menuitem"
              @click.native="menu = false"
            >
              <frame-icon
                name="shield"
                small
              />People and access
            </router-link>
            <button
              v-if="printerUser && printerPasswordHere"
              type="button"
              class="acct-menu__item"
              role="menuitem"
              @click="menu = false; passwordDialog = true"
            >
              <frame-icon
                name="lock"
                small
              />Change {{ printerName }}'s password
            </button>
            <button
              v-if="printerUser"
              type="button"
              class="acct-menu__item"
              role="menuitem"
              data-tid="account-lock-printer"
              @click="lockPrinter"
            >
              <frame-icon
                name="logout"
                small
              />Lock {{ printerName }} on this browser
            </button>
          </template>
        </template>

        <template v-else>
          <div
            v-if="account"
            class="acct-menu__who"
          >
            <span class="acct-menu__avatar">{{ initials }}</span>
            <span class="acct-menu__names">
              <b>{{ account.name }}</b>
              <span>{{ account.email }}</span>
            </span>
          </div>
          <div
            v-if="account"
            class="acct-menu__rule"
          />
          <router-link
            v-if="account"
            :to="accountTo('')"
            class="acct-menu__item"
            role="menuitem"
            data-tid="account-open"
            @click.native="menu = false"
          >
            <frame-icon
              name="user"
              small
            />Account<span class="acct-menu__key">G A</span>
          </router-link>
          <router-link
            v-if="account && built('security')"
            :to="accountTo('security')"
            class="acct-menu__item"
            role="menuitem"
            @click.native="menu = false"
          >
            <frame-icon
              name="shield"
              small
            />Sign-in and security
          </router-link>
          <router-link
            v-if="account && built('printers')"
            :to="accountTo('printers')"
            class="acct-menu__item"
            role="menuitem"
            @click.native="menu = false"
          >
            <frame-icon
              name="printer"
              small
            />Printers and access<span
              v-if="waiting"
              class="acct-menu__badge"
              :aria-label="`${waiting} waiting`"
            >{{ waiting }}</span>
          </router-link>
          <router-link
            v-if="account"
            :to="libraryTo"
            class="acct-menu__item"
            role="menuitem"
            data-tid="account-library"
            @click.native="menu = false"
          >
            <frame-icon
              name="library"
              small
            />Library<span class="acct-menu__key">G B</span>
          </router-link>
          <router-link
            v-if="!account"
            to="/"
            exact
            class="acct-menu__item"
            role="menuitem"
            @click.native="menu = false"
          >
            <frame-icon
              name="printers"
              small
            />All printers<span class="acct-menu__key">G P</span>
          </router-link>
          <button
            v-if="account"
            type="button"
            class="acct-menu__item"
            role="menuitem"
            @click="menu = false; linkDialog = true"
          >
            <frame-icon
              name="plus"
              small
            />Link a printer
          </button>
          <div class="acct-menu__rule" />
          <button
            type="button"
            class="acct-menu__item"
            role="menuitem"
            @click="openKeys"
          >
            <frame-icon
              name="keyboard"
              small
            />Keyboard shortcuts<span class="acct-menu__key">?</span>
          </button>
          <a
            :href="helpUrl"
            target="_blank"
            rel="noopener"
            class="acct-menu__item"
            role="menuitem"
            @click="menu = false"
          >
            <frame-icon
              name="help"
              small
            />Help and support
          </a>
          <div class="acct-menu__rule" />
          <button
            v-if="account"
            type="button"
            class="acct-menu__item"
            role="menuitem"
            data-tid="account-sign-out"
            @click="doSignOut"
          >
            <frame-icon
              name="logout"
              small
            />Sign out
          </button>
          <button
            v-else
            type="button"
            class="acct-menu__item"
            role="menuitem"
            data-tid="account-sign-in"
            @click="menu = false; dialog = true"
          >
            <frame-icon
              name="signIn"
              small
            />Sign in to Muon3D
          </button>
          <app-user-menu @click="menu = false" />
        </template>
      </div>
    </v-menu>
    <user-password-dialog
      v-if="passwordDialog"
      v-model="passwordDialog"
    />

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
import { Component, Vue, Watch } from 'vue-property-decorator'
import { cloudState } from '@/services/muon-cloud/state'
import { cloudBaseUrl } from '@/services/muon-cloud/api'
import { centralLoginEnabled } from '@/services/muon-cloud/centralLogin'
import { beginSignOut } from '@/services/account/sign-out'
import { printerNameParts } from '@/util/printer-name'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { ACCOUNT_SECTIONS, initialsOf, type AccountSectionId } from '@/services/account/model'
import { accountState, loadApprovals } from '@/services/account/state'
import { EventBus } from '@/eventBus'
import { Globals } from '@/globals'
import CloudAccountDialog from './CloudAccountDialog.vue'
import LinkPrinterDialog from './LinkPrinterDialog.vue'
import AppUserMenu from '@/components/layout/AppUserMenu.vue'
import UserPasswordDialog from '@/components/settings/auth/UserPasswordDialog.vue'

/** A trusted client or an API key has no name to show, password or log out. */
const NAMELESS_USERS = ['_TRUSTED_USER_', '_API__API_KEY_USER_USER_']

/**
 * The person (the canvas's "Header account menu"): their Muon3D account and
 * its pages, the Library, linking a printer, the keys and help, and signing
 * out; then the printer's own login when it has one (password, accounts,
 * log out).
 *
 * On a printer's own page (the canvas's "Account menu on a printer's own
 * page") the account's settings open on the console instead, and the
 * printer's login is "This printer": who can use it, its password, and
 * locking it in this browser.
 */
@Component({ components: { CloudAccountDialog, LinkPrinterDialog, AppUserMenu, UserPasswordDialog } })
export default class CloudAccountMenu extends Vue {
  dialog = false
  linkDialog = false
  menu = false
  passwordDialog = false
  helpUrl = Globals.DOCS_ROOT

  /** Not the console's page: passkeys, its cookie and the Library's CORS don't reach here. */
  get printerPage (): boolean {
    return !centralLoginEnabled()
  }

  get consoleHost (): string {
    try {
      return new URL(cloudBaseUrl()).host
    } catch {
      return 'control.muon3d.com'
    }
  }

  consoleUrl (path: string): string {
    return `${cloudBaseUrl()}${path}`
  }

  get printerName (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name || 'this printer'
  }

  /** A printer is open on this page: its own section has something to offer. */
  get printerConnected (): boolean {
    return !!this.$store.state.socket?.open
  }

  /** The printer keeps this login's password itself (not a system login). */
  get printerPasswordHere (): boolean {
    const user = this.$store.getters['auth/getCurrentUser'] as { source?: string } | null
    return user?.source === 'moonraker'
  }

  get accessTo () {
    return { path: scopedPath('/settings', activeSlug()), hash: '#access' }
  }

  /** Logs this browser out of the printer's own login, as AppUserMenu does. */
  async lockPrinter () {
    this.menu = false
    await this.$store.dispatch('auth/checkTrust')
  }

  /** Signed in to this printer by name (Moonraker's own login). */
  get printerUser (): string | null {
    const user = this.$store.getters['auth/getCurrentUser'] as { username: string } | null
    if (!user || NAMELESS_USERS.includes(user.username)) return null
    return user.username
  }

  get account () {
    return cloudState.account
  }

  get initials () {
    return initialsOf(cloudState.account?.name || this.printerUser, cloudState.account?.email)
  }

  /** Requests to use one of your printers, waiting for you. */
  get waiting (): number {
    return accountState.approvals?.length ?? 0
  }

  @Watch('menu')
  onMenu (open: boolean) {
    if (open && this.account && this.built('printers')) loadApprovals().catch(() => {})
  }

  built (id: AccountSectionId): boolean {
    return ACCOUNT_SECTIONS.some(s => s.id === id && s.built)
  }

  accountTo (section: string): string {
    return scopedPath(section ? `/account/${section}` : '/account', activeSlug())
  }

  get libraryTo (): string {
    return scopedPath('/library', activeSlug())
  }

  openKeys () {
    this.menu = false
    EventBus.bus.$emit('keyboard-shortcuts')
  }

  doSignOut () {
    this.menu = false
    return beginSignOut(this.$router)
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
    border-radius: 50%;

    &:hover {
      background: var(--m3d-hover);
    }
  }

  .muon-account__avatar--open {
    box-shadow: 0 0 0 2px var(--m3d-accent);
  }

  .muon-account__initials {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--m3d-accent) 32%, var(--m3d-surface-2));
    color: var(--m3d-text);
    font-size: 13px;
    font-weight: 600;
  }
</style>

<style lang="scss">
  // Global: the menu mounts outside the header.
  .muon-account__menu {
    border-radius: 12px !important;
    background: var(--m3d-surface) !important;
    box-shadow: var(--m3d-shadow-float, 0 8px 24px rgb(0 0 0 / 45%)), 0 0 0 1px var(--m3d-border-strong) !important;
  }

  .acct-menu {
    display: flex;
    flex-direction: column;
    padding: 6px;
    color: var(--m3d-text);
    font-size: 14px;
  }

  .acct-menu__who {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
  }

  .acct-menu__avatar {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--m3d-accent) 32%, var(--m3d-surface-2));
    font-size: 19px;
    font-weight: 600;
  }

  .acct-menu__names {
    display: flex;
    flex-direction: column;
    min-width: 0;

    b,
    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    b {
      font-weight: 600;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .acct-menu__item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 40px;
    padding: 0 12px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--m3d-text) !important;
    font: inherit;
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    text-decoration: none;
    cursor: pointer;

    .frame-icon {
      color: var(--m3d-text-muted);
    }

    &:hover,
    &:focus-visible {
      background: var(--m3d-surface-2);
      outline: none;
    }
  }

  .acct-menu__key {
    margin-left: auto;
    color: var(--m3d-text-subtle);
    font-family: var(--m3d-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.08em;
  }

  .acct-menu__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    margin-left: auto;
    padding: 0 7px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--m3d-warning) 14%, transparent);
    color: var(--m3d-warning);
    font-size: 11.5px;
    font-weight: 600;
  }

  .acct-menu__rule {
    height: 1px;
    margin: 6px 4px;
    background: var(--m3d-border);
  }

  .acct-menu__caps {
    padding: 8px 12px 4px;
    color: var(--m3d-text-subtle);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .acct-menu__note {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin: 0 6px 6px;
    padding: 10px 12px;
    border-radius: 9px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
    font-size: 13px;

    .frame-icon {
      flex: none;
      margin-top: 2px;
      color: var(--m3d-accent);
    }
  }

  .acct-menu__out {
    margin-left: auto;
  }

  // The printer's own login, under the account (AppUserMenu).
  .acct-menu .v-list {
    padding: 0;
    background: transparent !important;
  }
</style>
