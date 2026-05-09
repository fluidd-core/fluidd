import { Globals } from '@/globals'
import consola from 'consola'

const isFileDataTransferData = (dataAsObject: unknown): dataAsObject is FileDataTransferData => (
  dataAsObject !== null &&
  typeof dataAsObject === 'object' &&
  'path' in dataAsObject &&
  typeof dataAsObject.path === 'string' &&
  'items' in dataAsObject &&
  Array.isArray(dataAsObject.items) &&
  dataAsObject.items.every(item => typeof item === 'string')
)

export type FileDataTransferData = {
  path: string,
  items: string[]
}

export const hasFileDataTransferTypeInDataTransfer = (dataTransfer: DataTransfer, type: keyof typeof Globals.FILE_DATA_TRANSFER_TYPES) => {
  return dataTransfer.types.includes(Globals.FILE_DATA_TRANSFER_TYPES[type])
}

export const setFileDataTransferDataInDataTransfer = (dataTransfer: DataTransfer, type: keyof typeof Globals.FILE_DATA_TRANSFER_TYPES, fileDataTransferData: FileDataTransferData) => {
  dataTransfer.setData(Globals.FILE_DATA_TRANSFER_TYPES[type], JSON.stringify(fileDataTransferData))
}

export const getFileDataTransferDataFromDataTransfer = (dataTransfer: DataTransfer, type: keyof typeof Globals.FILE_DATA_TRANSFER_TYPES): FileDataTransferData | null => {
  const data = dataTransfer.getData(Globals.FILE_DATA_TRANSFER_TYPES[type])

  try {
    const dataAsObject = JSON.parse(data)

    if (!isFileDataTransferData(dataAsObject)) {
      throw new Error('Data in data transfer is not of type FileDataTransferData')
    }

    return dataAsObject
  } catch (error) {
    consola.warn(`Failed to parse data transfer data for type ${Globals.FILE_DATA_TRANSFER_TYPES[type]}`, data, error)
  }

  return null
}
