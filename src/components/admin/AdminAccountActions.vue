<template>
  <section>
    <h3>Account actions</h3>
    <p>{{ account.staff_suspended ? 'Suspended by staff' : 'No staff suspension' }} · Version {{ account.admin_version }}</p>
    <p>Staff suspension and deletion are separate. Restoring staff access keeps a scheduled deletion in place. Keeping the account leaves staff suspension in place.</p>
    <label for="account-action-reason">Reason for this action</label><textarea
      id="account-action-reason"
      v-model="reason"
      minlength="8"
      maxlength="500"
    />
    <div class="actions">
      <button
        class="cbtn"
        :disabled="busy || account.staff_suspended"
        @click="ask('suspend', $event)"
      >
        Suspend account · passkey
      </button>
      <button
        class="cbtn"
        :disabled="busy || !account.staff_suspended"
        @click="ask('restore-account', $event)"
      >
        Restore staff suspension · passkey
      </button>
      <button
        v-if="!account.delete_after"
        class="cbtn"
        :disabled="busy"
        @click="ask('schedule-deletion', $event)"
      >
        Schedule deletion · 14 days · passkey
      </button>
      <button
        v-else
        class="cbtn"
        :disabled="busy"
        @click="ask('cancel-deletion', $event)"
      >
        Keep account · cancel deletion · passkey
      </button>
    </div>
    <p
      v-if="message"
      role="status"
      aria-live="polite"
    >
      {{ message }}
    </p>
    <button
      v-if="uncertain"
      type="button"
      class="cbtn"
      @click="$emit('refresh')"
    >
      Refresh
    </button>
    <div
      v-if="pendingAction"
      class="dialog-backdrop"
      @mousedown.self="cancel"
    >
      <section
        ref="dialog"
        class="action-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-action-title"
        tabindex="-1"
        @keydown="trapDialog"
      >
        <h3 id="account-action-title">
          Confirm account action
        </h3>
        <p>This action will ask for a fresh passkey and will be recorded with your reason.</p>
        <div class="actions">
          <button
            type="button"
            class="cbtn"
            @click="cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            data-tid="account-action-confirm"
            @click="confirm"
          >
            Continue with passkey
          </button>
        </div>
      </section>
    </div>
  </section>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { AdminError, newCommandId, staffCommand, type AdminAccount } from '@/services/admin/client'
import { storedToken } from '@/services/muon-cloud/api'
@Component
export default class AdminAccountActions extends Vue {
  @Prop({ required: true }) readonly account!: AdminAccount
  reason = ''
  message = ''
  busy = false
  alive = true
  uncertain = false
  pendingAction = ''
  opener: HTMLElement | null = null
  beforeDestroy () { this.alive = false }
  ask (action: string, event: Event) { this.pendingAction = action; this.opener = event.currentTarget as HTMLElement; this.$nextTick(() => (this.$refs.dialog as HTMLElement)?.focus()) }
  cancel () { this.pendingAction = ''; this.$nextTick(() => this.opener?.focus()) }
  async confirm () { const action = this.pendingAction; this.pendingAction = ''; if (action) await this.act(action); this.$nextTick(() => this.opener?.focus()) }
  trapDialog (event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); this.cancel(); return }
    if (event.key !== 'Tab') return
    const buttons = Array.from((this.$refs.dialog as HTMLElement).querySelectorAll<HTMLElement>('button'))
    const first = buttons[0]; const last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  async act (action: string) {
    if (this.busy || this.reason.trim().length < 8) { this.message = 'Give a short reason before continuing.'; return }
    const token = storedToken()
    const current = () => this.alive && token === storedToken() && !document.hidden
    this.uncertain = false; this.busy = true; this.message = 'Confirm this action with your passkey…'
    try {
      await staffCommand({ command: newCommandId(), action, target: this.account.id, version: this.account.admin_version!, reason: this.reason, details: {} }, true, current)
      if (current()) this.$emit('spent', 'Account action saved. Confirm staff access to continue.')
    } catch (error) {
      if (current()) {
        this.message = error instanceof DOMException && error.name === 'NotAllowedError' ? 'Passkey confirmation was cancelled or expired. No command was sent.' : error instanceof DOMException && (error.name === 'NotSupportedError' || error.name === 'SecurityError') ? 'Passkeys are unavailable. No command was sent.' : error instanceof Error ? error.message : 'The outcome is uncertain. It may have saved; refresh the account and audit before deciding again.'
        this.uncertain = /outcome is uncertain/i.test(this.message)
        if (error instanceof AdminError && error.expired) this.$emit('expired')
      }
    } finally { if (current()) this.busy = false }
  }
}
</script>
<style scoped>
section { margin-top: 24px; min-width: 0; overflow-wrap: anywhere; } label { display: block; margin: 16px 0 8px; } textarea { display: block; width: 100%; min-height: 80px; padding: 12px; background: var(--m3d-inset); color: var(--m3d-text); border: 1px solid var(--m3d-border); font: inherit; } .actions { display: flex; flex-wrap: wrap; gap: 10px; } button { white-space: normal; max-width: 100%; } :focus-visible { outline: 2px solid var(--m3d-accent); outline-offset: 2px; } .dialog-backdrop { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, .6); } .action-dialog { width: min(440px, 100%); padding: 24px; border: 1px solid var(--m3d-border); border-radius: 6px; background: var(--m3d-surface); color: var(--m3d-text); }
</style>
