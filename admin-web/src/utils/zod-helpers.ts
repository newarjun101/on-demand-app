import { z } from 'zod';

type Translator = (key: string, vars?: Record<string, string | number>) => string;
let zodT: Translator = (key) => key;

export function setZodTranslator(t: Translator) { zodT = t; }
export function getZodTranslator(): Translator { return zodT; }

export const zStringRequired = (key = 'errors.required') =>
  z.preprocess(
    (v) => (v == null ? '' : v),
    z.string({ message: zodT(key) }).min(1, zodT(key)).trim(),
  );

export const zStringOptional = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().optional(),
);

export const zEmailRequired = z
  .string()
  .trim()
  .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: zodT('errors.validationFailed') });

export const zNumberOptional = z.preprocess(
  (v) => {
    if (v === '' || v == null) return undefined;
    if (typeof v === 'string') {
      const n = Number(v);
      return Number.isFinite(n) ? n : v;
    }
    return v;
  },
  z.number().optional(),
);

export const zUuidRequired = (key = 'errors.required') =>
  z.preprocess(
    (v) => (v == null ? '' : v),
    z.string({ message: zodT(key) }).min(1, zodT(key)).uuid(zodT('errors.validationFailed')),
  );

export const zEnumRequired = <T extends [string, ...string[]]>(values: T, key = 'errors.required') =>
  z.preprocess(
    (v) => (v == null ? '' : v),
    z.enum(values, { message: zodT(key) }),
  );

export const zStringOptionalStatic = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().optional(),
);

export const zStringRequiredStatic = (msg = 'Required') =>
  z.string({ message: msg }).min(1, msg).trim();
