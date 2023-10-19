export interface FlashMessage {
  type?: FlashMessageTypes;
  open: boolean;
  text?: string;
  timeout?: number;
}

export type FlashMessageTypes = 'success' | 'error' | 'warning' | 'primary' | 'secondary'
