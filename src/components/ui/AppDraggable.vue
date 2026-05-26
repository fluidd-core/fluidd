<template>
  <div class="app-draggable">
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Prop, VModel, Vue, Watch } from 'vue-property-decorator'
import { markRaw } from 'vue'
import Sortable from 'sortablejs'

const instanceMap = new WeakMap<HTMLElement, AppDraggable>()

@Component({})
export default class AppDraggable extends Vue {
  @VModel({ type: Array, default: () => [] })
  items!: unknown[]

  @Prop({ type: Object })
  readonly options?: Sortable.Options

  @Prop({ type: String })
  readonly target?: string

  @Watch('options')
  onOptions (value: Sortable.Options) {
    if (this.sortable) {
      for (const prop in value) {
        const propAsOptionsKey = prop as keyof Sortable.Options

        this.sortable.option(propAsOptionsKey, value[propAsOptionsKey])
      }
    }
  }

  @Watch('target')
  onTarget () {
    this.dettach()
    this.attach()
  }

  sortable: Sortable | null = null

  handleStart (event: Sortable.SortableEvent) {
    this.$emit('start', event)
  }

  handleAdd (event: Sortable.SortableEvent) {
    const { oldIndex, newIndex, from } = event
    const fromInstance = instanceMap.get(from)

    if (
      oldIndex === undefined ||
      newIndex === undefined ||
      fromInstance === undefined
    ) {
      return
    }

    const items = [...this.items]

    items.splice(newIndex, 0, fromInstance.items[oldIndex])

    this.items = items

    this.$emit('add', event)
  }

  handleRemove (event: Sortable.SortableEvent) {
    const { oldIndex } = event

    if (oldIndex === undefined) {
      return
    }

    const items = [...this.items]

    items.splice(oldIndex, 1)

    this.items = items

    this.$emit('remove', event)
  }

  handleUpdate (event: Sortable.SortableEvent) {
    const { oldIndex, newIndex } = event

    if (
      oldIndex === undefined ||
      newIndex === undefined
    ) {
      return
    }

    const items = [...this.items]

    const movedItem = items.splice(oldIndex, 1)[0]
    items.splice(newIndex, 0, movedItem)

    this.items = items

    this.$emit('update', event)
  }

  handleEnd (event: Sortable.SortableEvent) {
    this.$emit('end', event)
  }

  attach () {
    const targetElement = (
      this.target &&
      this.$el.querySelector(this.target)
    ) || this.$el

    if (targetElement instanceof HTMLElement) {
      instanceMap.set(targetElement, this)

      const options: Sortable.Options = {
        animation: 200,
        handle: '.handle',
        ghostClass: 'app-draggable__ghost',
        chosenClass: 'app-draggable__chosen',
        ...this.options,
        onStart: this.handleStart,
        onAdd: this.handleAdd,
        onRemove: this.handleRemove,
        onUpdate: this.handleUpdate,
        onEnd: this.handleEnd
      }

      this.sortable = markRaw(Sortable.create(targetElement, options))
    }
  }

  dettach () {
    const targetElement = this.sortable?.el

    if (targetElement) {
      instanceMap.delete(targetElement)
    }

    this.sortable?.destroy()
    this.sortable = null
  }

  mounted () {
    this.attach()
  }

  beforeDestroy () {
    this.dettach()
  }
}
</script>
