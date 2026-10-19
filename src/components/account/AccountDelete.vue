<template>
  <div
    class="acct-section"
    data-tid="account-delete"
  >
    <div class="acct-head">
      <h1>Delete your account</h1>
      <p>This deletes your Muon3D account and everything kept in it. Your printers keep working without it.</p>
    </div>

    <div
      v-if="scheduled"
      class="acct-note del__scheduled"
      role="status"
      data-tid="delete-scheduled"
    >
      <frame-icon
        name="clock"
        small
      />
      <span class="del__grow"><b>Your account will be deleted on {{ deleteDay }}.</b> Until then you can keep it, with your printers and sharing as they were.</span>
      <button
        type="button"
        class="lib-btn lib-btn--sm lib-btn--pri"
        :disabled="busy"
        data-tid="delete-keep"
        @click="keep"
      >
        Keep my account
      </button>
    </div>

    <div class="del__grid">
      <section
        class="lib-surface acct-card"
        aria-label="What goes"
      >
        <div class="acct-card__title">
          <h2>What goes</h2>
        </div>
        <div class="acct-list">
          <div
            v-for="item in goes"
            :key="item.title"
            class="del__item"
          >
            <frame-icon
              :name="item.icon"
              small
              class="del__red"
            />
            <span class="acct-row__label"><b>{{ item.title }}</b><span>{{ item.text }}</span></span>
          </div>
        </div>
      </section>

      <div class="del__side">
        <section
          class="lib-surface acct-card"
          aria-label="What stays"
        >
          <div class="acct-card__title">
            <h2>What stays</h2>
          </div>
          <div class="acct-list del__stays">
            <div class="del__keep">
              <frame-icon
                name="check"
                small
                class="del__green"
              />
              <span>Your printers, their files and their history. They work on your network with no account, for good.</span>
            </div>
            <div class="del__keep">
              <frame-icon
                name="check"
                small
                class="del__green"
              />
              <span>You stay their owner. That is set at each printer, not in your account.</span>
            </div>
          </div>
        </section>

        <section
          class="lib-surface acct-card acct-card--pad"
          aria-label="Before you go"
        >
          <h2 class="lib-card-title">
            Before you go
          </h2>
          <span class="acct-muted del__text">Download your account first. Once it's gone we can't get it back.</span>
          <div>
            <router-link
              :to="linkTo('privacy')"
              class="lib-btn lib-btn--sm"
            >
              Download your data
            </router-link>
          </div>
        </section>

        <section
          class="lib-surface acct-card acct-card--pad del__danger"
          aria-label="Delete"
        >
          <span class="acct-muted del__text">{{ graceLine }}</span>
          <div
            v-if="grace && !scheduled"
          >
            <button
              type="button"
              class="lib-btn lib-btn--dng"
              data-tid="delete-open"
              @click="open"
            >
              Delete account…
            </button>
          </div>
        </section>
      </div>
    </div>

    <p
      v-if="error"
      class="acct-error"
      role="alert"
    >
      {{ error }}
    </p>

    <m3-dialog
      :value="dialog"
      :title="stepTitle"
      tone="danger"
      :persistent="busy || step === 3"
      :closable="step !== 3"
      max-width="460"
      data-tid="delete-dialog"
      @close="close"
    >
      <div class="del__steps">
        <span
          v-for="(name, i) in ['Check', 'It\'s you', 'Done']"
          :key="name"
          class="del__step"
          :class="{ 'del__step--on': step === i + 1, 'del__step--done': step > i + 1 }"
        ><span class="del__n">
          <frame-icon
            v-if="step > i + 1"
            name="check"
            small
          />
          <template v-else>{{ i + 1 }}</template>
        </span>{{ name }}</span>
      </div>

      <template v-if="step === 1">
        <p class="m3-dlg__text">
          In 14 days we delete your account, your Library and who you share with. Until then you can change your mind.
        </p>
        <div class="del__keep">
          <frame-icon
            name="x"
            small
            class="del__red"
          /><span>{{ printersGo }}</span>
        </div>
        <div class="del__keep">
          <frame-icon
            name="x"
            small
            class="del__red"
          /><span>Your Library{{ librarySize ? ` (${librarySize})` : '' }} is deleted</span>
        </div>
        <div class="del__keep">
          <frame-icon
            name="check"
            small
            class="del__green"
          /><span>Your printers keep working on your network</span>
        </div>
      </template>

      <template v-else-if="step === 2">
        <p class="m3-dlg__text">
          {{ hasPasskey ? 'Confirm with your passkey to delete in 14 days, or use the other sign-in method below.' : hasPassword ? 'Deleting needs your password, so someone using an unlocked computer can\'t do it.' : 'Deleting needs a fresh sign-in.' }}
        </p>
        <button
          v-if="hasPasskey"
          type="button"
          class="cbtn cbtn--danger"
          :disabled="busy"
          data-tid="delete-passkey"
          @click="confirmPasskey"
        >
          Delete in 14 days with passkey
        </button>
        <template v-if="hasPassword">
          <label class="m3-field">
            <span class="m3-field__label">Password</span>
            <span class="m3-field__box"><input
              v-model="password"
              type="password"
              autocomplete="current-password"
              aria-label="Password"
              data-tid="delete-password"
              @keydown.enter="confirm"
            ></span>
          </label>
          <label
            v-if="twoStep"
            class="m3-field"
          >
            <span class="m3-field__label">Code from your authenticator app</span>
            <span class="m3-field__box m3-field__box--mono"><input
              v-model="code"
              inputmode="numeric"
              autocomplete="one-time-code"
              aria-label="Code from your authenticator app"
              @keydown.enter="confirm"
            ></span>
            <span class="m3-dlg__note">Or use a recovery code.</span>
          </label>
        </template>
        <p
          v-else
          class="m3-dlg__text"
        >
          This account has no password. You can confirm after a sign-in within the last ten minutes.
          Otherwise, sign out and sign in again first.
        </p>
        <p
          v-if="dialogError"
          class="m3-dlg__error"
          role="alert"
        >
          {{ dialogError }}
        </p>
      </template>

      <template v-else>
        <div class="del__done">
          <span class="del__icon"><frame-icon
            :name="deletedAt ? 'clock' : 'check'"
            large
          /></span>
          <p class="m3-dlg__text">
            {{ deletedAt
              ? `We've emailed ${email} to say so. You're signed out on every device, your printers can't be reached from outside, and nothing of yours is shared.`
              : `Your account is deleted. Your printers keep working on your network, with no account.` }}
          </p>
        </div>
        <div
          v-if="deletedAt"
          class="acct-note"
        >
          <frame-icon
            name="refresh"
            small
          />
          <span>Changed your mind? Sign in before {{ day(deletedAt) }} and press <b>Keep my account</b>. Everything comes back as it was, printers and sharing included.</span>
        </div>
      </template>

      <template #actions>
        <template v-if="step === 1">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            @click="close"
          >
            Keep my account
          </button>
          <button
            type="button"
            class="cbtn cbtn--danger"
            data-tid="delete-continue"
            @click="step = 2"
          >
            Continue
          </button>
        </template>
        <template v-else-if="step === 2">
          <button
            type="button"
            class="cbtn cbtn--ghost"
            :disabled="busy"
            @click="step = 1"
          >
            Back
          </button>
          <button
            type="button"
            class="cbtn cbtn--danger"
            :disabled="(hasPassword && (!password || (twoStep && !code.trim()))) || busy"
            data-tid="delete-confirm"
            @click="confirm"
          >
            Delete in 14 days
          </button>
        </template>
        <button
          v-else
          type="button"
          class="cbtn cbtn--primary"
          data-tid="delete-done"
          @click="finish"
        >
          Done
        </button>
      </template>
    </m3-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { deletionState } from '@/services/muon-cloud/deletion'
