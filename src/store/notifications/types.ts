export interface NotificationsState {
  notifications: Notification[];
}

export interface Notification {
  id: string;
  name: string;
  count?: number;
  visible?: number;
}
