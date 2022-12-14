import { ObjectDirective } from 'vue'
import Sortable from 'sortablejs'

type SortableHtmlElement = HTMLElement & { _sortable: Sortable }

type SortableDataTableHandler = (items: any[]) => void

type SortableDataTableValue = SortableDataTableHandler | {
  handler: SortableDataTableHandler
  options?: Sortable.Options
}

const sortableDataTable : ObjectDirective<SortableHtmlElement, SortableDataTableValue> = {
  bind: (el, binding, vnode) => {
    const bindingValue = typeof (binding.value) === 'function'
      ? {
          handler: binding.value
        }
      : binding.value

    const options = {
      ...bindingValue.options || {},
      onUpdate: (event: any) => {
        if (!vnode.componentOptions?.propsData || !('items' in vnode.componentOptions.propsData)) {
          return
        }

        const items = vnode.componentOptions.propsData.items as any[]

        const movedItem = items.splice(event.oldIndex, 1)[0]
        items.splice(event.newIndex, 0, movedItem)

        bindingValue.handler(items)
      }
    }

    el._sortable = Sortable.create(el.getElementsByTagName('tbody')[0], options)
  },
  unbind: (el) => {
    el._sortable?.destroy()
  }
}

export default sortableDataTable
