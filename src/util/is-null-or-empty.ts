export type NullableOrEmpty<T> = T | null | undefined | ''

const isNullOrEmpty = (v: unknown): v is null | undefined | '' => v == null || v === ''

export default isNullOrEmpty
