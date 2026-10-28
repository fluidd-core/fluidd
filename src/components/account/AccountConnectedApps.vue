<template>
  <div
    class="acct-section"
    data-tid="account-apps"
  >
    <div class="acct-head">
      <h1>Connected apps</h1>
      <p>AI tools and other programs you let into your account from the Muon3D sign-in page. Each one can do only what you approved, and you can cut it off any time.</p>
    </div>

    <section
      v-if="!missing && apps && apps.length"
      class="lib-surface acct-card"
      aria-label="Your connected apps"
      data-tid="apps-list"
    >
      <div class="acct-list">
        <div
          v-for="app in ordered"
          :key="app.client_id"
          class="app__row"
          :class="{ 'app__row--gone': !app.known }"
          data-tid="apps-row"
        >
          <span class="acct-icon-box"><frame-icon
            :name="app.verified ? 'link' : 'cpu'"
            small
          /></span>
          <div class="acct-row__label app__body">
            <span class="app__name">
              <b>{{ nameOf(app) }}</b>
              <span
                v-if="app.current"
                class="lib-pill lib-pill--ok"
                data-tid="apps-current"
              >This app</span>
              <span
                v-else-if="app.verified"
                class="lib-pill"
                data-tid="apps-verified"
              >Muon3D</span>
              <span
                v-else
                class="lib-pill lib-pill--warn"
                data-tid="apps-unverified"
              >Muon3D did not check this app</span>
            </span>
            <span data-tid="apps-where">Signs in from {{ whereLine(app) }}<template v-if="siteLine(app)"> · says its site is {{ siteLine(app) }}</template></span>
            <span
              v-if="app.scopes.length"
              class="app__chips"
            >
              <span
                v-for="scope in scopesOf(app)"
                :key="scope.id"
                class="app__chip"
                :class="{ 'app__chip--power': scope.power }"
                :title="scope.id"
                :data-tid="`apps-scope-${scope.id}`"
              >{{ scope.label }}</span>
            </span>
            <span
              v-else
              data-tid="apps-no-scopes"
            >Can see who you are, nothing else</span>
            <span data-tid="apps-used">{{ approvedLine(app) }} · {{ usedLine(app) }}</span>
            <span class="app__ask">
              <toggle-switch
                :value="true"
                :label="`${nameOf(app)} asks you before it acts`"
                disabled
                data-tid="apps-ask"
              />
              <span><span class="lib-pill lib-pill--ok">Ask mode</span> Asks you first. Letting an app act without asking (Bypass) comes later.</span>
            </span>
          </div>
          <button
            v-if="!app.current"
            type="button"
            class="lib-btn lib-btn--sm lib-btn--ghost app__revoke"
            :disabled="busy"
            :aria-label="`Disconnect ${nameOf(app)}`"
            data-tid="apps-revoke"
            @click="revoke(app)"
          >
            Disconnect
          </button>
        </div>
      </div>
    </section>

    <div
      v-else-if="apps === null && !missing && !loadError"
      class="lib-surface acct-card acct-card--pad"
    >
      <p class="acct-muted app__reading">
        Reading your connected apps…
      </p>
    </div>

    <div
      v-else-if="missing"
      class="acct-empty"
      data-tid="apps-missing"
    >
      <span class="acct-empty__icon"><frame-icon
        name="link"
        large
      /></span>
      <h3>Connected apps come soon</h3>
      <p>This console can't list connected apps yet. They appear here when it can.</p>
    </div>

    <div
      v-else-if="apps && !apps.length"
      class="acct-empty"
      data-tid="apps-empty"
    >
      <span class="acct-empty__icon"><frame-icon
        name="link"
        large
      /></span>
      <h3>No connected apps</h3>
      <p>When you connect an AI tool such as an MCP client to Muon3D and approve it, it shows here. For a script or a CI job, make an access token instead.</p>
      <router-link
        :to="linkTo('tokens')"
        class="lib-btn"
        data-tid="apps-to-tokens"
      >
        Access tokens
      </router-link>
    </div>

    <div class="acct-note">
      <frame-icon
        name="info"
        small
      />
      <span>An app that registered itself can only look: see your printers, your Library, your Design files and your name. Its name and site are what it said about itself. Disconnect one you don't know: its sign-ins end at once, and it has to ask you again to come back.</span>
    </div>

    <p
      v-if="message"
      class="acct-note acct-note--info"
      role="status"
      data-tid="apps-message"
    >
      <frame-icon
        name="info"
        small
      />
      <span>{{ message }}</span>
    </p>
    <p
      v-if="error"
      class="acct-error"
      role="alert"
      data-tid="apps-error"
    >
      {{ error }}
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import { accountApi } from '@/services/account/api'
import { isMissing } from '@/services/account/client'
import type { AccountSectionId } from '@/services/account/model'
import {
  appFailure,
  appName,
  appScopes,
  approvedText,
  lastUsedText,
  orderApps,
  siteText,
  whereText,
  type ConnectedApp
} from '@/services/account/connectedApps'

