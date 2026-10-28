<template>
  <div
    class="acct-section"
    data-tid="account-printers"
  >
    <div class="acct-head acct-head--row">
      <div class="acct-head">
        <h1>Printers and access</h1>
      </div>
      <button
        type="button"
        class="lib-btn"
        data-tid="printers-link"
        @click="linkDialog = true"
      >
        <frame-icon
          name="plus"
          small
        />Link a printer
      </button>
    </div>

    <div
      v-for="request in approvals"
      :key="request.id"
      class="acct-note acct-note--warn prn__request"
      role="status"
      data-tid="printers-request"
    >
      <frame-icon
        name="userPlus"
        small
      />
      <span class="prn__grow"><b>{{ requester(request) }}</b> wants to use {{ printerName(request.printer_id) }}{{ request.link_id ? ' with your invite link' : '' }} as {{ request.role === 'viewer' ? 'a Viewer' : 'an Operator' }}.</span>
      <button
        type="button"
        class="lib-btn lib-btn--sm lib-btn--ghost"
        :disabled="busy"
        @click="answer(request, false)"
      >
        Decline
      </button>
      <button
        type="button"
        class="lib-btn lib-btn--sm lib-btn--pri"
        :disabled="busy"
        data-tid="approval-allow"
        @click="answer(request, true)"
      >
        Allow {{ request.role === 'viewer' ? 'Viewer' : 'Operator' }}
      </button>
    </div>

    <section
      class="lib-surface acct-card"
      aria-label="Your printers"
    >
      <div class="acct-card__title">
        <h2>Your printers</h2>
        <acct-more
          label="Who owns a printer"
          end
        >
          The owner is set on each printer's own screen. Printers on your network work without an account.
        </acct-more>
      </div>
      <div
        v-if="!owned.length"
        class="acct-empty"
        data-tid="printers-empty"
      >
        <span class="acct-empty__icon"><frame-icon
          name="printer"
          large
        /></span>
        <h3>No printers in your account yet</h3>
        <p>Link an M1 with the code on its screen.</p>
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          @click="linkDialog = true"
        >
          Link a printer
        </button>
      </div>
      <div class="acct-list">
        <div
          v-for="p in owned"
          :key="p.id"
          class="prn__printer"
          data-tid="printers-owned"
        >
          <printer-thumb
            :size="48"
            :state="thumbOf(p)"
          />
          <div class="acct-row__label">
            <span class="prn__name"><b>{{ p.name }}</b><span
              class="lib-pill"
              :class="stateOf(p).pill"
            ><span class="lib-dot" />{{ stateOf(p).text }}</span></span>
            <span>{{ p.model || 'M1' }} · linked {{ day(p.linked_at) }} · {{ peopleLine(p.id) }}</span>
          </div>
          <div class="acct-row__control">
            <button
              type="button"
              class="lib-btn lib-btn--sm lib-btn--ghost"
              @click="openRename(p)"
            >
              Rename
            </button>
            <router-link
              v-if="securityTo(p)"
              :to="securityTo(p)"
              class="lib-btn lib-btn--sm"
            >
              Security page
            </router-link>
            <button
              type="button"
              class="lib-btn lib-btn--sm lib-btn--ghost"
              :disabled="busy"
              :aria-label="`Unlink ${p.name}`"
              @click="unlink(p)"
            >
              Unlink
            </button>
          </div>
        </div>
      </div>
    </section>

    <section
      v-if="owned.length"
      class="lib-surface acct-card"
      aria-label="People who can use them"
    >
      <div class="acct-card__title">
        <h2>People who can use them</h2>
        <button
          type="button"
          class="lib-btn lib-btn--sm"
          data-tid="printers-invite"
          @click="openInvite"
        >
          <frame-icon
            name="plus"
            small
          />Invite someone
        </button>
      </div>
      <div
        v-if="people.length"
        class="prn__table prn__th"
      >
        <span /><span>Person</span><span>Printer</span><span>Can</span><span>Until</span><span />
      </div>
      <div class="acct-list">
        <div
          v-for="row in people"
          :key="row.key"
          class="prn__table"
          data-tid="printers-person"
        >
          <span class="acct-avatar prn__small">{{ row.letter }}</span>
          <span class="acct-row__label"><span class="prn__email">{{ row.email }}</span><span class="acct-subtle">{{ row.state }}</span></span>
          <span>{{ printerName(row.printerId) }}</span>
          <span><span
            class="lib-pill"
            :class="row.role === 'operator' ? 'lib-pill--run' : ''"
          >{{ row.role === 'operator' ? 'Operator' : 'Viewer' }}</span></span>
          <span class="acct-muted">{{ row.until }}</span>
          <span class="acct-row__control prn__end">
            <button
              type="button"
              class="lib-btn lib-btn--sm lib-btn--ghost"
              :disabled="busy"
              data-tid="person-role"
              @click="openRole(row)"
            >
              Change role
            </button>
            <button
              v-if="row.invite && !resendMissing"
              type="button"
              class="lib-btn lib-btn--sm lib-btn--ghost"
              :disabled="busy"
              data-tid="invite-resend"
              @click="resend(row)"
            >
              Resend
            </button>
            <span
              v-else-if="row.invite"
              class="acct-soon"
            >Resending: Coming soon</span>
            <button
              type="button"
              class="lib-btn lib-btn--sm lib-btn--ghost"
              :disabled="busy"
              @click="removePerson(row)"
            >
              {{ row.invite ? 'Cancel' : 'Remove' }}
            </button>
          </span>
        </div>
        <p
          v-if="!people.length"
          class="acct-muted prn__empty"
        >
          Only you can use your printers.
        </p>
      </div>
      <template v-if="links.length">
        <div class="prn__rule" />
        <div
          v-for="link in links"
          :key="link.id"
          class="acct-row"
          data-tid="printers-link-row"
        >
          <div class="acct-row__label">
            <b>Invite link{{ link.name ? `: "${link.name}"` : '' }}</b>
            <span>{{ linkLine(link) }}</span>
          </div>
          <div class="acct-row__control">
            <button
              v-if="link.url"
              type="button"
              class="lib-btn lib-btn--sm lib-btn--ghost"
              @click="copy(link.url)"
            >
              Copy link
            </button>
            <button
              type="button"
              class="lib-btn lib-btn--sm lib-btn--ghost"
              :disabled="busy"
              @click="revoke(link)"
            >
              Turn off
            </button>
          </div>
        </div>
      </template>
    </section>

    <section
      v-if="sharedWithYou.length"
      class="lib-surface acct-card"
      aria-label="Shared with you"
    >
      <div class="acct-card__title">
        <h2>Shared with you</h2>
      </div>
      <div class="acct-list">
        <div
          v-for="p in sharedWithYou"
          :key="p.id"
          class="prn__printer"
          data-tid="printers-shared"
        >
          <printer-thumb
            :size="48"
            :state="thumbOf(p)"
          />
          <div class="acct-row__label">
            <span class="prn__name"><b>{{ p.name }}</b><span
              class="lib-pill"
              :class="stateOf(p).pill"
            >{{ stateOf(p).text }}</span></span>
            <span>{{ sharedLine(p) }}</span>
          </div>
          <button
            v-if="shareIdOf(p)"
            type="button"
            class="lib-btn lib-btn--sm lib-btn--ghost"
            :disabled="busy"
            @click="leave(p)"
          >
            Leave
          </button>
          <span
            v-else
            class="acct-soon"
          >Leaving comes soon</span>
        </div>
      </div>
    </section>

    <span class="acct-field__note">We always show people by their confirmed email address when they ask for access, never by a name they chose. Owner can only be given at the printer itself.</span>

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

    <m3-dialog
      :value="dialog === 'role'"
      title="Change role"
      :persistent="busy"
      @close="dialog = ''"
    >
      <p class="m3-dlg__text">
        What {{ changing && changing.email }} can do with {{ changing && printerName(changing.printerId) }}.
      </p>
      <div class="prn__roles">
        <button
          type="button"
          class="lib-chip"
          :class="{ 'lib-chip--on': form.role === 'operator' }"
          :aria-pressed="form.role === 'operator' ? 'true' : 'false'"
          data-tid="role-operator"
          @click="form.role = 'operator'"
        >
          Operator: print and control
        </button>
        <button
          type="button"
          class="lib-chip"
          :class="{ 'lib-chip--on': form.role === 'viewer' }"
          :aria-pressed="form.role === 'viewer' ? 'true' : 'false'"
          data-tid="role-viewer"
          @click="form.role = 'viewer'"
        >
          Viewer: watch only
        </button>
      </div>
      <p
        v-if="dialogError"
        class="m3-dlg__error"
        role="alert"
      >
        {{ dialogError }}
      </p>
      <template #actions>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          :disabled="busy"
          @click="dialog = ''"
        >
          Cancel
        </button>
        <button
          type="button"
          class="cbtn cbtn--primary"
          :disabled="busy || !changing || form.role === changing.role"
          data-tid="role-save"
          @click="changeRole"
        >
          Save role
        </button>
      </template>
    </m3-dialog>

    <m3-dialog
      :value="dialog === 'rename'"
      title="Rename this printer"
      :persistent="busy"
      @close="dialog = ''"
    >
      <label class="m3-field">
        <span class="m3-field__label">Name</span>
        <span class="m3-field__box"><input
          v-model="form.name"
          maxlength="64"
          aria-label="Name"
          @keydown.enter="rename"
        ></span>
        <span class="m3-dlg__note">Shown in your account, the app and to people you share it with. The printer's own name on its screen stays.</span>
      </label>
      <template #actions>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          @click="dialog = ''"
        >
          Cancel
        </button>
        <button
          type="button"
          class="cbtn cbtn--primary"
          :disabled="!form.name.trim() || busy"
          @click="rename"
        >
          Rename
        </button>
      </template>
    </m3-dialog>

    <m3-dialog
      :value="dialog === 'invite'"
      title="Let someone use a printer"
      :persistent="busy"
      max-width="480"
      @close="dialog = ''"
    >
      <p class="m3-dlg__text">
        It appears in their account. Take it back any time.
      </p>
      <label class="m3-field">
        <span class="m3-field__label">Their email address</span>
        <span class="m3-field__box"><input
          v-model="form.email"
          type="email"
          aria-label="Their email address"
          data-tid="invite-email"
        ></span>
      </label>
      <label class="m3-field">
        <span class="m3-field__label">Printer</span>
        <span class="m3-field__box"><select
          v-model="form.printer"
          aria-label="Printer"
          class="prn__select"
        ><option
          v-for="p in owned"
          :key="p.id"
          :value="p.id"
        >{{ p.name }}</option></select></span>
      </label>
      <div class="m3-field">
        <span class="m3-field__label">What they can do</span>
        <div class="prn__roles">
          <button
            type="button"
            class="lib-chip"
            :class="{ 'lib-chip--on': form.role === 'operator' }"
            :aria-pressed="form.role === 'operator' ? 'true' : 'false'"
            @click="form.role = 'operator'"
          >
            Operator: print and control
          </button>
          <button
            type="button"
            class="lib-chip"
            :class="{ 'lib-chip--on': form.role === 'viewer' }"
            :aria-pressed="form.role === 'viewer' ? 'true' : 'false'"
            @click="form.role = 'viewer'"
          >
            Viewer: watch only
          </button>
        </div>
      </div>
      <label class="m3-field">
        <span class="m3-field__label">Until <span class="acct-subtle">(leave empty for no end)</span></span>
        <span class="m3-field__box"><input
          v-model="form.until"
          type="date"
          aria-label="Until"
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
          @click="dialog = ''"
        >
          Cancel
        </button>
        <button
          type="button"
          class="cbtn cbtn--primary"
          :disabled="!form.email.includes('@') || !form.printer || busy"
          data-tid="invite-send"
          @click="invite"
        >
          Let them use it
        </button>
      </template>
    </m3-dialog>

    <link-printer-dialog
      v-if="linkDialog"
      v-model="linkDialog"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import PrinterThumb, { type ThumbState } from '@/components/ui/PrinterThumb.vue'
