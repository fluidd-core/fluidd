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
