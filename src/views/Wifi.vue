<template>
  <div
    class="wifi-page"
    :class="{ 'wifi-page--phone': isMobileViewport }"
    data-tid="wifi-page"
  >
    <wifi-manager-card />
    <hotspot-manager-card />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import WifiManagerCard from '@/components/widgets/wifi/WifiManagerCard.vue'
import HotspotManagerCard from '@/components/widgets/wifi/HotspotManagerCard.vue'

/**
 * Wi-Fi and network (Settings): the networks the printer hears, to join,
 * leave or forget, and its own hotspot, to turn on or off and rename.
 * Both talk to MuonOS's Aux API, and both say so instead when network
 * protection or a remote connection (Iroh) rules changes out.
 */
@Component({ components: { WifiManagerCard, HotspotManagerCard } })
export default class Wifi extends Mixins(BrowserMixin) {}
</script>

<style lang="scss" scoped>
  .wifi-page {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    gap: 16px;
    align-items: start;
  }

  @media (max-width: 1100px) {
    .wifi-page {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .wifi-page--phone {
    gap: 12px;
  }
</style>
