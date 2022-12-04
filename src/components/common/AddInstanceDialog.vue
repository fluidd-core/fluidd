<template>
  <v-dialog
    v-model="open"
    :max-width="320"
    persistent
  >
    <v-form
      ref="form"
      v-model="valid"
      @submit.prevent="addInstance()"
    >
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ $t('app.general.title.add_printer') }}</span>
          <v-spacer />
          <app-inline-help bottom>
            <span v-html="$t('app.endpoint.tooltip.endpoint_examples')" />
          </app-inline-help>
        </v-card-title>

        <v-card-text class="mt-4">
          <span v-html="helpTxt" />

          <v-text-field
            v-model="url"
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

        <v-card-actions>
          <v-spacer />
          <app-btn
            color="warning"
            text
            type="button"
            @click="open=false"
          >
            {{ $t('app.general.btn.cancel') }}
          </app-btn>
          <app-btn
            color="primary"
            type="submit"
            :disabled="!verified"
          >
            {{ $t('app.general.btn.save') }}
          </app-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Ref, VModel, Watch } from 'vue-property-decorator'
import { Globals } from '@/globals'
import Axios, { AxiosError, CancelTokenSource } from 'axios'
import StateMixin from '@/mixins/state'
import { Debounce } from 'vue-debounce-decorator'
import { VForm } from '@/types'
import consola from 'consola'
import { httpClientActions } from '@/api/httpClientActions'

@Component({})
export default class AddInstanceDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean, required: true })
    open!: boolean

  @Ref('form')
  readonly form!: VForm

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
      this.buildUrl(url)
    } catch {
      return false
    }
    return true
  }

  /**
   * Builds the URL using the browsers URL class
   * Assume http:// if no protocol is given.
  */
  buildUrl (url: string) {
    if (
      !url.startsWith('http://') && !url.startsWith('https://')
    ) url = `http://${url}`
    return new URL(url)
  }

  timer = 0
  url = ''

  // Axios cancels.
  cancelSource: CancelTokenSource | undefined = undefined

  // Fetch cancels.
  controller: AbortController | undefined = undefined

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

      const url = this.buildUrl(value)

      // Handle cancelling axios requests.
      if (this.cancelSource !== undefined) {
        this.cancelSource.cancel('Cancelled due to new request.')
      }

      this.cancelSource = Axios.CancelToken.source()

      // Start by making a standard request. Maybe it's good?
      const request = await httpClientActions.get(`${url}server/info?t=${Date.now()}`, {
        withAuth: false,
        cancelToken: this.cancelSource.token
      })
        .then(() => {
          this.verified = true
          this.verifying = false
          return 'ok'
        })
        .catch((e: AxiosError) => {
          // If it failed because we cancelled, set ok and move on.
          if (Axios.isCancel(e)) {
            return 'ok'
          }

          // If it failed because of a 401, set ok and move on.
          if (e.response?.status === 401) {
            this.verified = true
            this.verifying = false
            return 'ok'
          }

          // If it failed with a network issue..
          if (e.request) return e.message

          // Otherwise pass along the error..
          this.error = e
          return 'ok'
        })

      // The initial request failed with a network issue..
      if (request !== 'ok') {
        // Handle cancelling fetch requests.
        if (this.controller !== undefined) {
          this.controller.abort()
        }
        this.controller = new AbortController()
        const { signal } = this.controller

        await fetch(url + 'server/info', { signal, mode: 'no-cors', cache: 'no-cache' })
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

  get helpTxt () {
    return this.$t('app.endpoint.msg.trouble', {
      url: Globals.DOCS_MULTIPLE_INSTANCES
    })
  }

  addInstance () {
    if (this.valid) {
      const url = this.buildUrl(this.url)
      const apiConfig = this.$filters.getApiUrls(url.toString())
      this.$emit('input', false)
      this.$emit('resolve', apiConfig)
    }
  }
}
</script>
