import { When } from './common';

export interface IFile {
  fileId: string;
  clientId: string;
  projectId: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  downloadUrl: string;
  uploadedBy: 'admin' | 'client';
  uploadedAt: When;
}
