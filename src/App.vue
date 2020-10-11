<template>
  <v-app>
    <app-bar></app-bar>

    <FlashMessage
      v-model="flashMessage.open"
      :text="flashMessage.text"
      :type="flashMessage.type"
      :timeout="flashMessage.timeout"
    />

    <v-main>
      <router-view v-if="socketConnected && klippyConnected" />
      <app-disconnected v-if="!socketConnected || !klippyConnected"></app-disconnected>
    </v-main>

    <!-- <v-footer app>
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer> -->
    <app-footer></app-footer>
  </v-app>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import EventBus from '@/eventBus'
import UtilsMixin from './mixins/utils'
import { FlashMessage as FlashMessageType } from '@/types'
import AppBar from '@/components/AppBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import AppDisconnected from '@/components/AppDisconnected.vue'
import FlashMessage from '@/components/FlashMessage.vue'

@Component({
  components: {
    AppBar,
    AppDisconnected,
    FlashMessage,
    AppFooter
  }
})
export default class App extends Mixins(UtilsMixin) {
  flashMessage: FlashMessageType = {
    open: false,
    text: undefined,
    type: undefined
  }

  mounted () {
    this.$vuetify.theme.dark = this.$store.state.config.localConfig.darkMode

    EventBus.$on('flashMessage', (payload: FlashMessageType) => {
      this.flashMessage.text = (payload && payload.text) || undefined
      this.flashMessage.type = (payload && payload.type) || undefined
      this.flashMessage.timeout = (payload && payload.timeout !== undefined) ? payload.timeout : undefined
      this.flashMessage.open = true
    })
  }
}
</script>

<style lang="scss" scoped>
  .title {
    background: -webkit-linear-gradient(45deg, #1970b5, #9accf5);
    background-clip: text;
    -webkit-text-fill-color: transparent;}
  .logo {
    margin-right: 12px;
    max-height: 40px;
    max-width: 40px;
    object-fit: contain;
  }
</style>