import LinkPrinterDialog from '@/components/muon-cloud/LinkPrinterDialog.vue'
import AcctMore from './AcctMore.vue'
import { cloudApi, type CloudPrinter } from '@/services/muon-cloud/api'
import { cloudState, refreshPrinters } from '@/services/muon-cloud/state'
import { knownPrinters, printerPath } from '@/services/printer-pages'
import { accountApi, type InviteLink, type JoinApproval, type PrinterInvite, type PrinterShare } from '@/services/account/api'
import { isMissing } from '@/services/account/client'
import { accountState, describe, loadApprovals } from '@/services/account/state'
import { dayText, type AccountSectionId } from '@/services/account/model'

interface PersonRow {
  key: string;
  id: string;
  printerId: string;
  email: string;
  letter: string;
  role: string;
  until: string;
  endsAt: number | null;
  state: string;
  invite: boolean;
}

/**
 * Printers and access (the canvas's "Account · Printers and access"): your
 * printers, who else can use them and until when, invite links, requests
 * waiting for you, and printers shared with you. People are named by their
 * confirmed email address, never a name they chose (LINK-3).
 */
@Component({ components: { M3Dialog, PrinterThumb, LinkPrinterDialog, AcctMore } })
export default class AccountPrinters extends Vue {
  @Prop({ type: Function, required: true })
  readonly linkTo!: (id: AccountSectionId) => string

