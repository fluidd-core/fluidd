import type { AppFile, FileUpload, AppFileThumbnail, KlipperFileMeta, FileDownload } from '@/store/files/types'
import Vue from 'vue'
import { Component } from 'vue-property-decorator'
import type { AxiosRequestConfig, AxiosProgressEvent } from 'axios'
import { httpClientActions } from '@/api/httpClientActions'
import type { FileWithPath } from '@/types'
import consola from 'consola'
import { v4 as uuidv4 } from 'uuid'

@Component
export default class FilesMixin extends Vue {
  get apiUrl (): string {
    return this.$store.state.config.apiUrl
  }

  get isTrustedUser (): boolean {
    return this.$store.getters['auth/getCurrentUser']?.username === '_TRUSTED_USER_'
  }

  getThumbUrl (meta: KlipperFileMeta, root: string, path: string, large: boolean, date?: number) {
    const thumb = this.getThumb(meta, root, path, large, date)

    return thumb?.url ?? ''
  }

  getThumb (meta: KlipperFileMeta, root: string, path: string, large = true, date?: number): AppFileThumbnail | undefined {
    if (meta.thumbnails?.length) {
      const thumb = meta.thumbnails.reduce((a, b) => (a.size > b.size) === large ? a : b)

      if (thumb.relative_path) {
        const filepath = path ? `${root}/${path}` : root

        return {
          ...thumb,
          url: this.createFileUrl(thumb.relative_path, filepath, date)
        }
      }
    }
  }

  /**
   * Loads a gcode file and parses for the gcode-viewer.
   */
  async getGcode (file: AppFile) {
    const sizeInMB = file.size / 1024 / 1024

    const result = (
      sizeInMB < 100 ||
      await this.$confirm(
        this.$t('app.gcode.msg.confirm', {
          filename: file.filename,
          size: this.$filters.getReadableFileSizeString(file.size)
        }).toString(), {
          title: this.$tc('app.general.title.gcode_preview'),
          color: 'card-heading',
          icon: '$error'
        })
    )

    if (result) {
      const path = file.path ? `gcodes/${file.path}` : 'gcodes'
      return await this.getFile<string>(file.filename, path, file.size, {
        responseType: 'text',
        transformResponse: [v => v]
      })
    }
  }

  /**
   * Will retrieve a file blob for independent processing.
   * @param filename The filename to retrieve
   * @param path The path to the file
   */
  async getFile<T = any> (filename: string, path: string, size = 0, options?: AxiosRequestConfig) {
    const currentDownload: FileDownload | null = this.$store.state.files.download

    if (currentDownload) {
      currentDownload.abortController.abort()

      this.$store.dispatch('files/removeFileDownload', currentDownload.uid)
    }

    // Sort out the filepath
    const filepath = path
      ? `${path}/${filename}`
      : filename
    const uid = uuidv4()

    try {
      const abortController = new AbortController()

      // Add an entry to vuex indicating we're downloading a file.
      this.$store.dispatch('files/updateFileDownload', {
        uid,
        filepath,
        size,
        loaded: 0,
        percent: 0,
        speed: 0,
        abortController
      })

      const response = await httpClientActions.serverFilesGet<T>(filepath, {
        ...options,
        signal: abortController.signal,
        onDownloadProgress: (event: AxiosProgressEvent) => {
          if (abortController.signal.aborted) {
            return
          }

          const progress = event.progress ?? (
            size > 0
              ? event.loaded / size
              : 0
          )

          const payload: any = {
            uid,
            loaded: event.loaded,
            percent: Math.round(progress * 100),
            speed: event.rate ?? 0
          }

          if (event.total) {
            size = payload.size = event.total
          }

          this.$store.dispatch('files/updateFileDownload', payload)
        }
      })

      abortController.abort()

      return response
    } finally {
      this.$store.dispatch('files/removeFileDownload', uid)
    }
  }

