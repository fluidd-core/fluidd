export interface VersionState {
  [key: string]: boolean | number | VersionComponents | FluiddVersion | UpdateResponse[];
  busy: boolean;
  refreshing: boolean;
  github_limit_reset_time: number;
  github_rate_limit: number;
  github_requests_remaining: number;
  version_info: VersionComponents;
  responses: UpdateResponse[];
  fluidd: FluiddVersion;
}

export interface VersionComponents {
  [key: string]: HashVersion | ArtifactVersion | OSPackage;
}

/** For klipper / moonraker */
export interface HashVersion {
  key: string;
  branch: string;
  commits_behind: CommitItem[];
  current_hash: string;
  debug_enabled: boolean;
  detached: boolean;
  git_messages: string[];
  is_dirty: boolean;
  is_valid: boolean;
  owner: string;
  remote_alias: string;
  remote_hash: string;
  remote_version: string;
  version: string;
  full_version_string: string;
}

export interface CommitItem {
  author: string;
  date: string; // number
  message: string | null;
  sha: string;
  subject: string;
  tag: string | null;
}

/** For system OS */
export interface OSPackage {
  key: string;
  package_count: number;
  package_list: string[];
}

/** For clients */
export interface ArtifactVersion {
  key: string;
  name: string;
  owner: string;
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
