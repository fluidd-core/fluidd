<template>
  <updating-screen
    :printer-name="printerName"
    data-tid="updating-page"
    @done="back"
  />
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import UpdatingScreen from '@/components/updates/UpdatingScreen.vue'
import { poll } from '@/services/updates/watch'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import { printerNameParts } from '@/util/printer-name'

/**
 * The printer updating (/boxwood-367a/updating): where Install goes, and
 * where the bar on every other page leads while an install runs. While the
 * printer restarts, the connection screens show the same thing.
 */
@Component({ components: { UpdatingScreen } })
export default class Updating extends Mixins(StateMixin) {
  get printerName (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name
  }

  mounted () {
    poll()
  }

  back () {
    this.$router.push(scopedPath('/settings', activeSlug()) + '#versions').catch(() => undefined)
  }
}
</script>
