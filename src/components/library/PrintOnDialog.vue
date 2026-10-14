<template>
  <m3-dialog
    :value="!!item"
    eyebrow="Print from your Library"
    :title="item ? `${item.name} on…` : ''"
    :persistent="sending"
    :close-disabled="sending"
    max-width="660"
    content-class="print-on-frame"
    data-tid="print-on"
    @close="close"
  >
    <p
      v-if="!rows.length"
      class="m3-dlg__text"
    >
      There are no printers in your account yet. Link one from Printers, and it appears here.
    </p>
    <div
      v-else
      class="print-on__list"
      role="radiogroup"
      aria-label="Printer"
    >
      <div
        v-for="row in rows"
        :key="row.id"
        class="lib-fit print-on__row"
        :class="{
          'print-on__row--on': chosenRow && chosenRow.id === row.id,
          'lib-fit--warn': row.tone === 'warn',
          'lib-fit--off': row.tone === 'off'
        }"
        :role="row.action === 'print' || row.action === 'queue' ? 'radio' : undefined"
        :aria-checked="row.action === 'print' || row.action === 'queue' ? (!!chosenRow && chosenRow.id === row.id) : undefined"
        :tabindex="row.action === 'print' || row.action === 'queue' ? 0 : undefined"
        :data-tid="`print-on-${row.slug}`"
        @click="choose(row)"
        @keydown.enter.space.prevent="choose(row)"
      >
        <span
          class="print-on__radio"
          :class="{ 'print-on__radio--on': chosenRow && chosenRow.id === row.id }"
          aria-hidden="true"
        />
        <printer-thumb
          :size="52"
          :state="row.tone === 'off' ? 'offline' : row.tone === 'run' ? 'printing' : 'idle'"
        />
        <span class="print-on__text">
          <span class="lib-fit__name">{{ row.name }}<span
            v-if="row.active"
            class="print-on__here"
          > · open here</span></span>
          <span
            class="lib-fit__detail"
            data-tid="print-on-fit"
          >{{ row.detail }}</span>
          <span
            v-if="row.note"
            class="print-on__note"
          >{{ row.note }}</span>
        </span>
        <button
          v-if="row.action === 'reslice'"
          type="button"
          class="lib-btn lib-btn--sm"
          :disabled="sending"
          data-tid="print-on-reslice"
          @click.stop="reslice(row)"
        >
          {{ row.reslice }}
        </button>
        <span
          v-else
          class="lib-pill"
          :class="{ 'lib-pill--ok': row.tone === 'ok', 'lib-pill--run': row.tone === 'run' }"
        >
          <span
            v-if="row.tone === 'ok'"
            class="lib-dot"
          />{{ row.status }}
        </span>
      </div>
    </div>

    <plate-check
      v-if="asksPlate"
      v-model="plateClear"
      :disabled="sending"
      data-tid="print-on-plate"
    />

    <p
      v-if="step"
      class="m3-dlg__note print-on__step"
      role="status"
    >
      <v-progress-circular
        indeterminate
        size="14"
        width="2"
      />
      {{ step }}
    </p>
    <p
      v-if="error"
      class="m3-dlg__error"
      role="alert"
    >
      {{ error }}
    </p>

    <template #actions>
      <span class="print-on__fine">
        This page fetches the file from your Library and sends it to {{ chosenRow ? chosenRow.name : 'the printer' }} itself. The Library never contacts a printer.
      </span>
      <button
        type="button"
        class="lib-btn"
        :disabled="!chosenRow || sending"
        data-tid="print-on-save"
        @click="go('save')"
      >
        Save to the printer
      </button>
      <button
        type="button"
        class="lib-btn lib-btn--pri"
        :disabled="!canGo"
        data-tid="print-on-print"
        @click="go('print')"
      >
        {{ chosenRow && chosenRow.action === 'queue' ? 'Add to queue' : 'Print now' }}
      </button>
    </template>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import PlateCheck from '@/components/ui/PlateCheck.vue'
import PrinterThumb from '@/components/ui/PrinterThumb.vue'
import PrintOnMixin from '@/mixins/print-on'

/**
 * Print on…: the account's printers, each with whether this print can go
 * to it now (fit.ts), one chosen, and the plate check before Print now.
 * What it does is mixins/print-on.ts; only the look is here.
 */
@Component({ components: { M3Dialog, PlateCheck, PrinterThumb } })
export default class PrintOnDialog extends Mixins(PrintOnMixin) {}
</script>

<style lang="scss" scoped>
  .print-on__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .print-on__row {
    grid-template-columns: 20px 52px minmax(0, 1fr) auto;
    cursor: default;

    &[role='radio'] {
      cursor: pointer;
    }

    &:focus-visible {
      outline: 2px solid var(--m3d-accent);
      outline-offset: 2px;
    }
  }

  .print-on__row--on {
    background: var(--m3d-accent-soft);
    box-shadow: inset 0 0 0 1.5px var(--m3d-accent);
  }

  .print-on__radio {
    position: relative;
    width: 18px;
    height: 18px;
    border: 1.5px solid var(--m3d-border-strong);
    border-radius: 50%;
  }

  .print-on__row:not([role='radio']) .print-on__radio {
    opacity: 0.4;
  }

  .print-on__radio--on {
    border-color: var(--m3d-accent);

    &::after {
      content: '';
      position: absolute;
      inset: 3px;
      border-radius: 50%;
      background: var(--m3d-accent);
    }
  }

  .print-on__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .print-on__here {
    color: var(--m3d-text-subtle);
    font-weight: 400;
  }

  .print-on__note {
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .print-on__step {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .print-on__fine {
    flex: 1 1 auto;
    max-width: 300px;
    margin-right: auto;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  @media (max-width: 600px) {
    .print-on__row {
      grid-template-columns: 18px 52px minmax(0, 1fr);

      > :last-child {
        grid-column: 3;
        justify-self: start;
      }
    }

    .print-on__fine {
      flex-basis: 100%;
      max-width: none;
    }
  }
</style>