/**
 * Connected apps (KAN-905): the OAuth apps the account let in, Muon's own and
 * self-registered ones such as MCP clients. List them with what they may do
 * and when they were last used, and disconnect one. Approving happens on the
 * console's consent page, never here. Every app asks first today; the switch
 * shows that and changes nothing until the console has Bypass for apps
 * (KAN-961). Control's own entry has no Disconnect: that is signing out.
 */
@Component({ components: { ToggleSwitch } })
export default class AccountConnectedApps extends Vue {
  @Prop({ type: Function, default: (id: AccountSectionId) => `/account/${id}` })
  readonly linkTo!: (id: AccountSectionId) => string

  apps: ConnectedApp[] | null = null
  missing = false
  loadError = false
  busy = false
  error = ''
  message = ''

  created () {
    this.refresh()
  }

  async refresh () {
    try {
      this.apps = (await accountApi.connectedApps()).apps
      this.missing = false
      this.loadError = false
    } catch (error) {
      if (isMissing(error)) {
        this.missing = true
        this.apps = []
      } else {
        this.loadError = true
        this.apps = this.apps ?? []
        this.error = appFailure(error)
      }
    }
  }

  get ordered (): ConnectedApp[] {
    return orderApps(this.apps ?? [])
  }

  nameOf (app: ConnectedApp): string {
    return appName(app)
  }

  scopesOf (app: ConnectedApp) {
    return appScopes(app)
  }

  whereLine (app: ConnectedApp): string {
    return whereText(app)
  }

  siteLine (app: ConnectedApp): string {
    return siteText(app)
  }

  approvedLine (app: ConnectedApp): string {
    return approvedText(app)
  }

  usedLine (app: ConnectedApp): string {
    return lastUsedText(app)
  }

  async revoke (app: ConnectedApp) {
    const name = appName(app)
    const sure = await this.$confirm(`${name} is signed out at once, everywhere it is signed in as you, and loses the access you approved. To use it again, connect it and approve it again.`, {
      title: `Disconnect ${name}?`,
      buttonTrueText: 'Disconnect'
    })
    if (!sure) return
    this.busy = true
    this.error = ''
    this.message = ''
    try {
      await accountApi.disconnectApp(app.client_id)
      this.message = `${name} is disconnected.`
    } catch (error) {
      // Already gone, or this app: the list says so after a refresh.
      this.error = appFailure(error)
    } finally {
      this.busy = false
      await this.refresh()
    }
  }
}
</script>

<style lang="scss" scoped>
  .app__row {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: start;
    padding: 14px 0;
  }

  .app__row--gone {
    opacity: 0.7;
  }

  .app__body {
    gap: 4px;
  }

  .app__name {
    display: flex !important;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    color: var(--m3d-text) !important;
    font-size: 14px !important;
  }

  .app__chips {
    display: flex !important;
    flex-wrap: wrap;
    gap: 4px;
  }

  .app__chip {
    padding: 1px 8px;
    border: 1px solid var(--m3d-border);
    border-radius: 99px;
    color: var(--m3d-text-muted);
    font-size: 11px;
  }

  .app__chip--power {
    border-color: color-mix(in srgb, var(--m3d-warn, #d49a2a) 60%, var(--m3d-border));
    color: var(--m3d-text);
  }

  .app__ask {
    display: flex !important;
    align-items: center;
    gap: 10px;
    margin-top: 4px;
  }

  .app__reading {
    margin: 0;
    font-size: 13px;
  }

  @media (max-width: 480px) {
    .app__row {
      grid-template-columns: 40px minmax(0, 1fr);
    }
    .app__revoke {
      grid-column: 2;
      justify-self: start;
    }
  }
</style>
