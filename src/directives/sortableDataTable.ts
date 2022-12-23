import { ObjectDirective } from 'vue'
import Sortable from 'sortablejs'

type SortableHtmlElement = HTMLElement & { _sortable: Sortable }

type SortableEvent = (event: Sortable.SortableEvent) => void

type SortableDataTableValue = SortableEvent | Sortable.Options

const sortableDataTable : ObjectDirective<SortableHtmlElement, SortableDataTableValue> = {
  bind: (el, binding) => {
    const options: Sortable.Options = typeof (binding.value) === 'function'
      ? {
          onUpdate: binding.value
        }
      : binding.value

    el._sortable = Sortable.create(el.getElementsByTagName('tbody')[0], options)
  },
  unbind: (el) => {
    el._sortable?.destroy()
  }
}

export default sortableDataTable
