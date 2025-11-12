declare namespace TSHelpers {
  type Prettify<T> = {
    [K in keyof T]: T[K];
  } & {}

  type ValueTypesOf<T> = NonNullable<T[keyof T]>
}
