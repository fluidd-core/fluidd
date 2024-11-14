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
}

export interface MoonrakerSensorValues extends Record<string, number> {
}
