declare namespace Moonraker {
  export type OkResponse = 'ok'

  export type StringResponse = string

  export type Method = keyof Methods

  export type MethodResult<M extends Method> = Methods[M]['result']

  export type MethodParams<M extends Method> = Methods[M]['params']

  export type Notification = keyof Notifications

  export type NotificationPayload<N extends Notification> = Notifications[N] extends [infer P, ...unknown[]]
    ? P
    : undefined

  export type NotificationAction<N extends Notification> = TSHelpers.SnakeToCamelCase<N>
}
