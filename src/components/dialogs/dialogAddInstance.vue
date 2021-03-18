<template>
  <v-dialog
    @input="$emit('input', $event)"
    :value="value"
    :maxWidth="320"
    persistent
  >
    <v-form
      class="mt-3"
      ref="addInstanceForm"
      v-model="valid"
      @submit.prevent="addInstance()"
    >
      <v-card color="secondary darken-1">

        <v-card-title>
          <span class="headline">{{$t('printer.add.title')}}</span>
          <v-spacer></v-spacer>
          <inline-help bottom>
            {{$t('printer.add.tooltip[0]')}}<br />
            {{$t('printer.add.tooltip[1]')}}<br />
            <blockquote>
              http://fluidd.local,
              http://192.168.1.150
            </blockquote>
          </inline-help>
        </v-card-title>

        <v-card-text>
          {{$t('printer.add.docs[0]')}} <a :href="$globals.DOCS_MULTIPLE_INSTANCES" target="_blank">{{$t('printer.add.docs[1]')}}</a> {{$t('printer.add.docs[2]')}}<br />

          <v-text-field
            v-model="url"
            autofocus
            :label="$t('printer.add.apiUrl')"
            persistent-hint
            hint="http://fluiddpi.local"
            :loading="verifying"
            :rules="[rules.required, rules.url]"
          >
            <template v-slot:append-outer>
              <v-icon v-if="verifying" class="spin" color="primary">$loading</v-icon>
              <v-icon v-if="!verified && !verifying" color="error">$close</v-icon>
              <v-icon v-if="verified && !verifying" color="success">$check</v-icon>
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
          <btn color="warning" text @click="$emit('input', false)" type="button">{{$t('app.btn.cancel')}}</btn>
          <btn color="primary" type="submit" :disabled="!verified">{{$t('app.btn.save')}}</btn>
        </v-card-actions>

      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { Debounce } from 'vue-debounce-decorator'
import StateMixin from '@/mixins/state'
import { Globals, Waits } from '@/globals'
import { VForm } from '@/types/vuetify'
import { AxiosError } from 'axios'
import consola from 'consola'

@Component({})
export default class SystemPrintersWidget extends Mixins(StateMixin) {
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
    required: (v: string) => !!v || this.$t('app.form.required'),
    url: (v: string) => (this.urlRegex.test(v)) || this.$t('app.form.invalidUrl')
  }

  timer = 0

  get url () {
    return this.actualUrl
  }

  set url (url: string) {
    this.verified = false
    this.actualUrl = url
  }

  actualUrl = ''
  @Watch('actualUrl')
  @Debounce(500)
  async onUrlChange (url: string) {
    if (this.valid) {
      this.error = null
      this.note = null
      this.verifying = true

      // this.$http.options(url + '/server/info?t=optionscall' + new Date().getTime(), {
      //   headers: {
      //     'Access-Control-Request-Method': 'GET'
      //   }
      // })
      //   .then((r) => {
      //     consola.log(r)
      //   })

      // Start by making a standard request. Maybe it's good?
      const request = await this.$http.get(url + '/server/info?t=' + new Date().getTime())
        .then(() => {
          this.verified = true
          this.verifying = false
          return 'ok'
        })
        .catch((e: AxiosError) => {
          // If it failed with a network issue..
          if (e.request) return e.message

          // Otherwise pass along the error..
          this.error = e
          return 'ok'
        })

      // The initial request failed with a network issue..
      if (request !== 'ok') {
        await fetch(url + '/server/info', { mode: 'no-cors', cache: 'no-cache' })
          .then(() => {
            // likely a cors issue
            this.error = 'blocked by CORS policy'
            this.note = `This may mean you need to modify your moonraker
                         configuration. Please see the documentation on multi
                         printer setups <a href="${Globals.DOCS_MULTIPLE_INSTANCES}" target="_blank">here</a>.`
          })
          .catch(e => {
            // external host not reachable (fetch returns 'failed to fetch')
            consola.log('Network Error', e, request)
            this.error = request
            this.note = `Something went wrong, and fluidd can't reach the
                         destination. Are you sure this is the correct address?`
          })
          .finally(() => { this.verifying = false })
      }
    }
  }

  get form (): VForm {
    return this.$refs.addInstanceForm as VForm
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
