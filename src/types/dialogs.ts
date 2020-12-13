import { AppDirectory, AppFile } from '@/store/files/types'
import { InputValidationRules } from 'vuetify'

export interface FileSystemDialogData {
  type: 'rename' | 'createdir' | 'createfile' | '';
  active: boolean;
  valid: boolean;
  title: string;
  formLabel: string;
  rules: InputValidationRules;
  item: AppDirectory | NewDirectory | AppFile;
  original?: AppDirectory | AppFile;
}

export interface NewDirectory {
  name: string;
}
