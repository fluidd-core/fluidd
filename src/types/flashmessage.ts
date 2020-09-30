export interface FlashMessage {
  type?: 'error' | 'warning' | 'primary' | 'secondary';
  open: boolean;
  text?: string;
  timeout?: number;
}
