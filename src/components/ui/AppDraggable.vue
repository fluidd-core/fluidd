<template>
  <div>
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
      this.$el.querySelector<TargetHtmlElement>(this.target)
    ) || this.$el as TargetHtmlElement

    targetElement[instanceKey] = this

    const options: Sortable.Options = {
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
