import sanitizeEndpoint from '../sanitize-endpoint'

describe('santizeEndpointChecks', () => {
  it.each([
    ['https://localhost/', 'https://localhost'],
    ['https://localhost', 'https://localhost'],
    ['https://test.example.com/some/subpath/', 'https://test.example.com/some/subpath'],
    ['https://test.example.com/?query=parameter&test',
      'https://test.example.com'],
    ['garbage', undefined]
  ])('Expects url Parsing of "%s" to be %s', (param, expected) => {
    expect(sanitizeEndpoint(param)).toBe(expected)
  })
})
