declare namespace Moonraker.Authorization {
  export interface InfoResponse {
    default_source: Source;
    available_sources: Source[];
    login_required: boolean;
    trusted: boolean | null;
  }

  export interface RefreshJwtResponse {
    username: string;
    token: string;
    action: 'user_jwt_refresh';
    source: Source;
  }

  export interface LoginResponse {
    username: string;
    token: string;
    refresh_token: string;
    action: 'user_logged_in';
    source: Source;
  }

  export interface LogoutResponse {
    username: string;
    action: 'user_logged_out';
  }

  export interface User {
    username: string;
    source: Source;
    created_on: number;
  }

  export type GetUserResponse = User | {
    username: null;
    source: null;
    created_on: null;
  }

  export interface UsersListResponse {
    users: User[]
  }

  export interface PostUserResponse {
    username: string;
    token: string;
    refresh_token: string;
    action: 'user_created';
    source: 'moonraker';
  }

  export interface DeleteUserResponse {
    username: string;
    action: 'user_deleted';
  }

  export interface UserPasswordResponse {
    username: string;
    action: 'user_password_reset';
  }

  export type Source = 'moonraker' | 'ldap'
}

declare namespace Moonraker {
  export interface Methods {
    'access.info': {
      params: undefined,
      result: Authorization.InfoResponse
    },
    'access.refresh_jwt': {
      params: {
        refresh_token: string
      },
      result: Authorization.RefreshJwtResponse
    },
    'access.login': {
      params: {
        username: string,
        password: string,
        source?: Authorization.Source
      },
      result: Authorization.LoginResponse
    },
    'access.logout': {
      params: undefined,
      result: Authorization.LogoutResponse
    },
    'access.oneshot_token': {
      params: undefined,
      result: StringResponse
    },
    'access.get_user': {
      params: undefined,
      result: Authorization.GetUserResponse
    },
    'access.users.list': {
      params: undefined,
      result: Authorization.UsersListResponse
    },
    'access.post_user': {
      params: {
        username: string,
        password: string,
        source?: Authorization.Source
      },
      result: Authorization.PostUserResponse
    },
    'access.delete_user': {
      params: {
        username: string
      },
      result: Authorization.DeleteUserResponse
    },
    'access.user.password': {
      params: {
        password: string,
        new_password: string
      },
      result: Authorization.UserPasswordResponse
    },
    'access.get_api_key': {
      params: undefined,
      result: StringResponse
    },
    'access.post_api_key': {
      params: undefined,
      result: StringResponse
    }
  }
}
