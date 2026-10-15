<template>
  <section class="task-fold">
    <button
      :id="`${foldId}-trigger`"
      ref="trigger"
      type="button"
      class="task-fold__trigger"
      :aria-expanded="value ? 'true' : 'false'"
      :aria-controls="foldId"
      @click="$emit('input', !value)"
    >
      <span>{{ title }}</span>
      <span class="task-fold__summary">{{ summary }}</span>
      <span aria-hidden="true">{{ value ? '−' : '+' }}</span>
    </button>
    <div
      v-show="value"
      :id="foldId"
      ref="panel"
      class="task-fold__panel"
      :aria-labelledby="`${foldId}-trigger`"
    >
      <slot />
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component({})
export default class TaskFold extends Vue {
  @Prop({ type: String, required: true }) readonly foldId!: string
  @Prop({ type: String, required: true }) readonly title!: string
  @Prop({ type: String, required: true }) readonly summary!: string
  @Prop({ type: Boolean, default: false }) readonly value!: boolean

  @Watch('value')
  restoreFocus (open: boolean) {
    const panel = this.$refs.panel as HTMLElement | undefined
    if (!open && panel?.contains(document.activeElement)) (this.$refs.trigger as HTMLButtonElement).focus()
  }
}
</script>

<style lang="scss" scoped>
  .task-fold__trigger {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 0;
    color: var(--m3d-text);
    text-align: left;
    font: inherit;

    &:focus-visible {
      outline: 2px solid var(--m3d-accent);
      outline-offset: 2px;
    }
  }

  .task-fold__summary {
    flex: 1;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .task-fold__panel {
    padding-bottom: 12px;
  }
</style>
