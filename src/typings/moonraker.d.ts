declare namespace Moonraker {
  export type OkResponse = 'ok'

  export type StringResponse = string

  export type Method = keyof Methods

  export type MethodResult<M extends Method> = Methods[M]['result']

  export type MethodParams<M extends Method> = Methods[M]['params']
}
