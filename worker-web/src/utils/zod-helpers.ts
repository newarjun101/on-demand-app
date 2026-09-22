// Shared form helpers that work with react-hook-form + Zod.

import { z } from 'zod';

type Translator = (key: string, vars?: Record<string, string | number>) => string;
const fallbackT: Translator = (key) => key;
let zodT: Translator = fallbackT;

export function setZodTranslator(t: Translator) { zodT = t; }
export function getZodTranslator(): Translator { return zodT; }

const keyToMessage = (k: string) => zodT(k);

export const zStringRequired = (key = 'validation.required') =>
  z.preprocess(
    (v) => (v == null ? '' : v),
    z.string({ required_error: keyToMessage(key) }).min(1, keyToMessage(key)).trim(),
  );

export const zStringOptional = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().optional(),
);

export const zEmailRequired = z
  .string()
  .trim()
  .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: zodT('validation.invalidEmail'),
  });

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

export const zPositiveInt = (key = 'validation.required') =>
  z.preprocess(
    (v) => (v === '' || v == null ? v : Number(v)),
    z.number({ invalid_type_error: keyToMessage(key) }).int().positive(keyToMessage(key)),
  );

export const zUuidOptional = z.preprocess(
  (v) => {
    if (v === '' || v == null) return undefined;
    if (typeof v === 'string') {
      const s = v.trim();
      if (s === '') return undefined;
      return s;
    }
    return v;
  },
  z.string().uuid().optional(),
);

export const zUuidRequired = (key = 'validation.selectOption') =>
  z.preprocess(
    (v) => (v == null ? '' : v),
    z.string({ required_error: keyToMessage(key) }).min(1, keyToMessage(key)).uuid(zodT('validation.invalid')),
  );

export const zEnumRequired = <T extends [string, ...string[]]>(values: T, key = 'validation.selectOption') =>
  z.preprocess(
    (v) => (v == null ? '' : v),
    z.enum(values, { required_error: keyToMessage(key), invalid_type_error: keyToMessage(key) }),
  );

export const zEnumOptional = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : v), z.enum(values).optional());

export const zBooleanRequiredTrue = (key = 'validation.required') =>
  z.literal(true, { errorMap: () => ({ message: zodT(key) }) });

// Static (non-translated) variants for simple forms.

export const zStringRequiredStatic = (msg = 'Required') =>
  z.string({ required_error: msg }).min(1, msg).trim();

export const zStringOptionalStatic = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().optional(),
);

export const zEmailRequiredStatic = z
  .string()
  .trim()
  .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: 'Invalid email' });

export const zNumberOptionalStatic = z.preprocess(
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

export const zPositiveIntStatic = (msg = 'Must be a positive number') =>
  z.preprocess(
    (v) => (v === '' || v == null ? v : Number(v)),
    z.number({ invalid_type_error: msg }).int().positive(msg),
  );

export const zUuidRequiredStatic = (msg = 'Please select') =>
  z.string({ required_error: msg }).min(1, msg).uuid(msg);

export const zUuidOptionalStatic = z.preprocess(
  (v) => {
    if (v === '' || v == null) return undefined;
    if (typeof v === 'string') {
      const s = v.trim();
      if (s === '') return undefined;
      return s;
    }
    return v;
  },
  z.string().uuid().optional(),
);

export const zEnumRequiredStatic = <T extends [string, ...string[]]>(values: T, msg = 'Please select') =>
  z.enum(values, { required_error: msg, invalid_type_error: msg });

export const zEnumOptionalStatic = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : v), z.enum(values).optional());
