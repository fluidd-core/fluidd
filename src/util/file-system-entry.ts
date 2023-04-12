import { consola } from 'consola'

type EntryWithPath = {
  entry: FileSystemEntry,
  path: string
}
export type FileWithPath = {
  file: File,
  path: string
}

const isFile = (item: FileSystemEntry): item is FileSystemFileEntry => item.isFile

const isDirectory = (item: FileSystemEntry): item is FileSystemDirectoryEntry => item.isDirectory

const getFileAsync = async (fileEntry: FileSystemFileEntry) => {
  try {
    return new Promise<File>((resolve, reject) => fileEntry.file(resolve, reject))
  } catch (e) {
    consola.error('[FileSystemFileEntry] file', e)
  }
}

const readEntriesAsync = async (directoryReader: FileSystemDirectoryReader) => {
  try {
    return new Promise<FileSystemEntry[]>((resolve, reject) => directoryReader.readEntries(resolve, reject))
  } catch (e) {
    consola.error('[FileSystemDirectoryReader] readEntries', e)
  }
}

export const getFilesFromDataTransfer = async (dataTransfer: DataTransfer) => {
  if (dataTransfer.items.length) {
    const entries = [...dataTransfer.items]
      .map(x => x.webkitGetAsEntry())
      .filter((x): x is FileSystemEntry => !!x)

    return await getFilesFromFileSystemEntries(entries)
  } else if (dataTransfer.files.length) {
    return convertFilesToFilesWithPath(dataTransfer.files)
  }
}

export const getFilesWithPathFromHTMLInputElement = async (input: HTMLInputElement) => {
  if (input.webkitEntries.length) {
    return await getFilesFromFileSystemEntries(input.webkitEntries)
  } else if (input.files?.length) {
    return convertFilesToFilesWithPath(input.files)
  }
}

export const convertFilesToFilesWithPath = (files: File[] | FileList) => {
  return [...files]
    .map((file): FileWithPath => ({
      file,
      path: file.webkitRelativePath.slice(0, -file.name.length)
    }))
}

export const getFilesFromFileSystemEntries = async (entries: readonly FileSystemEntry[]) => {
  const files: FileWithPath[] = []
  const items = entries
    .map((entry): EntryWithPath => ({
      entry,
      path: ''
    }))

  let item = items.pop()
  while (item) {
    if (isFile(item.entry)) {
      const file = await getFileAsync(item.entry)

      if (file) {
        files.push({
          file,
          path: item.path
        })
      }
    } else if (isDirectory(item.entry)) {
      const subEntries = await readEntriesAsync(item.entry.createReader())

      if (subEntries) {
        for (const entry of subEntries) {
          items.push({
            entry,
            path: item.path + item.entry.name + '/'
          })
        }
      }
    }

    item = items.pop()
  }

  return files
}
