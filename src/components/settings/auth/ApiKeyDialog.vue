<template>
  <v-dialog
    :value="value"
    :max-width="500"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-card-title class="card-heading py-2">
        <span class="focus--text">{{ $t('app.general.label.api_key') }}</span>
      </v-card-title>

      <v-divider />

      <v-card-text class="py-4">
        <v-text-field
          :value="apiKey"
          filled
          dense
          single-line
          hide-details
          readonly
        />
      </v-card-text>

      <v-divider />

      <v-layout
        align-center
        column
        class="py-4"
      >
        <app-qr-code
          :value="apiKey"
          centered
        />
      </v-layout>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />

        <app-btn
          color="primary"
          text
          type="button"
          @click="handleRefreshApiKey"
        >
          {{ $t('app.general.btn.refresh') }}
        </app-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class ApiKeyDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  readonly value!: boolean

  get apiKey () {
    return this.$store.getters['auth/getApiKey']
  }

  handleRefreshApiKey () {
    this.$store.dispatch('auth/refreshApiKey')
  }
}
</script>
