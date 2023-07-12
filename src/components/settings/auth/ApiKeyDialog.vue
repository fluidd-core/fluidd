<template>
  <app-dialog
    v-model="open"
    :title="$t('app.general.label.api_key')"
    max-width="500"
  >
    <v-card-text>
      <v-text-field
        :value="apiKey"
        filled
        dense
        single-line
        hide-details
        readonly
      />

      <v-layout
        align-center
        column
        class="pt-4"
      >
        <app-qr-code
          :value="apiKey"
          centered
        />
      </v-layout>
    </v-card-text>

    <template #actions>
      <v-spacer />

      <app-btn
        color="primary"
        text
        type="button"
        @click="handleRefreshApiKey"
      >
        {{ $t('app.general.btn.refresh') }}
      </app-btn>
    </template>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Vue, VModel } from 'vue-property-decorator'

@Component({})
export default class ApiKeyDialog extends Vue {
  @VModel({ type: Boolean, required: true })
    open!: boolean

  get apiKey () {
    return this.$store.getters['auth/getApiKey']
  }

  handleRefreshApiKey () {
    this.$store.dispatch('auth/refreshApiKey')
  }
}
</script>
