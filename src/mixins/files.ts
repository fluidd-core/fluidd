import { AppFile, FilesUpload, Thumbnail } from '@/store/files/types'
import Vue from 'vue'
import httpClient from '@/api/httpClient'
import { Component } from 'vue-property-decorator'
import { getThumb } from '@/store/helpers'
import Axios, { AxiosRequestConfig, CancelTokenSource } from 'axios'
import { authApi } from '@/api/auth.api'

@Component
export default class FilesMixin extends Vue {
  // Maintains a cancel token source should we need to disable a request.
  cancelTokenSource: CancelTokenSource | undefined = undefined

  get apiUrl () {
    return this.$store.state.config.apiUrl
  }

  getThumbUrl (thumbnails: Thumbnail[], path: string, large: boolean, cachebust?: number) {
    if (thumbnails.length) {
      if (!cachebust) cachebust = new Date().getTime()
      const thumb = getThumb(thumbnails, path, large)
      if (
        thumb &&
        thumb.absolute_path
      ) return `${thumb.absolute_path}?cachebust=${cachebust}`
      if (
        thumb &&
        thumb.data
      ) return thumb.data
    }
    return ''
  }

  /**
   * Loads a gcode file and parses for the gcode-viewer.
   */
  async getGcode (file: AppFile) {
    const sizeInMB = file.size / 1024 / 1024
    let res: boolean | undefined = true

    if (sizeInMB >= 100) {
      res = await this.$confirm(
        this.$t('app.gcode.msg.confirm', {
          filename: file.filename,
          size: this.$filters.getReadableFileSizeString(file.size)
        }).toString(), {
          title: this.$tc('app.general.title.gcode_preview'),
          color: 'card-heading',
          icon: '$error'
        })
    }

    if (res) {
      this.cancelTokenSource = Axios.CancelToken.source()
      const path = file.path ? `${file.path}/${file.filename}` : file.filename
      return await this.getFile(path, 'gcodes', file.size, {
        responseType: 'text',
        transformResponse: [v => v],
        cancelToken: this.cancelTokenSource.token
      })
    }
  }

  /**
   * Will retrieve a file blob for independent processing.
   * @param filename The filename to retrieve
   * @param path The path to the file
   */
  async getFile (filename: string, path: string, size = 0, options?: AxiosRequestConfig) {
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
        let speed = 0
        let i = 0
        const delta = performance.now() - startTime
        if (delta > 0) {
          speed = progressEvent.loaded / delta
          while (speed > 1024) {
            speed /= 1024
            i = Math.min(2, i + 1)
          }
        }

        const payload: any = {
          filepath,
          loaded: progressEvent.loaded,
          percent: Math.round(progressEvent.loaded / size * 100),
          speed,
          unit: units[i]
        }

        if (progressEvent.lengthComputable) {
          size = payload.size = progressEvent.total
        }

        this.$store.dispatch('files/updateFileDownload', payload)
      }
    }

    return await httpClient.get(encodeURI(this.apiUrl + '/server/files/' + filepath + '?date=' + new Date().getTime()), o)
  }

  /**
   * Will download a file by filepath via a standard browser link.
   * @param filename The filename to retrieve.
   * @param path The path to the file.
   */
  async downloadFile (filename: string, path: string) {
    // Grab a oneshot.
    try {
      const url = encodeURI(await this.createFileUrl(filename, path))

      // Create a link, handle its click - and finally remove it again.
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      link.setAttribute('target', '_blank')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      // Likely a 401.
    }
  }

  /**
   * Creates a url for a file by filepath.
   * Implements a oneshot.
   * @param filename The filename.
   * @param path The path to the file.
   * @returns The url for the requested file
   */
  async createFileUrl (filename: string, path: string) {
    const token = (await authApi.getOneShot()).data.result

    const filepath = (path) ? `${path}/${filename}` : `${filename}`

    return `${this.apiUrl}/server/files/${filepath}?token=${token}&date=${Date.now()}`
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
      unit: 'kB',
      cancelled: false
    })

    return httpClient
      .post(
        this.apiUrl + '/server/files/upload',
        formData, {
          ...options,
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent: ProgressEvent) => {
            const units = ['kB', 'MB', 'GB']
            let speed = 0
            let i = 0
            const delta = performance.now() - startTime
            if (delta > 0) {
              speed = progressEvent.loaded / delta
              while (speed > 1024) {
                speed /= 1024
                i = Math.min(2, i + 1)
              }
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
    // For each file, adds the associated state.
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
        unit: 'kB',
        cancelled: false
      })
    }

    // Async uploads cause issues in moonraker / klipper.
    // So instead, upload sequentially waiting for moonraker to finish
    // processing of each file.
    if (files.length > 1) andPrint = false
    for (const file of files) {
      let filepath = `${path}/${file.name}`
      filepath = (filepath.startsWith('/'))
        ? filepath
        : '/' + filepath
      const fileState = this.$store.state.files.uploads.find((u: FilesUpload) => u.filepath === filepath)
      // consola.error('about to process...', fileState)
      if (fileState && !fileState?.cancelled) {
        try {
          this.cancelTokenSource = Axios.CancelToken.source()
          await this.uploadFile(file, path, root, andPrint, {
            cancelToken: this.cancelTokenSource.token
          })
        } catch (e) {
          return e
        }
      } else {
        this.$store.dispatch('files/removeFileUpload', filepath)
      }
    }
  }
}
