declare namespace Moonraker.Authorization {
  export interface InfoResponse {
    default_source: string,
    available_sources: string[]
  }

  export interface RefreshJwtResponse {
    username: string,
    token: string,
    action: 'user_jwt_refresh',
    source: string
  }

  export interface LoginResponse {
    username: string,
    token: string,
    refresh_token: string,
    action: 'user_logged_in',
    source: string
  }

  export interface LogoutResponse {
    username: string,
    action: 'user_logged_out'
  }

  export interface GetUserResponse {
    username: string,
    source: string,
    created_on: number
  }

  export interface UsersListResponse {
    users: {
      username: string,
      source: string,
      created_on: number
    }[]
  }

  export interface PostUserResponse {
    username: string,
    token: string,
    refresh_token: string,
    action: 'user_created',
    source: 'moonraker'
  }

  export interface DeleteUserResponse {
    username: string,
    action: 'user_deleted'
  }

  export interface UserPasswordResponse {
    username: string,
    action: 'user_password_reset'
  }
}
