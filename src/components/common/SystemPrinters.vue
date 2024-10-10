<template>
  <v-list dense>
    <v-subheader>{{ $t('app.general.label.printers') }}</v-subheader>

    <template v-for="(instance, index) in instances">
      <v-list-item
        :key="index"
        color="primary"
        :class="{ 'v-item--active v-list-item--active': instance.active }"
        @click.stop="activateInstance(instance)"
      >
        <v-list-item-content>
          <v-list-item-title>
            {{ instance.name }}<br>
            <small>{{ instance.apiUrl }}</small>
          </v-list-item-title>
        </v-list-item-content>
        <v-list-item-action v-if="!instance.active">
          <app-btn
            icon
            small
            color=""
            @click.stop="removeInstance(instance)"
          >
            <v-icon small>
              $delete
            </v-icon>
          </app-btn>
        </v-list-item-action>
      </v-list-item>
    </template>

    <v-list-item @click="addInstanceDialog()">
      <v-list-item-icon>
        <v-icon>$plus</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title class="text-wrap">
          {{ $t('app.general.btn.add_printer') }}
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <add-instance-dialog
      v-if="instanceDialogOpen"
      v-model="instanceDialogOpen"
      @resolve="activateInstance"
    />

    <v-divider />
  </v-list>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import type { InstanceConfig } from '@/store/config/types'
import StateMixin from '@/mixins/state'
import { appInit } from '@/init'

@Component({})
export default class SystemPrinters extends Mixins(StateMixin) {
  instanceDialogOpen = false

  get instanceName () {
    return this.$store.state.config.uiSettings.general.instanceName
  }

  get instances () {
    return this.$store.getters['config/getInstances']
  }

  @Watch('appReady')
  onAppReady (value: boolean) {
    if (value) {
      if (this.$store.state.config.apiUrl === '') {
        this.instanceDialogOpen = true
      }
    }
  }

  removeInstance (instance: InstanceConfig) {
    this.$store.dispatch('config/removeInstance', instance)
  }

  addInstanceDialog () {
    this.instanceDialogOpen = true
  }

  async activateInstance (instance: InstanceConfig) {
    // Close the drawer
    this.$emit('click')
    if (!instance.active) {
      // Close the socket.
      this.$socket.close()

      // Re-init the app.
      const config = await appInit(instance, this.$store.state.config.hostConfig)

      // Reconnect the socket with the new instance url.
      if (config.apiConfig.socketUrl && config.apiConnected && config.apiAuthenticated) {
        this.$socket.connect(config.apiConfig.socketUrl)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  :deep(.instance-item .v-list-item__action ) {
    margin: 6px 0;
  }
  :deep(.v-list-item--active::before) {
    opacity: 0.08;
  }
</style>
