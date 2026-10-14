<template>
  <div
    class="acct-section"
    data-tid="account-security"
  >
    <div class="acct-head">
      <h1>Sign-in and security</h1>
      <p>How you get into your account, and what keeps someone else out.</p>
    </div>

    <div
      v-if="me"
      class="acct-note"
      :class="health.level === 'good' ? 'acct-note--good' : health.level === 'weak' ? 'acct-note--bad' : 'acct-note--warn'"
      role="status"
      data-tid="security-health"
    >
      <frame-icon
        name="shield"
        small
      />
      <span><b>{{ health.title }}.</b> {{ health.line }}</span>
    </div>

    <section
      class="lib-surface acct-card"
      aria-label="Email"
    >
      <div class="acct-row">
        <div class="acct-row__label">
          <b>Email</b>
          <span>
            {{ email }}<template v-if="details && details.email_verified === true"><span class="sec__ok"> · confirmed</span></template><template v-else-if="details && details.email_verified === false"><span class="sec__warn"> · not confirmed yet</span></template>.
            You sign in with it, and every security email goes here.
          </span>
          <span
            v-if="pending"
            class="sec__warn"
            data-tid="security-email-pending"
          >Waiting for you to open the link sent to {{ pending.address }}.</span>
        </div>
        <div class="acct-row__control">
          <button
            v-if="details && details.email_verified === false"
            type="button"
            class="lib-btn lib-btn--sm lib-btn--ghost"
            :disabled="busy"
            @click="resend"
          >
            Send the link again
          </button>
          <button
            v-if="pending"
            type="button"
            class="lib-btn lib-btn--sm lib-btn--ghost"
            :disabled="busy"
            @click="cancelEmail"
          >
            Keep the old address
          </button>
          <button
            type="button"
            class="lib-btn lib-btn--sm"
            data-tid="security-change-email"
            @click="open('email')"
          >
            Change email
          </button>
        </div>
      </div>
    </section>

    <section
      class="lib-surface acct-card"
      aria-label="Ways to sign in"
    >
      <div class="acct-card__title">
        <h2>Ways to sign in</h2>
        <span class="acct-card__aside">Keep at least two, in case you lose a phone</span>
      </div>
      <div class="acct-list">
        <div class="sec__method">
          <span class="acct-icon-box"><frame-icon
            name="key"
            small
          /></span>
          <div class="acct-row__label">
            <b>Passkeys <span class="acct-subtle">{{ passkeys.length || '' }}</span></b>
            <span>Sign in with your fingerprint, face or screen lock. Nothing to type, nothing to steal. Skips the two-step code.</span>
          </div>
          <button
            v-if="canAddPasskey"
            type="button"
            class="lib-btn lib-btn--sm lib-btn--pri"
            :disabled="busy"
            data-tid="security-add-passkey"
            @click="addPasskey"
          >
            <frame-icon
              name="plus"
              small
            />Add a passkey
          </button>
          <span
            v-else
            class="acct-soon"
          >Not in this browser</span>
        </div>
        <div
          v-for="key in passkeys"
          :key="key.id"
          class="sec__sub"
          data-tid="security-passkey"
        >
          <span class="acct-icon-box sec__sub-icon"><frame-icon
            :name="keyIcon(key.name)"
            small
          /></span>
          <div class="acct-row__label">
            <span class="sec__name">{{ key.name }}</span>
            <span class="acct-subtle">Added {{ day(key.created_at) }} · {{ key.last_used_at ? `used ${ago(key.last_used_at)}` : 'not used yet' }}</span>
          </div>
          <div class="acct-row__control">
            <span
              v-if="renameMissing"
              class="acct-soon"
            >Renaming soon</span>
            <button
              v-else
              type="button"
              class="lib-btn lib-btn--sm lib-btn--ghost"
              @click="openRename(key)"
            >
              Rename
            </button>
            <button
              type="button"
              class="lib-btn lib-btn--sm lib-btn--ghost"
              :disabled="busy"
              @click="removePasskey(key)"
            >
              Remove
            </button>
          </div>
        </div>
        <div class="sec__method">
          <span class="acct-icon-box"><frame-icon
            name="lock"
            small
          /></span>
          <div class="acct-row__label">
            <b>Password</b>
            <span>{{ passwordLine }}</span>
          </div>
          <button
            type="button"
            class="lib-btn lib-btn--sm"
            data-tid="security-change-password"
            @click="open('password')"
          >
            {{ hasPassword ? 'Change password' : 'Set a password' }}
          </button>
        </div>
        <div
          v-for="provider in providers"
          :key="provider.id"
          class="sec__method"
        >
          <span class="acct-icon-box sec__letter">{{ provider.letter }}</span>
          <div class="acct-row__label">
            <b>{{ provider.name }}</b>
            <span>{{ provider.line }}</span>
          </div>
          <button
            v-if="provider.linked"
            type="button"
            class="lib-btn lib-btn--sm lib-btn--ghost"
            :disabled="busy"
            @click="unlink(provider.id)"
          >
            Unlink
          </button>
          <span
            v-else
            class="acct-soon"
          >Linking comes soon</span>
        </div>
      </div>
    </section>

    <section
      class="lib-surface acct-card"
      aria-label="Two-step sign-in"
    >
      <div class="acct-card__title">
        <h2>Two-step sign-in</h2>
        <span
          class="lib-pill"
          :class="twoStep ? 'lib-pill--ok' : ''"
        >{{ twoStep ? 'On' : 'Off' }}</span>
      </div>
      <div class="acct-list">
        <div class="acct-row">
          <div class="acct-row__label">
            <b>Authenticator app</b>
            <span>{{ twoStep ? 'A six-digit code after your password, or after Apple or Google.' : 'Off. Turn it on and a password alone no longer gets anyone in.' }}</span>
          </div>
          <button
            type="button"
            class="lib-btn lib-btn--sm"
            :class="twoStep ? 'lib-btn--ghost' : 'lib-btn--pri'"
            :disabled="busy"
            data-tid="security-two-step"
            @click="twoStep ? open('twoStepOff') : startTwoStep()"
          >
            {{ twoStep ? 'Turn off' : 'Turn on' }}
          </button>
        </div>
        <div
          v-if="twoStep"
          class="acct-row"
        >
          <div class="acct-row__label">
            <b>Recovery codes</b>
            <span><template v-if="recoveryLeft !== null"><span class="sec__num">{{ recoveryLeft }} of 10</span> left. </template>Each works once, if you lose your authenticator. Making new ones cancels the old.</span>
          </div>
          <span
            v-if="recoveryMissing"
            class="acct-soon"
          >Coming soon</span>
          <button
            v-else
            type="button"
            class="lib-btn lib-btn--sm"
            :disabled="busy"
            data-tid="security-new-codes"
            @click="newCodes"
          >
            Make new codes
          </button>
        </div>
      </div>
    </section>

    <section
      class="lib-surface acct-card"
      aria-label="Security emails"
    >
      <div class="acct-row">
        <div class="acct-row__label">
          <b>Security emails</b>
          <span>We always email you when someone signs in on a new device, or your password, email, passkeys or two-step sign-in change. These can't be turned off.</span>
        </div>
        <router-link
          :to="linkTo('sessions')"
          class="lib-btn lib-btn--sm lib-btn--ghost"
        >
          See activity
        </router-link>
      </div>
    </section>

    <p
      v-if="message"
      class="acct-note acct-note--info"
      role="status"
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
    >
      {{ error }}
    </p>

    <!-- Change email -->
    <m3-dialog
      :value="dialog === 'email'"
      title="Change your email address"
      :persistent="busy"
      @close="close"
    >
      <p class="m3-dlg__text">
        We send a link to the new address. It changes when you open the link, and we tell the old address.
      </p>
      <label class="m3-field">
        <span class="m3-field__label">New email address</span>
        <span class="m3-field__box"><input
          v-model="form.email"
          type="email"
          autocomplete="email"
          aria-label="New email address"
          @keydown.enter="changeEmail"
        ></span>
      </label>
      <p
        v-if="dialogError"
        class="m3-dlg__error"
      >
        {{ dialogError }}
      </p>
      <template #actions>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          @click="close"
        >
          Cancel
        </button>
        <button
          type="button"
          class="cbtn cbtn--primary"
          :disabled="!form.email.includes('@') || busy"
          @click="changeEmail"
        >
          Send the link
        </button>
      </template>
    </m3-dialog>

    <!-- Change or set the password -->
    <m3-dialog
      :value="dialog === 'password'"
      :title="hasPassword ? 'Change your password' : 'Set a password'"
      :persistent="busy"
      @close="close"
    >
      <p class="m3-dlg__text">
        Changing it signs you out everywhere else.
      </p>
      <label
        v-if="hasPassword"
        class="m3-field"
      >
        <span class="m3-field__label">Current password</span>
        <span class="m3-field__box"><input
          v-model="form.current"
          type="password"
          autocomplete="current-password"
          aria-label="Current password"
        ></span>
      </label>
      <label class="m3-field">
        <span class="m3-field__label">New password</span>
        <span class="m3-field__box"><input
          v-model="form.next"
          type="password"
          autocomplete="new-password"
          aria-label="New password"
        ></span>
        <span class="m3-dlg__note">At least 8 characters.</span>
      </label>
      <label
        v-if="twoStep"
        class="m3-field"
      >
        <span class="m3-field__label">Code from your authenticator app</span>
        <span class="m3-field__box m3-field__box--mono"><input
          v-model="form.code"
          inputmode="numeric"
          autocomplete="one-time-code"
          aria-label="Code from your authenticator app"
          @keydown.enter="changePassword"
        ></span>
      </label>
      <p
        v-if="dialogError"
        class="m3-dlg__error"
      >
        {{ dialogError }}
      </p>
      <template #actions>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          @click="close"
        >
          Cancel
        </button>
        <button
          type="button"
          class="cbtn cbtn--primary"
          :disabled="form.next.length < 8 || (hasPassword && !form.current) || (twoStep && !form.code) || busy"
          @click="changePassword"
        >
          {{ hasPassword ? 'Change password' : 'Set password' }}
        </button>
      </template>
    </m3-dialog>

    <!-- Rename a passkey -->
    <m3-dialog
      :value="dialog === 'rename'"
      title="Rename this passkey"
      :persistent="busy"
      @close="close"
    >
      <label class="m3-field">
        <span class="m3-field__label">Name</span>
        <span class="m3-field__box"><input
          v-model="form.name"
          maxlength="64"
          aria-label="Name"
          @keydown.enter="renamePasskey"
        ></span>
      </label>
      <p
        v-if="dialogError"
        class="m3-dlg__error"
      >
        {{ dialogError }}
      </p>
      <template #actions>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          @click="close"
        >
          Cancel
        </button>
        <button
          type="button"
          class="cbtn cbtn--primary"
          :disabled="!form.name.trim() || busy"
          @click="renamePasskey"
        >
          Rename
        </button>
      </template>
    </m3-dialog>

    <!-- Two-step: set up, then the recovery codes -->
    <m3-dialog
      :value="dialog === 'twoStep'"
      :title="codes.length ? 'Keep these recovery codes' : 'Turn on two-step sign-in'"
      :persistent="busy || codes.length > 0"
      :closable="!codes.length"
      max-width="480"
      @close="close"
    >
      <template v-if="!codes.length">
        <p class="m3-dlg__text">
          Scan this with an authenticator app, then type the six-digit code it shows.
        </p>
        <div class="sec__qr">
          <app-qr-code
            v-if="setup"
            :value="setup.otpauth_url"
            :size="168"
          />
          <div class="sec__key">
            <span class="m3-dlg__note">Or type this key</span>
            <span class="sec__mono">{{ setupKey }}</span>
          </div>
        </div>
        <label class="m3-field">
          <span class="m3-field__label">Code from the app</span>
          <span class="m3-field__box m3-field__box--mono"><input
            v-model="form.code"
            inputmode="numeric"
            autocomplete="one-time-code"
            aria-label="Code from the app"
            data-tid="two-step-code"
            @keydown.enter="confirmTwoStep"
          ></span>
        </label>
      </template>
      <template v-else>
        <p class="m3-dlg__text">
          Each works once, if you lose your authenticator. We won't show them again, so save them somewhere safe.
        </p>
        <div
          class="sec__codes"
          data-tid="recovery-codes"
        >
          <span
            v-for="c in codes"
            :key="c"
          >{{ c }}</span>
        </div>
      </template>
      <p
        v-if="dialogError"
        class="m3-dlg__error"
      >
        {{ dialogError }}
      </p>
      <template #actions>
        <template v-if="!codes.length">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            @click="close"
          >
            Cancel
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            :disabled="form.code.trim().length < 6 || busy"
            @click="confirmTwoStep"
          >
            Turn on
          </button>
        </template>
        <template v-else>
          <button
            type="button"
            class="cbtn"
            @click="copyCodes"
          >
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            data-tid="recovery-codes-done"
            @click="close"
          >
            I've saved them
          </button>
        </template>
      </template>
    </m3-dialog>

    <!-- Two-step off -->
    <m3-dialog
      :value="dialog === 'twoStepOff'"
      title="Turn off two-step sign-in?"
      tone="warn"
      eyebrow="Less protection"
      :persistent="busy"
      @close="close"
    >
      <p class="m3-dlg__text">
        A password alone gets into your account again. Type a code from your authenticator app, or a recovery code, to confirm.
      </p>
      <label class="m3-field">
        <span class="m3-field__label">Code</span>
        <span class="m3-field__box m3-field__box--mono"><input
          v-model="form.code"
          autocomplete="one-time-code"
          aria-label="Code"
          @keydown.enter="twoStepOff"
        ></span>
      </label>
      <p
        v-if="dialogError"
        class="m3-dlg__error"
      >
        {{ dialogError }}
      </p>
      <template #actions>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          @click="close"
        >
          Keep it on
        </button>
        <button
          type="button"
          class="cbtn cbtn--danger"
          :disabled="!form.code.trim() || busy"
          @click="twoStepOff"
        >
          Turn off
        </button>
      </template>
    </m3-dialog>

    <reauth-dialog
      v-bind="reauthProps"
      v-on="reauthOn"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import AccountReauthMixin from '@/mixins/account-reauth'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import AppQrCode from '@/components/ui/AppQrCode.vue'