import { confirmAccount } from '@/services/account/confirmation'
import { storedToken } from '@/services/muon-cloud/api'
import { accountApi } from '@/services/account/api'
import { accountState, describe, loadMe } from '@/services/account/state'
import { dayText, listText, type AccountSectionId } from '@/services/account/model'
import { signOutNow } from '@/services/account/sign-out'
import { libraryItems, libraryPrints, libraryState, refreshLibrary, watchLibraryAccount } from '@/services/library/store'
import { bytesText } from '@/services/library/format'

/**
 * Delete account (the canvas's "Account · Delete account" and its three
 * steps): what goes and what stays, then check, it's you, done. The account
 * can be kept for 14 days. An older console needs an update before deletion.
 */
@Component({ components: { M3Dialog } })
export default class AccountDelete extends Vue {
  @Prop({ type: Function, required: true })
  readonly linkTo!: (id: AccountSectionId) => string

  alive = true
  beforeDestroy () { this.alive = false }

  dialog = false
  step = 1
  password = ''
  code = ''
  busy = false
  error = ''
  dialogError = ''
  deletedAt: number | null = null

  created () {
    loadMe().catch(() => {})
    watchLibraryAccount()
    refreshLibrary().catch(() => {})
  }

  /** The console has the grace period: its account answer carries `deletion`. */
  get grace (): boolean {
    const account = accountState.me?.account
    return !!account && 'deletion' in account
  }

