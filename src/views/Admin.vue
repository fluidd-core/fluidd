<template>
  <div class="admin-shell">
    <header class="admin-topbar">
      <router-link
        to="/"
        class="muon-wordmark"
      >
        MUON3D
      </router-link><span>Control / Staff</span>
    </header>
    <main class="admin-page">
      <nav
        class="admin-nav"
        aria-label="Staff tools"
      >
        <span class="admin-label">Control / Staff</span>
        <button
          v-for="item in sections"
          :key="item.id"
          type="button"
          :aria-current="section === item.id ? 'page' : undefined"
          @click="changeSection(item.id)"
        >
          {{ item.label }}
        </button>
        <router-link to="/account">
          Back to your account
        </router-link>
      </nav>
      <div class="admin-pane">
        <header class="admin-heading">
          <div>
            <h1>{{ sections.find(item => item.id === section)?.label }}</h1><p class="muted">
              Staff tools
            </p>
          </div>
          <button
            v-if="expires"
            type="button"
            class="cbtn cbtn--ghost"
            @click="lock"
          >
            Lock staff tools
          </button>
        </header>
        <p
          v-if="message"
          role="status"
          aria-live="polite"
        >
          {{ message }}
        </p>
        <section
          v-if="!available"
          class="admin-card"
        >
          <h2>Open staff tools on Control</h2><p>Use control.muon3d.com to access staff tools.</p>
        </section>
        <section
          v-else-if="!expires"
          class="admin-card"
        >
          <h2>Confirm staff access</h2>
          <p>Use your passkey to look up accounts and read the audit log. Only staff accounts have access.</p>
          <button
            type="button"
            class="cbtn cbtn--primary"
            data-tid="admin-confirm"
            :disabled="busy"
            @click="confirm"
          >
            {{ busy ? 'Waiting for your passkey…' : 'Confirm with passkey' }}
          </button>
          <p class="muted">
            Confirmation lasts two minutes. <router-link to="/account/security">
              Account security
            </router-link>
          </p>
        </section>
        <template v-else>
          <p class="admin-notice">
            Searches and audit reads are recorded with your account and reason.
          </p>
          <admin-moderation
            v-if="section === 'queue' || section === 'reservations'"
            :key="section"
            :section="section"
            :actor="actor"
            @spent="spent"
            @expired="lock"
          />
          <form
            v-else
            class="admin-card"
            @submit.prevent="read(false)"
          >
            <template v-if="section === 'accounts'">
              <label for="admin-query">Exact email or account ID</label>
              <input
                id="admin-query"
                v-model="query"
                name="query"
                required
                maxlength="254"
                autocomplete="off"
              >
            </template>
            <template v-else>
              <label for="admin-source">Audit log</label>
              <select
                id="admin-source"
                v-model="source"
                @change="clearResults"
              >
                <option value="console">
                  Accounts
                </option><option value="community">
                  Community
                </option>
              </select>
            </template>
            <label for="admin-reason">Why are you looking this up?</label>
            <textarea
              id="admin-reason"
              v-model="reason"
              name="reason"
              required
              minlength="8"
              maxlength="500"
            />
            <button
              type="submit"
              class="cbtn cbtn--primary"
              data-tid="admin-lookup"
              :disabled="busy"
            >
              {{ busy ? 'Reading…' : section === 'accounts' ? 'Find account' : 'Read audit' }}
            </button>
          </form>
          <section
            v-if="account"
            class="admin-card"
            aria-label="Account result"
          >
            <h2>{{ account.name }}</h2><p class="muted">
              {{ account.id }}
            </p>
            <dl>
              <dt>Email</dt><dd>{{ account.email }}</dd><dt>Email confirmed</dt><dd>{{ account.email_verified ? 'Yes' : 'No' }}</dd>
              <dt>Active sessions</dt><dd>{{ account.sessions }}</dd><dt>Account status</dt><dd>{{ account.delete_after ? 'Deletion scheduled' : 'Active' }}</dd>
              <template v-if="account.delete_after">
                <dt>Deletion date</dt><dd>{{ date(account.delete_after) }}</dd>
              </template>
            </dl>
            <admin-account-actions
              v-if="account.admin_version !== undefined"
              :key="account.id + ':' + account.admin_version"
              :account="account"
              @spent="spent"
              @expired="lock"
            />
          </section>
          <section
            v-if="entries.length"
            class="admin-card admin-scroll"
            aria-label="Audit results"
          >
            <table>
              <thead><tr><th>Time</th><th>Staff / action</th><th>Reason / result</th></tr></thead><tbody>
                <tr
                  v-for="entry in entries"
                  :key="entry.id"
                >
                  <td>{{ date(entry.at) }}</td><td>{{ entry.actor }}<br>{{ entry.action }}<br>{{ entry.target }}</td><td>{{ entry.reason }}<br><span class="muted">{{ entry.result }}</span></td>
                </tr>
              </tbody>
            </table>
            <button
              v-if="next"
              type="button"
              class="cbtn"
              :disabled="busy"
              @click="read(true)"
            >
              Load older entries
            </button>
          </section>
        </template>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { adminAvailable, confirmStaff, lookupAccount, readAudit, AdminError, type AdminAccount, type AuditEntry } from '@/services/admin/client'
