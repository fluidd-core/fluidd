export interface VersionState {
  busy: boolean;
  github_rate_limit: number;
  github_requests_remaining: number;
  github_limit_reset_time: number;
  version_info: VersionComponents;
  responses: UpdateResponse[];
}

export type VersionComponents = Record<string, UpdatePackage>;

/**
 * Base interface for all versioned packages
 */
export interface VersionedPackage {
  key: string;
  channel?: 'stable' | 'beta' | 'dev';
  channel_invalid?: boolean;
  detected_type?: 'git_repo'; // As far as I can tell, this is the only possible value that Moonraker can return for this field.
  debug_enabled: boolean;
  is_valid: boolean;
  name: string;
  repo_name?: string;
  owner: string;
  version: string;
  remote_version: string;
  rollback_version?: string;
  info_tags?: string[];
  warnings?: string[];
  anomalies?: string[];
}

/**
 * Updates are deployed directly via git.
 * Typical usage scenarios are to manage extensions installed a service.
 * eg. KlipperScreen, repos containing configs, etc.
 *
 * See: https://moonraker.readthedocs.io/en/latest/configuration/#git-type-application-configuration
 */
export interface GitUpdatePackage extends VersionedPackage {
  configured_type?: 'git_repo';
  pristine?: boolean;
  branch: string;
  remote_alias: string;
  full_version_string: string;
  current_hash: string;
  remote_hash: string;
  corrupt?: boolean;
  is_dirty: boolean;
  detached: boolean;
  commits_behind: CommitItem[];
  commits_behind_count: number;
  git_messages: string[];
  recovery_url?: string;
  remote_url?: string;
}

/**
 * `web` packages are simple packages that can be updated by downloading a zip of a github release.
 * They are not capable of performing any additional actions.
 * e.g. updating dependencies, building from source, managing services, etc
 *
 * See: https://moonraker.readthedocs.io/en/latest/configuration/#web-type-front-end-configuration
 */
export interface WebUpdatePackage extends VersionedPackage {
  configured_type?: 'web';
  /** Note: Can be an empty string */
  last_error?: string;
}

/**
 * `zip` packages are a combination of the `web` and `git_repo` types.
 * Compared to `web` packages, `zip` packages have can perform actions such as
 * updating of dependencies, building from source, managing services, etc.
 *
 * See: https://moonraker.readthedocs.io/en/latest/configuration/#zip-application-configuration
 */
export interface ZipUpdatePackage extends VersionedPackage {
  configured_type?: 'zip';
  /** Note: Can be an empty string */
  last_error?: string;
}

export type VersionedUpdatePackage = GitUpdatePackage | WebUpdatePackage | ZipUpdatePackage;
export type UpdatePackage = VersionedUpdatePackage | OSPackage;

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

export interface UpdateResponse {
  id: number;
  message: string;
  application: string;
  proc_id: number;
}
