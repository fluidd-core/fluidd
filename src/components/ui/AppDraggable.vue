<template>
  <div class="app-draggable">
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Prop, VModel, Vue, Watch } from 'vue-property-decorator'
import Sortable from 'sortablejs'

const instanceKey = Symbol('instanceKey')

type TargetHtmlElement = HTMLElement & {
  [instanceKey]: AppDraggable | null
}

const isTargetHtmlElement = (element: HTMLElement): element is TargetHtmlElement => instanceKey in element

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

  @Watch('items')
  onItemsChange () {
    // Sync DOM order when the backing array changes externally
    // SortableJS manages DOM independently, so we need to tell it to re-sort
    if (this.sortable && this.options?.dataIdAttr) {
      const dataIdAttr = this.options.dataIdAttr
      const newOrder = this.items
        .map((item: any) => item?.id)
        .filter((id): id is string => Boolean(id))

      // Get current DOM order
      const currentOrder: string[] = []
      const el = this.sortable.el
      for (const child of el.children) {
        const id = child.getAttribute(dataIdAttr)
        if (id) currentOrder.push(id)
      }

      // Only re-sort if order actually differs (avoid unnecessary DOM manipulation)
      const ordersDiffer = newOrder.length !== currentOrder.length ||
        newOrder.some((id, i) => currentOrder[i] !== id)

      if (ordersDiffer) {
        this.sortable.sort(newOrder)
      }
    }
  }

  sortable: Sortable | null = null

  handleStart (event: Sortable.SortableEvent) {
    this.$emit('start', event)
  }

  handleAdd (event: Sortable.SortableEvent) {
    const { oldIndex, newIndex, from } = event

    if (
      oldIndex === undefined ||
      newIndex === undefined ||
      !isTargetHtmlElement(from) ||
      from[instanceKey] === null
    ) {
      return
    }

    const fromInstance = from[instanceKey]

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
    // Use dataIdAttr to get reliable order by reading DOM directly
    const dataIdAttr = this.options?.dataIdAttr
    if (dataIdAttr && this.sortable) {
      // Create a map of id -> item for quick lookup
      const itemMap = new Map<string, unknown>()
      for (const item of this.items) {
        const id = (item as any)?.id
        if (id) {
          itemMap.set(id, item)
        }
      }

      // Get the dragged item's ID - search up the DOM tree if needed
      let draggedId: string | null = null
      let searchEl: Element | null = event.item
      while (searchEl && !draggedId) {
        draggedId = searchEl.getAttribute(dataIdAttr)
        if (!draggedId) {
          // Also check first child in case the attribute is nested
          const firstChild = searchEl.firstElementChild
          if (firstChild) {
            draggedId = firstChild.getAttribute(dataIdAttr)
          }
        }
        searchEl = searchEl.parentElement
      }

      const { oldIndex, newIndex } = event

      if (!draggedId || !itemMap.has(draggedId) || oldIndex === undefined || newIndex === undefined) {
        return
      }

      // Find the old position of the dragged item in our items array
      const items = [...this.items]
      const oldItemIndex = items.findIndex((item: any) => item?.id === draggedId)
      if (oldItemIndex === -1) {
        return
      }

      // Calculate new position: use relative movement from DOM indices
      // The DOM has extra elements, so we need to map DOM index to our array index
      // Count how many of our items come before each DOM position
      const targetElement = this.sortable.el
      let ourItemsBeforeOldIndex = 0
      let ourItemsBeforeNewIndex = 0
      for (let i = 0; i < targetElement.children.length; i++) {
        const child = targetElement.children[i]
        const childId = child.getAttribute(dataIdAttr)
        if (childId && itemMap.has(childId)) {
          if (i < oldIndex) ourItemsBeforeOldIndex++
          if (i < newIndex) ourItemsBeforeNewIndex++
        }
      }

      // The dragged item was at ourItemsBeforeOldIndex in our array
      // It should now be at ourItemsBeforeNewIndex
      const newItemIndex = newIndex > oldIndex ? ourItemsBeforeNewIndex : ourItemsBeforeNewIndex

      // Remove from old position and insert at new position
      const [movedItem] = items.splice(oldItemIndex, 1)
      items.splice(newItemIndex, 0, movedItem)

      const sortedIds = items.map((item: any) => item?.id).filter(Boolean)

      this.items = items
      this.$emit('update', event)
      this.$emit('sorted', sortedIds)
      return
    }

    // Fallback to index-based reordering (less reliable)
    const { oldIndex, newIndex } = event

    if (
      oldIndex === undefined ||
      newIndex === undefined
    ) {
      return
    }

    const items = [...this.items]

    // Bounds check to prevent undefined items
    if (oldIndex < 0 || oldIndex >= items.length) {
      return
    }

    const movedItem = items.splice(oldIndex, 1)[0]

    // Safety check - don't insert undefined
    if (movedItem === undefined) {
      return
    }

    // Clamp newIndex to valid range
    const clampedNewIndex = Math.max(0, Math.min(newIndex, items.length))
    items.splice(clampedNewIndex, 0, movedItem)

    this.items = items

    this.$emit('update', event)
  }

  handleEnd (event: Sortable.SortableEvent) {
    this.$emit('end', event)
  }

  attach () {
    const targetElement = (
      this.target &&
      this.$el.querySelector<TargetHtmlElement>(this.target)
    ) || this.$el as TargetHtmlElement

    targetElement[instanceKey] = this

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

    this.sortable = Sortable.create(targetElement, options)
  }

  dettach () {
    const targetElement = this.sortable?.el

    if (targetElement && isTargetHtmlElement(targetElement)) {
      targetElement[instanceKey] = null
    }

    this.sortable?.destroy()
    this.sortable = null
  }

  mounted () {
    this.attach()
  }

  unmounted () {
    this.dettach()
  }
}
</script>
