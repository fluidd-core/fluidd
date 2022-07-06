import httpClient from './httpClient'
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { AppUser } from '@/store/auth/types'

export const authApi = {
  async login (username: string, password: string, source = 'moonraker'): Promise<AxiosResponse> {
    return await httpClient.post('/access/login', {
      username,
      password,
      source
    })
  },

  async logout (): Promise<AxiosResponse> {
    return await httpClient.post('access/logout')
  },

  async getOneShot (): Promise<AxiosResponse> {
    return await httpClient.get('/access/oneshot_token')
  },

  /**
   * Retrieves the currently authenticated user.
   */
  async getCurrentUser (options?: AxiosRequestConfig | undefined): Promise<AxiosResponse> {
    return await httpClient.get('/access/user', options)
  },

  async getUsers (): Promise<AxiosResponse> {
    return await httpClient.get('/access/users/list')
  },

  async addUser (user: AppUser): Promise<AxiosResponse> {
    return await httpClient.post('/access/user', user)
  },

  async removeUser (user: AppUser): Promise<AxiosResponse> {
    return await httpClient.delete('/access/user', {
      params: { username: user.username }
    })
  },

  async changePassword (password: string, new_password: string): Promise<AxiosResponse> {
    return await httpClient.post('/access/user/password', { password, new_password })
  },

  async getApiKey () {
    return await httpClient.get('/access/api_key')
  },

  async refreshApiKey () {
    return await httpClient.post('/access/api_key')
  }
}
