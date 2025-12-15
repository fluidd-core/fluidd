declare module 'vue-virtual-scroller' {
  import Vue, { PluginObject } from 'vue'

  declare const VueVirtualScroller: PluginObject<any>

  export interface DinamicScroller extends Vue {
    scrollToItem: (index: number) => void,
    scrollToBottom: () => void
  }

  export default VueVirtualScroller
}