  get scheduled (): boolean {
    return deletionState.deleteAfter !== null
  }

  get deleteDay (): string {
    const at = deletionState.deleteAfter
    return at ? dayText(at) : ''
  }

  get email (): string {
    return accountState.me?.account.email ?? cloudState.account?.email ?? ''
  }

  get hasPassword (): boolean {
    return accountState.me?.sign_in?.password ?? accountState.me?.account.has_password !== false
  }

  get twoStep (): boolean {
    return accountState.me?.sign_in?.two_step ?? accountState.me?.account.two_step ?? false
  }

  get hasPasskey (): boolean {
    return (accountState.me?.sign_in?.passkeys ?? 0) > 0
  }

  get owned () {
    return cloudState.printers.filter(p => !p.shared)
  }

  get printersGo (): string {
    const names = this.owned.map(p => p.name)
    if (!names.length) return 'No printers are linked to it'
    return `${listText(names)} ${names.length === 1 ? 'is' : 'are'} unlinked, and the people you share with lose access`
  }

  get librarySize (): string {
    return libraryState.usedBytes ? bytesText(libraryState.usedBytes) : ''
  }

  get goes (): Array<{ icon: string, title: string, text: string }> {
    const shared = cloudState.printers.filter(p => p.shared)
    const prints = libraryPrints().length
    const models = libraryItems().length - prints
    return [
      {
        icon: 'printer',
        title: this.owned.length ? `${listText(this.owned.map(p => p.name))} ${this.owned.length === 1 ? 'is' : 'are'} unlinked` : 'No printers are linked',
        text: "You can't reach them from outside your home any more. Link them again from a new account at each printer's screen."
      },
      {
        icon: 'userMinus',
        title: 'Everyone you share with loses access',
        text: shared.length ? `Your access to ${listText(shared.map(p => p.name))} ends too.` : 'And invite links stop working.'
      },
      {
        icon: 'library',
        title: libraryState.enabled ? `Your Library: ${prints === 1 ? '1 print' : `${prints} prints`}${models ? `, ${models === 1 ? '1 model' : `${models} models`}` : ''}` : 'Your Library',
        text: `${this.librarySize ? `${this.librarySize}, deleted` : 'Deleted'} from our storage. Backups are cleared within 14 days.`
      },
      {
        icon: 'card',
        title: 'Credits and plan',
        text: 'Unused credits can\'t be refunded or moved.'
      }
    ]
  }

  get graceLine (): string {
    if (this.scheduled) return `Deletion is set for ${this.deleteDay}. Until then you can keep your account.`
    return this.grace
      ? 'We wait 14 days before deleting anything, in case this wasn\'t you or you change your mind. You\'re signed out everywhere straight away, and nothing of yours is shared from that moment.'
      : 'Account deletion needs a console update to support the 14-day recovery period.'
  }

