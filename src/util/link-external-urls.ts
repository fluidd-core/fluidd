const externalUrlRegExp = /(https?:\/\/\S+)/gi

const linkExternalUrls = (text: string) => text.replace(externalUrlRegExp, '<a target="_blank" href="$1">$1</a>')

export default linkExternalUrls
