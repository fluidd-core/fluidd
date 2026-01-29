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

  sortable: Sortable | null = null

  handleStart (event: Sortable.SortableEvent) {
    console.log('[AppDraggable.handleStart] Drag started!', event.item)
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
      console.log('[AppDraggable.handleUpdate] items BEFORE:', this.items.map((i: any) => i?.title || i?.id || 'undefined'))

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
      console.log('[AppDraggable.handleUpdate] draggedId:', draggedId, 'oldIndex:', oldIndex, 'newIndex:', newIndex)
      console.log('[AppDraggable.handleUpdate] event.item:', event.item.outerHTML.substring(0, 200))

      if (!draggedId || !itemMap.has(draggedId) || oldIndex === undefined || newIndex === undefined) {
        console.log('[AppDraggable.handleUpdate] Invalid drag data, skipping')
        return
      }

      // Find the old position of the dragged item in our items array
      const items = [...this.items]
      const oldItemIndex = items.findIndex((item: any) => item?.id === draggedId)
      if (oldItemIndex === -1) {
        console.log('[AppDraggable.handleUpdate] Could not find dragged item in array')
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

      console.log('[AppDraggable.handleUpdate] oldItemIndex:', oldItemIndex, 'newItemIndex:', newItemIndex)

      // Remove from old position and insert at new position
      const [movedItem] = items.splice(oldItemIndex, 1)
      items.splice(newItemIndex, 0, movedItem)

      const sortedIds = items.map((item: any) => item?.id).filter(Boolean)
      console.log('[AppDraggable.handleUpdate] items AFTER:', items.map((i: any) => i?.title || i?.id || 'undefined'))

      this.items = items
      this.$emit('update', event)
      this.$emit('sorted', sortedIds)
      return
    }

    // Fallback to index-based reordering (less reliable)
    const { oldIndex, newIndex } = event

    console.log('[AppDraggable.handleUpdate] oldIndex:', oldIndex, 'newIndex:', newIndex)
    console.log('[AppDraggable.handleUpdate] items BEFORE:', this.items.map((i: any) => i?.title || i?.id || 'undefined'))

    if (
      oldIndex === undefined ||
      newIndex === undefined
    ) {
      return
    }

    const items = [...this.items]

    // Bounds check to prevent undefined items
    if (oldIndex < 0 || oldIndex >= items.length) {
      console.log('[AppDraggable.handleUpdate] BOUNDS CHECK FAILED')
      return
    }

    const movedItem = items.splice(oldIndex, 1)[0]

    // Safety check - don't insert undefined
    if (movedItem === undefined) {
      console.log('[AppDraggable.handleUpdate] MOVED ITEM UNDEFINED')
      return
    }

    // Clamp newIndex to valid range
    const clampedNewIndex = Math.max(0, Math.min(newIndex, items.length))
    items.splice(clampedNewIndex, 0, movedItem)

    console.log('[AppDraggable.handleUpdate] items AFTER:', items.map((i: any) => i?.title || i?.id || 'undefined'))

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

    console.log('[AppDraggable.attach] Creating sortable with options:', {
      handle: options.handle,
      dataIdAttr: options.dataIdAttr,
      filter: options.filter ? 'function' : undefined
    })
    console.log('[AppDraggable.attach] Target element children:', targetElement.children.length)

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