  shares: Record<string, PrinterShare[]> = {}
  invites: Record<string, PrinterInvite[]> = {}
  linksOf: Record<string, InviteLink[]> = {}
  dialog: '' | 'rename' | 'invite' | 'role' = ''
  form = { name: '', email: '', printer: '', role: 'operator', until: '' }
  renaming: CloudPrinter | null = null
  changing: PersonRow | null = null
  resendMissing = false
  linkDialog = false
  busy = false
  error = ''
  dialogError = ''
  message = ''

  created () {
    this.refresh()
  }

  async refresh () {
    await refreshPrinters()
    loadApprovals().catch(() => {})
    for (const p of this.owned) {
      accountApi.shares(p.id).then(r => this.$set(this.shares, p.id, r.shares)).catch(() => {})
      accountApi.invites(p.id).then(r => this.$set(this.invites, p.id, r.invites)).catch(() => {})
      accountApi.links(p.id).then(r => this.$set(this.linksOf, p.id, r.links)).catch(() => {})
    }
  }

  get owned (): CloudPrinter[] {
    return cloudState.printers.filter(p => !p.shared)
  }

  get sharedWithYou (): CloudPrinter[] {
    return cloudState.printers.filter(p => p.shared)
  }

  get approvals (): JoinApproval[] {
    return accountState.approvals ?? []
  }

