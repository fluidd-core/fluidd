<template>
  <app-dialog
    v-model="open"
    max-width="320"
    :save-button-disabled="!verified"
    :valid.sync="valid"
    :title="$t('app.general.title.add_printer')"
    :help-tooltip="$t('app.endpoint.tooltip.endpoint_examples')"
    @save="addInstance"
  >
    <v-card-text>
      <span v-safe-html="helpTxt" />

      <v-text-field
        v-model="url"
        type="url"
        spellcheck="false"
        autofocus
        :label="$t('app.general.label.api_url')"
        persistent-hint
        :hint="$t('app.endpoint.hint.add_printer')"
        :loading="verifying"
        :rules="[
          $rules.required,
          customRules.url
        ]"
      >
        <template #append-outer>
          <v-icon
            v-if="verifying"
            class="spin"
            color="primary"
          >
            $loading
          </v-icon>
          <v-icon
            v-if="!verified && !verifying"
            color="error"
          >
            $cloudAlert
          </v-icon>
          <v-icon
            v-if="verified && !verifying"
            color="success"
          >
            $cloudCheck
          </v-icon>
        </template>
      </v-text-field>

      <v-alert
        v-if="error"
        v-safe-html="error"
        dense
        text
        type="error"
        class="mt-3 mb-2"
      />

      <p
        v-if="note"
        v-safe-html="note"
        class="mb-0"
      />
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, VModel, Watch } from 'vue-property-decorator'
import { Globals } from '@/globals'
import StateMixin from '@/mixins/state'
import { Debounce } from 'vue-debounce-decorator'
import webSocketWrapper from '@/util/web-socket-wrapper'
import diagnoseHttpEndpoint from '@/util/http-endpoint-diagnostics'

@Component({})
export default class AddInstanceDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
  open?: boolean

  valid = true
  verifying = false
  verified = false
  error: string | null = null
  note: string | null = null

  get customRules () {
    return {
      url: (v: string) => (this.validUrl(v)) || this.$t('app.general.simple_form.error.invalid_url')
    }
  }

  /**
   * Validates a URL
   */
  validUrl (url: string) {
    try {
      this.$filters.getApiUrls(url)
    } catch {
      return false
    }
    return true
  }

  timer = 0
  url = ''

  abortController?: AbortController = undefined

  // Watch for valid url changes.
  @Watch('url')
  onUrlChange (value: string, oldVal: string) {
    if (value === oldVal) return
    if (this.valid) this.handleUrlChange(value)
  }

  @Debounce(750)
  async handleUrlChange (value: string) {
    if (this.valid) {
      this.verified = false
      this.error = null
      this.note = null
      this.verifying = true

      const { apiUrl, socketUrl } = this.$filters.getApiUrls(value)

      // Cancel any in-flight probe before starting a new one.
      this.abortController?.abort()

      this.abortController = new AbortController()
      const { signal } = this.abortController

      const result = await webSocketWrapper(socketUrl, {
        timeout: 3000,
        signal
      })

      if (result.ok) {
        this.verified = true
      } else if (result.reason === 'error') {
        await this.diagnoseError(apiUrl, result.message, signal)
      } else if (result.reason === 'timeout') {
        this.note = this.$t('app.endpoint.error.cant_connect').toString()
      }

      // A newer probe may have superseded this one while awaiting; if so, leave
      // the spinner for it to own.
      if (!signal.aborted) {
        this.verifying = false
      }
    }
  }

  async diagnoseError (apiUrl: string, wsMessage: string, signal: AbortSignal) {
    const diagnostic = await diagnoseHttpEndpoint(apiUrl, {
      timeout: 3000,
      signal
    })

    switch (diagnostic.kind) {
      case 'mixed-content':
        this.error = this.$t('app.endpoint.error.mixed_content').toString()
        break

      case 'cors':
        this.error = this.$t('app.endpoint.error.cors_error').toString()
        this.note = this.$t('app.endpoint.error.cors_note', {
          url: Globals.DOCS_MULTIPLE_INSTANCES
        }).toString()
        break

      case 'reachable':
        this.error = this.$t('app.endpoint.error.websocket_failed').toString()
        break

      case 'unreachable':
        this.error = wsMessage
        this.note = this.$t('app.endpoint.error.cant_connect').toString()
        break

      case 'cancelled':
        // Superseded by a newer probe; leave the UI state untouched.
        break
    }
  }

  get helpTxt () {
    return this.$t('app.endpoint.msg.trouble', {
      url: Globals.DOCS_MULTIPLE_INSTANCES
    })
  }

  addInstance () {
    const apiConfig = this.$filters.getApiUrls(this.url)
    this.open = false
    this.$emit('resolve', apiConfig)
  }

  beforeDestroy () {
    this.abortController?.abort()
  }
}
</script>
