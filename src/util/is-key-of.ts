const isKeyOf = <T extends object>(key: PropertyKey, parent: T): key is keyof T => {
  return key in parent
}

export default isKeyOf
