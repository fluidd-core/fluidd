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

    <dialog-base
      title="Add printer"
      :maxWidth="320"
      v-model="instanceDialog.open">

      <template v-slot:actions>
        <v-btn color="secondary" @click="instanceDialog.open = false">Close</v-btn>
        <v-btn color="primary" :disabled="!instanceDialog.valid" type="submit" form="form">Save</v-btn>
      </template>

      <template v-slot:help-tooltip>
        Enter your API URL.<br />
        Some examples might be;<br />
        <blockquote>
          http://fluidd.local,
          http://192.168.1.150
        </blockquote>
      </template>

      Having trouble? <a :href="docsUrl + 'multiple-printers.md'" target="_blank">See here</a> for more information.<br />

      <v-form
        class="mt-3"
        ref="form"
        id="form"
        v-model="instanceDialog.valid"
        lazy-validation
        @submit="addInstance()"
      >
        <v-text-field
          autofocus
          label="API URL"
          :rules="[rules.required, rules.url]"
          persistent-hint
          hint="E.g., http://fluiddpi.local"
          v-model="instanceDialog.url">
        </v-text-field>
      </v-form>

    </dialog-base>

  </v-list>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { ApiConfig, Config, InstanceConfig } from '@/store/config/types'
import VersionStatus from '@/components/VersionStatus.vue'
import UtilsMixin from '@/mixins/utils'
import DialogBase from '@/components/dialogs/dialogBase.vue'
import { appInit } from '@/init'
import { Globals, Waits } from '@/globals'

@Component({
  components: {
    VersionStatus,
    DialogBase
  }
})
export default class SystemPrintersWidget extends Mixins(UtilsMixin) {
  docsUrl = Globals.DOCUMENTATION_ROOT
  waits = Waits

  urlRegex = new RegExp('^(https?:\\/\\/)' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port
            '(\\?[;&amp;a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i')

  rules = {
    required: (v: string) => !!v || 'Required',
    url: (v: string) => (this.urlRegex.test(v)) || 'Valid URL'
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
    if (this.instanceDialog.valid) {
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