import ReauthDialog from './ReauthDialog.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { accountApi, type AccountDetails, type Identity, type Me, type Passkey } from '@/services/account/api'
import { isMissing } from '@/services/account/client'
import { accountState, describe, loadConfig, loadEvents, loadMe } from '@/services/account/state'
import { agoText, dayText, providerName, securityHealth, type AccountSectionId, type SecurityHealth } from '@/services/account/model'
import { cancelledPasskey, createPasskey, deviceLabel, passkeysSupported } from '@/services/account/webauthn'

type Dialog = '' | 'email' | 'password' | 'rename' | 'twoStep' | 'twoStepOff'

/**
 * Sign-in and security (the canvas's "Account · Sign-in and security"): the
 * address, passkeys, the password, Apple and Google, two-step sign-in and
 * its recovery codes. Each change asks "Confirm it's you" when the console
 * wants it. What the console can't do yet says so ("Renaming soon").
 */
@Component({ components: { M3Dialog, AppQrCode, ReauthDialog } })
export default class AccountSecurity extends Mixins(AccountReauthMixin) {
  @Prop({ type: Function, required: true })
  readonly linkTo!: (id: AccountSectionId) => string

  passkeys: Passkey[] = []
  identities: Identity[] = []
  dialog: Dialog = ''
  form = { email: '', current: '', next: '', code: '', name: '' }
  renaming: Passkey | null = null
  setup: { secret: string, otpauth_url: string } | null = null
  codes: string[] = []
  copied = false
  busy = false
  error = ''
  dialogError = ''
  message = ''
  renameMissing = false
  recoveryMissing = false

