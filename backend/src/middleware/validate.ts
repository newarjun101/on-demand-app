import { RequestHandler } from 'express';
import { ZodTypeAny, ZodEffects } from 'zod';
import { errors } from '../utils/api';

export function validate(schema: ZodTypeAny | ZodEffects<any, any, any>, target: 'body' | 'query' | 'params' = 'body'): RequestHandler {
  return async (req, _res, next) => {
    try {
      const data = await schema.parseAsync(req[target]);
      Object.assign(req[target], data);
      next();
    } catch (err: any) {
      const details = err?.errors ?? err?.message;
      next(errors.validation('Invalid request', details));
    }
  };
}