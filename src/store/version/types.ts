export interface VersionState {
  busy: boolean;
  github_rate_limit: number;
  github_requests_remaining: number;
  github_limit_reset_time: number;
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
  configured_type?: string;
  detected_type?: string;
  channel?: string;
  pristine?: boolean;
  owner: string;
  branch: string;
  remote_alias: string;
  version: string;
  remote_version: string;
  rollback_version?: string;
  full_version_string: string;
  current_hash: string;
  remote_hash: string;
  is_valid: boolean;
  corrupt?: boolean;
  is_dirty: boolean;
  detached: boolean;
  debug_enabled: boolean;
  commits_behind: CommitItem[];
  git_messages: string[];
  info_tags?: string[];
  recovery_url?: string;
  remote_url?: string;
  warnings?: string[];
  anomalies?: string[];
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
  channel?: string;
  configured_type?: string;
  name: string;
  owner: string;
  version: string;
  remote_version: string;
  rollback_version?: string;
  info_tags?: string[];
  is_valid: boolean;
  warnings?: string[];
  anomalies?: string[];
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
