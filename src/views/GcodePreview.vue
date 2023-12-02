<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col cols="12">
      <GcodePreviewCard fullscreen />
    </v-col>
  </v-row>
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
