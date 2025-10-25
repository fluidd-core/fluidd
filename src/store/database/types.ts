export interface DatabaseState {
  info: DatabaseInfo | null;
}

export interface DatabaseInfo {
  namespaces: string[];
  backups: string[];
}
