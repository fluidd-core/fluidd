const setUrlQueryParam = (url: string, key: string, value: string) => {
  const fakeOrigin = 'http://fake.fake'
  const newUrl = new URL(url, fakeOrigin)

  newUrl.searchParams.set(key, value)

  return newUrl.origin === fakeOrigin
    ? newUrl.pathname + newUrl.search
    : newUrl.href
}

export default setUrlQueryParam
