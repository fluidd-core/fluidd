<template>
  <div
    class="printer-opening"
    data-tid="printer-opening"
  >
    <template v-if="missing">
      <v-icon
        x-large
        class="mb-4 printer-opening__icon"
      >
        $printer3d
      </v-icon>
      <h2 class="printer-opening__title">
        No printer called {{ slug }} here
      </h2>
      <p class="printer-opening__text">
        This browser doesn't know that printer. It may be on another network,
        saved in another browser, or linked to another account.
      </p>
      <v-btn
        color="primary"
        to="/"
        data-tid="printer-opening-all"
      >
        All printers
      </v-btn>
    </template>

    <template v-else-if="error">
      <v-icon
        x-large
        class="mb-4 printer-opening__icon"
      >
        $alertCircle
      </v-icon>
      <h2 class="printer-opening__title">
        Couldn't open {{ name }}
      </h2>
      <p class="printer-opening__text">
        {{ error }}
      </p>
      <div class="printer-opening__actions">
        <v-btn
          v-if="fallbackUrl"
          color="primary"
          :href="fallbackUrl"
        >
          Open its own page
        </v-btn>
        <v-btn
          text
          @click="retry"
        >
          Try again
        </v-btn>
        <v-btn
          text
          to="/"
        >
          All printers
        </v-btn>
      </div>
    </template>

    <template v-else>
      <v-progress-circular
        indeterminate
        size="40"
        width="3"
        color="primary"
        class="mb-4"
      />
      <h2 class="printer-opening__title">
        Opening {{ name }}…
      </h2>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { activationState } from '@/services/muon-cloud/activate'
import { cloudState } from '@/services/muon-cloud/state'
import { openPrinterAt, printerPagesState, resolveSlug } from '@/services/printer-pages'

/**
 * Shown on a printer's page while Fluidd is on another printer: opening the
 * one the address names, or why it can't. Never the last printer's page under
 * this printer's address.
 */
@Component({})
export default class PrinterOpening extends Vue {
  @Prop({ type: String, required: true })
  readonly slug!: string

  get name (): string {
    const target = resolveSlug(this.slug)
    if (target?.kind === 'local') return target.instance.name || this.slug
    if (target?.kind === 'cloud') return cloudState.printers.find(p => p.id === target.printerId)?.name ?? this.slug
    return this.slug
  }

  /** Only once the account's printers are known: one of them may be it. */
  get missing (): boolean {
    return printerPagesState.missing === this.slug && (cloudState.ready || !cloudState.account)
  }

  get error (): string | null {
    return activationState.switching ? null : activationState.error
  }

  get fallbackUrl (): string | null {
    return activationState.fallbackUrl
  }

  retry () {
    activationState.error = null
    openPrinterAt(this.slug).catch(() => {})
  }
}
</script>

<style lang="scss" scoped>
.printer-opening {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 60vh;
  padding: 24px;
}

.printer-opening__icon {
  opacity: .6;
}

.printer-opening__title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
}

.printer-opening__text {
  max-width: 440px;
  opacity: .75;
  margin-bottom: 20px;
}

.printer-opening__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
</style>
