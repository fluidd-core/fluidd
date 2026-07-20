export interface ConsoleState {
  consoleCommand: string;
  consoleSearch: string;
  console: Readonly<ConsoleEntry>[]; // console stream
  gcodeHelp: Readonly<Moonraker.KlippyApis.GcodeHelpResponse>; // known commands
  consoleEntryCount: number; // give each console entry a unique id.
  commandHistory: string[];
  autoScroll: boolean;
  lastCleared: number;
  promptDialog: PromptDialog;
  consoleFilters: ConsoleFilter[];
  consoleFiltersRegexp: RegExp[];
}

export interface ConsoleEntry {
  id: number;
  message: string;
  time?: number;
  type: 'command' | 'response' | 'action';
}

export type ConsoleFilterType = 'contains' | 'starts-with' | 'expression'

export interface ConsoleFilter {
  id: string;
  name: string;
  type: ConsoleFilterType;
  value: string;
  enabled: boolean;
}

export interface PromptDialog {
  open: boolean;
  title?: string;
  items: PromptDialogItem[];
  footerButtons: PromptDialogButton[]
}

export type PromptDialogItem = PromptDialogItemText | PromptDialogItemButton

export interface PromptDialogItemText {
  type: 'text';
  text: string;
}

export interface PromptDialogItemButton extends PromptDialogButton {
  type: 'button';
}

export interface PromptDialogButton {
  text: string;
  command?: string;
  color?: string;
}
