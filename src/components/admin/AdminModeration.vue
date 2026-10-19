<template>
  <section class="moderation">
    <p>Each lookup and decision is recorded. A decision needs a reason and fresh passkey confirmation.</p>
    <form @submit.prevent="read">
      <label>Reason<textarea
        v-model="reason"
        required
        minlength="8"
        maxlength="500"
      /></label>
      <button
        class="cbtn cbtn--primary"
        :disabled="busy"
      >
        {{ busy ? 'Reading…' : section === 'queue' ? 'Read review queue' : 'Read reservations' }}
      </button>
    </form>
    <p
      v-if="message"
      role="status"
    >
      {{ message }}
    </p>
    <template v-if="section === 'queue'">
      <article
        v-for="row in cases"
        :key="row.id"
      >
        <button
          class="cbtn"
          :disabled="busy"
          @click="open(row.id)"
        >
          {{ row.title }} · {{ row.kind }} · {{ row.state }}
        </button>
        <p>Assigned to {{ row.assignee === 'jack' ? 'Jack' : 'Harry' }} · Version {{ row.version }}</p>
      </article>
      <article
        v-if="review"
        aria-label="Case detail"
      >
        <h2>{{ review.title }}</h2>
        <p v-if="review.action_due_at">
          First-action target: {{ date(review.action_due_at) }}
        </p>
        <p v-if="review.decision_due_at">
          Decision target: {{ date(review.decision_due_at) }}
        </p>
        <p v-if="review.action_due_at">
          Business-day targets skip weekends. Check holidays and use a hold before restoration.
        </p>
        <p v-if="review.restore_after">
          Counter-notice wait ends: {{ date(review.restore_after) }}. Another reviewer must still decide.
        </p>
        <p v-if="review.legal_hold">
          Restoration is on hold.
        </p>
        <p
          v-for="notice in review.notices"
          :key="notice.id"
        >
          Notice {{ notice.id }} · {{ notice.reason }} · {{ notice.complete ? 'Complete' : 'Needs notice details' }} · {{ notice.decision || 'No decision' }} <button
            v-if="!notice.complete"
            class="cbtn"
            :disabled="busy"
            @click="decide('notice-complete', { notice_id: notice.id })"
          >
            Confirm notice complete · passkey
          </button>
        </p>
        <p>{{ review.id }} · {{ review.state }} · Version {{ review.version }}</p>
        <p>Assigned to {{ review.assignee === 'jack' ? 'Jack' : 'Harry' }}. Evidence and reporter details stay private.</p>
        <p>File previews are not loaded automatically. A case response never restores content on its own.</p>
        <div class="actions">
          <button
            class="cbtn"
            :disabled="busy || review.state !== 'open'"
            @click="decide('approve')"
          >
            Approve public submission · passkey
          </button>
          <button
            class="cbtn"
            :disabled="busy || review.state === 'hidden'"
            @click="decide('hide')"
          >
            Hide content · passkey
          </button>
          <button
            class="cbtn"
            :disabled="busy || review.state !== 'hidden' || review.hidden_by === actor || review.legal_hold || !!review.restore_after && review.restore_after * 1000 > Date.now()"
            @click="decide('restore')"
          >
            Restore · another reviewer required
          </button>
          <button
            class="cbtn"
            :disabled="busy"
            @click="decide('close')"
          >
            {{ review.state === 'hidden' ? 'Close case · keep content hidden' : 'No action needed' }} · passkey
          </button>
          <button
            class="cbtn"
            :disabled="busy"
            @click="decide('assign', { assignee: 'harry' })"
          >
            Assign to Harry · passkey
          </button>
          <button
            class="cbtn"
            :disabled="busy"
            @click="decide('assign', { assignee: 'jack' })"
          >
            Assign to Jack · passkey
          </button>
          <button
            class="cbtn"
            :disabled="busy"
            @click="decide(review.legal_hold ? 'clear-hold' : 'hold')"
          >
            {{ review.legal_hold ? 'Clear restoration hold' : 'Hold restoration' }} · passkey
          </button>
        </div>
        <h3>Case history</h3>
        <ol>
          <li
            v-for="event in review.events"
            :key="event.id"
          >
            <b>{{ event.kind }}</b> · {{ event.actor }} · {{ date(event.at) }}<p>{{ event.text }}</p>
          </li>
        </ol>
        <p v-if="review.events.length === 100">
          Showing the latest 100 entries. Retain the case ID for a full evidence review.
        </p>
      </article>
    </template>
    <template v-else>
      <article
        v-for="row in reservations"
        :key="row.pattern"
      >
        <b>{{ row.pattern }}</b> · {{ row.active ? 'Reserved' : 'Released' }} · Version {{ row.version }}
        <p>{{ row.reason }} · {{ row.owner || 'No assigned owner' }} · {{ row.expires_at ? date(row.expires_at) : 'No expiry' }}</p>
        <button
          v-if="row.managed && row.active"
          class="cbtn"
          :disabled="busy"
          @click="release(row)"
        >
          Release · confirm with passkey
        </button>
        <p v-if="!row.managed">
          Protected service or safety reservation
        </p>
      </article>
      <form @submit.prevent="reserve">
        <h2>Reserve a handle</h2>
        <label>Handle or wildcard pattern<input
          v-model="pattern"
          required
          maxlength="32"
        ></label>
        <label>Stable account ID (optional)<input
          v-model="owner"
          maxlength="64"
          autocomplete="off"
        ></label>
        <label>Expiry (optional, your local time)<input
          v-model="expiry"
          type="datetime-local"
        ></label>
        <p>A reservation never transfers a current or held handle.</p>
        <button
          class="cbtn"
          :disabled="busy"
        >
          Reserve · confirm with passkey
        </button>
      </form>
    </template>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { AdminError, newCommandId, staffCommand, isStaffMutation, type CaseSummary, type CaseDetail, type Reservation, type CommandResult } from '@/services/admin/client'
