import { ObjectDirective } from 'vue'
import Sortable from 'sortablejs'

type SortableHtmlElement = HTMLElement & { _sortable: Sortable }

type SortableDataTableHandler = (event: Sortable.SortableEvent) => void

type SortableDataTableValue = SortableDataTableHandler | {
  handler: SortableDataTableHandler
  options?: Sortable.Options
}

const sortableDataTable : ObjectDirective<SortableHtmlElement, SortableDataTableValue> = {
  bind: (el, binding) => {
    const bindingValue = typeof (binding.value) === 'function'
      ? {
          handler: binding.value
        }
      : binding.value

    const options = {
      ...bindingValue.options || {},
      onUpdate: bindingValue.handler
    } as Sortable.Options

    el._sortable = Sortable.create(el.getElementsByTagName('tbody')[0], options)
  },
  unbind: (el) => {
    el._sortable?.destroy()
  }
}

export default sortableDataTable
