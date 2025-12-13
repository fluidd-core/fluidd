declare namespace Moonraker.UpdateManager {
  export interface StatusResponse {
    busy: boolean;
    github_rate_limit: number;
    github_requests_remaining: number;
    github_limit_reset_time: number;
    version_info: VersionInfo;
  }

  export interface VersionInfo extends Record<string, VersionInfoEntry> {
  }

  export type VersionInfoEntry = System | GitRepo | NetHosted | Python

  export interface System {
    configured_type?: 'system';
    name?: string;
    package_count: number;
    package_list: string[];
  }

  export interface GitRepo {
    configured_type: 'git_repo';
    name?: string;
    detected_type: string;
    channel: 'stable' | 'beta' | 'dev';
    channel_invalid: boolean;
    debug_enabled: boolean;
    is_valid: boolean;
    version: string;
    remote_version: string;
    rollback_version: string;
    full_version_string: string;
    remote_hash: string;
    current_hash: string;
    remote_alias: string;
    remote_url: string;
    recovery_url: string;
    owner: string;
    branch: string;
    repo_name: string;
    is_dirty: boolean;
    corrupt: boolean;
    pristine: boolean;
    detached: boolean;
    git_messages: string[];
    anomalies: string[];
    warnings: string[];
    commits_behind: GitRepoCommit[];
    commits_behind_count: number;
    info_tags: string[];
  }

  export interface GitRepoCommit {
    sha: string;
    author: string;
    date: string;
    subject: string;
    message: string;
    tag: string | null;
  }

  export interface NetHosted {
    configured_type: 'web' | 'zip';
    name?: string;
    channel: 'stable' | 'beta';
    channel_invalid: boolean;
    debug_enabled: boolean;
    owner: string;
    repo_name: string;
    last_error: string;
    version: string;
    remote_version: string;
    rollback_version: string;
    is_valid: boolean;
    anomalies: string[];
    warnings: string[];
    info_tags: string[];
  }

  export interface Python {
    configured_type: 'python';
    name?: string;
    channel: 'stable' | 'beta' | 'dev';
    channel_invalid: boolean;
    debug_enabled: boolean;
    owner: string;
    repo_name: string;
    branch: string;
    version: string;
    remote_version: string;
    rollback_version: string;
    full_version_string: string;
    current_hash: string;
    remote_hash: string;
    is_valid: boolean;
    is_dirty: boolean;
    changelog_url: string;
    anomalies: string[];
    warnings: string[];
    info_tags: string[];
  }

}
