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
    status: Partial<Klipper.PrinterState>;
  }

  export interface GcodeHelpResponse extends Record<string, string> {
  }

  export interface QueryEndstopsStatusResponse extends Record<string, QueryEndstopsStatus> {
  }

  export type QueryEndstopsStatus = 'TRIGGERED' | 'open'
}

declare namespace Moonraker {
  export interface Methods {
    'printer.info': {
      params: undefined,
      result: KlippyApis.InfoResponse
    },
    'printer.restart': {
      params: undefined,
      result: OkResponse
    },
    'printer.firmware_restart': {
      params: undefined,
      result: OkResponse
    },
    'printer.query_endstops.status': {
      params: undefined,
      result: KlippyApis.QueryEndstopsStatusResponse
    },
    'printer.objects.list': {
      params: undefined,
      result: KlippyApis.ObjectsListResponse
    },
    'printer.objects.subscribe': {
      params: {
        objects: Record<string, string[] | null>
      },
      result: KlippyApis.ObjectsSubscribeResponse
    },
    'printer.print.start': {
      params: {
        filename: string
      },
      result: OkResponse
    },
    'printer.print.cancel': {
      params: undefined,
      result: OkResponse
    },
    'printer.print.pause': {
      params: undefined,
      result: OkResponse
    },
    'printer.print.resume': {
      params: undefined,
      result: OkResponse
    },
    'printer.gcode.script': {
      params: {
        script: string
      },
      result: OkResponse
    },
    'printer.gcode.help': {
      params: undefined,
      result: KlippyApis.GcodeHelpResponse
    },
    'printer.emergency_stop': {
      params: undefined,
      result: OkResponse
    }
  }
}
