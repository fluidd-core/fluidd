declare namespace Moonraker.Sensor {
  export interface ListResponse {
    sensors: Record<string, Entry>;
  }

  export interface Entry {
    id: string;
    friendly_name: string;
    type: string;
    values: Values;
    parameter_info?: ParameterInfo[];
    history_fields?: HistoryField[];
  }

  export interface Values extends Record<string, unknown> {
  }

  export interface ParameterInfo extends Record<string, string> {
    name: string;
  }

  export interface HistoryField {
    field: string;
    provider: string;
    description: string;
    strategy: string;
    units: string | null;
    init_tracker: boolean;
    exclude_paused: boolean;
    report_total: boolean;
    report_maximum: boolean;
    precision: number;
    parameter: string;
  }
}
