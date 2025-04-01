import { consola } from 'consola'

const downloadUrl = (filename: string, url: string) => {
  try {
    // Create a link, handle its click - and finally remove it again.
    const link = document.createElement('a')

    link.href = url
    link.download = filename
    link.target = '_blank'

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)
  } catch (error) {
    consola.error('[DownloadUrl] error', error)
  }
}

export default downloadUrl
