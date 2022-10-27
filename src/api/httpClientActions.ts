import Vue from 'vue'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

export const httpClientActions = {
  get<T = any, R = AxiosResponse<T>, D = any> (url: string, options?: AxiosRequestConfig) {
    return Vue.$httpClient.get<T, R, D>(url, options)
  },

  post<T = any, R = AxiosResponse<T>, D = any> (url: string, data: any, options?: AxiosRequestConfig) {
    return Vue.$httpClient.post<T, R, D>(url, data, options)
  },

  delete<T = any, R = AxiosResponse<T>, D = any> (url: string, options?: AxiosRequestConfig) {
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
        action: string,
        source: string
      }
    }>('/access/refresh_jwt', { refresh_token }, options)
  },

  accessLoginPost (username: string, password: string, source = 'moonraker', options?: AxiosRequestConfig) {
    return this.post<{
      result: {
        username: string,
        token: string,
        refresh_token: string,
        action: string,
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
        action: string
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
        source: 'moonraker' | 'ldap',
        created_on: number
      }
    }>('/access/user', options)
  },

  accessUsersListGet (options?: AxiosRequestConfig) {
    return this.get<{
      result: {
        users: Array<{
          username: string,
          source: 'moonraker' | 'ldap',
          created_on: number
        }>
      }
    }>('/access/users/list', options)
  },

  accessUserPost (username: string, password: string, options?: AxiosRequestConfig) {
    return this.post('/access/user', {
      username,
      password
    }, options)
  },

  accessUserDelete (username: string, options?: AxiosRequestConfig) {
    return this.delete<{
      result: {
        username: string,
        action: string
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
        action: string
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

  serverDatabaseItemGet<T = any> (namespace: string, options?: AxiosRequestConfig) {
    return this.get<{
      result: {
        namespace: string,
        key: string,
        value: T
      }
    }>(`/server/database/item?namespace=${namespace}`, options)
  },

  serverDatabaseItemPost<T = any> (namespace: string, key: string, value: any, options?: AxiosRequestConfig) {
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

  serverFilesUploadPost (data: FormData, options?: AxiosRequestConfig) {
    return this.post<{
      result: {
        item: {
          path: string,
          root: string
        }
        print_started?: boolean,
        action: string
      }
    }>('/server/files/upload', data, options)
  },

  serverFilesGet<R = any> (filepath: string, options?: AxiosRequestConfig) {
    return this.get<R>(`/server/files/${filepath}?date=${Date.now()}`, options)
  }
}
