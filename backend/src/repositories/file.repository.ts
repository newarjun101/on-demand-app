import { prisma } from '../config/prisma';

export interface CreateFileUploadInput {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  ownerId: string;
}

export const fileRepository = {
  create(input: CreateFileUploadInput) {
    return prisma.fileUpload.create({ data: input });
  },
};
