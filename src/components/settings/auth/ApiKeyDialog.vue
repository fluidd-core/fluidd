<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    :max-width="500"
  >
    <v-card>
      <v-card-title class="card-heading py-2">
        <span class="focus--text" v-html="$t('app.general.label.api_key')"></span>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="px-4 pt-4">
        <app-code-view :value="apiKey"></app-code-view>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <app-btn
          color=""
          @click="handleRefreshApiKey"
        >
          <v-icon small left>$refresh</v-icon>
          {{ $t('app.general.btn.refresh') }}
        </app-btn>

        <app-btn color="warning" text @click="$emit('input', false)" type="button">{{ $t('app.general.btn.close') }}</app-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class ApiKeyDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  value!: boolean

  get apiKey () {
    return this.$store.getters['auth/getApiKey']
  }

  handleRefreshApiKey () {
    this.$store.dispatch('auth/refreshApiKey')
  }
}
</script>
