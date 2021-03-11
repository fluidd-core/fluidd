<template>
  <v-list dense>
    <v-subheader>Printers</v-subheader>

    <template v-for="(instance, index) in instances">
      <v-list-item
        :key="index"
        color="primary"
        :class="{ 'v-item--active v-list-item--active': instance.active }"
        @click.stop="activateInstance(instance)">
        <v-list-item-content>
          <v-list-item-title>
            {{ instance.name }}<br />
            <small>{{ instance.apiUrl }}</small>
          </v-list-item-title>
        </v-list-item-content>
        <v-list-item-action v-if="!instance.active">
          <btn icon small @click.stop="removeInstance(instance)">
            <v-icon small>$delete</v-icon>
          </btn>
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

    <dialog-add-instance
      v-model="instanceDialogOpen"
      @resolve="activateInstance"
    ></dialog-add-instance>
  </v-list>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import consola from 'consola'
import { InitConfig, InstanceConfig, ApiConfig } from '@/store/config/types'
import VersionStatus from '@/components/VersionStatus.vue'
import DialogAddInstance from '@/components/dialogs/dialogAddInstance.vue'
import UtilsMixin from '@/mixins/utils'
import { appInit } from '@/init'
import { Waits } from '@/globals'

@Component({
  components: {
    VersionStatus,
    DialogAddInstance
  }
})
export default class SystemPrintersWidget extends Mixins(UtilsMixin) {
  waits = Waits

  instanceDialogOpen = false

  get instanceName () {
    return this.$store.state.config.uiSettings.general.instanceName
  }

  get instances () {
    return this.$store.getters['config/getInstances']
  }

  mounted () {
    // If we have no api's configured at all, open the dialog.
    if (this.$store.state.config.apiUrl === '') {
      this.instanceDialogOpen = true
    }
  }

  removeInstance (instance: InstanceConfig) {
    this.$store.dispatch('config/removeInstance', instance)
  }

  addInstanceDialog () {
    this.instanceDialogOpen = true
  }

  activateInstance (apiConfig: ApiConfig) {
    // Close the drawer and socket.
    this.$emit('click')
    this.$socket.close()

    // Re-init the app.
    appInit(apiConfig, this.$store.state.config.hostConfig)
      .then((config: InitConfig) => {
        // Reconnect the socket with the new instance url.
        if (config.apiConnected) {
          consola.debug('Activating new instance with config', config)
          this.$socket.connect(config.apiConfig.socketUrl)
        }
      })
  }
}
</script>

<style lang="scss" scoped>
  ::v-deep .instance-item .v-list-item__action  {
    margin: 6px 0;
  }
  ::v-deep .v-list-item--active::before {
    opacity: 0.08;
  }
</style>
