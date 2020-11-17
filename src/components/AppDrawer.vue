<template>
  <v-navigation-drawer
    :value="value"
    @input="emitChange"
    app right clipped temporary
    dense>

    <v-list dense>
      <v-subheader>Printer: {{ instanceName }}</v-subheader>

      <v-list-item to="/" class="d-flex d-sm-none">
        <v-list-item-icon>
          <v-icon>$home</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Dashboard</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item to="/jobs" class="d-flex d-sm-none" v-if="jobsInMenu">
        <v-list-item-icon>
          <v-icon>$files</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Jobs</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item to="/configuration" class="d-flex d-sm-none">
        <v-list-item-icon>
          <v-icon>$tune</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Printer Configuration</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item to="/settings">
        <v-list-item-icon>
          <v-icon>$cog</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Settings</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-divider></v-divider>

      <system-commands-widget></system-commands-widget>
      <v-divider></v-divider>

      <v-subheader>Available Printers</v-subheader>

      <template v-for="(instance, index) in instances">
        <v-list-item :key="index" :disabled="instance.active" class="instance-item" @click.stop="activateInstance(instance)">
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

    </v-list>

    <dialog-base
      title="Add printer"
      :maxWidth="320"
      v-model="instanceDialog.open">

      <template v-slot:actions>
        <v-btn color="secondary" @click="instanceDialog.open = false">Close</v-btn>
        <v-btn color="primary" :disabled="!instanceDialog.valid" type="submit" form="form">Save</v-btn>
      </template>

      <template v-slot:help-tooltip>
        Enter your moonraker API endpoint.<br />
        Some examples might include;<br />
        <blockquote>
          fluidd.local,
          my_ip_address
        </blockquote>
      </template>

      Having trouble? <a :href="docsUrl + '/Multiple-Printers'" target="_blank">See here</a> for more information.<br />

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
          label="Moonraker api url"
          :rules="[rules.required, rules.url]"
          persistent-hint
          hint="E.g., fluiddpi.local:7125"
          v-model="instanceDialog.url">
        </v-text-field>
      </v-form>

    </dialog-base>

  </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { ApiConfig, Config, InstanceConfig } from '@/store/config/types'
import SystemCommandsWidget from '@/components/widgets/SystemCommandsWidget.vue'
import DialogBase from '@/components/dialogs/dialogBase.vue'
import UtilsMixin from '@/mixins/utils'
import { appInit } from '@/init'
import { Globals } from '@/globals'

@Component({
  components: {
    SystemCommandsWidget,
    DialogBase
  }
})
export default class AppDrawer extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, default: false })
  value!: boolean

  docsUrl = Globals.DOCUMENTATION_ROOT

  get instances () {
    return this.$store.state.config.instances
  }

  get instanceName () {
    return this.$store.state.config.fileConfig.general.instanceName
  }

  get jobsInMenu () {
    return this.$store.state.config.fileConfig.general.jobsInMenu
  }

  urlRegex = new RegExp('^(https?:\\/\\/)?' + // protocol
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

  mounted () {
    // If we have no api's configured at all, open the dialog.
    if (this.$store.state.config.apiUrl === '') {
      this.instanceDialog.open = true
    }
  }

  emitChange (e: boolean) {
    this.$emit('input', e)
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
      const urls = (
        !this.instanceDialog.url.startsWith('http://') ||
        !this.instanceDialog.url.startsWith('https://')
      )
        ? this.$filters.getApiUrls('http://' + this.instanceDialog.url)
        : this.$filters.getApiUrls(this.instanceDialog.url)
      this.instanceDialog.open = false
      this.activateInstance(urls)
    }
  }

  activateInstance (instance: ApiConfig) {
    // Close the drawer.
    this.emitChange(false)

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
</style>
