// Server-side i18n: keep an in-process locale per request so the same Node
// process can serve multiple languages concurrently. The middleware sets
// the locale on every request (either from the URL path /api/v1/:locale/...
// or from the Accept-Language header) and reads it back when localizing
// error responses.

import { AppError, localizeError } from '../utils/api';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export type ApiLocale = 'en' | 'zh' | 'my' | 'th' | 'hi';

export const LOCALES: { code: ApiLocale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'zh', label: '中文',     flag: '🇨🇳' },
  { code: 'my', label: 'မြန်မာ', flag: '🇲🇲' },
  { code: 'th', label: 'ไทย',     flag: '🇹🇭' },
  { code: 'hi', label: 'हिन्दी',   flag: '🇮🇳' },
];

const SUPPORTED = LOCALES.map((l) => l.code);
export function isLocaleSupported(code: string): code is ApiLocale {
  return (SUPPORTED as string[]).includes(code);
}

// Per-process active locale. The middleware writes this on every request
// and the error handler reads it.
let currentLocale: ApiLocale = 'en';
export function setApiLocale(l: ApiLocale) { currentLocale = l; }
export function getApiLocale(): ApiLocale { return currentLocale; }

// Localized error messages. Add new error codes here.
const MESSAGES: Record<string, Record<ApiLocale, string>> = {
  BAD_REQUEST:        { en: 'Bad request',                       zh: '请求错误',       my: 'တောင်းဆိုချက် မှားနေသည်',     th: 'คำขอไม่ถูกต้อง',         hi: 'खराब अनुरोध' },
  VALIDATION_ERROR:   { en: 'Validation failed',                 zh: '验证失败',       my: 'စစ်ဆေးမှု မအောင်မြင်ပါ',     th: 'การตรวจสอบไม่ผ่าน',       hi: 'सत्यापन विफल' },
  UNAUTHORIZED:       { en: 'Please log in to continue',                  zh: '请先登录',                     my: 'ကျေးဇူးပြု၍ လော့ဂ်အင်ဝင်ပါ',          th: 'กรุณาเข้าสู่ระบบ',                    hi: 'कृपया लॉग इन करें' },
  INVALID_CREDENTIALS: { en: 'Invalid email or password',                  zh: '邮箱或密码错误',                 my: 'အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားနေသည်',  th: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',          hi: 'अमान्य ईमेल या पासवर्ड' },
  FORBIDDEN:          { en: 'Access denied',                       zh: '拒绝访问',       my: 'ဝင်ရောက်ခွင့် မရှိပါ',       th: 'ปฏิเสธการเข้าถึง',          hi: 'पहुँच अस्वीकृत' },
  NOT_FOUND:          { en: 'Not found',                           zh: '未找到',           my: 'မတွေ့ပါ',                       th: 'ไม่พบ',                    hi: 'नहीं मिला' },
  CONFLICT:           { en: 'Resource already exists',             zh: '资源已存在',       my: 'အရင်ကတည်ရှိနေပြီး',           th: 'ทรัพยากรมีอยู่แล้ว',         hi: 'संसाधन पहले से मौजूद' },
  RATE_LIMITED:       { en: 'Too many requests',                   zh: '请求过于频繁',   my: 'တောင်းဆိုချက် အရမ်းများနေသည်', th: 'คำขอมากเกินไป',             hi: 'बहुत सारे अनुरोध' },
  INTERNAL_ERROR:     { en: 'Internal server error',               zh: '服务器错误',       my: 'ဆာဗာ အမှား',                  th: 'เซิร์ฟเวอร์ขัดข้อง',         hi: 'सर्वर त्रुटि' },
};

function detectLang(acceptLanguage?: string): ApiLocale {
  if (!acceptLanguage) return currentLocale;
  const lower = acceptLanguage.toLowerCase();
  if (lower.startsWith('zh')) return 'zh';
  if (lower.startsWith('my')) return 'my';
  if (lower.startsWith('th')) return 'th';
  if (lower.startsWith('hi')) return 'hi';
  return 'en';
}

declare global {
  namespace Express {
    interface Request {
      apiLocale?: ApiLocale;
      apiVersion?: 'v1';
    }
  }
}

const LOCALE_PATTERN = /^\/api\/v1\/([a-z]{2})(\/|$)/;

/**
 * Mount this as the FIRST middleware after cors/json. It:
 *   1. Detects /api/v1/:locale/* and sets the active locale.
 *   2. Strips the /v1/:locale prefix so downstream routers see original paths.
 *   3. For legacy /api/* requests, falls back to Accept-Language.
 *   4. Rejects unknown locales with 400.
 */
export function apiVersionRouter(req: Request, res: Response, next: NextFunction) {
  const m = req.originalUrl.match(LOCALE_PATTERN);
  if (m) {
    const candidate = m[1];
    if (isLocaleSupported(candidate)) {
      setApiLocale(candidate);
      req.apiLocale = candidate;
      req.apiVersion = 'v1';
      req.url = req.url.replace(/^\/v1\/[a-z]{2}/, '');
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: `Unsupported locale "${candidate}" in URL. Use one of: en, zh, my, th, hi.`,
        },
      });
    }
  } else {
    req.apiLocale = currentLocale;
  }
  next();
}

export const errors = {
  badRequest: (message = 'Bad request', details?: unknown) =>
    new AppError('BAD_REQUEST', message, 400, details),
  validation: (message = 'Validation failed', details?: unknown) =>
    new AppError('VALIDATION_ERROR', message, 422, details),
  unauthorized: (message = 'Please log in to continue') => new AppError('UNAUTHORIZED', message, 401),
  forbidden: (message = 'Access denied') => new AppError('FORBIDDEN', message, 403),
  notFound: (message = 'Not found') => new AppError('NOT_FOUND', message, 404),
  conflict: (message = 'Resource already exists') => new AppError('CONFLICT', message, 409),
  tooMany: (message = 'Too many requests') => new AppError('RATE_LIMITED', message, 429),
  internal: (message = 'Internal server error') =>
    new AppError('INTERNAL_ERROR', message, 500),
};

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: localizeError('NOT_FOUND', 'Route not found', req.headers['accept-language']),
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const lang = req.headers['accept-language'];

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: localizeError(err.code, err.message, lang),
        details: err.details,
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: localizeError('VALIDATION_ERROR', 'Validation failed', lang),
        details: err.errors,
      },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: localizeError('CONFLICT', 'Resource already exists', lang),
          details: err.meta,
        },
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: localizeError('NOT_FOUND', 'Resource not found', lang),
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.error('[error]', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: localizeError('INTERNAL_ERROR', 'Internal server error', lang),
    },
  });
}