import { storedToken } from '@/services/muon-cloud/api'

@Component
export default class AdminModeration extends Vue {
  @Prop({ required: true }) readonly section!: string
  @Prop({ required: true }) readonly actor!: string
  reason = ''
  message = ''
  busy = false
  alive = true
  revision = 0
  cases: CaseSummary[] = []
  review: CaseDetail | null = null
  reservations: Reservation[] = []
  pattern = ''
  owner = ''
  expiry = ''
  beforeDestroy () { this.alive = false; this.revision++ }
  date (at: number): string { return new Date(at * 1000).toLocaleString() }
  async request (action: string, target: string, version = 0, details: Record<string, unknown> = {}): Promise<CommandResult | null> {
    if (this.busy || this.reason.trim().length < 8) { this.message = 'Give a short reason before continuing.'; return null }
    const revision = ++this.revision
    const token = storedToken()
    const current = () => this.alive && revision === this.revision && storedToken() === token && !document.hidden
    this.busy = true; this.message = isStaffMutation(action) ? 'Confirm this decision with your passkey…' : 'Reading…'
    try {
      const result = await staffCommand({ command: newCommandId(), action, target, version, reason: this.reason, details }, false, current)
      if (!current()) return null
      this.message = 'Read complete.'
      if (isStaffMutation(action)) this.$emit('spent', 'Action saved. Confirm staff access to continue.')
      return result
    } catch (error) {
      if (current()) {
        this.message = error instanceof DOMException && error.name === 'NotAllowedError' ? 'Confirmation cancelled. No command was sent.' : error instanceof Error ? error.message : 'Staff tools could not be reached.'
        if (error instanceof AdminError && error.expired) this.$emit('expired')
      }
      return null
    } finally { if (current()) this.busy = false }
  }

  async read () {
    this.review = null; this.cases = []; this.reservations = []
    const result = await this.request(this.section === 'queue' ? 'queue' : 'reservations', 'all')
    if (!result) return
    this.cases = result.cases || []; this.reservations = result.reservations || []
    if (!this.cases.length && !this.reservations.length) this.message = 'No work waiting.'
  }

  async open (id: string) { const result = await this.request('case', id); if (result?.case) this.review = result.case }
  async decide (action: string, details: Record<string, unknown> = {}) { if (this.review) await this.request(action, this.review.id, this.review.version, details) }
  async release (row: Reservation) { await this.request('release', row.pattern, row.version) }
  async reserve () {
    const existing = this.reservations.find(r => r.pattern === this.pattern)
    await this.request('reserve', this.pattern, existing?.version || 0, { owner: this.owner || null, expires_at: this.expiry ? Math.floor(new Date(this.expiry).getTime() / 1000) : null })
  }
}
</script>

<style scoped>
.moderation { max-width: 860px; } form, article { padding: 20px; margin: 16px 0; border: 1px solid var(--m3d-border); border-radius: 6px; background: var(--m3d-surface); overflow-wrap: anywhere; }
label { display: block; margin-bottom: 16px; } textarea, input { display: block; width: 100%; padding: 10px; border: 1px solid var(--m3d-border); border-radius: 4px; background: var(--m3d-inset); color: var(--m3d-text); font: inherit; }
textarea { min-height: 80px; } .actions { display: flex; flex-wrap: wrap; gap: 10px; } li { margin: 16px 0; white-space: pre-wrap; } button { white-space: normal; max-width: 100%; } button:disabled { opacity: .5; } :focus-visible { outline: 2px solid var(--m3d-accent); outline-offset: 2px; }
</style>