import { storedToken } from '@/services/muon-cloud/api'
import AdminModeration from '@/components/admin/AdminModeration.vue'
import AdminAccountActions from '@/components/admin/AdminAccountActions.vue'

@Component({ components: { AdminModeration, AdminAccountActions } })
export default class Admin extends Vue {
  sections = [{ id: 'accounts', label: 'Accounts' }, { id: 'audit', label: 'Audit log' }, { id: 'queue', label: 'Review queue' }, { id: 'reservations', label: 'Handle reservations' }]
  actor = ''
  section = 'accounts'
  source: 'console' | 'community' = 'console'
  query = ''
  reason = ''
  message = ''
  busy = false
  expires = 0
  account: AdminAccount | null = null
  entries: AuditEntry[] = []
  next: number | null = null
  revision = 0
  token: string | null = null
  timer: ReturnType<typeof setInterval> | undefined
  get available (): boolean { return adminAvailable() }
  mounted () {
    this.timer = setInterval(() => {
      if (this.expires && (Date.now() >= this.expires * 1000 || storedToken() !== this.token)) this.lock()
    }, 250)
    document.addEventListener('visibilitychange', this.hidden)
  }

  beforeDestroy () { clearInterval(this.timer); document.removeEventListener('visibilitychange', this.hidden); this.lock() }
  hidden () { if (document.hidden) this.lock() }
  clearResults () { this.revision++; this.account = null; this.entries = []; this.next = null; this.message = ''; this.busy = false }
  lock () { this.clearResults(); this.expires = 0; this.query = ''; this.reason = ''; this.busy = false; this.message = 'Confirm staff access to continue.' }
  spent (message: string) { this.lock(); this.message = message }
  changeSection (section: string) { this.clearResults(); this.section = section }
  date (seconds: number): string { return new Date(seconds * 1000).toLocaleString() }
  failure (error: unknown) {
    if (error instanceof AdminError && error.expired) this.lock()
    this.message = error instanceof DOMException && error.name === 'NotAllowedError'
      ? 'Confirmation cancelled. No staff access was opened.'
      : error instanceof Error ? error.message : 'Staff tools could not be reached. Try again.'
  }

  async confirm () {
    const revision = ++this.revision
    this.busy = true; this.message = ''
    try {
      const result = await confirmStaff()
      if (revision !== this.revision || result.staff_expires_at * 1000 <= Date.now()) return
      this.expires = result.staff_expires_at; this.token = storedToken(); this.actor = result.actor
    } catch (error) { if (revision === this.revision) this.failure(error) } finally { if (revision === this.revision) this.busy = false }
  }

