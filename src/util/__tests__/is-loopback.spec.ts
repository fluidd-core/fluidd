import isLoopback from '../is-loopback'

describe('isLoopback', () => {
  it.each([
    'localhost',
    ' LOCALHOST ',
    '127.0.0.1',
    '127.0.0.2',
    '::1',
    '0:0:0:0:0:0:0:1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
  ])('Expects host "%s" to be loopback', host => {
    expect(isLoopback(host)).toBeTruthy()
  })

  it.each([
    'somewhere',
    'somewhere.localhost',
    '128.0.0.1',
    '192.168.0.1',
  ])('Expects host "%s" not to be loopback', host => {
    expect(isLoopback(host)).toBeFalsy()
  })
})
