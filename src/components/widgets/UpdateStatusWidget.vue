<template>
  <v-dialog
    :value="showDialog"
    :max-width="650"
    persistent
  >
    <v-card
      color="secondary darken-1"
      :height="400">
      <v-card-title>
        <span class="headline">{{ title }}</span>
      </v-card-title>
      <v-card-text style="height: 270px;">

        <v-progress-linear
          :value="100"
          :active="true"
          :indeterminate="(updating)"
          class="mb-4"
          color="warning"
          rounded
          height="6"
        ></v-progress-linear>

        <console-widget
          v-if="updateResponses"
          :items="updateResponses"
          readonly
        ></console-widget>

        <!-- <v-textarea
          v-if="updateResponses"
          readonly
          class="terminal-response"
          :value="updateResponses"
        >
        </v-textarea> -->
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <slot name="actions">
          <v-btn color="secondary" @click="close" :disabled="updating">Close</v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- <update-in-progress-widget v-if=""></update-in-progress-widget> -->
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import ConsoleWidget from '@/components/widgets/ConsoleWidget.vue'

@Component({
  components: {
    ConsoleWidget
  }
})
export default class App extends Mixins(UtilsMixin) {
  invokedDialog = false
  get showDialog () {
    if (
      this.invokedDialog === true ||
      this.$store.state.version.busy
    ) {
      this.invokedDialog = true
      return true
    }
    return false
  }

  get updating () {
    return this.$store.state.version.busy
  }

  get title () {
    if (this.updating) {
      return 'Updating...'
    } else {
      return 'Finished'
    }
  }

  get updateResponses () {
    return this.$store.state.version.responses
  }

  close () {
    this.invokedDialog = false
    this.$store.commit('version/clearUpdateResponse')
  }
}
</script>
