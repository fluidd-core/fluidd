declare namespace Moonraker.KlippyApis {
  export interface InfoResponse extends Info {
  }

  export interface Info {
    state: InfoState;
    state_message: string;
    hostname?: string;
    klipper_path?: string;
    python_path?: string;
    process_id?: number;
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
    objects: string[];
  }

  export interface ObjectsSubscribeResponse {
    status: Klipper.PrinterState;
  }

  export interface GcodeHelpResponse extends Record<string, string> {
  }

  export interface QueryEndstopsStatusResponse extends Record<string, QueryEndstopsStatus> {
  }

  export type QueryEndstopsStatus = 'TRIGGERED' | 'open'
}
