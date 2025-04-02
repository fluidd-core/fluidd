export interface MmuState {
  dialog: MmuDialogState;
}

export interface MmuDialogState {
  show: boolean;
  filename?: string;
}