  created () {
    this.refresh()
  }

  refresh () {
    loadMe().catch(() => {})
    loadConfig().catch(() => {})
    loadEvents().catch(() => {})
    accountApi.passkeys().then(r => { this.passkeys = r.passkeys }).catch(() => {})
    accountApi.identities().then(r => { this.identities = r.identities }).catch(() => {})
  }

  get me (): Me | null {
    return accountState.me
  }

  get details (): AccountDetails | null {
    return accountState.me?.account ?? null
  }

  get email (): string {
    return this.details?.email ?? cloudState.account?.email ?? ''
  }

  get pending () {
    return this.details?.email_pending ?? null
  }

  get health (): SecurityHealth {
    return securityHealth(this.me as Me)
  }

  get hasPassword (): boolean {
    return this.me?.sign_in?.password ?? this.details?.has_password !== false
  }

  get twoStep (): boolean {
    return this.me?.sign_in?.two_step ?? this.details?.two_step ?? false
  }

  get recoveryLeft (): number | null {
    const left = this.me?.sign_in?.recovery_left
    return typeof left === 'number' ? left : null
  }

  get canAddPasskey (): boolean {
    return passkeysSupported()
  }

  get passwordLine (): string {
    if (!this.hasPassword) return 'No password. You sign in with a passkey, Apple or Google.'
    const changed = (accountState.events ?? []).find(e => e.kind === 'password_changed' || e.kind === 'password_reset')
    return `${changed ? `Changed ${dayText(changed.at)}. ` : ''}Changing it signs you out everywhere else.`
  }

