<template>
  <div
    class="fit-list"
    data-tid="library-your-printers"
  >
    <p
      v-if="!rows.length"
      class="fit-list__none"
    >
      There are no printers in your account yet. Link one from Printers.
    </p>
    <div
      v-for="row in rows"
      :key="row.id"
      class="lib-fit"
      :class="{ 'lib-fit--warn': row.tone === 'warn', 'lib-fit--off': row.tone === 'off' }"
      :data-tid="`library-fit-${row.slug}`"
    >
      <printer-thumb
        :size="44"
        :state="row.tone === 'off' ? 'offline' : row.tone === 'run' ? 'printing' : 'idle'"
      />
      <span class="fit-list__text">
        <span class="lib-fit__name">{{ row.name }}</span>
        <span class="lib-fit__detail">{{ row.detail }}</span>
      </span>
      <button
        v-if="row.action === 'reslice'"
        type="button"
        class="lib-btn lib-btn--sm"
        @click="$emit('reslice', row)"
      >
        {{ row.reslice }}
      </button>
      <button
        v-else-if="row.action === 'queue'"
        type="button"
        class="lib-btn lib-btn--sm"
        @click="$emit('print', row)"
      >
        Queue it
      </button>
      <button
        v-else-if="row.action === 'print'"
        type="button"
        class="lib-pill lib-pill--ok fit-list__ready"
        :aria-label="`Print on ${row.name}`"
        @click="$emit('print', row)"
      >
        <span class="lib-dot" />{{ row.status }}
      </button>
      <span
        v-else
        class="lib-pill"
      >{{ row.status }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PrinterThumb from '@/components/ui/PrinterThumb.vue'
import PrinterRowsMixin from '@/mixins/printer-rows'

/**
 * A print's "Your printers": each account printer and whether the print
 * fits it now (printer-rows.ts). Ready and Queue open Print on… for that
 * printer; Re-slice opens Slice on it.
 */
@Component({ components: { PrinterThumb } })
export default class PrinterFitList extends Mixins(PrinterRowsMixin) {}
</script>

<style lang="scss" scoped>
  .fit-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .fit-list__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .fit-list__none {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .fit-list__ready {
    border: 0;
    cursor: pointer;
  }
</style>
