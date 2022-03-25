import Vue from 'vue'
import { camelCase } from 'lodash-es'

const requireComponent = require.context(
  // The relative path of the components folder
  '.',
  // Whether or not to look in subfolders
  true,
  // The regular expression used to match base component filenames
  /(ui|layout|common)\/[\w-]+\.vue$/
)

requireComponent.keys().forEach((fileName) => {
  // Get component config
  const componentConfig = requireComponent(fileName)

  // Get PascalCase name of component
  const componentName = camelCase(
    fileName
      .split('/')
      .pop()
      ?.replace(/\.\w+$/, '')
  )

  // Globally register the component
  if (componentName) Vue.component(componentName, componentConfig.default || componentConfig)
})