  get providers () {
    const social = accountState.config?.social ?? {}
    return (['apple', 'google'] as const).map(id => {
      const linked = this.identities.find(i => i.provider === id)
      return {
        id,
        name: providerName(id),
        letter: id === 'apple' ? 'A' : 'G',
        linked: !!linked,
        line: linked
          ? `Linked ${dayText(linked.created_at)}${linked.email ? ` to ${linked.email}` : ''}.`
          : social[id] ? 'Not linked.' : 'Not linked. Signing in with it isn\'t open yet.'
      }
    })
  }

  day (seconds: number): string {
    return dayText(seconds)
  }

  ago (seconds: number): string {
    const text = agoText(seconds)
    return text === 'now' ? 'just now' : text
  }

  keyIcon (name: string): string {
    return /iphone|android|phone|pixel/i.test(name) ? 'phone' : 'laptop'
  }

  open (dialog: Dialog) {
    this.form = { email: '', current: '', next: '', code: '', name: '' }
    this.dialogError = ''
    this.dialog = dialog
  }

  close () {
    if (this.busy) return
    this.dialog = ''
    this.codes = []
    this.setup = null
  }

  async run (what: () => Promise<unknown>, inDialog = false): Promise<boolean> {
    this.busy = true
    this.error = ''
    this.dialogError = ''
    this.message = ''
    try {
      await what()
      return true
    } catch (error) {
      if (inDialog) this.dialogError = describe(error)
      else this.error = describe(error)
      return false
    } finally {
      this.busy = false
    }
  }

