declare namespace Moonraker.DataStore {
  export interface TemperatureStoreResponse extends Record<string, TemperatureStoreEntry> {
  }

  export interface GcodeStoreResponse {
    gcode_store: GcodeStoreEntry[];
  }

  export interface TemperatureStoreEntry {
    temperatures: number[];
    targets?: number[];
    powers?: number[];
    speeds?: number[];
  }

  export interface GcodeStoreEntry {
    message: string;
    time?: number;
    type: 'command' | 'response';
  }
}
