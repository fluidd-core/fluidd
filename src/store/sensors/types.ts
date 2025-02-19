export interface MoonrakerSensorsState {
  sensors: MoonrakerSensors;
}

export interface MoonrakerSensors extends Record<string, MoonrakerSensor> {
}

export type MoonrakerSensorTypes = 'mqtt'

export interface MoonrakerSensor {
  id: string;
  friendly_name: string;
  type: MoonrakerSensorTypes;
  values: MoonrakerSensorValues;
  parameter_info?: MoonrakerSensorParameterInfo[];
  history_fields?: MoonrakerSensorHistoryFields[];
}

export interface MoonrakerSensorValues extends Record<string, number> {
}

export interface MoonrakerSensorParameterInfo {
  name: string;
  units: string;
}

export interface MoonrakerSensorHistoryFields {
  field: string;
  provider: string;
  description: string;
  strategy: string;
  units: string;
  init_tracker: boolean;
  exclude_paused: boolean;
  report_total: boolean;
  report_maximum: boolean;
  precision: number;
  parameter: string;
}
