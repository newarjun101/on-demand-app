import { Router } from 'express';
import { upload, handleUploadError } from '../middleware/upload';
import { authenticate } from '../middleware/auth';
import { fileController } from '../controllers/file.controller';

export const fileRouter = Router();

fileRouter.post(
  '/upload',
  authenticate(),
  upload.single('file'),
  handleUploadError,
  fileController.upload,
);