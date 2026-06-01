export interface IFile {
    fileId: string;
    clientId: string;
    projectId?: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    storagePath: string;
    downloadUrl: string;
    uploadedBy: 'admin' | 'client';
    uploadedAt: Date;
  }