  async resend () {
    if (await this.run(() => accountApi.resendVerification())) this.message = `We've sent a new link to ${this.email}.`
  }

  async cancelEmail () {
    const done = await this.run(async () => {
      try {
        await accountApi.cancelEmailChange()
      } catch (error) {
        if (isMissing(error)) throw new Error('Cancelling a change isn\'t possible yet. The link stops working after three days.')
        throw error
      }
    })
    if (done) loadMe().catch(() => {})
  }

  async changeEmail () {
    const email = this.form.email.trim()
    let sent = false
    await this.run(async () => {
      sent = (await this.withReauth(r => accountApi.changeEmail(email, r), { action: 'Send the link' })) !== null
    }, true)
    if (sent) {
      this.dialog = ''
      this.message = `We've sent a link to ${email}. Your address changes when you open it.`
      loadMe().catch(() => {})
    }
  }

  async changePassword () {
    const reauth = { password: this.hasPassword ? this.form.current : undefined, code: this.twoStep ? this.form.code.trim() : undefined }
    const done = await this.run(() => accountApi.changePassword(this.form.next, reauth), true)
    if (done) {
      this.dialog = ''
      this.message = 'Your password is changed. Every other device is signed out.'
      this.refresh()
    }
  }

  async addPasskey () {
    const name = deviceLabel()
    await this.run(async () => {
      try {
        const { ceremony_id: ceremony, options } = await accountApi.passkeyCreateOptions()
        const credential = await createPasskey(options.publicKey)
        const added = await this.withReauth(r => accountApi.passkeyCreate(ceremony, credential, name, r), { action: 'Add passkey' })
        if (added) this.message = `Passkey added: ${added.name}. It works on this device from now on.`
      } catch (error) {
        if (cancelledPasskey(error)) return
        throw error
      }
    })
    this.refresh()
  }

  openRename (key: Passkey) {
    this.renaming = key
    this.open('rename')
    this.form.name = key.name
  }

  async renamePasskey () {
    const key = this.renaming
    if (!key) return
    const name = this.form.name.trim()
    const done = await this.run(async () => {
      try {
        await accountApi.renamePasskey(key.id, name)
      } catch (error) {
        if (isMissing(error)) {
          this.renameMissing = true
          throw new Error('Renaming passkeys comes soon.')
        }
        throw error
      }
    }, true)
    if (done) {
      this.dialog = ''
      key.name = name
    }
  }

