import { env } from '../config/env';
import { fileRepository } from '../repositories/file.repository';
import { fileToUrl } from '../middleware/upload';

export interface RecordUploadInput {
  filename: string;
  mimetype: string;
  size: number;
  ownerId: string;
}

export const fileService = {
  async recordUpload(input: RecordUploadInput) {
    const url = fileToUrl(input.filename);
    await fileRepository.create({ ...input, url });
    return { url, fullUrl: `${env.apiUrl}${url}` };
  },
};
