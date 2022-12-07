const IsKeyOf = <T extends object>(key: string | number | symbol, parent: T): key is keyof T => {
  return key in parent
}

export default IsKeyOf
