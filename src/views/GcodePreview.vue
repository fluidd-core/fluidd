<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col cols="12">
      <GcodePreviewCard full-screen />
    </v-col>

    <file-system-download-wrapper />
  </v-row>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import GcodePreviewCard from '@/components/widgets/gcode-preview/GcodePreviewCard.vue'
import FileSystemDownloadWrapper from '@/components/widgets/filesystem/FileSystemDownloadWrapper.vue'

@Component({
  components: {
    GcodePreviewCard,
    FileSystemDownloadWrapper
  }
})
export default class GcodePreview extends Vue {
}
</script>
