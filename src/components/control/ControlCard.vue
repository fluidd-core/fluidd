<template>
  <section
    class="ccard"
    :class="{ 'ccard--locked': !!locked }"
  >
    <header
      v-if="title || $slots.aside"
      class="ccard__head"
    >
      <h2 class="ccard__title">
        {{ title }}
      </h2>
      <span class="ccard__aside"><slot name="aside" /></span>
    </header>
    <slot />
    <p
      v-if="locked"
      class="ccard__lock"
    >
      <frame-icon
        name="lock"
        small
      />
      {{ locked }}
    </p>
    <p
      v-else-if="note"
      class="ccard__note"
    >
      {{ note }}
    </p>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/**
 * One panel of Control: its title, something beside it (the heaters'
 * temperatures, the material loaded), its controls, and a line under them.
 * A panel that can't be used now stays in place and says why (`locked`).
 */
@Component({})
export default class ControlCard extends Vue {
  @Prop({ type: String, default: '' })
  readonly title!: string

  @Prop({ type: String, default: '' })
  readonly note!: string

  /** Why the controls can't be used now, shown in place of the note. */
  @Prop({ type: String, default: '' })
  readonly locked!: string
}
</script>

<style lang="scss" scoped>
  .ccard {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    padding: 20px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .ccard__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    min-width: 0;
  }

  .ccard__title {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    white-space: nowrap;
  }

  .ccard__aside {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    min-width: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
    text-align: right;
  }

  .ccard__note,
  .ccard__lock {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .ccard__lock {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--m3d-text-subtle);
  }
</style>
