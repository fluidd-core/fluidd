<template>
  <component
    :is="isForeign ? 'foreign-camera' : 'camera'"
    :key="isForeign ? $route.params.printer : undefined"
  />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { isForeignSlug } from '@/services/printer-pages'

@Component({
  components: {
    Camera: () => import('@/views/Camera.vue'),
    ForeignCamera: () => import('./ForeignPrinterCamera.vue')
  }
})
export default class CameraRoute extends Vue {
  get isForeign () { return isForeignSlug(this.$route.params.printer) }
}
</script>
