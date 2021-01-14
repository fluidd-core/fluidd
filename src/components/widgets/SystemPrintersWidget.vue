<template>
  <v-list dense>
    <v-subheader>Printers</v-subheader>

    <template v-for="(instance, index) in instances">
      <v-list-item
        :key="index"
        active-class="instance-item-active"
        class="instance-item"
        :class="{ 'instance-item-active': instance.active }"
        @click.stop="activateInstance(instance)">
        <v-list-item-content>
          <v-list-item-title>
            {{ instance.name }}<br />
            <small>{{ instance.apiUrl }}</small>
          </v-list-item-title>
        </v-list-item-content>
        <v-list-item-action v-if="!instance.active">
          <v-btn icon small @click.stop="removeInstance(instance)">
            <v-icon small>$delete</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </template>

    <v-list-item @click="addInstanceDialog()">
      <v-list-item-icon>
        <v-icon>$plus</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>Add another printer</v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-dialog
      :maxWidth="320"
      v-model="instanceDialog.open"
    >
      <v-form
        class="mt-3"
        ref="addInstanceForm"
        v-model="instanceDialog.valid"
        @submit="addInstance()"
      >
        <v-card color="secondary darken-1">

          <v-card-title>
            <span class="headline">Add printer</span>
            <v-spacer></v-spacer>
            <inline-help bottom small>
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
              autofocus
              label="API URL"
              :rules="[rules.required, rules.url]"
              persistent-hint
              hint="E.g., http://fluiddpi.local"
              v-model="instanceDialog.url">
            </v-text-field>

          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="warning" text @click="instanceDialog.open = false" type="button">Cancel</v-btn>
            <v-btn color="primary" type="submit">Save</v-btn>
          </v-card-actions>

        </v-card>
      </v-form>
    </v-dialog>

  </v-list>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { ApiConfig, Config, InstanceConfig } from '@/store/config/types'
import VersionStatus from '@/components/VersionStatus.vue'
import UtilsMixin from '@/mixins/utils'
import { appInit } from '@/init'
import { Globals, Waits } from '@/globals'
import { VForm } from '@/types/vuetify'

@Component({
  components: {
    VersionStatus
  }
})
export default class SystemPrintersWidget extends Mixins(UtilsMixin) {
  docsUrl = Globals.DOCS_MULTIPLE_INSTANCES
  waits = Waits

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

  instanceDialog = {
    valid: false,
    open: false,
    url: ''
  }

  get instanceName () {
    return this.$store.state.config.fileConfig.general.instanceName
  }

  get instances () {
    return this.$store.getters['config/getInstances']
  }

  get form (): VForm {
    return this.$refs.addInstanceForm as VForm
  }

  mounted () {
    // If we have no api's configured at all, open the dialog.
    if (this.$store.state.config.apiUrl === '') {
      this.instanceDialog.open = true
    }
  }

  addInstanceDialog () {
    this.instanceDialog = {
      valid: false,
      open: true,
      url: ''
    }
  }

  removeInstance (instance: InstanceConfig) {
    this.$store.dispatch('config/removeInstance', instance)
  }

  addInstance () {
    const valid = this.form.validate()
    if (valid) {
      const urls = this.$filters.getApiUrls(this.instanceDialog.url)
      this.instanceDialog.open = false
      this.activateInstance(urls)
      this.$emit('click')
    }
  }

  activateInstance (instance: ApiConfig) {
    // Close the drawer.
    this.$emit('click')

    // Close the existing socket.
    this.$socket.close()

    // Re-init the app.
    appInit(instance)
      .then((config: Config) => {
        // Reconnect the socket with the new instance url.
        console.debug('Activating new instance with config', config)
        this.$socket.connect(instance.socketUrl)
      })
  }
}
</script>

<style lang="scss" scoped>
  ::v-deep .instance-item .v-list-item__action  {
    margin: 6px 0;
  }
  ::v-deep .instance-item-active::before {
    opacity: 0.08;
  }
</style>
