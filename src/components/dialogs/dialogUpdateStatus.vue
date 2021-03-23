<template>
  <v-dialog
    :value="showDialog"
    :max-width="650"
    persistent
  >
    <v-card
      :loading="(updating) ? 'primary' : false">
      <v-card-title>
        <span class="headline">{{ title }}</span>
      </v-card-title>
      <v-card-text>
        <console-widget
          :items="responses"
          key-field="id"
          :height="250"
          readonly
        ></console-widget>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <slot name="actions">
          <btn color="primary" text @click="close" :disabled="updating">{{ buttonTitle }}</btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ConsoleWidget from '@/components/widgets/ConsoleWidget.vue'

@Component({
  components: {
    ConsoleWidget
  }
})
export default class DialogUpdateStatus extends Mixins(StateMixin) {
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
      return this.$t('app.version.status.updating')
    } else {
      return this.$t('app.version.status.finished')
    }
  }

  get buttonTitle () {
    if (this.updating) {
      return this.$t('app.version.status.updating')
    } else {
      return this.$t('app.version.btn.finish')
    }
  }

  get responses () {
    return this.$store.getters['version/getResponses']
  }

  close () {
    this.invokedDialog = false
    this.$store.commit('version/setClearUpdateResponse')
  }
}
</script>