  get people (): PersonRow[] {
    const rows: PersonRow[] = []
    for (const p of this.owned) {
      for (const s of this.shares[p.id] ?? []) {
        rows.push({
          key: `s-${s.id}`,
          id: s.id,
          printerId: p.id,
          email: s.email,
          letter: s.email.charAt(0).toUpperCase(),
          role: s.role,
          until: s.ends_at ? dayText(s.ends_at) : 'No end date',
          endsAt: s.ends_at ?? null,
          state: s.accepted === false ? 'Not signed in yet' : `Since ${dayText(s.created_at)}`,
          invite: false
        })
      }
      for (const i of this.invites[p.id] ?? []) {
        rows.push({
          key: `i-${i.id}`,
          id: i.id,
          printerId: p.id,
          email: i.email,
          letter: i.email.charAt(0).toUpperCase(),
          role: i.role,
          until: i.ends_at ? dayText(i.ends_at) : 'No end date',
          endsAt: i.ends_at ?? null,
          state: `Invited ${dayText(i.created_at)}, not accepted yet`,
          invite: true
        })
      }
    }
    return rows
  }

  get links (): InviteLink[] {
    return this.owned.flatMap(p => this.linksOf[p.id] ?? [])
  }

  printerName (id: string): string {
    return cloudState.printers.find(p => p.id === id)?.name ?? 'a printer'
  }

  requester (request: JoinApproval): string {
    return request.requester?.email ?? 'Someone'
  }

  day (seconds: number): string {
    return dayText(seconds)
  }

  thumbOf (p: CloudPrinter): ThumbState {
    if (!p.online) return 'offline'
    const state = cloudState.status[p.id]?.state
    return state === 'printing' || state === 'paused' ? 'printing' : 'idle'
  }

  stateOf (p: CloudPrinter): { text: string, pill: string } {
    if (!p.online) return { text: 'Offline', pill: '' }
    const status = cloudState.status[p.id]
    if (status?.state === 'printing') {
      const progress = typeof status.progress === 'number' ? ` ${Math.round(status.progress * 100)}%` : ''
      return { text: `Printing${progress}`, pill: 'lib-pill--run' }
    }
    if (status?.state === 'paused') return { text: 'Paused', pill: 'lib-pill--warn' }
    return { text: 'Online', pill: 'lib-pill--ok' }
  }

