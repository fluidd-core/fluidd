import buildOutputLabel from '../build-output-label'

describe('buildOutputLabel', () => {
  it('escapes the (possibly aliased) display name — AC6', () => {
    expect(buildOutputLabel('<img src=x onerror=alert(1)>'))
      .toBe('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('passes a plain name through unchanged', () => {
    expect(buildOutputLabel('Side Fan')).toBe('Side Fan')
  })

  it('appends the trusted rpm suffix as <small> markup', () => {
    expect(buildOutputLabel('Side Fan', '1200 rpm')).toBe('Side Fan <small>1200 rpm</small>')
  })

  it('escapes the name even when an rpm suffix is present', () => {
    expect(buildOutputLabel('<b>x</b>', '5 rpm')).toBe('&lt;b&gt;x&lt;/b&gt; <small>5 rpm</small>')
  })
})
