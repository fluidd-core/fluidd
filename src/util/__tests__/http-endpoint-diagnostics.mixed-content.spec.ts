/**
 * @vitest-environment jsdom
 * @vitest-environment-options { "url": "https://fluidd.local/" }
 */

import diagnoseHttpEndpoint from '../http-endpoint-diagnostics'

describe('diagnoseHttpEndpoint', () => {
  it('returns mixed-content for an http target on an https page', async () => {
    const result = await diagnoseHttpEndpoint('http://printer.local')

    expect(result).toEqual({ kind: 'mixed-content' })
  })
})
