export interface ConsoleState {
  // [key: string]: string;
  consoleCommand: string;
  console: ConsoleEntry[]; // console stream
  availableCommands: GcodeCommands; // available gcode commands
  consoleEntryCount: number; // give each console entry a unique id.
  commandHistory: string[];
  autoScroll: boolean;
  consoleFilters: ConsoleFilter[];
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

export interface ConsoleFilter {
  id: string;
  name: string;
  expression: string;
  enabled: boolean;
  regex?: RegExp;       // should not be serialized
}