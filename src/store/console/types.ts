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
  pendingItems: PromptDialogItem[] | null;
  footerButtons: PromptDialogButton[];
}

export type PromptDialogItem = PromptDialogItemText | PromptDialogItemButtonGroup | PromptDialogItemButton

export interface PromptDialogItemText {
  type: 'text';
  id: number;
  text: string;
}

export interface PromptDialogItemButtonGroup {
  type: 'button_group';
  id: number;
  buttons: PromptDialogButton[];
}

export interface PromptDialogItemButton extends PromptDialogButton {
  type: 'button';
}

export interface PromptDialogButton {
  id: number;
  text: string;
  command?: string;
  color?: string;
}
