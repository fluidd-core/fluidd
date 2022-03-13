<template>
  <v-dialog
    :value="value"
    :max-width="500"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-card-title class="card-heading py-2">
        <span
          class="focus--text"
          v-html="$t('app.general.label.api_key')"
        />
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
          outlined
        />
      </v-card-text>

      <v-layout
        align-center
        column
        class="pb-4"
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
          color=""
          @click="handleRefreshApiKey"
        >
          <v-icon
            small
            left
          >
            $refresh
          </v-icon>
          {{ $t('app.general.btn.refresh') }}
        </app-btn>

        <app-btn
          color="warning"
          text
          type="button"
          @click="$emit('input', false)"
        >
          {{ $t('app.general.btn.close') }}
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
  value!: boolean

  get apiKey () {
    return this.$store.getters['auth/getApiKey']
  }

  handleRefreshApiKey () {
    this.$store.dispatch('auth/refreshApiKey')
  }
}
</script>