  /**
   * Will download a file by filepath via a standard browser link.
   * @param filename The filename to retrieve.
   * @param path The path to the file.
   */
  async downloadFile (filename: string, path: string) {
    // Grab a oneshot.
    try {
      const url = await this.createFileUrlWithToken(filename, path)

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
  createFileUrl (filename: string, path: string, date?: number) {
    const filepath = (path) ? `${path}/${filename}` : `${filename}`

    const encodedFilepath = filepath
      .replace(/[^/]+/g, match => encodeURIComponent(match))

    return `${this.apiUrl}/server/files/${encodedFilepath}?date=${date || Date.now()}`
  }

  async createFileUrlWithToken (filename: string, path: string, date?: number) {
    const url = this.createFileUrl(filename, path, date)

    return this.isTrustedUser
      ? url
      : `${url}&token=${(await httpClientActions.accessOneshotTokenGet()).data.result}`
  }

  /**
   * Uploads a single file via moonraker.
   * @param file The file object. Contains the filename.
   * @param path The path we're uploading to.
   * @param root The root we're downloading from.
   * @param andPrint If we should attempt to print this file or not.
   * @param options Axios request options
   */
  async uploadFile (file: File, path: string, root: string, andPrint: boolean, uid?: string, options?: AxiosRequestConfig) {
    const filepath = path
      ? `${path}/${file.name}`
      : file.name
    uid = uid || uuidv4()

    try {
      const abortController = new AbortController()

      this.$store.dispatch('files/updateFileUpload', {
        uid,
        filepath,
        size: file.size,
        loaded: 0,
        percent: 0,
        speed: 0,
        cancelled: false,
        complete: false,
        abortController
      } satisfies FileUpload)

      const response = await httpClientActions.serverFilesUploadPost(file, path, root, andPrint, {
        ...options,
        signal: abortController.signal,
        onUploadProgress: (event: AxiosProgressEvent) => {
          if (abortController.signal.aborted) {
            return
          }

          this.$store.dispatch('files/updateFileUpload', {
            uid,
            loaded: event.loaded,
            percent: event.progress ? Math.round(event.progress * 100) : 0,
            speed: event.rate ?? 0
          })
        }
      })

      abortController.abort()

      return response
    } finally {
      this.$store.dispatch('files/removeFileUpload', uid)
    }
  }

  getFullPathAndFile (rootPath: string, file: File | FileWithPath): [string, File] {
    if ('path' in file) {
      return [
        [rootPath, file.path]
          .filter(path => !!path)
          .join('/'),
        file.file
      ]
    } else {
      return [
        rootPath,
        file
      ]
    }
  }

  // Upload some files.
  async uploadFiles (files: FileList | File[] | FileWithPath[], path: string, root: string, andPrint: boolean) {
    // For each file, adds the associated state.
    const fileUploads = [...files]
      .map(file => {
        const uid = uuidv4()
        const [fullPath, fileObject] = this.getFullPathAndFile(path, file)

        const filepath = fullPath
          ? `${fullPath}/${fileObject.name}`
          : fileObject.name

        this.$store.dispatch('files/updateFileUpload', {
          uid,
          filepath,
          size: fileObject.size,
          loaded: 0,
          percent: 0,
          speed: 0,
          cancelled: false,
          complete: false
        })

        return {
          uid,
          file
        }
      })

    // Async uploads cause issues in moonraker / klipper.
    // So instead, upload sequentially waiting for moonraker to finish
    // processing of each file.
    if (fileUploads.length > 1) andPrint = false
    for (const fileUpload of fileUploads) {
      const [fullPath, fileObject] = this.getFullPathAndFile(path, fileUpload.file)

      const fileState = this.$store.state.files.uploads.find((u: FileUpload) => u.uid === fileUpload.uid)

      if (fileState && !fileState?.cancelled) {
        try {
          await this.uploadFile(fileObject, fullPath, root, andPrint, fileUpload.uid)
        } catch (error: unknown) {
          consola.error('[FileUpload] file', error)
        }
      } else {
        this.$store.dispatch('files/removeFileUpload', fileUpload.uid)
      }
    }
  }
}
