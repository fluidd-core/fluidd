<template>
  <v-dialog
    :value="showDialog"
    :max-width="650"
    persistent
  >
    <v-card
      :loading="(updating) ? 'primary' : false"
      color="secondary darken-1">
      <v-card-title>
        <span class="headline">{{ title }}</span>
      </v-card-title>
      <v-card-text>
        <div style="height: 250px;">
          <console-widget
            v-if="updateResponses"
            :items="updateResponses"
            readonly
          ></console-widget>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <slot name="actions">
          <v-btn color="primary" text @click="close" :elevation="2" :disabled="updating">{{ buttonTitle }}</v-btn>
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
      return 'Updating, please wait...'
    } else {
      return 'Updates finished'
    }
  }

  get buttonTitle () {
    if (this.updating) {
      return 'Updating...'
    } else {
      return 'Finish'
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
