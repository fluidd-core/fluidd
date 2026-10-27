<template>
  <div>
    <v-subheader id="access">
      Access
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
      data-test="access-settings"
    >
      <v-card-text
        v-if="loading && !state"
        class="d-flex align-center"
      >
        <v-progress-circular
          indeterminate
          size="16"
          width="2"
          class="mr-3"
        />
        Reading this printer's access settings…
      </v-card-text>

      <template v-else-if="state">
        <app-setting
          title="Owner"
          :sub-title="ownerHint"
        >
          <span data-test="access-owner">{{ ownerText }}</span>
        </app-setting>

        <v-divider />

        <app-setting
          title="Who can use it"
          :sub-title="entryHint"
        >
          <v-btn-toggle
            :key="`entry-${renderKey}`"
            :value="state.entry"
            mandatory
            dense
            data-test="access-entry"
          >
            <v-btn
              small
              value="open"
              :disabled="busy || cannot('protection')"
              @click="changeEntry('open')"
            >
              <v-icon
                left
                small
              >
                $lockOpen
              </v-icon>
              Open
            </v-btn>
            <v-btn
              small
              value="protected"
              :disabled="busy || cannot('protection')"
              @click="changeEntry('protected')"
            >
              <v-icon
                left
                small
              >
                $lock
              </v-icon>
              Protected
            </v-btn>
          </v-btn-toggle>
        </app-setting>

        <v-divider />

        <app-setting
          title="Your access"
          :sub-title="youHint"
        >
          <v-chip
            small
            label
            data-test="access-you"
          >
            {{ levelWord }} · {{ state.you.role === 'viewer' ? 'Viewer' : 'Operator' }}
          </v-chip>
        </app-setting>

        <v-divider />

        <app-setting
          title="Ways in"
          sub-title="Email invites, invite links and approvals are managed from the Muon3D app."
        >
          <span class="text-body-2">{{ waysText }}</span>
        </app-setting>

        <v-divider />

        <app-setting
          title="Who can do what"
          :sub-title="ownerOnly ? 'Only the owner can change this.' : 'The preset the level for each action comes from.'"
        >
          <v-select
            :key="`preset-${renderKey}`"
            :value="state.levelsPreset"
            :items="presetItems"
            :disabled="busy || ownerOnly"
            dense
            hide-details
            outlined
            class="access-select"
            data-test="access-preset"
            @change="apply(() => client.setLevels($event))"
          />
        </app-setting>

        <v-divider />

        <app-setting
          title="Where prints go"
          :sub-title="ownerOnly ? 'Only the owner can change this.' : 'One shared drive, a drive for each account, or both.'"
        >
          <v-select
            :key="`data-${renderKey}`"
            :value="state.dataMode"
            :items="dataItems"
            :disabled="busy || ownerOnly"
            dense
            hide-details
            outlined
            class="access-select"
            data-test="access-data"
            @change="apply(() => client.setData($event))"
          />
        </app-setting>

        <v-divider />

        <app-setting
          title="Private uploads"
          sub-title="Hides a file from everyone but the person who uploaded it. It does not hide it from someone holding the printer."
        >
          <v-switch
            :key="`private-${renderKey}`"
            :input-value="state.privateUploads"
            :disabled="busy || ownerOnly"
            hide-details
            class="mt-0"
            data-test="access-private"
            @change="apply(() => client.setPrivateUploads(!!$event))"
          />
        </app-setting>

        <v-divider />

        <v-card-text>
          <div class="text-subtitle-2 mb-2">
            What you can do on this printer
          </div>
          <div
            v-for="row in capabilityRows"
            :key="row.action"
            class="access-capability"
            :data-capability="row.action"
          >
            <v-icon
              small
              :color="row.value === 'allowed' ? 'success' : row.value === 'ask' ? 'warning' : undefined"
              class="mr-2"
            >
              {{ row.value === 'allowed' ? '$printerOnline' : row.value === 'ask' ? '$printerAsk' : '$printerOffline' }}
            </v-icon>
            {{ row.label }}
            <span
              v-if="row.value === 'ask'"
              class="secondary--text ml-1"
            >· ask at the printer</span>
          </div>
        </v-card-text>
      </template>

      <v-alert
        v-if="message"
        :type="messageType"
        dense
        text
        class="ma-3"
        data-test="access-message"
      >
        {{ message }}
      </v-alert>
    </v-card>

    <access-request-dialog
      v-if="askingOpen && asking"
      v-model="askingOpen"
      :client="client"
      :ask="asking"
      :printer-name="printerName"
      @answered="refresh"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import {
  capabilityRows as rowsFor,
  LEVEL_WORDS,
  currentPrinterAccess,
  type AccessAsk,
  type AccessEntry,
  type AccessState,
  type Capability
} from '@/services/muon-access/api'
import AccessRequestDialog from '@/components/muon-access/AccessRequestDialog.vue'

