export interface ConsoleState {
  // [key: string]: string;
  consoleCommand: string;
  console: ConsoleEntry[]; // console stream
  availableCommands: GcodeCommands; // available gcode commands
  consoleEntryCount: number; // give each console entry a unique id.
  commandHistory: string[];
  autoScroll: boolean;
  consoleFilters: ConsoleFilter[];
  consoleFiltersRegexp: RegExp[];
}

export interface ConsoleEntry {
  id?: number;
  message: string;
  type: 'command' | 'response';
  time?: number;
}

export interface GcodeCommands {
  [key: string]: string;
}

export enum ConsoleFilterType {
  Contains,
  StartsWith,
  Expression
}

export interface ConsoleFilter {
  id: string;
  name: string;
  type: ConsoleFilterType;
  value: string;
  enabled: boolean;
}
