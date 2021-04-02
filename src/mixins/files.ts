import { Thumbnail } from '@/store/files/types'
import Vue from 'vue'
import { Component } from 'vue-property-decorator'
import { getThumb } from '@/store/helpers'
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import EventBus from '@/eventBus'

@Component
export default class FilesMixin extends Vue {
  get apiUrl () {
    return this.$store.state.config.apiUrl
  }

  getThumbUrl (thumbnails: Thumbnail[], path: string, goLarge: boolean) {
    if (thumbnails.length) {
      const thumb = getThumb(thumbnails, path, goLarge)
      if (
        thumb &&
        thumb.absolute_path
      ) return thumb.absolute_path
      if (
        thumb &&
        thumb.data
      ) return thumb.data
    }
    return ''
  }

  // Retrieves a file from moonraker.
  getFile (path: string, options?: AxiosRequestConfig) {
    const o = { ...options }
    return this.$http.get(
      encodeURI(this.apiUrl + '/server/files/' + path + '?date=' + new Date().getTime()),
      o
    )
  }

  // Download a file.
  async downloadFile (filename: string, path: string) {
    const filepath = (path) ? `${path}/${filename}` : `${filename}`
    this.getFile(filepath, { responseType: 'blob' })
      .then((response: AxiosResponse) => {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
      })
  }

  /**
   * Uploads a single file via moonraker.
   * @param file The file object. Contains the filename.
   * @param path The path we're uploading to, incl root.
   * @param andPrint If we should attempt to print this file or not.
   */
  async uploadFile (file: File, path: string, root: string, andPrint: boolean) {
    const formData = new FormData()
    let filename = file.name.replace(' ', '_')
    filename = `${path}/${filename}`
    filename = (filename.startsWith('/'))
      ? filename
      : '/' + filename
    formData.append('file', file, filename)
    formData.append('root', root)
    if (andPrint) {
      formData.append('print', 'true')
    }

    this.$store.dispatch('files/addFileUpload', { filename, percentComplete: 0 })

    return this.$http
      .post(
        this.apiUrl + '/server/files/upload',
        formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent: ProgressEvent) => {
            const percentComplete = Math.round(progressEvent.loaded / progressEvent.total * 100)
            this.$store.dispatch('files/updateFileUpload', { filename, percentComplete })
          }
        }
      )
      .then((response) => {
        this.$store.dispatch('files/removeFileUpload', filename)
        return response
      })
  }

  // Upload some files.
  async uploadFiles (files: FileList, path: string, root: string, andPrint: boolean) {
    // Async uploads cause issues in moonraker / klipper.
    // So instead, upload sequentially.
    if (files.length > 1) andPrint = false
    for (const file of files) {
      try {
        await this.uploadFile(file, path, root, andPrint)
      } catch (e) {
        EventBus.$emit('flashMessage', { type: 'error', text: `Error uploading ${file.name}<br />${e}` })
      }
    }
  }
}
