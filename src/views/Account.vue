<template>
  <div
    class="acct-page"
    :class="{ 'acct-page--phone': isMobileViewport }"
    data-tid="account-page"
  >
    <nav
      v-if="showList"
      class="acct-nav"
      aria-label="Account sections"
    >
      <span class="lib-caps">Account</span>
      <router-link
        v-for="section in mainSections"
        :key="section.id"
        :to="linkTo(section.id)"
        class="acct-nav__item"
        :class="{ 'acct-nav__item--on': !isMobileViewport && section.id === current.id }"
        :aria-current="section.id === current.id ? 'page' : undefined"
        :data-tid="`account-nav-${section.id}`"
      >
        <frame-icon
          :name="section.icon"
          small
        />
        <span class="acct-nav__label">{{ section.label }}</span>
        <frame-icon
          v-if="isMobileViewport"
          name="chevronRight"
          small
        />
      </router-link>
      <div class="acct-nav__rule" />
      <router-link
        v-if="deleteSection"
        :to="linkTo('delete')"
        class="acct-nav__item acct-nav__item--danger"
        :class="{ 'acct-nav__item--on': !isMobileViewport && current.id === 'delete' }"
        data-tid="account-nav-delete"
      >
        <frame-icon
          name="trash"
          small
        />
        <span class="acct-nav__label">Delete account</span>
      </router-link>
      <button
        v-if="signedIn"
        type="button"
        class="acct-nav__item"
        data-tid="account-sign-out"
        @click="signOut"
      >
        <frame-icon
          name="logout"
          small
        />
        <span class="acct-nav__label">Sign out</span>
      </button>
    </nav>

    <div
      v-if="showPane"
      class="acct-pane"
      data-tid="account-pane"
    >
      <router-link
        v-if="isMobileViewport"
        :to="linkTo('overview', true)"
        class="acct-back"
      >
        <frame-icon
          name="chevronLeft"
          small
        />
        Account
      </router-link>

      <!-- Signed out: the account is what these pages are about. -->
      <section
        v-if="!ready"
        class="lib-empty lib-surface"
      >
        <p>Reading your account…</p>
      </section>

      <section
        v-else-if="!signedIn"
        class="lib-empty lib-surface"
        data-tid="account-signed-out"
      >
        <span class="lib-empty__icon"><frame-icon
          name="user"
          large
        /></span>
        <h2>Sign in to see your account</h2>
        <p>Your Muon3D account keeps your printers reachable from anywhere, your Library and who can use your printers. Printers on this network work without it.</p>
        <div class="lib-empty__actions">
          <button
            type="button"
            class="lib-btn lib-btn--pri"
            data-tid="account-sign-in"
            @click="accountDialog = true"
          >
            Sign in
          </button>
        </div>
      </section>

      <!-- A printer's own page: the account's settings live on the console's page (KAN-532 §2.1). -->
      <section
        v-else-if="!consoleHere"
        class="lib-empty lib-surface"
        data-tid="account-elsewhere"
      >
        <span class="lib-empty__icon lib-empty__icon--accent"><frame-icon
          name="user"
          large
        /></span>
        <h2>Your account opens on {{ consoleHost }}</h2>
        <p>
          You're on a printer's own page. Your account's settings, passkeys and Library are on {{ consoleHost }},
          where you're signed in to Muon3D.
        </p>
        <div class="lib-empty__actions">
          <a
            class="lib-btn lib-btn--pri"
            :href="consoleAccountUrl"
            target="_blank"
            rel="noopener"
            data-tid="account-open-console"
          >
            Manage your account
            <frame-icon
              name="external"
              small
            />
          </a>
        </div>
      </section>

      <template v-else>
        <account-overview
          v-if="current.id === 'overview'"
          :link-to="linkTo"
        />
        <account-profile v-else-if="current.id === 'profile'" />
        <account-security
          v-else-if="current.id === 'security'"
          :link-to="linkTo"
        />
        <account-sessions
          v-else-if="current.id === 'sessions'"
          :link-to="linkTo"
        />
        <account-printers
          v-else-if="current.id === 'printers'"
          :link-to="linkTo"
        />
        <account-notifications v-else-if="current.id === 'notifications'" />
        <library-settings v-else-if="current.id === 'library'" />
        <account-plan v-else-if="current.id === 'plan'" />
        <account-privacy
          v-else-if="current.id === 'privacy'"
          :link-to="linkTo"
        />
        <account-delete
          v-else-if="current.id === 'delete'"
          :link-to="linkTo"
        />
      </template>
    </div>

    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import { cloudState } from '@/services/muon-cloud/state'
