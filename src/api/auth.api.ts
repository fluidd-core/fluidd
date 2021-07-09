import httpClient from './httpClient'
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { AppUser } from '@/store/auth/types'

export const authApi = {
  /**
   * Log the user in.
   * Doesn't require auth.
   */
  async login (username: string, password: string): Promise<AxiosResponse> {
    return await httpClient.post('/access/login', {
      username,
      password
    }, { withAuth: false })
  },

  /**
   * Refresh the tokens, given a refresh_token.
   * Doesn't require auth.
   */
  async refresh (refresh_token: string | null) {
    return await httpClient.post('/access/refresh_jwt', {
      refresh_token
    }, { withAuth: false })
  },

  /**
   * Logout the user.
   * Doesn't require auth.
   */
  async logout (): Promise<AxiosResponse> {
    return await httpClient.post('access/logout', null, { withAuth: false })
  },

  /**
   * Grab a oneshot token.
   * Doesn't require auth.
   */
  async getOneShot (): Promise<AxiosResponse> {
    return await httpClient.get('/access/oneshot_token')
  },

  /**
   * Retrieves the currently authenticated user.
   */
  async getCurrentUser (options?: AxiosRequestConfig | undefined): Promise<AxiosResponse> {
    return await httpClient.get('/access/user', options)
  },

  /**
   * Retrieves available users.
   */
  async getUsers (): Promise<AxiosResponse> {
    return await httpClient.get('/access/users/list')
  },

  /**
   * Adds a user.
   */
  async addUser (user: AppUser): Promise<AxiosResponse> {
    return await httpClient.post('/access/user', user)
  },

  /**
   * Removes a user.
   */
  async removeUser (user: AppUser): Promise<AxiosResponse> {
    return await httpClient.delete('/access/user', {
      params: { username: user.username }
    })
  },

  /**
   * Change a users password.
   */
  async changePassword (password: string, new_password: string): Promise<AxiosResponse> {
    return await httpClient.post('/access/user/password', { password, new_password })
  },

  /**
   * Retrieves the current API Key.
   */
  async getApiKey () {
    return await httpClient.get('/access/api_key')
  },

  /**
   * Refreshes the current API Key.
   */
  async refreshApiKey () {
    return await httpClient.post('/access/api_key')
  }
}