  peopleLine (printerId: string): string {
    const n = (this.shares[printerId] ?? []).length
    return n === 0 ? 'only you' : n === 1 ? '1 other person' : `${n} other people`
  }

  sharedLine (p: CloudPrinter & { shared_by?: string }): string {
    const by = p.shared_by ? `Shared by ${p.shared_by}` : 'Shared with you'
    const role = p.role === 'viewer' ? "you're a Viewer" : "you're an Operator"
    return `${by} · ${role} · ${p.ends_at ? `until ${dayText(p.ends_at)}` : 'no end date'}`
  }

  shareIdOf (p: CloudPrinter & { share_id?: string }): string | null {
    return p.share_id ?? null
  }

  linkLine (link: InviteLink): string {
    const parts = [`for ${this.printerName(link.printer_id)}`]
    if (link.max_uses) parts.push(`${link.uses ?? 0} of ${link.max_uses} uses`)
    parts.push(link.expires_at ? `ends ${dayText(link.expires_at)}` : 'no end date')
    if (link.approve_each) parts.push('you approve each person')
    return parts.join(' · ').replace(/^./, c => c.toUpperCase())
  }

  /** That printer's own Security page (KAN-426): People and access in its Settings. */
  securityTo (p: CloudPrinter): string | null {
    const target = knownPrinters().find(t => t.kind === 'cloud' && t.printerId === p.id)
    return target ? `${printerPath(target.slug, 'settings')}#access` : null
  }

  async run (what: () => Promise<unknown>, done?: string, inDialog = false): Promise<boolean> {
    this.busy = true
    this.error = ''
    this.dialogError = ''
    this.message = ''
    try {
      await what()
      if (done) this.message = done
      return true
    } catch (error) {
      if (isMissing(error)) {
        this.message = 'Coming soon.'
        return false
      }
      if (inDialog) this.dialogError = describe(error)
      else this.error = describe(error)
      return false
    } finally {
      this.busy = false
    }
  }

  async answer (request: JoinApproval, allow: boolean) {
    await this.run(() => accountApi.answerApproval(request.id, allow),
      allow ? `${this.requester(request)} can use ${this.printerName(request.printer_id)} now.` : 'Declined.')
    this.refresh()
  }

  openRename (p: CloudPrinter) {
    this.renaming = p
    this.form.name = p.name
    this.dialog = 'rename'
  }

  async rename () {
    const p = this.renaming
    if (!p) return
    if (await this.run(() => cloudApi.renamePrinter(p.id, this.form.name.trim()))) {
      this.dialog = ''
      this.refresh()
    }
  }

  async unlink (p: CloudPrinter) {
    const sure = await this.$confirm(`${p.name} leaves your account: you can't reach it from outside your home, and everyone you share it with loses access. It keeps working on your network, and you can link it again at its screen.`, {
      title: `Unlink ${p.name}?`,
      buttonTrueText: 'Unlink',
      danger: true
    })
    if (!sure) return
    await this.run(() => cloudApi.unlinkPrinter(p.id), `${p.name} is unlinked.`)
    this.refresh()
  }

  openInvite () {
    this.form = { name: '', email: '', printer: this.owned[0]?.id ?? '', role: 'operator', until: '' }
    this.dialogError = ''
    this.dialog = 'invite'
  }

  async invite () {
    const endsAt = this.form.until ? Math.floor(new Date(`${this.form.until}T23:59:59`).getTime() / 1000) : null
    const email = this.form.email.trim()
    if (await this.run(() => accountApi.share(this.form.printer, email, this.form.role, endsAt), `${email} can use ${this.printerName(this.form.printer)}. We've emailed them.`, true)) {
      this.dialog = ''
      this.refresh()
    }
  }

  async removePerson (row: PersonRow) {
    const sure = await this.$confirm(`${row.email} won't be able to use ${this.printerName(row.printerId)} any more.`, {
      title: row.invite ? 'Cancel this invite?' : 'Take back access?',
      buttonTrueText: row.invite ? 'Cancel invite' : 'Remove',
      danger: true
    })
    if (!sure) return
    await this.run(() => row.invite ? accountApi.withdrawInvite(row.printerId, row.id) : accountApi.removeShare(row.printerId, row.id))
    this.refresh()
  }

