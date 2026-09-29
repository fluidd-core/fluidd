declare namespace Moonraker.DataStore {
  export interface TemperatureStoreResponse extends Record<string, TemperatureStoreEntry> {
  }

  export interface GcodeStoreResponse {
    gcode_store: GcodeStoreEntry[];
  }

  export interface TemperatureStoreEntry {
    temperatures: (number | null)[];
    targets?: (number | null)[];
    powers?: (number | null)[];
    speeds?: (number | null)[];
  }

  export interface GcodeStoreEntry {
    message: string;
    time: number;
    type: 'command' | 'response';
  }
}

declare namespace Moonraker {
  export interface Methods {
    'server.temperature_store': {
      params: {
        include_monitors?: boolean
      },
      result: DataStore.TemperatureStoreResponse
    },
    'server.gcode_store': {
      params: {
        count?: number
      },
      result: DataStore.GcodeStoreResponse
    }
  }
}
