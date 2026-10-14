<template>
  <div
    class="printer-switch"
    :class="{ 'printer-switch--phone': phone }"
  >
    <v-menu
      v-if="!phone"
      v-model="open"
      offset-y
      nudge-bottom="8"
      :close-on-content-click="false"
      content-class="printer-switch__menu"
      min-width="440"
      max-width="440"
      max-height="calc(100vh - 96px)"
    >
      <template #activator="{ on, attrs }">
        <button
          type="button"
          class="printer-switch__button"
          :class="{ 'printer-switch__button--open': open }"
          aria-label="Switch printer"
          data-tid="printer-switch"
          v-bind="attrs"
          v-on="on"
        >
          <printer-thumb
            :size="32"
            :state="thumbState"
          />
          <span class="printer-switch__text">
            <span class="printer-switch__name">{{ name }}</span>
            <span
              class="printer-switch__status"
              :class="`printer-switch__status--${statusTone}`"
            >
              <span class="printer-switch__dot" />
              <span class="printer-switch__status-text">{{ statusLine }}</span>
            </span>
          </span>
          <frame-icon
            name="chevronDown"
            small
            class="printer-switch__chevron"
          />
        </button>
      </template>
      <printer-switcher
        :visible="open"
        @click="open = false"
      />
    </v-menu>

    <template v-else>
      <button
        type="button"
        class="printer-switch__button"
        aria-label="Switch printer"
        data-tid="printer-switch"
        @click="open = true"
      >
        <printer-thumb
          :size="34"
          :state="thumbState"
        />
        <span class="printer-switch__text">
          <span class="printer-switch__name">
            {{ name }}
            <frame-icon
              name="chevronDown"
              small
              class="printer-switch__chevron"
            />
          </span>
          <span
            class="printer-switch__status"
            :class="`printer-switch__status--${statusTone}`"
          >
            <span class="printer-switch__dot" />
            <span class="printer-switch__status-text">{{ statusLineShort }}</span>
          </span>
        </span>
      </button>
      <v-bottom-sheet
        v-model="open"
        scrollable
        content-class="printer-switch__sheet"
      >
        <div class="printer-switch__sheet-body">
          <printer-switcher
            :visible="open"
            @click="open = false"
          />
        </div>
      </v-bottom-sheet>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import PrinterStatusMixin from '@/mixins/printer-status'
import PrinterSwitcher from '@/components/muon-cloud/PrinterSwitcher.vue'
import type { ThumbState } from '@/components/ui/PrinterThumb.vue'
import type { TimeEstimates } from '@/store/printer/types'
import { printerNameParts } from '@/util/printer-name'
import { shortDuration } from '@/util/short-duration'

/**
 * The printer you're on, top left: its picture, name and what it's doing,
 * on one line. It opens every printer: a menu on a computer, a sheet on a
 * phone. It is never hidden behind three dots, and never near the E-STOP.
 */
@Component({ components: { PrinterSwitcher } })
export default class PrinterSwitchButton extends Mixins(PrinterStatusMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

  open = false

  get name (): string {
    return printerNameParts(this.displayName).name
  }

  get thumbState (): ThumbState {
    if (!this.socketConnected) return 'offline'
    return this.printerPrinting || this.printerPaused ? 'printing' : 'idle'
  }

  get timeLeft (): string | null {
    if (!this.printerPrinting) return null
    const estimates = this.$store.getters['printer/getTimeEstimates'] as TimeEstimates
    const seconds = (estimates.eta - Date.now()) / 1000
    return seconds > 0 ? `${shortDuration(seconds)} left` : null
  }

  get statusLine (): string {
    return this.timeLeft ? `${this.statusText} · ${this.timeLeft}` : this.statusText
  }

  get statusLineShort (): string {
    return this.statusText
  }
}
</script>

<style lang="scss" scoped>
  .printer-switch {
    display: flex;
    flex: 0 1 auto;
    min-width: 0;
  }

  .printer-switch--phone {
    flex: 1 1 0;
  }

  .printer-switch__button {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-width: 0;
    height: 44px;
    padding: 0 12px 0 6px;
    border-radius: 14px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    text-align: left;
    transition: box-shadow var(--m3d-duration-fast) var(--m3d-ease);

    &:hover {
      box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
    }
  }

  .printer-switch__button--open {
    box-shadow: inset 0 0 0 1.5px var(--m3d-accent) !important;
  }

  .printer-switch:not(.printer-switch--phone) .printer-switch__button {
    min-width: 232px;
    max-width: 340px;
  }

  .printer-switch--phone .printer-switch__button {
    padding: 0;
    background: transparent;
    box-shadow: none !important;
  }

  .printer-switch__text {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-width: 0;
    line-height: 1.25;
  }

  .printer-switch__name {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
    font-size: 15px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .printer-switch__status {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: var(--m3d-text-muted);
    font-size: 12px;
    white-space: nowrap;
  }

  .printer-switch__status-text {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .printer-switch__dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--m3d-text-subtle);
  }

  .printer-switch__status--ok .printer-switch__dot { background: var(--m3d-success); }
  .printer-switch__status--active { color: var(--m3d-accent); }
  .printer-switch__status--active .printer-switch__dot { background: var(--m3d-accent); }
  .printer-switch__status--warn { color: var(--m3d-warning); }
  .printer-switch__status--warn .printer-switch__dot { background: var(--m3d-warning); }
  .printer-switch__status--fault { color: var(--m3d-danger); }
  .printer-switch__status--fault .printer-switch__dot { background: var(--m3d-danger); }

  .printer-switch__chevron {
    color: var(--m3d-text-muted);
  }
</style>

<style lang="scss">
  .printer-switch__menu {
    overflow-y: auto;
    border-radius: 22px !important;
    background: var(--m3d-surface) !important;
    box-shadow: var(--m3d-shadow-float), inset 0 0 0 1px var(--m3d-border) !important;
  }

  .printer-switch__sheet {
    border-radius: 22px 22px 0 0 !important;
  }

  .printer-switch__sheet-body {
    max-height: 85vh;
    overflow-y: auto;
    padding-bottom: env(safe-area-inset-bottom);
    border-radius: 22px 22px 0 0;
    background: var(--m3d-surface);
  }
</style>
