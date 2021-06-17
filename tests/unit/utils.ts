import MockDate from 'mockdate'

export const timeTravel = (to: string, cb: () => any): any => {
  MockDate.set(to)
  const retVal = cb()
  MockDate.reset()

  return retVal
}
