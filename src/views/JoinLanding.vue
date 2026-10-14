<!--
  An invite link (AB-CON-1, muon-link-cloud#14): the console sends /j/<code>
  here as /#/join?code=<code>.

  Signed out, the page asks the person to sign in, which on the console's
  own page goes through its /authorize and comes back here. Signed in, Join
  posts the code, and the page says the printer was joined, or that it is
  waiting for the owner to approve, which it then follows until the owner
  answers or the request expires.

  Join is a press, not something the page does on opening: following a link
  someone sent should not by itself put a printer into the account.
-->
<template>
  <div class="muon-join-landing">
    <v-card
      max-width="460"
      class="mx-auto mt-8 pa-2"
    >
      <v-card-title>Join a printer</v-card-title>

      <v-card-text
        v-if="!code"
        data-tid="join-bad-code"
      >
        This invite link is incomplete. Open it again from the message it came in, or ask the printer's owner for a new one.
      </v-card-text>

      <template v-else-if="!signedIn">
        <v-card-text data-tid="join-sign-in">
          Sign in to your Muon3D account to join the printer this link was made for.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <app-btn
            color="primary"
            @click="accountDialog = true"
          >
            Sign in
          </app-btn>
        </v-card-actions>
      </template>

      <template v-else-if="!state || state.kind === 'error'">
        <v-card-text>
          Invite code <strong class="muon-join-landing__code">{{ groupedCode }}</strong>
        </v-card-text>
        <v-card-text
          v-if="state"
          class="pt-0"
        >
          <v-alert
            type="error"
            dense
            text
            data-tid="join-error"
          >
            {{ state.message }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <app-btn
            color="primary"
            :loading="busy"
            data-tid="join-button"
            @click="join"
          >
            Join
          </app-btn>
        </v-card-actions>
      </template>

      <template v-else-if="state.kind === 'joined'">
        <v-card-text data-tid="join-joined">
          You've joined {{ joinedName }}. It's in your printer list now.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <app-btn
            color="primary"
            @click="$router.push('/')"
          >
            Open your printers
          </app-btn>
        </v-card-actions>
      </template>

      <v-card-text
        v-else-if="state.kind === 'pending'"
        data-tid="join-pending"
      >
        Waiting for the owner of {{ state.printerName }} to approve. You can leave this page; the printer appears in your list once they do.
      </v-card-text>

      <v-card-text
        v-else-if="state.kind === 'refused'"
        data-tid="join-refused"
      >
        The owner of {{ state.printerName }} did not approve this request.
      </v-card-text>

      <v-card-text
        v-else-if="state.kind === 'expired'"
        data-tid="join-expired"
      >
        The owner of {{ state.printerName }} did not answer in time. Ask them for a new invite link.
      </v-card-text>
    </v-card>
    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { cloudApi } from '@/services/muon-cloud/api'
import { cloudState, printerName, refreshPrinters } from '@/services/muon-cloud/state'
import { fromApproval, fromJoinAnswer, fromJoinError, normalizeJoinCode, type JoinState } from '@/services/muon-cloud/join'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'

/** How often to ask whether the owner has answered. */
export const APPROVAL_POLL_MS = 10_000

@Component({ components: { CloudAccountDialog } })
export default class JoinLanding extends Vue {
  accountDialog = false
  busy = false
  state: JoinState | null = null
  timer: number | null = null
  left = false

  get code (): string | null {
    return normalizeJoinCode(this.$route.query.code)
  }

  get groupedCode (): string {
    return this.code ? `${this.code.slice(0, 5)}-${this.code.slice(5)}` : ''
  }

  get signedIn (): boolean {
    return cloudState.account !== null
  }

  get joinedName (): string {
    return this.state?.kind === 'joined' ? printerName(this.state.printerId) : ''
  }

  async join () {
    if (!this.code || this.busy) return
    this.busy = true
    try {
      this.state = fromJoinAnswer(await cloudApi.join(this.code))
      await this.settle()
    } catch (error) {
      this.state = fromJoinError(error)
    } finally {
      this.busy = false
    }
  }

  async poll () {
    if (this.state?.kind !== 'pending') return
    try {
      this.state = fromApproval((await cloudApi.approval(this.state.approvalId)).approval)
      await this.settle()
    } catch {
      // Keep waiting: a blip is not an answer.
      this.schedule()
    }
  }

  async settle () {
    if (this.state?.kind === 'joined') await refreshPrinters()
    else if (this.state?.kind === 'pending') this.schedule()
  }

  schedule () {
    this.stop()
    if (!this.left) this.timer = window.setTimeout(() => { this.poll() }, APPROVAL_POLL_MS)
  }

  stop () {
    if (this.timer !== null) window.clearTimeout(this.timer)
    this.timer = null
  }

  beforeDestroy () {
    this.left = true
    this.stop()
  }
}
</script>

<style lang="scss" scoped>
.muon-join-landing__code {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  letter-spacing: 0.08em;
}
</style>
