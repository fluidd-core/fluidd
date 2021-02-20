export interface VersionState {
  [key: string]: boolean | number | VersionComponents | FluiddVersion | UpdateResponse[];
  busy: boolean;
  refreshing: boolean;
  github_limit_reset_time: number;
  github_rate_limit: number;
  github_requests_remaining: number;
  skipClientUpdates: boolean;
  responses: UpdateResponse[];
  components: VersionComponents;
  fluidd: FluiddVersion;
}

export interface VersionComponents {
  [key: string]: HashVersion | ArtifactVersion | OSPackage;
}

/** For klipper / moonraker */
export interface HashVersion {
  type: string;
  version: string;
  remote_version: string;
  remote_alias: string;
  current_hash: string;
  remote_hash: string;
  branch: string;
  is_valid: boolean;
  is_dirty: boolean;
  detached: boolean;
  debug_enabled: boolean;
}

/** For system OS */
export interface OSPackage {
  type: string;
  package_count: number;
  package_list: string[];
}

/** For clients */
export interface ArtifactVersion {
  type: string;
  name: string;
  version: string;
  remote_version: string;
}

export interface FluiddVersion {
  version: string;
  hash: string;
}

export interface UpdateResponse {
  id: number;
  message: string;
  application: string;
  proc_id: number;
}
