import { Directory, KlipperFile } from '@/store/files/types'
import { InputValidationRules } from 'vuetify'

export interface FileSystemDialogData {
  type: 'rename' | 'createdir' | '';
  active: boolean;
  title: string;
  formLabel: string;
  rules: InputValidationRules;
  item: Directory | NewDirectory | KlipperFile;
  original?: Directory | KlipperFile;
}

export interface NewDirectory {
  name: string;
}

export interface SaveMeshDialog {
  open: boolean;
  profileName: string;
  removeDefault: boolean;
}
