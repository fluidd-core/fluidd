import type Vue from 'vue'

type ElementWithVueApp = Element & {
  __vue__: Vue
}

const elementHasVueApp = (element: Element): element is ElementWithVueApp => '__vue__' in element

const getVueApp = () => {
  const app = document.querySelector('#app')

  if (!app || !elementHasVueApp(app)) {
    throw new Error('Vue app not found')
  }

  return app.__vue__
}

export default getVueApp
