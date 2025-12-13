declare namespace TSHelpers {
  type Prettify<T> = {
    [K in keyof T]: T[K];
  } & {}

  type DeepReadonly<T> =
    T extends (...args: any[]) => any
      ? T
      : T extends [...any] | object
        ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
        : T

  type ValueTypesOf<T> = NonNullable<T[keyof T]>
}
