<template>
  <v-dialog
    :maxWidth="320"
    @input="$emit('input', $event)"
    :value="value"
  >
    <v-form
      class="mt-3"
      ref="addInstanceForm"
      v-model="valid"
      @submit="addInstance()"
    >
      <v-card color="secondary darken-1">

        <v-card-title>
          <span class="headline">Add printer</span>
          <v-spacer></v-spacer>
          <inline-help bottom>
            Enter your API URL.<br />
            Some examples might be;<br />
            <blockquote>
              http://fluidd.local,
              http://192.168.1.150
            </blockquote>
          </inline-help>
        </v-card-title>

        <v-card-text>
          Having trouble? <a :href="docsUrl" target="_blank">See here</a> for more information.<br />

          <v-text-field
            v-model="url"
            autofocus
            label="API URL"
            persistent-hint
            hint="E.g., http://fluiddpi.local"
            :loading="verifying"
            :rules="[rules.required, rules.url]"
          >
            <template v-slot:append-outer>
              <v-icon v-if="verifying" class="spin" color="info">$loading</v-icon>
              <v-icon v-if="!verified && !verifying" color="error">$close</v-icon>
              <v-icon v-if="verified && !verifying" color="success">$check</v-icon>
            </template>
          </v-text-field>

        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning" text @click="$emit('input', false)" type="button">Cancel</v-btn>
          <v-btn color="primary" type="submit" :disabled="!verified">Save</v-btn>
        </v-card-actions>

      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { Debounce } from 'vue-debounce-decorator'
import UtilsMixin from '@/mixins/utils'
import { Globals, Waits } from '@/globals'
import { VForm } from '@/types/vuetify'

@Component({})
export default class SystemPrintersWidget extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, required: true })
  public value!: boolean

  docsUrl = Globals.DOCS_MULTIPLE_INSTANCES
  waits = Waits

  valid = true
  verifying = false
  verified = false

  urlRegex = new RegExp('^(https?:\\/\\/)' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z\\d]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port
            '(\\?[;&amp;a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i')

  rules = {
    required: (v: string) => !!v || 'Required',
    url: (v: string) => (this.urlRegex.test(v)) || 'Invalid URL'
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
  onUrlChange (url: string) {
    if (this.valid) {
      this.verifying = true
      this.$http.get(url + '/printer/info')
        .then(() => {
          this.verified = true
        })
        .catch(() => {
          this.verified = false
        })
        .finally(() => {
          this.verifying = false
        })
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