import { cloudBaseUrl } from '@/services/muon-cloud/api'
import { centralLoginEnabled } from '@/services/muon-cloud/centralLogin'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { accountSectionFor, accountSections, type AccountSection, type AccountSectionId } from '@/services/account/model'
import { accountState, loadMe } from '@/services/account/state'
import AccountOverview from '@/components/account/AccountOverview.vue'
import AccountProfile from '@/components/account/AccountProfile.vue'
import AccountPlan from '@/components/account/AccountPlan.vue'
import { beginSignOut } from '@/services/account/sign-out'
import LibrarySettings from '@/components/settings/LibrarySettings.vue'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import '@/scss/muon3d-account.scss'

/**
 * Your account (`/account`, KAN-532): its sections on the left, the one
 * chosen on the right, by the address (`/account/profile`). With a printer
 * open the same pages sit under it (`/boxwood-367a/account`), beside its
 * rail. On a phone the list is a page and a section opens over it.
 *
 * Only where the console serves Fluidd: on a printer's own page the account's
 * settings open on the console's page instead, where passkeys work and the
 * session is the console's own (the canvas's "Account menu on a printer's
 * own page").
 */
@Component({
  components: {
    AccountOverview,
    AccountProfile,
    AccountSecurity: () => import('@/components/account/AccountSecurity.vue'),
    AccountSessions: () => import('@/components/account/AccountSessions.vue'),
    AccountPrinters: () => import('@/components/account/AccountPrinters.vue'),
    AccountNotifications: () => import('@/components/account/AccountNotifications.vue'),
    AccountPrivacy: () => import('@/components/account/AccountPrivacy.vue'),
    AccountDelete: () => import('@/components/account/AccountDelete.vue'),
    AccountPlan,
    LibrarySettings,
    CloudAccountDialog
  }
})
export default class Account extends Mixins(BrowserMixin) {
  accountDialog = false

  created () {
    if (!accountState.me) loadMe().catch(() => {})
  }

  /**
   * Waiting out its 14 days before deletion (console #28), the account
   * answers only its own details, the export and Keep my account: the
   * other sections have nothing to show until it's kept.
   */
  get deleting (): boolean {
    return !!accountState.me?.account.deletion
  }

  get ready (): boolean {
    return cloudState.ready
  }

  get signedIn (): boolean {
    return cloudState.account !== null
  }

  /** The console serves this page: the account's own pages work here. */
  get consoleHere (): boolean {
    return centralLoginEnabled()
  }

  get consoleHost (): string {
    try {
      return new URL(cloudBaseUrl()).host
    } catch {
      return 'control.muon3d.com'
    }
  }

  get consoleAccountUrl (): string {
    return `${cloudBaseUrl()}/account`
  }

  get sections (): AccountSection[] {
    const all = accountSections()
    return this.deleting ? all.filter(section => section.id === 'privacy' || section.id === 'delete') : all
  }

  get mainSections (): AccountSection[] {
    return this.sections.filter(section => section.id !== 'delete')
  }

  get deleteSection (): AccountSection | undefined {
    return this.sections.find(section => section.id === 'delete')
  }

  get current (): AccountSection {
    const section = accountSectionFor(this.$route.params.section)
    if (this.deleting && section.id !== 'privacy') return accountSectionFor('delete')
    return section
  }

  /** On a phone, the list on its own until a section is chosen. */
  get showList (): boolean {
    return !this.isMobileViewport || !this.$route.params.section
  }

  get showPane (): boolean {
    return !this.isMobileViewport || !!this.$route.params.section
  }

  linkTo (id: AccountSectionId, list = false): string {
    const path = id === 'overview' && (list || !this.isMobileViewport) ? '/account' : `/account/${id}`
    return scopedPath(path, activeSlug())
  }

  signOut () {
    return beginSignOut()
  }
}
</script>