/**
 * Access to the printer on screen (ADR 0037; ACC-1 to ACC-34), in Settings.
 *
 * Every setting is read from the printer, and what this browser may change is
 * what the printer says it may (`capabilities`). A control the printer would
 * answer `applied: false` is shown disabled with the reason, never as if it
 * worked. Changing the entry from home can instead be asked at the printer's
 * panel, which shows a code to compare.
 */
@Component({ components: { AccessRequestDialog } })
export default class AccessSettings extends Mixins(StateMixin) {
  client = currentPrinterAccess()
  state: AccessState | null = null
  capabilities: Record<string, Capability> = {}
  loading = false
  busy = false
  message = ''
  messageType: 'info' | 'error' | 'success' = 'info'
  asking: AccessAsk | null = null
  /** The ask dialog is mounted only while open, so closing it withdraws the request. */
  askingOpen = false
  /**
   * Bumped on every read. The toggle, selects and switch keep the value a
   * click gave them; re-rendering puts back what the printer holds, so a
   * refused change never looks applied.
   */
  renderKey = 0

  get printerName (): string {
    return this.$store.getters['config/getDisplayName'] || 'The printer'
  }

  mounted () {
    this.refresh()
  }

  async refresh () {
    this.loading = true
    try {
      const [state, capabilities] = await Promise.all([this.client.get(), this.client.capabilities()])
      this.state = state
      this.capabilities = capabilities
    } catch (error) {
      this.messageType = 'error'
      this.message = (error as Error).message
    } finally {
      this.loading = false
      this.renderKey++
    }
  }

  cannot (action: string) {
    return (this.capabilities[action] ?? 'refused') === 'refused'
  }

  /** The other settings cannot be asked for at the panel (only entry and join can). */
  get ownerOnly () {
    return this.capabilities.protection !== 'allowed'
  }

  get ownerText () {
    const owner = this.state?.owner
    switch (owner?.kind) {
      case 'account': return owner.email ? `Linked to ${owner.email}` : 'Linked to an account'
      case 'organisation': return owner.name ? `Linked to ${owner.name}` : 'Linked to an organisation'
      case 'none': return 'No owner'
      default: return 'Not known yet'
    }
  }

  get ownerHint () {
    return this.state?.owner.kind === 'none'
      ? 'Link it to an account from its card in the printer list. Linking is confirmed at the printer.'
      : 'Set by the link. Unlinking at the printer removes it.'
  }

  get entryHint () {
    const reason = this.capabilities.protection === 'ask'
      ? ' Only the owner can change this; from here you can ask at the printer.'
      : this.ownerOnly ? ' Only the owner can change this.' : ''
    return this.state?.entry === 'protected'
      ? `Protected: only people let in can use it.${reason}`
      : `Open: anyone on this printer's network can use it.${reason}`
  }

  get levelWord () {
    return this.state ? LEVEL_WORDS[this.state.you.level] ?? this.state.you.level : ''
  }

  get youHint () {
    if (!this.state) return ''
    const trusted = this.state.you.trusted ? ' This is a trusted device.' : ''
    return `As ${this.state.you.principal}.${trusted}`
  }

  get waysText () {
    const ways = this.state?.ways
    if (!ways) return ''
    const on = [
      ways.password.on && 'printer password',
      ways.email.on && 'email invites',
      ways.link.on && 'invite links',
      ways.approve.on && 'approval'
    ].filter(Boolean)
    return on.length ? on.join(', ') : 'None turned on'
  }

  get presetItems () {
    return [
      { value: 'relaxed', text: 'Relaxed' },
      { value: 'standard', text: 'Standard' },
      { value: 'strict', text: 'Strict' }
    ]
  }

  get dataItems () {
    return [
      { value: 'shared', text: 'One shared drive' },
      { value: 'accounts', text: 'A drive for each account' },
      { value: 'both', text: 'Both' }
    ]
  }

  get capabilityRows () {
    return rowsFor(this.capabilities)
  }

  changeEntry (entry: AccessEntry) {
    if (!this.state || this.state.entry === entry) return
    if (this.capabilities.protection === 'ask') {
      this.asking = { kind: 'entry', entry }
      this.askingOpen = true
      return
    }
    return this.apply(() => this.client.setEntry(entry))
  }

  /** Applies a change, and says so plainly when the printer did not take it. */
  async apply (change: () => Promise<boolean>) {
    this.busy = true
    this.message = ''
    try {
      const applied = await change()
      if (!applied) {
        this.messageType = 'info'
        this.message = 'Not changed: only the owner can change this.'
      }
    } catch (error) {
      this.messageType = 'error'
      this.message = (error as Error).message
    } finally {
      this.busy = false
      await this.refresh()
    }
  }
}
</script>

<style lang="scss" scoped>
.access-select {
  max-width: 220px;
}

.access-capability {
  display: flex;
  align-items: center;
  font-size: 13px;
  padding: 2px 0;
}
</style>
