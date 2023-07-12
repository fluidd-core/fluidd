import md5 from 'md5'

const md5AsBase64 = (text: string) => {
  const hash = md5(text, { asString: true })

  return btoa(hash)
}

export default md5AsBase64
