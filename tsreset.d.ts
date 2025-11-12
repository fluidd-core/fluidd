// From https://github.com/mattpocock/ts-reset

declare namespace TSReset {
  type NonFalsy<T> = T extends false | 0 | '' | null | undefined | 0n
    ? never
    : T

  type WidenLiteral<T> = T extends string
    ? string
    : T extends number
      ? number
      : T extends boolean
        ? boolean
        : T extends bigint
          ? bigint
          : T extends symbol
            ? symbol
            : T
}

interface JSON {
  parse(
    text: string,
    reviver?: (this: any, key: string, value: any) => any,
  ): unknown;
}

interface Body {
  json(): Promise<unknown>;
}

interface ReadonlyArray<T> {
  filter<S extends T>(
    predicate: BooleanConstructor,
    thisArg?: any,
  ): TSReset.NonFalsy<S>[];

  includes(
    searchElement: T | (TSReset.WidenLiteral<T> & {}),
    fromIndex?: number,
  ): boolean;

  lastIndexOf(
    searchElement: T | (TSReset.WidenLiteral<T> & {}),
    fromIndex?: number,
  ): number;

  indexOf(
    searchElement: T | (TSReset.WidenLiteral<T> & {}),
    fromIndex?: number,
  ): number;
}

interface Array<T> {
  filter<S extends T>(
    predicate: BooleanConstructor,
    thisArg?: any,
  ): TSReset.NonFalsy<S>[];

  includes(
    searchElement: T | (TSReset.WidenLiteral<T> & {}),
    fromIndex?: number,
  ): boolean;

  lastIndexOf(
    searchElement: T | (TSReset.WidenLiteral<T> & {}),
    fromIndex?: number,
  ): number;

  indexOf(
    searchElement: T | (TSReset.WidenLiteral<T> & {}),
    fromIndex?: number,
  ): number;
}

interface MapConstructor {
  new <K = unknown, V = unknown>(): Map<K, V>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Map<K, V> {
  has(value: K | (TSReset.WidenLiteral<K> & {})): boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ReadonlyMap<K, V> {
  has(value: K | (TSReset.WidenLiteral<K> & {})): boolean;
}

interface Set<T> {
  has(value: T | (TSReset.WidenLiteral<T> & {})): boolean;
}

interface ReadonlySet<T> {
  has(value: T | (TSReset.WidenLiteral<T> & {})): boolean;
}

interface Promise<T> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): Promise<TResult1 | TResult2>;

  catch<TResult = never>(
    onrejected?:
      | ((reason: unknown) => TResult | PromiseLike<TResult>)
      | undefined
      | null,
  ): Promise<T | TResult>;
}

interface Storage {
  [name: string & {}]: unknown;
}

interface String {
  toLowerCase<T extends string>(this: T): Lowercase<T>

  toUpperCase<T extends string>(this: T): Uppercase<T>

  startsWith<T extends string, T2 extends string>(this: T, searchString: T2, position?: number): this is `${T2}${string}`

  endsWith<T extends string, T2 extends string>(this: T, searchString: T2, position?: number): this is `${string}${T2}`
}
