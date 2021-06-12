<template>
  <v-dialog
    @input="$emit('input', $event)"
    :value="value"
    :maxWidth="320"
    persistent
  >
    <v-form
      ref="addInstanceForm"
      v-model="valid"
      @submit.prevent="addInstance()"
    >
      <v-card>

        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ $t('app.general.title.add_printer') }}</span>
          <v-spacer></v-spacer>
          <app-inline-help bottom>
            <span v-html="$t('app.endpoint.tooltip.endpoint_examples')"></span>
          </app-inline-help>
        </v-card-title>

        <v-card-text class="mt-4">
          <span v-html="helpTxt"></span>

          <v-text-field
            v-model="url"
            autofocus
            :label="$t('app.general.label.api_url')"
            persistent-hint
            :hint="$t('app.endpoint.hint.add_printer')"
            :loading="verifying"
            :rules="[rules.required, rules.url]"
          >
            <template v-slot:append-outer>
              <v-icon v-if="verifying" class="spin" color="primary">$loading</v-icon>
              <v-icon v-if="!verified && !verifying" color="error">$cloudAlert</v-icon>
              <v-icon v-if="verified && !verifying" color="success">$cloudCheck</v-icon>
            </template>
          </v-text-field>

          <v-alert
            v-if="error"
            dense
            text
            type="error"
            class="mt-3 mb-2"
            v-html="error"
          >
          </v-alert>

          <p
            v-if="note"
            v-html="note"
            class="mb-0"
          >
          </p>

        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <app-btn color="warning" text @click="$emit('input', false)" type="button">{{ $t('app.general.btn.cancel') }}</app-btn>
          <app-btn color="primary" type="submit" :disabled="!verified">{{ $t('app.general.btn.save') }}</app-btn>
        </v-card-actions>

      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import httpClient from '@/api/httpClient'
import { Globals, Waits } from '@/globals'
import Axios, { AxiosError, CancelTokenSource } from 'axios'
import StateMixin from '@/mixins/state'
import { Debounce } from 'vue-debounce-decorator'
import { VForm } from '@/types/vuetify'
import consola from 'consola'

@Component({})
export default class AddInstanceDialog extends Mixins(StateMixin) {
  @Prop({ type: Boolean, required: true })
  public value!: boolean

  waits = Waits

  valid = true
  verifying = false
  verified = false
  error: any = null
  note: any = null

  urlRegex = new RegExp('^(https?:\\/\\/)' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z\\d-]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port
            '(\\?[;&amp;a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i')

  rules = {
    required: (v: string) => !!v || this.$t('app.general.simple_form.error.required'),
    url: (v: string) => (this.urlRegex.test(v)) || this.$t('app.general.simple_form.error.invalid_url')
  }

  timer = 0
  actualUrl = ''

  get url () {
    return this.actualUrl
  }

  set url (url: string) {
    this.verified = false
    this.actualUrl = url
  }

  // Axios cancels.
  cancelSource: CancelTokenSource | undefined = undefined

  // Fetch cancels.
  controller: AbortController | undefined = undefined

  @Watch('actualUrl')
  @Debounce(500)
  async onUrlChange (url: string) {
    if (this.valid) {
      this.error = null
      this.note = null
      this.verifying = true

      // Handle cancelling axios requests.
      if (this.cancelSource !== undefined) {
        this.cancelSource.cancel('Cancelled due to new request.')
      }

      this.cancelSource = Axios.CancelToken.source()

      // filter trailing slashes
      url = (url.endsWith('/'))
        ? url.slice(0, -1)
        : url

      // Start by making a standard request. Maybe it's good?
      const request = await httpClient.get(
        url + '/server/info?t=' + new Date().getTime(), {
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

        await fetch(url + '/server/info', { signal, mode: 'no-cors', cache: 'no-cache' })
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

  get form (): VForm {
    return this.$refs.addInstanceForm as VForm
  }

  get helpTxt () {
    return this.$t('app.endpoint.msg.trouble', {
      url: Globals.DOCS_MULTIPLE_INSTANCES
    })
  }

  addInstance () {
    const valid = this.form.validate()
    if (valid) {
      const apiConfig = this.$filters.getApiUrls(this.url)
      this.$emit('input', false)
      this.$emit('resolve', apiConfig)
    }
  }
}
</script>
