<template>
  <file-system-download-dialog
    v-if="currentDownload !== null"
    :value="currentDownload !== null"
    :file="currentDownload"
    @cancel="handleCancelDownload"
  />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import FileSystemDownloadDialog from './FileSystemDownloadDialog.vue'

@Component({
  components: {
    FileSystemDownloadDialog
  }
})
export default class FileSystemDownloadWrapper extends Vue {
  get currentDownload () {
    return this.$store.state.files.download
  }

  handleCancelDownload () {
    console.log('TEST')
  }
}
</script>
