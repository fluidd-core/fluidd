export interface VersionState {
  [key: string]: boolean | VersionComponents | FluiddVersion | UpdateResponse[];
  busy: boolean;
  skipClientUpdates: boolean;
  responses: UpdateResponse[];
  components: VersionComponents;
  fluidd: FluiddVersion;
}

export interface VersionComponents {
  [key: string]: HashVersion | ArtifactVersion;
}

/** For klipper / moonraker */
export interface HashVersion {
  version: string;
  current_hash: string;
  remote_hash: string;
  is_valid: boolean;
  is_dirty: boolean;
}

/** For clients */
export interface ArtifactVersion {
  name: string;
  version: string;
  remote_version: string;
}

export interface FluiddVersion {
  version: string;
  hash: string;
}

export interface UpdateResponse {
  message: string;
  application: string;
  proc_id: number;
}