  openRole (row: PersonRow) {
    this.changing = row
    this.form.role = row.role
    this.dialogError = ''
    this.dialog = 'role'
  }

  async changeRole () {
    const row = this.changing
    if (!row) return
    const role = this.form.role
    const action = () => row.invite
      ? accountApi.sendInvite(row.printerId, row.email, role, row.endsAt)
      : accountApi.share(row.printerId, row.email, role, row.endsAt)
    const verb = role === 'viewer' ? 'watch' : 'print and control'
    if (await this.run(action, `${row.email} can now ${verb} ${this.printerName(row.printerId)}.`, true)) {
      this.dialog = ''
      this.changing = null
      this.refresh()
    }
  }

  async resend (row: PersonRow) {
    if (!row.invite) return
    const action = async () => {
      try {
        return await accountApi.sendInvite(row.printerId, row.email, row.role, row.endsAt)
      } catch (error) {
        if (isMissing(error)) this.resendMissing = true
        throw error
      }
    }
    if (await this.run(action, `Invitation sent to ${row.email}.`)) this.refresh()
  }

  async revoke (link: InviteLink) {
    await this.run(() => accountApi.revokeLink(link.printer_id, link.id), 'That invite link no longer works. People who joined with it keep their access.')
    this.refresh()
  }

  async leave (p: CloudPrinter & { share_id?: string }) {
    const sure = await this.$confirm(`You won't be able to use ${p.name} any more, until its owner shares it with you again.`, {
      title: `Leave ${p.name}?`,
      buttonTrueText: 'Leave',
      danger: true
    })
    if (!sure || !p.share_id) return
    await this.run(() => accountApi.removeShare(p.id, p.share_id as string), `You've left ${p.name}.`)
    this.refresh()
  }

  async copy (text: string) {
    try {
      await navigator.clipboard.writeText(text)
      this.message = 'Link copied.'
    } catch {
      this.error = 'Copying didn\'t work in this browser.'
    }
  }
}
</script>

<style lang="scss" scoped>
  .prn__request {
    align-items: center;
  }

  .prn__grow {
    flex: 1 1 auto;
  }

  .prn__printer {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 14px 0;
  }

  .prn__name {
    display: flex !important;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    color: var(--m3d-text) !important;
    font-size: 14px !important;
  }

  .prn__table {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) 100px 110px 120px auto;
    gap: 12px;
    align-items: center;
    padding: 10px 0;
    font-size: 13.5px;
  }

  .prn__th {
    padding: 12px 0 4px;
    color: var(--m3d-text-subtle);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .prn__small {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }

  .prn__email {
    overflow: hidden;
    color: var(--m3d-text) !important;
    font-size: 13.5px !important;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .prn__end {
    justify-content: flex-end;
  }

  .prn__rule {
    height: 1px;
    background: var(--m3d-border);
  }

  .prn__empty {
    margin: 0;
    padding: 14px 0;
    font-size: 13px;
  }

  .prn__roles {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .prn__select {
    flex: 1 1 auto;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--m3d-text);
    font: inherit;
    font-size: 15px;

    option {
      background: var(--m3d-surface);
    }
  }

  @media (max-width: 760px) {
    .prn__table {
      grid-template-columns: 28px minmax(0, 1fr) auto;
    }

    .prn__end {
      grid-column: 2 / -1;
      justify-content: flex-start;
      flex-wrap: wrap;
    }

    // On a phone the words take the width and the buttons go underneath.
    .prn__request {
      flex-wrap: wrap;
    }

    .prn__grow {
      flex-basis: calc(100% - 30px);
    }

    .prn__request > .lib-btn:first-of-type {
      margin-left: 26px;
    }

    .prn__printer {
      grid-template-columns: 48px minmax(0, 1fr);
    }

    .prn__printer > :nth-child(3) {
      grid-column: 2;
      justify-self: start;
    }

    .prn__table > span:nth-child(3),
    .prn__table > span:nth-child(5),
    .prn__th {
      display: none;
    }
  }
</style>
