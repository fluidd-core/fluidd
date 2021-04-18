// registerComponentHooks.ts
// import { Component } from 'vue-property-decorator'
import Component from 'vue-class-component'

Component.registerHooks([
  'beforeRouteEnter',
  'beforeRouteUpdate'
])
