<template>
  <app-dialog
    v-model="open"
    max-width="320"
    :save-button-disabled="!verified"
    :valid.sync="valid"
    persistent
    @save="addInstance"
  >
    <template #title>
      <span class="focus--text">{{ $t('app.general.title.add_printer') }}</span>
      <v-spacer />
      <app-inline-help bottom>
        <span v-html="$t('app.endpoint.tooltip.endpoint_examples')" />
      </app-inline-help>
    </template>

    <v-card-text>
      <span v-html="helpTxt" />

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
        dense
        text
        type="error"
        class="mt-3 mb-2"
        v-html="error"
      />

      <p
        v-if="note"
        class="mb-0"
        v-html="note"
      />
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, VModel, Watch } from 'vue-property-decorator'
import { Globals } from '@/globals'
import axios from 'axios'
import StateMixin from '@/mixins/state'
import { Debounce } from 'vue-debounce-decorator'
import { consola } from 'consola'
import { httpClientActions } from '@/api/httpClientActions'
import webSocketWrapper from '@/util/web-socket-wrapper'

@Component({})
export default class AddInstanceDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  valid = true
  verifying = false
  verified = false
  error: any = null
  note: any = null

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

      // Handle cancelling axios requests.
      this.abortController?.abort()

      this.abortController = new AbortController()

      const { signal } = this.abortController

      // Start by making a standard request. Maybe it's good?
      const request = await httpClientActions.get(`${apiUrl}/server/info?t=${Date.now()}`, {
        withAuth: false,
        signal
      })
        .then(() => {
          this.verified = true
          this.verifying = false
          return 'ok'
        })
        .catch(e => {
          // If it failed because we cancelled, set ok and move on.
          if (axios.isCancel(e)) {
            return 'ok'
          } else if (axios.isAxiosError(e)) {
            // If it failed because of a 401, set ok and move on.
            if (e.response?.status === 401) {
              this.verified = true
              this.verifying = false
              return 'ok'
            }

            // If it failed with a network issue..
            if (e.request) return e.message
          }

          // Otherwise pass along the error..
          this.error = e
          return 'ok'
        })

      // The initial request failed with a network issue..
      if (request !== 'ok') {
        if (this.hosted) {
          await webSocketWrapper(socketUrl, signal)
            .then(() => {
              // likely a cors issue, but socket worked
              this.verified = true
            })
            .catch(e => {
              // external host not reachable (fetch returns 'failed to fetch')
              consola.debug('Network Error', e, request)
              this.error = request
              this.note = this.$t('app.endpoint.error.cant_connect')
            })
            .finally(() => { this.verifying = false })
        } else {
          await fetch(`${apiUrl}/server/info`, { signal, mode: 'no-cors', cache: 'no-cache' })
            .then(() => {
              // likely a cors issue
              this.error = this.$t('app.endpoint.error.cors_error')
              this.note = this.$t('app.endpoint.error.cors_note', {
                url: Globals.DOCS_MULTIPLE_INSTANCES
              })
            })
            .catch(e => {
              // external host not reachable (fetch returns 'failed to fetch')
              consola.debug('Network Error', e, request)
              this.error = request
              this.note = this.$t('app.endpoint.error.cant_connect')
            })
            .finally(() => { this.verifying = false })
        }
      }
    }
  }

  get helpTxt () {
    return this.$t('app.endpoint.msg.trouble', {
      url: Globals.DOCS_MULTIPLE_INSTANCES
    })
  }

  get hosted () {
    return this.$store.state.config.hostConfig.hosted
  }

  addInstance () {
    const apiConfig = this.$filters.getApiUrls(this.url)
    this.open = false
    this.$emit('resolve', apiConfig)
  }
}
</script>
