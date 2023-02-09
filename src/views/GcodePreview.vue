<template>
  <GcodePreviewCard full-screen />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import GcodePreviewCard from '@/components/widgets/gcode-preview/GcodePreviewCard.vue'

@Component({
  components: {
    GcodePreviewCard
  }
})
export default class GcodePreview extends Vue {
}
</script>
