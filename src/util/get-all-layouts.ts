import { LayoutConfig, Layouts } from '@/store/layout/types'

export default (layouts: Layouts) => {
  let knownComponents: LayoutConfig[] = []
  for (const _layout in layouts) {
    const layout = layouts[_layout]
    for (const _container in layout) {
      const container = layouts[_layout][_container]
        .map(config => ({ ...config, container: _container, layout: _layout }))
      knownComponents = [
        ...knownComponents,
        ...container
      ]
    }
  }
  return knownComponents
}
