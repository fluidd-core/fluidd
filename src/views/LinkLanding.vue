<template>
  <div class="muon-link-landing">
    <v-card
      max-width="460"
      class="mx-auto mt-8 pa-2"
    >
      <v-card-title>Link a printer</v-card-title>
      <v-card-text v-if="!signedIn">
        Sign in to your Muon3D account to link the printer showing code
        <strong class="muon-link-landing__code">{{ code || '—' }}</strong>.
      </v-card-text>
      <v-card-actions v-if="!signedIn">
        <v-spacer />
        <app-btn
          color="primary"
          @click="accountDialog = true"
        >
          Sign in
        </app-btn>
      </v-card-actions>
      <v-card-text v-else>
        Follow the steps in the dialog. When the printer is linked it appears in your printer list.
      </v-card-text>
    </v-card>

    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
    />
    <link-printer-dialog
      v-if="signedIn && linkDialog"
      v-model="linkDialog"
      :initial-code="code"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { cloudState } from '@/services/muon-cloud/state'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import LinkPrinterDialog from '@/components/muon-cloud/LinkPrinterDialog.vue'

@Component({ components: { CloudAccountDialog, LinkPrinterDialog } })
export default class LinkLanding extends Vue {
  accountDialog = false
  linkDialog = false

  get code (): string {
    return String(this.$route.query.code ?? '').replace(/\D/g, '').slice(0, 6)
  }

  get signedIn () {
    return cloudState.account !== null
  }

  mounted () {
    if (this.signedIn) this.linkDialog = true
    else if (cloudState.ready) this.accountDialog = true
  }

  @Watch('signedIn')
  onSignedIn (value: boolean) {
    if (value) this.linkDialog = true
  }

  @Watch('linkDialog')
  onClosed (value: boolean) {
    if (!value && this.signedIn) this.$router.push('/')
  }
}
</script>

<style lang="scss" scoped>
.muon-link-landing__code {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  letter-spacing: 0.12em;
}
</style>
