declare namespace Moonraker.Printer {
  export interface Info {
    state: InfoState;
    state_message: string;
    hostname?: string;
    klipper_path?: string;
    python_path?: string;
    process_id?: 275124,
    user_id?: number;
    group_id?: number;
    log_file?: string;
    config_file?: string;
    software_version?: string;
    cpu_info?: string;
    app?: string;
  }

  export type InfoState = 'ready' | 'startup' | 'shutdown' | 'error'

  export interface ObjectsListResponse {
    objects: string[]
  }

  export interface GcodeHelpResponse {
    [key: string]: string;
  }

  export interface QueryEndstopsStatusResponse {
    [key: string]: QueryEndstopsStatus
  }

  export type QueryEndstopsStatus = 'TRIGGERED' | 'open'
}
