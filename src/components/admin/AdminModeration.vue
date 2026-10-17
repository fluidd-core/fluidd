<template>
  <section class="moderation">
    <p>Each lookup and decision is recorded. A decision needs a reason and fresh passkey confirmation.</p>
    <form @submit.prevent="read">
      <label for="moderation-reason">Reason</label><textarea
        id="moderation-reason"
        v-model="reason"
        required
        minlength="8"
        maxlength="500"
      />
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
      aria-live="polite"
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
          Notice {{ notice.id }} · {{ notice.reason }} · {{ notice.complete ? 'Complete' : 'Needs notice details' }} · {{ notice.decision || 'No decision' }}
          <span v-if="notice.sender">Private reply contact: {{ notice.sender }}.</span>
          <button
            v-if="!notice.complete"
            class="cbtn"
            :disabled="busy"
            @click="askDecision('notice-complete', { notice_id: notice.id }, $event)"
          >
            Confirm notice complete · passkey
          </button>
        </p>
        <p>{{ review.id }} · {{ review.state }} · Version {{ review.version }}</p>
        <p>Assigned to {{ review.assignee === 'jack' ? 'Jack' : 'Harry' }}. Evidence and reporter details stay private.</p>
        <p>File previews are not loaded automatically. A case response never restores content on its own.</p>
        <section
          v-if="review.publication"
          aria-label="Source review"
        >
          <h3>Source review</h3>
          <p>{{ review.publication.licence }}</p>
          <p v-if="review.publication.credit">
            {{ review.publication.credit.author || 'Source work' }} on {{ review.publication.credit.site }}
          </p>
          <p>Fetch every file deliberately. Inspect the archive and remove private names, email, printer identity and history before accepting. A download alone is not a safety check. Files over 8 MiB stay pending.</p>
          <div
            v-for="file in review.publication.files"
            :key="file.id"
          >
            <p class="long-text">
              {{ file.role }} · {{ file.size_bytes }} bytes · SHA-256 {{ file.sha256 }}
            </p>
            <button
              class="cbtn"
              :disabled="busy || file.size_bytes > 8 * 1024 * 1024"
              @click="fetchSource(file)"
            >
              Fetch source for inspection
            </button>
            <a
              v-if="sourceDownloads[file.id]"
              :href="sourceDownloads[file.id]"
              :download="'source-' + file.id + '.' + file.format + (file.encoding === 'gzip' ? '.gz' : '')"
            >Download verified source</a>
          </div>
          <label><input
            v-model="privacyChecked"
            type="checkbox"
          >I inspected the complete files, licence and credit, and checked for private information.</label>
          <button
            class="cbtn"
            :disabled="busy || !privacyChecked || !allSourcesFetched"
            @click="askDecision('accept-source', { manifest: review.publication.manifest, privacy_checked: true }, $event)"
          >
            Accept source snapshot · passkey
          </button>
          <p v-if="sourceAccepted">
            Source accepted by you for this case version. Publication still needs a separate decision.
          </p>
        </section>
        <section
          v-if="review.profile"
          aria-label="Profile evidence"
        >
          <h3>Current profile evidence</h3>
          <p>{{ review.profile.content.name || 'Private identity' }} {{ review.profile.content.handle ? '@' + review.profile.content.handle : '' }}</p>
          <p>{{ review.profile.content.bio }}</p>
          <p
            v-for="url in review.profile.content.links"
            :key="url"
          >
            {{ url }}
          </p>
          <button
            v-if="review.profile.content.avatar"
            class="cbtn"
            :disabled="busy"
            @click="fetchProfilePhoto"
          >
            Fetch profile photo for inspection
          </button>
          <a
            v-if="sourceDownloads['profile-avatar']"
            :href="sourceDownloads['profile-avatar']"
            download="profile-evidence.png"
          >Download verified profile photo</a>
          <label><input
            v-model="privacyChecked"
            type="checkbox"
          >I inspected this current profile and its photo before restoration.</label>
        </section>
        <div class="actions">
          <button
            class="cbtn"
            :disabled="busy || review.state !== 'open' || !review.publication || !sourceAccepted"
            @click="askDecision('approve', {}, $event)"
          >
            Approve public submission · passkey
          </button>
          <button
            class="cbtn"
            :disabled="busy || review.state === 'hidden'"
            @click="askDecision('hide', {}, $event)"
          >
            Hide content · passkey
          </button>
          <button
            class="cbtn"
            :disabled="busy || review.state !== 'hidden' || review.hidden_by === actor || !!review.publication && !sourceAccepted || !!review.profile && (!privacyChecked || !!review.profile.content.avatar && !sourceDownloads['profile-avatar']) || review.legal_hold || !!review.restore_after && review.restore_after * 1000 > Date.now()"
            @click="askDecision('restore', {}, $event)"
          >
            Restore · another reviewer required
          </button>
          <button
            class="cbtn"
            :disabled="busy"
            @click="askDecision('close', {}, $event)"
          >
            {{ review.state === 'hidden' ? 'Close case · keep content hidden' : 'No action needed' }} · passkey
          </button>
          <button
            class="cbtn"
            :disabled="busy"
            @click="askDecision('assign', { assignee: 'harry' }, $event)"
          >
            Assign to Harry · passkey
          </button>
          <button
            class="cbtn"
            :disabled="busy"
            @click="askDecision('assign', { assignee: 'jack' }, $event)"
          >
            Assign to Jack · passkey
          </button>
          <button
            class="cbtn"
            :disabled="busy"
            @click="askDecision(review.legal_hold ? 'clear-hold' : 'hold', {}, $event)"
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
    <button
      v-if="uncertain"
      type="button"
      class="cbtn"
      @click="refresh"
    >
      Refresh
    </button>
    <div
      v-if="decision"
      class="dialog-backdrop"
      @mousedown.self="cancelDecision"
    >
      <section
        ref="decisionDialog"
        class="decision-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-title"
        tabindex="-1"
        @keydown="trapDialog"
      >
        <h2 id="decision-title">
          Confirm decision
        </h2>
        <p>This decision will ask for a fresh passkey and will be recorded with your reason.</p>
        <div class="actions">
          <button
            type="button"
            class="cbtn"
            @click="cancelDecision"
          >
            Cancel
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            data-tid="decision-confirm"
            @click="confirmDecision"
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
import { AdminError, newCommandId, staffCommand, isStaffMutation, sourceBlob, type SourceFile, type CaseSummary, type CaseDetail, type Reservation, type CommandResult } from '@/services/admin/client'
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
  sourceDownloads: Record<string, string> = {}
  privacyChecked = false
  uncertain = false
  decision: { action: string; details: Record<string, unknown> } | null = null
  decisionOpener: HTMLElement | null = null
  get sourceAccepted () { return this.review?.publication?.reviewed_by === this.actor && this.review.publication.reviewed_version === this.review.version }
  get allSourcesFetched () { return !!this.review?.publication?.files.length && this.review.publication.files.every(f => this.sourceDownloads[f.id]) }
  clearSources () { Object.values(this.sourceDownloads).forEach(url => URL.revokeObjectURL(url)); this.sourceDownloads = {}; this.privacyChecked = false }
  beforeDestroy () { this.alive = false; this.revision++; this.clearSources() }
  async fetchSource (file: SourceFile) {
    const review = this.review
    if (!review?.publication) return
    const result = await this.request('source', review.id, review.version, { file: file.id })
    if (!result?.source) return
    const revision = this.revision; const token = storedToken()
    try {
      const blob = await sourceBlob(result.source, file, review.publication.manifest)
      if (!this.alive || revision !== this.revision || document.hidden || storedToken() !== token) return
      if (this.sourceDownloads[file.id]) URL.revokeObjectURL(this.sourceDownloads[file.id])
      this.$set(this.sourceDownloads, file.id, URL.createObjectURL(blob))
      this.message = 'Source verified. Download and inspect the complete file before accepting.'
    } catch (e) { if (this.alive && revision === this.revision) this.message = e instanceof Error ? e.message : 'Source could not be verified.' }
  }

  async fetchProfilePhoto () {
    const review = this.review
    if (!review?.profile) return
    const result = await this.request('source', review.id, review.version, { profile_digest: review.profile.digest })
    if (!result?.source) return
    const revision = this.revision; const token = storedToken()
    try {
      const blob = await sourceBlob(result.source, result.source.file, review.profile.digest)
      if (!this.alive || revision !== this.revision || document.hidden || storedToken() !== token) return
      if (this.sourceDownloads['profile-avatar']) URL.revokeObjectURL(this.sourceDownloads['profile-avatar'])
      this.$set(this.sourceDownloads, 'profile-avatar', URL.createObjectURL(blob))
      this.message = 'Profile photo verified. Download and inspect it before restoration.'
    } catch (e) { if (this.alive && revision === this.revision) this.message = e instanceof Error ? e.message : 'Photo could not be verified.' }
  }

  date (at: number): string { return new Date(at * 1000).toLocaleString() }
  askDecision (action: string, details: Record<string, unknown>, event: Event) {
    this.decision = { action, details }; this.decisionOpener = event.currentTarget as HTMLElement
    this.$nextTick(() => (this.$refs.decisionDialog as HTMLElement)?.focus())
  }

  cancelDecision () { this.decision = null; this.$nextTick(() => this.decisionOpener?.focus()) }
  async confirmDecision () {
    const pending = this.decision
    this.decision = null
    if (pending) await this.decide(pending.action, pending.details)
    this.$nextTick(() => this.decisionOpener?.focus())
  }

  trapDialog (event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); this.cancelDecision(); return }
    if (event.key !== 'Tab') return
    const buttons = Array.from((this.$refs.decisionDialog as HTMLElement).querySelectorAll<HTMLElement>('button:not([disabled])'))
    const first = buttons[0]; const last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  async request (action: string, target: string, version = 0, details: Record<string, unknown> = {}): Promise<CommandResult | null> {
    if (this.busy || this.reason.trim().length < 8) { this.message = 'Give a short reason before continuing.'; return null }
    const revision = ++this.revision
    const token = storedToken()
    const current = () => this.alive && revision === this.revision && storedToken() === token && !document.hidden
    this.uncertain = false; this.busy = true; this.message = isStaffMutation(action) ? 'Confirm this decision with your passkey…' : 'Loading…'
    try {
      const result = await staffCommand({ command: newCommandId(), action, target, version, reason: this.reason, details }, false, current)
      if (!current()) return null
      this.message = 'Read complete.'
      if (isStaffMutation(action)) this.$emit('spent', 'Action saved. Confirm staff access to continue.')
      return result
    } catch (error) {
      if (current()) {
        this.message = error instanceof DOMException && error.name === 'NotAllowedError' ? 'Passkey confirmation was cancelled or expired. No command was sent.' : error instanceof DOMException && (error.name === 'NotSupportedError' || error.name === 'SecurityError') ? 'Passkeys are unavailable. No command was sent.' : error instanceof Error ? error.message : 'Staff tools could not be reached.'
        this.uncertain = isStaffMutation(action) && /outcome is uncertain/i.test(this.message)
        if (error instanceof AdminError && error.expired) this.$emit('expired')
      }
      return null
    } finally { if (current()) this.busy = false }
  }

  async read () {
    this.clearSources()
    this.review = null; this.cases = []; this.reservations = []
    const result = await this.request(this.section === 'queue' ? 'queue' : 'reservations', 'all')
    if (!result) return
    this.cases = result.cases || []; this.reservations = result.reservations || []
    if (!this.cases.length && !this.reservations.length) this.message = 'No work waiting.'
  }

  async refresh () { this.uncertain = false; await this.read() }

  async open (id: string) { this.clearSources(); const result = await this.request('case', id); if (result?.case) this.review = result.case }
  async decide (action: string, details: Record<string, unknown> = {}) { if (this.review) await this.request(action, this.review.id, this.review.version, { ...(this.review.profile ? { profile_digest: this.review.profile.digest, privacy_checked: this.privacyChecked } : {}), ...details }) }
  async release (row: Reservation) { await this.request('release', row.pattern, row.version) }
  async reserve () {
    const existing = this.reservations.find(r => r.pattern === this.pattern)
    await this.request('reserve', this.pattern, existing?.version || 0, { owner: this.owner || null, expires_at: this.expiry ? Math.floor(new Date(this.expiry).getTime() / 1000) : null })
  }
}
</script>

<style scoped>
.moderation { max-width: 860px; min-width: 0; overflow-wrap: anywhere; } form, article { max-width: 100%; padding: 20px; margin: 16px 0; border: 1px solid var(--m3d-border); border-radius: 6px; background: var(--m3d-surface); overflow-wrap: anywhere; }
label { display: block; margin-bottom: 16px; } textarea, input { display: block; width: 100%; padding: 10px; border: 1px solid var(--m3d-border); border-radius: 4px; background: var(--m3d-inset); color: var(--m3d-text); font: inherit; }
textarea { min-height: 80px; } .actions { display: flex; flex-wrap: wrap; gap: 10px; } li { margin: 16px 0; white-space: pre-wrap; } button { white-space: normal; max-width: 100%; } button:disabled { opacity: .5; } :focus-visible { outline: 2px solid var(--m3d-accent); outline-offset: 2px; }
input[type="checkbox"] { display: inline-block; width: auto; margin-right: 8px; }
.long-text { word-break: break-all; } .dialog-backdrop { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, .6); } .decision-dialog { width: min(440px, 100%); padding: 24px; border: 1px solid var(--m3d-border); border-radius: 6px; background: var(--m3d-surface); color: var(--m3d-text); }
</style>
