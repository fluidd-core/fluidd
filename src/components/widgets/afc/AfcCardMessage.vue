<template>
  <v-alert
    v-if="message"
    icon="$warning"
    :type="type"
    class="mt-3 align-content-center"
    dense
    text
  >
    <v-row>
      <v-col class="grow text-format">
        {{ message }}
      </v-col>
      <v-col class="shrink py-0 align-content-center">
        <v-btn
          icon
          @click="clearMessage"
        >
          <v-icon small>
            $close
          </v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </v-alert>
</template>
<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import { mdiAlert, mdiClose } from '@mdi/js'

@Component
export default class AfcCardMessage extends Mixins(StateMixin, AfcMixin) {
  mdiAlert = mdiAlert
  mdiClose = mdiClose

  get type () {
    const type = this.afc.message?.type ?? 'error'
    const possibleTypes = ['info', 'warning', 'success', 'error']

    if (!possibleTypes.includes(type)) {
      window.console.warn(`AfcCardMessage: Invalid message type "${type}" detected. Defaulting to "error".`)
      return 'error'
    }

    return type
  }

  get message () {
    return this.afc.message?.message ?? ''
  }

  clearMessage () {
    const gcode = 'AFC_CLEAR_MESSAGE'

    this.sendGcode(gcode)
  }
}
</script>

<style scoped>
.text-format {
  white-space: break-spaces;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
}
</style>
