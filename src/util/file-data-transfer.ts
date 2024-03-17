import { Globals } from '@/globals'

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

export const getFileDataTransferDataFromDataTransfer = (dataTransfer: DataTransfer, type: keyof typeof Globals.FILE_DATA_TRANSFER_TYPES) => {
  const data = dataTransfer.getData(Globals.FILE_DATA_TRANSFER_TYPES[type])

  const fileDataTransferData: FileDataTransferData = JSON.parse(data)

  return fileDataTransferData
}
