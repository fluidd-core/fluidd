<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col cols="12">
      <GcodePreviewCard full-screen />
    </v-col>

    <file-system-download-dialog />
  </v-row>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import GcodePreviewCard from '@/components/widgets/gcode-preview/GcodePreviewCard.vue'
import FileSystemDownloadDialog from '@/components/widgets/filesystem/FileSystemDownloadDialog.vue'

@Component({
  components: {
    GcodePreviewCard,
    FileSystemDownloadDialog
  }
})
export default class GcodePreview extends Vue {
}
</script>
