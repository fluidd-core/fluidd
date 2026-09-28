declare namespace Moonraker.Database {
  export interface ListResponse {
    namespaces: string[];
    backups: string[];
  }

  export interface CompactResponse {
    previous_size: number;
    new_size: number;
  }

  export interface PostBackupResponse {
    backup_path: string
  }

  export interface RestoreResponse {
    restored_tables: string[];
    restored_namespaces: string[];
  }

  export interface DeleteBackupResponse {
    backup_path: string;
  }

  export interface PostItemResponse<T = unknown> {
    namespace: string;
    key: string;
    value: T;
  }

  export interface DeleteItemResponse<T = unknown> {
    namespace: string;
    key: string;
    value: T;
  }

  export interface GetItemResponse<T = unknown> {
    namespace: string;
    key?: string;
    value: T;
  }
}

declare namespace Moonraker {
  export interface Methods {
    'server.database.list': {
      params: undefined,
      result: Database.ListResponse
    },
    'server.database.compact': {
      params: undefined,
      result: Database.CompactResponse
    },
    'server.database.post_backup': {
      params: {
        filename?: string
      },
      result: Database.PostBackupResponse
    },
    'server.database.restore': {
      params: {
        filename: string
      },
      result: Database.RestoreResponse
    },
    'server.database.delete_backup': {
      params: {
        filename: string
      },
      result: Database.DeleteBackupResponse
    },
    'server.database.post_item': {
      params: {
        namespace: string,
        key: string | string[],
        value: unknown
      },
      result: Database.PostItemResponse
    },
    'server.database.delete_item': {
      params: {
        namespace: string,
        key: string | string[]
      },
      result: Database.DeleteItemResponse
    },
    'server.database.get_item': {
      params: {
        namespace: string,
        key?: string | string[] | null
      },
      result: Database.GetItemResponse
    }
  }
}
