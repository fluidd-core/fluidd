import MockDate from 'mockdate'

export const timeTravel = (to: string, cb: () => any): any => {
  MockDate.set(to)

  try {
    return cb()
  } finally {
    MockDate.reset()
  }
}
