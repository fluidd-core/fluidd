export interface VersionState {
  status: UpdateStatus | null;
  responses: UpdateResponse[];
}

export interface UpdateStatus {
  busy: boolean;
  github_rate_limit: number;
  github_requests_remaining: number;
  github_limit_reset_time: number;
  version_info: Record<string, MoonrakerVersionInfo>;
}

export type MoonrakerVersionInfo = MoonrakerSystemVersionInfo | MoonrakerGitRepoVersionInfo | MoonrakerNetHostedVersionInfo | MoonrakerPythonPackageVersionInfo

export interface MoonrakerSystemVersionInfo {
  configured_type?: 'system';
  name?: string;
  package_count: number;
  package_list: string[];
}

export interface MoonrakerGitRepoVersionInfo {
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
  commits_behind: MoonrakerGitRepoCommit[];
  commits_behind_count: number;
  info_tags: string[];
}

export interface MoonrakerGitRepoCommit {
  author: string;
  date: string;
  sha: string;
  subject: string;
  message: string;
  tag: string | null;
}

export interface MoonrakerNetHostedVersionInfo {
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

export interface MoonrakerPythonPackageVersionInfo {
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

export type VersionInfo = MoonrakerVersionInfo extends { configured_type?: infer K }
  ? MoonrakerVersionInfo & { configured_type: K, name: string }
  : never

export interface UpdateResponse {
  id: number;
  message: string;
  application: string;
  proc_id: number;
}
