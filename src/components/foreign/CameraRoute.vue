<template>
  <component :is="isForeign ? 'foreign-camera' : 'camera'" />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Camera from '@/views/Camera.vue'
import { isForeignSlug } from '@/services/printer-pages'

@Component({
  components: {
    Camera,
    ForeignCamera: () => import('./ForeignPrinterCamera.vue')
  }
})
export default class CameraRoute extends Vue {
  get isForeign () { return isForeignSlug(this.$route.params.printer) }
}
</script>