  async removePasskey (key: Passkey) {
    const sure = await this.$confirm(`"${key.name}" won't sign in to your account any more. The passkey stays on the device until you delete it there.`, {
      title: 'Remove this passkey?',
      buttonTrueText: 'Remove',
      danger: true
    })
    if (!sure) return
    await this.run(() => this.withReauth(r => accountApi.removePasskey(key.id, r), { action: 'Remove passkey', danger: true }))
    this.refresh()
  }

  async unlink (provider: string) {
    const sure = await this.$confirm(`You won't be able to sign in with ${providerName(provider)} any more.`, {
      title: `Unlink ${providerName(provider)}?`,
      buttonTrueText: 'Unlink',
      danger: true
    })
    if (!sure) return
    await this.run(() => this.withReauth(r => accountApi.unlinkIdentity(provider, r), { action: 'Unlink', danger: true }))
    this.refresh()
  }

  get setupKey (): string {
    return (this.setup?.secret ?? '').replace(/(.{4})/g, '$1 ').trim()
  }

  async startTwoStep () {
    this.setup = null
    await this.run(async () => {
      const setup = await this.withReauth(r => accountApi.totpBegin(r), { action: 'Continue' })
      if (setup) {
        this.open('twoStep')
        this.setup = setup
      }
    })
  }

  async confirmTwoStep () {
    const code = this.form.code.replace(/\s+/g, '')
    await this.run(async () => {
      const { recovery_codes: codes } = await accountApi.totpConfirm(code)
      this.codes = codes
    }, true)
    loadMe().catch(() => {})
  }

  async twoStepOff () {
    const done = await this.run(() => accountApi.totpOff(this.form.code.replace(/\s+/g, '')), true)
    if (done) {
      this.dialog = ''
      this.message = 'Two-step sign-in is off.'
      loadMe().catch(() => {})
    }
  }

  async newCodes () {
    const sure = await this.$confirm('The codes you have now stop working, and you get ten new ones.', {
      title: 'Make new recovery codes?',
      buttonTrueText: 'Make new codes'
    })
    if (!sure) return
    await this.run(async () => {
      try {
        const answer = await this.withReauth(r => accountApi.newRecoveryCodes(r), { action: 'Make new codes' })
        if (answer) {
          this.form.code = ''
          this.codes = answer.recovery_codes
          this.dialog = 'twoStep'
        }
      } catch (error) {
        if (isMissing(error)) {
          this.recoveryMissing = true
          return
        }
        throw error
      }
    })
    loadMe().catch(() => {})
  }

  async copyCodes () {
    try {
      await navigator.clipboard.writeText(this.codes.join('\n'))
      this.copied = true
    } catch {
      this.copied = false
    }
  }
}
</script>

<style lang="scss" scoped>
  .sec__method {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 14px 0;
  }

  .sec__sub {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 8px 0 8px 54px;
    border-top: 0 !important;
  }

  .sec__sub-icon {
    width: 32px;
    height: 32px;
  }

  // On a phone the words take the width and the buttons go underneath.
  @media (max-width: 760px) {
    .sec__method {
      grid-template-columns: 40px minmax(0, 1fr);
    }

    .sec__sub {
      grid-template-columns: 32px minmax(0, 1fr);
      padding-left: 20px;
    }

    .sec__method > :nth-child(3),
    .sec__sub > :nth-child(3) {
      grid-column: 2;
      justify-self: start;
    }
  }

  .sec__name {
    color: var(--m3d-text) !important;
    font-size: 14px !important;
  }

  .sec__letter {
    color: var(--m3d-text);
    font-size: 16px;
    font-weight: 700;
  }

  .sec__ok {
    color: var(--m3d-success);
  }

  .sec__warn {
    color: var(--m3d-warning) !important;
  }

  .sec__num {
    font-variant-numeric: tabular-nums;
  }

  .sec__qr {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
  }

  .sec__key {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sec__mono {
    font-family: var(--m3d-font-mono);
    font-size: 14px;
    letter-spacing: 0.04em;
  }

  .sec__codes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 16px;
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    font-family: var(--m3d-font-mono);
    font-size: 14px;
  }
</style>
