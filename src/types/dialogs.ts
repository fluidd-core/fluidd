import { Directory, File } from '@/store/files/types'

export interface DialogData {
  type: 'rename' | 'createdir' | '';
  active: boolean;
  title: string;
  formLabel: string;
  item: Directory | NewDirectory | File;
  original?: Directory | File;
}

export interface NewDirectory {
  name: string;
}
