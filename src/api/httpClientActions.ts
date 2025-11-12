import Vue from 'vue'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

export type AxiosRequestConfigForReturnType<T = unknown, D = unknown> = AxiosRequestConfig<D> & (
  T extends string
    ? { responseType?: 'text' | 'json' }
    : T extends ArrayBuffer
      ? { responseType: 'arraybuffer' }
      : T extends Blob
        ? { responseType: 'blob' }
        : T extends FormData
          ? { responseType: 'formdata' }
          : {}
        )

export const httpClientActions = {
  get<T = unknown, R = AxiosResponse<T>, D = unknown> (url: string, options?: AxiosRequestConfigForReturnType<T, D>) {
    return Vue.$httpClient.get<T, R, D>(url, options)
  },

  post<T = unknown, R = AxiosResponse<T>, D = unknown> (url: string, data: D, options?: AxiosRequestConfigForReturnType<T, D>) {
    return Vue.$httpClient.post<T, R, D>(url, data, options)
  },

  postForm<T = unknown, R = AxiosResponse<T>, D = unknown> (url: string, data: D, options?: AxiosRequestConfigForReturnType<T, D>) {
    return Vue.$httpClient.postForm<T, R, D>(url, data, options)
  },

  delete<T = unknown, R = AxiosResponse<T>, D = unknown> (url: string, options?: AxiosRequestConfigForReturnType<T, D>) {
    return Vue.$httpClient.delete<T, R, D>(url, options)
  },

  get defaults () {
    return Vue.$httpClient.defaults
  },

  accessInfoGet (options?: AxiosRequestConfig) {
    return this.get<{
      result: {
        default_source: string,
        available_sources: string[]
      }
    }>('/access/info', options)
  },

  accessRefreshJwtPost (refresh_token: string, options?: AxiosRequestConfig) {
    return this.post<{
      result: {
        username: string,
        token: string,
        action: 'user_jwt_refresh',
        source: string
      }
    }>('/access/refresh_jwt', { refresh_token }, options)
  },

  accessLoginPost (username: string, password: string, source: string = 'moonraker', options?: AxiosRequestConfig) {
    return this.post<{
      result: {
        username: string,
        token: string,
        refresh_token: string,
        action: 'user_logged_in',
        source: string
      }
    }>('/access/login', {
      username,
      password,
      source
    }, options)
  },

  accessLogoutPost (options?: AxiosRequestConfig) {
    return this.post<{
      result: {
        username: string,
        action: 'user_logged_out'
      }
    }>('access/logout', undefined, options)
  },

  accessOneshotTokenGet (options?: AxiosRequestConfig) {
    return this.get<{
      result: string
    }>('/access/oneshot_token', options)
  },

  accessCurrentUserGet (options?: AxiosRequestConfig) {
    return this.get<{
      result: {
        username: string,
        source: string,
        created_on: number
      }
    }>('/access/user', options)
  },

  accessUsersListGet (options?: AxiosRequestConfig) {
    return this.get<{
      result: {
        users: Array<{
          username: string,
          source: string,
          created_on: number
        }>
      }
    }>('/access/users/list', options)
  },

  accessUserPost (username: string, password: string, options?: AxiosRequestConfig) {
    return this.post<{
      result: {
        username: string,
        token: string,
        refresh_token: string,
        action: 'user_created',
        source: 'moonraker'
      }
    }>('/access/user', {
      username,
      password
    }, options)
  },

  accessUserDelete (username: string, options?: AxiosRequestConfig) {
    return this.delete<{
      result: {
        username: string,
        action: 'user_deleted'
      }
    }>('/access/user', {
      ...options,
      params: { username }
    })
  },

  accessUserPasswordPost (password: string, new_password: string, options?: AxiosRequestConfig) {
    return this.post<{
      result: {
        username: string,
        action: 'user_password_reset'
      }
    }>('/access/user/password', {
      password,
      new_password
    }, options)
  },

  accessApiKeyGet (options?: AxiosRequestConfig) {
    return this.get<{
      result: string
    }>('/access/api_key', options)
  },

  accessApiKeyPost (options?: AxiosRequestConfig) {
    return this.post<{
      result: string
    }>('/access/api_key', undefined, options)
  },

  serverDatabaseItemGet<T = unknown> (namespace: string, options?: AxiosRequestConfig) {
    return this.get<{
      result: {
        namespace: string,
        key: string,
        value: T
      }
    }>(`/server/database/item?namespace=${namespace}`, options)
  },

  serverDatabaseItemPost<T = unknown> (namespace: string, key: string, value: T, options?: AxiosRequestConfig) {
    return this.post<{
      result: {
        namespace: string,
        key: string,
        value: T
      }
    }>('/server/database/item', {
      namespace,
      key,
      value
    }, options)
  },

  serverDatabaseItemDelete<T = unknown> (namespace: string, key: string, options?: AxiosRequestConfig) {
    return this.delete<{
      result: {
        namespace: string,
        key: string,
        value: T
      }
    }>(`/server/database/item?namespace=${namespace}&key=${key}`, options)
  },

  serverFilesUploadPost (file: File, path: string, root: string, print?: boolean, options?: AxiosRequestConfig) {
    const formData = new FormData()

    formData.append('file', file, file.name)
    formData.append('path', path)
    formData.append('root', root)
    if (print) {
      formData.append('print', 'true')
    }

    return this.postForm<{
      result: {
        item: {
          modified?: number,
          size?: number,
          permissions?: string,
          path: string,
          root: string
        }
        print_started?: boolean,
        print_queued?: boolean,
        action: 'create_file'
      }
    }>('/server/files/upload', formData, options)
  },

  serverFilesGet<T = unknown> (filepath: string, options?: AxiosRequestConfigForReturnType<T>) {
    const encodedFilepath = filepath
      .replace(/[^/]+/g, match => encodeURIComponent(match))

    return this.get<T>(`/server/files/${encodedFilepath}?date=${Date.now()}`, options)
  }
}