  async read (older: boolean) {
    if (!this.expires || Date.now() >= this.expires * 1000) { this.lock(); return }
    const revision = ++this.revision
    const token = storedToken()
    if (!older) { this.account = null; this.entries = []; this.next = null }
    this.busy = true; this.message = ''
    try {
      const result = this.section === 'accounts' ? await lookupAccount(this.query, this.reason) : await readAudit(this.source, older ? this.next : null, this.reason)
      if (revision !== this.revision || Date.now() >= this.expires * 1000 || storedToken() !== token) return
      if ('account' in result) { this.account = result.account; if (!result.account) this.message = 'No account matched that exact email or ID.' } else {
        this.entries = older ? [...this.entries, ...result.entries] : result.entries; this.next = result.next
        if (!this.entries.length) this.message = 'No audit entries yet.'
      }
    } catch (error) { if (revision === this.revision) this.failure(error) } finally { if (revision === this.revision) this.busy = false }
  }
}
</script>

<style lang="scss" scoped>
.admin-shell, .admin-shell * { box-sizing: border-box; }
.admin-shell { width: 100%; }
.admin-shell input, .admin-shell textarea, .admin-shell select { font: inherit; }
.admin-shell button { font-family: inherit; }
.admin-nav button { border: 0; background: transparent; cursor: pointer; }
.admin-topbar { display: flex; align-items: center; gap: 24px; min-height: 64px; padding: 0 24px; background: var(--m3d-surface); border-bottom: 1px solid var(--m3d-border); color: var(--m3d-text-muted); } .admin-topbar a { color: var(--m3d-text); text-decoration: none; }
.admin-page { display: grid; grid-template-columns: 208px minmax(0, 1fr); min-height: calc(100vh - 64px); color: var(--m3d-text); background: var(--m3d-bg); }
.admin-nav { display: flex; flex-direction: column; gap: 4px; padding: 24px 12px; border-right: 1px solid var(--m3d-border); }
.admin-label { padding: 0 12px 16px; font-size: 10px; letter-spacing: .1em; color: var(--m3d-text-muted); }
.admin-nav button, .admin-nav a { padding: 12px; border-radius: 12px; text-align: left; font-size: 15px; color: var(--m3d-text-muted); text-decoration: none; }
.admin-nav button[aria-current] { background: var(--m3d-surface); color: var(--m3d-text); font-weight: 600; }
.admin-pane { padding: 32px; max-width: 1160px; width: 100%; min-width: 0; }
.admin-heading { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
h1 { font-size: 28px; font-weight: 500; letter-spacing: -.6px; } h2 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
.muted { color: var(--m3d-text-muted); } p { margin-top: 8px; } .admin-notice { padding: 12px 16px; border: 1px solid var(--m3d-border); border-radius: 6px; color: var(--m3d-text-muted); }
.admin-card { padding: 24px; margin-bottom: 20px; border: 1px solid var(--m3d-border); border-radius: 6px; background: var(--m3d-surface); }
label { display: block; margin-bottom: 8px; font-weight: 500; } input, textarea, select { display: block; width: 100%; padding: 10px 12px; margin-bottom: 20px; border: 1px solid var(--m3d-border); border-radius: 4px; background: var(--m3d-inset); color: var(--m3d-text); } textarea { min-height: 80px; }
dl { display: grid; grid-template-columns: 160px minmax(0, 1fr); gap: 12px; } dt { color: var(--m3d-text-muted); } dd { margin: 0; overflow-wrap: anywhere; }
.admin-scroll { overflow-x: auto; } table { width: 100%; border-collapse: collapse; } th, td { text-align: left; padding: 12px; border-bottom: 1px solid var(--m3d-border); overflow-wrap: anywhere; } th { font-size: 11px; color: var(--m3d-text-muted); } :focus-visible { outline: 2px solid var(--m3d-accent); outline-offset: 2px; }
@media (max-width: 800px) { .admin-page { display: block; } .admin-nav { flex-direction: row; flex-wrap: wrap; border-right: 0; border-bottom: 1px solid var(--m3d-border); padding: 8px 12px; } .admin-label { display: none; } .admin-pane { padding: 24px 16px; } .admin-card { padding: 20px; } .admin-heading { flex-wrap: wrap; } dl { grid-template-columns: minmax(0, 1fr); gap: 4px; } dd { margin-bottom: 12px; } }
</style>
