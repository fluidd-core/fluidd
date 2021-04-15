import { Thumbnail } from '@/store/files/types'
import Vue from 'vue'
import { Component } from 'vue-property-decorator'
import { getThumb } from '@/store/helpers'
import { AxiosRequestConfig } from 'axios'
// import { EventBus, FlashMessageTypes } from '@/eventBus'

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

  /**
   * Will retrieve a file blob for independent processing.
   * @param filename The filename to retrieve
   * @param path The path to the file
   */
  async getFile (filename: string, path: string, size: number, options?: AxiosRequestConfig) {
    // Sort out the filepath
    const filepath = (path) ? `${path}/${filename}` : `${filename}`

    // Add an entry to vuex indicating we're downloading a file.
    const startTime = performance.now()
    this.$store.dispatch('files/updateFileDownload', {
      // starttime: performance.now(),
      filepath,
      size,
      loaded: 0,
      percent: 0,
      speed: 0,
      unit: 'kB'
    })

    // Append any additional options.
    const o = {
      ...options,
      onDownloadProgress: (progressEvent: ProgressEvent) => {
        const units = ['kB', 'MB', 'GB']
        let speed = progressEvent.loaded / (performance.now() - startTime)
        let i = 0
        while (speed > 1024) {
          speed /= 1024.0
          i = Math.min(2, i + 1)
        }
        this.$store.dispatch('files/updateFileDownload', {
          filepath,
          loaded: progressEvent.loaded,
          percent: Math.round(progressEvent.loaded / size * 100),
          speed,
          unit: units[i]
        })
      }
    }

    return this.$http.get(
      encodeURI(this.apiUrl + '/server/files/' + filepath + '?date=' + new Date().getTime()),
      o
    )
      .then(response => {
        return response
      })
      .catch(e => {
        return e
      })
      .finally(() => {
        this.$store.dispatch('files/removeFileDownload')
      })
  }

  /**
   * Will download a file by filepath via a standard browser link.
   * @param filename The filename to retrieve.
   * @param path The path to the file.
   */
  downloadFile (filename: string, path: string) {
    // Sort out the filepath and url.
    const filepath = (path) ? `${path}/${filename}` : `${filename}`
    const url = encodeURI(this.apiUrl + '/server/files/' + filepath + '?date=' + new Date().getTime())

    // Create a link, handle its click - and finally remove it again.
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    link.setAttribute('target', '_blank')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Uploads a single file via moonraker.
   * @param file The file object. Contains the filename.
   * @param path The path we're uploading to.
   * @param root The root we're downloading from.
   * @param andPrint If we should attempt to print this file or not.
   * @param options Axios request options
   */
  async uploadFile (file: File, path: string, root: string, andPrint: boolean, options?: AxiosRequestConfig) {
    const formData = new FormData()
    // let filename = file.name.replace(' ', '_')
    let filepath = `${path}/${file.name}`
    filepath = (filepath.startsWith('/'))
      ? filepath
      : '/' + filepath
    formData.append('file', file, filepath)
    formData.append('root', root)
    if (andPrint) {
      formData.append('print', 'true')
    }

    const startTime = performance.now()
    this.$store.dispatch('files/updateFileUpload', {
      filepath,
      size: file.size,
      loaded: 0,
      percent: 0,
      speed: 0,
      unit: 'kB'
    })

    return this.$http
      .post(
        this.apiUrl + '/server/files/upload',
        formData, {
          ...options,
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent: ProgressEvent) => {
            const units = ['kB', 'MB', 'GB']
            let speed = progressEvent.loaded / (performance.now() - startTime)
            let i = 0
            while (speed > 1024) {
              speed /= 1024.0
              i = Math.min(2, i + 1)
            }
            this.$store.dispatch('files/updateFileUpload', {
              filepath,
              loaded: progressEvent.loaded,
              percent: Math.round(progressEvent.loaded / progressEvent.total * 100),
              speed,
              unit: units[i]
            })
          }
        }
      )
      .then((response) => {
        return response
      })
      .catch(e => {
        return e
      })
      .finally(() => {
        this.$store.dispatch('files/removeFileUpload', filepath)
      })
  }

  // Upload some files.
  async uploadFiles (files: FileList | File[], path: string, root: string, andPrint: boolean) {
    // Add a file upload for each intended file.
    for (const file of files) {
      let filepath = `${path}/${file.name}`
      filepath = (filepath.startsWith('/'))
        ? filepath
        : '/' + filepath
      this.$store.dispatch('files/updateFileUpload', {
        filepath,
        size: file.size,
        loaded: 0,
        percent: 0,
        speed: 0,
        unit: 'kB'
      })
    }

    // Async uploads cause issues in moonraker / klipper.
    // So instead, upload sequentially waiting for moonraker to finish
    // processing of each file.
    if (files.length > 1) andPrint = false
    for (const file of files) {
      try {
        await this.uploadFile(file, path, root, andPrint)
      } catch (e) {
        return e
        // EventBus.$emit('flashMessage', { type: 'error', text: `Error uploading ${file.name}<br />${e}` })
      }
    }
  }
}
