import { Request, Response, NextFunction } from 'express';
import { fileService } from '../services/file.service';
import { ok } from '../utils/api';

export const fileController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
        return;
      }
      const result = await fileService.recordUpload({
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        ownerId: req.user!.sub,
      });
      res.json(ok(result));
    } catch (error) { next(error); }
  },
};
