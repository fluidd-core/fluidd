<template>
  <section>
    <h3>Account actions</h3>
    <p>{{ account.staff_suspended ? 'Suspended by staff' : 'No staff suspension' }} · Version {{ account.admin_version }}</p>
    <p>Staff suspension and deletion are separate. Restoring staff access keeps a scheduled deletion in place. Keeping the account leaves staff suspension in place.</p>
    <label>Reason for this action<textarea
      v-model="reason"
      minlength="8"
      maxlength="500"
    /></label>
    <div class="actions">
      <button
        class="cbtn"
        :disabled="busy || account.staff_suspended"
        @click="act('suspend')"
      >
        Suspend account · passkey
      </button>
      <button
        class="cbtn"
        :disabled="busy || !account.staff_suspended"
        @click="act('restore-account')"
      >
        Restore staff suspension · passkey
      </button>
      <button
        v-if="!account.delete_after"
        class="cbtn"
        :disabled="busy"
        @click="act('schedule-deletion')"
      >
        Schedule deletion · 14 days · passkey
      </button>
      <button
        v-else
        class="cbtn"
        :disabled="busy"
        @click="act('cancel-deletion')"
      >
        Keep account · cancel deletion · passkey
      </button>
    </div>
    <p
      v-if="message"
      role="status"
    >
      {{ message }}
    </p>
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
  beforeDestroy () { this.alive = false }
  async act (action: string) {
    if (this.busy || this.reason.trim().length < 8) { this.message = 'Give a short reason before continuing.'; return }
    const token = storedToken()
    const current = () => this.alive && token === storedToken() && !document.hidden
    this.busy = true; this.message = 'Confirm this action with your passkey…'
    try {
      await staffCommand({ command: newCommandId(), action, target: this.account.id, version: this.account.admin_version!, reason: this.reason, details: {} }, true, current)
      if (current()) this.$emit('spent', 'Account action saved. Confirm staff access to continue.')
    } catch (error) {
      if (current()) {
        this.message = error instanceof DOMException && error.name === 'NotAllowedError' ? 'Confirmation cancelled. No command was sent.' : error instanceof Error ? error.message : 'The outcome is uncertain. Look up the account and audit before deciding again.'
        if (error instanceof AdminError && error.expired) this.$emit('expired')
      }
    } finally { if (current()) this.busy = false }
  }
}
</script>
<style scoped>
section { margin-top: 24px; } label { display: block; margin: 16px 0; } textarea { display: block; width: 100%; min-height: 80px; padding: 12px; background: var(--m3d-inset); color: var(--m3d-text); border: 1px solid var(--m3d-border); font: inherit; } .actions { display: flex; flex-wrap: wrap; gap: 10px; } button { white-space: normal; max-width: 100%; } :focus-visible { outline: 2px solid var(--m3d-accent); outline-offset: 2px; }
</style>