  get stepTitle (): string {
    if (this.step === 1) return 'Delete your Muon3D account?'
    if (this.step === 2) return 'Confirm it\'s you'
    return this.deletedAt ? `Your account will be deleted on ${dayText(this.deletedAt)}` : 'Your account is deleted'
  }

  day (seconds: number): string {
    return dayText(seconds)
  }

  open () {
    if (!this.grace || this.scheduled) return
    this.step = 1
    this.password = ''
    this.code = ''
    this.dialogError = ''
    this.deletedAt = null
    this.dialog = true
  }

  close () {
    if (this.busy || this.step === 3) return
    this.dialog = false
  }

  async confirm () {
    await this.submitDeletion(false)
  }

  async confirmPasskey () {
    await this.submitDeletion(true)
  }

  private async submitDeletion (passkey: boolean) {
    if (!this.grace || this.scheduled || this.busy || !this.dialog || this.step !== 2 || (passkey && !this.hasPasskey)) return
    const token = storedToken()
    const current = () => this.alive && this.dialog && this.step === 2 && storedToken() === token && !document.hidden
    if (!current()) return
    this.busy = true
    this.dialogError = ''
    try {
      if (passkey) await confirmAccount(current)
      if (!current() || !this.grace || this.scheduled) return
      const reauth = !passkey && this.hasPassword ? { password: this.password, code: this.twoStep ? this.code.replace(/\s+/g, '') : undefined } : {}
      const answer = await accountApi.deleteAccount(reauth)
      if (!current()) return
      this.password = ''
      this.deletedAt = answer.delete_after ?? null
      this.step = 3
    } catch (error) {
      if (current()) {
        this.dialogError = error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Passkey confirmation was cancelled. Your account is unchanged.'
          : describe(error)
      }
    } finally {
      this.busy = false
    }
  }

  async keep () {
    this.busy = true
    this.error = ''
    try {
      await accountApi.cancelDeletion()
      await loadMe()
    } catch (error) {
      this.error = describe(error)
    } finally {
      this.busy = false
    }
  }

  /**
   * The console has ended every session, the browser's included (#28): the
   * console's /logout still runs, so its frames clear Slice's dead tokens,
   * and then the signed-out page says what happened.
   */
  finish () {
    this.dialog = false
    signOutNow('deleted')
  }
}
</script>

<style lang="scss" scoped>
  .del__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  @media (max-width: 900px) {
    .del__grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .del__side {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .del__item {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
    padding: 12px 0;
  }

  .del__keep {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    padding: 6px 0;
    font-size: 13px;
  }

  .del__stays {
    padding-bottom: 8px;
  }

  .del__red {
    color: var(--m3d-danger);
  }

  .del__green {
    color: var(--m3d-success);
  }

  .del__text {
    font-size: 13px;
  }

  .del__danger {
    border-color: color-mix(in srgb, var(--m3d-danger) 35%, transparent);
  }

  .del__scheduled {
    align-items: center;
  }

  .del__grow {
    flex: 1 1 auto;
  }

  .del__steps {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .del__step {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--m3d-text-subtle);
    font-size: 12px;
    font-weight: 600;
  }

  .del__n {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: 1.5px solid var(--m3d-border-strong);
    border-radius: 50%;
    font-size: 11px;
  }

  .del__step--on {
    color: var(--m3d-text);

    .del__n {
      border-color: var(--m3d-accent);
      background: var(--m3d-accent);
      color: var(--m3d-on-accent, #00201e);
    }
  }

  .del__step--done {
    color: var(--m3d-text-muted);

    .del__n {
      border-color: var(--m3d-success);
      color: var(--m3d-success);
    }
  }

  .del__done {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .del__icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: color-mix(in srgb, var(--m3d-danger) 14%, transparent);
    color: var(--m3d-danger);
  }
</style>
