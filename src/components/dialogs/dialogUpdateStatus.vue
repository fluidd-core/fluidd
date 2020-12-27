<template>
  <v-dialog
    :value="showDialog"
    :max-width="650"
    persistent
  >
    <v-card
      color="secondary darken-1">
      <v-card-title>
        <span class="headline">Component Update</span>
      </v-card-title>
      <v-card-text>
        <v-row
          v-if="updating"
          class="fill-height"
          align-content="center"
          justify="center"
        >
          <v-col
            class="subtitle-1 text-center"
            cols="12"
          >
            Updating, please wait...
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              indeterminate
              class="mb-4"
              color="warning"
              rounded
              height="6"
            ></v-progress-linear>
          </v-col>
        </v-row>

        <v-container style="height: 250px;">
          <console-widget
            v-if="updateResponses"
            :items="updateResponses"
            readonly
          ></console-widget>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <slot name="actions">
          <v-btn color="primary" @click="close" :disabled="updating">Finish</v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
export default class DialogUpdateStatus extends Mixins(UtilsMixin) {
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
