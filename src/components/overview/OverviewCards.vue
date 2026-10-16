<template>
  <section
    class="ov-card overview-editor"
    aria-label="Customise Overview"
  >
    <h2 class="ov-card__title">
      Customise Overview
    </h2>
    <p>M1 and this print, with Pause and Stop, are always here.</p>
    <p>Choose your cards. Drag selected rows or use Move up and Move down.</p>
    <div
      v-for="card in rows"
      :key="card.id"
      :data-card="card.id"
      :draggable="selected.includes(card.id)"
      @dragstart="dragged = card.id"
      @dragover.prevent
      @drop.prevent="drop(card.id)"
    >
      <label>
        <input
          type="checkbox"
          :checked="selected.includes(card.id)"
          :disabled="!!unavailable[card.id] && !selected.includes(card.id)"
          @change="toggle(card.id, $event.target.checked)"
        >
        {{ card.title }}
        <small>{{ unavailable[card.id] || card.needs }}</small>
      </label>
      <template v-if="selected.includes(card.id)">
        <button
          type="button"
          class="cbtn"
          :disabled="selected.indexOf(card.id) === 0"
          :aria-label="`Move ${card.title} up`"
          @click="move(card.id, -1)"
        >
          ↑
        </button>
        <button
          type="button"
          class="cbtn"
          :disabled="selected.indexOf(card.id) === selected.length - 1"
          :aria-label="`Move ${card.title} down`"
          @click="move(card.id, 1)"
        >
          ↓
        </button>
      </template>
    </div>
    <button
      type="button"
      class="cbtn"
      data-tid="overview-reset"
      @click="$emit('input', null)"
    >
      Put back Muon3D's default
    </button>
  </section>
</template>
<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { cardLayout, moveCard, overviewCards } from '@/services/overview/cards'
@Component
export default class OverviewCards extends Vue {
  @Prop({ type: Array, required: true }) readonly value!: string[]
  @Prop({ type: Object, default: () => ({}) }) readonly unavailable!: Record<string, string>
  dragged = ''
  get selected (): string[] { return cardLayout(this.value) }
  get rows () { return [...this.selected.map(id => overviewCards.find(c => c.id === id)!), ...overviewCards.filter(c => !this.selected.includes(c.id))] }
  toggle (id: string, on: boolean) {
    if (this.unavailable[id] && on) return
    this.$emit('input', on ? cardLayout([...this.selected, id]) : this.selected.filter(c => c !== id))
  }

  move (id: string, by: number) { this.$emit('input', moveCard(this.selected, id, by)) }
  drop (id: string) {
    if (!this.selected.includes(this.dragged) || !this.selected.includes(id)) return
    this.move(this.dragged, this.selected.indexOf(id) - this.selected.indexOf(this.dragged))
    this.dragged = ''
  }
}
</script>
<style scoped>
.overview-editor > div { display: flex; align-items: center; gap: 8px; padding: 10px 0; border-top: 1px solid var(--m3d-border); }
.overview-editor label { flex: 1; }
.overview-editor input { margin-right: 8px; }
.overview-editor small { display: block; color: var(--m3d-text-subtle); }
.overview-editor p { margin: 0; color: var(--m3d-text-muted); }
</style>
