import { Router, Request, Response, NextFunction } from 'express';
import { upload, handleUploadError } from '../middleware/upload';
import { authenticate } from '../middleware/auth';
import { fileToUrl } from '../middleware/upload';
import { prisma } from '../config/prisma';
import { ok } from '../utils/api';

export const fileRouter = Router();

fileRouter.post(
  '/upload',
  authenticate(),
  upload.single('file'),
  handleUploadError,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
      }
      const url = fileToUrl(req.file.filename);
      await prisma.fileUpload.create({
        data: {
          url,
          filename: req.file.filename,
          mimetype: req.file.mimetype,
          size: req.file.size,
          ownerId: req.user!.sub,
        },
      });
      res.json(ok({ url, fullUrl: `${process.env.API_URL ?? ''}${url}` }));
    } catch (e) { next(e); }
  },
);