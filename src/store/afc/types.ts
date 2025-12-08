export interface AfcState {
  dialog: AfcDialogState;
}

export interface AfcDialogState {
  show: boolean;
  filename?: string;
}
