export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export const ok = <T>(data: T): ApiSuccess<T> => ({ success: true, data });

// Localized server-side error messages. The client can also override these
// by reading the `code` field and translating on the client side, but having
// sensible defaults on the server means the API is usable from any client
// (including mobile apps in the future).
type Lang = 'en' | 'zh' | 'my' | 'th' | 'hi';

const MESSAGES: Record<string, Record<Lang, string>> = {
  BAD_REQUEST:        { en: 'Bad request',             zh: '请求错误',     my: 'တောင်းဆိုချက် မှားနေသည်', th: 'คำขอไม่ถูกต้อง', hi: 'खराब अनुरोध' },
  VALIDATION_ERROR:   { en: 'Validation failed',        zh: '验证失败',     my: 'စစ်ဆေးမှု မအောင်မြင်ပါ',  th: 'การตรวจสอบไม่ผ่าน',  hi: 'सत्यापन विफल' },
  UNAUTHORIZED:       { en: 'Please log in to continue', zh: '请先登录',     my: 'ကျေးဇူးပြု၍ လော့ဂ်အင်ဝင်ပါ', th: 'กรุณาเข้าสู่ระบบ',  hi: 'कृपया लॉग इन करें' },
  FORBIDDEN:          { en: 'Access denied',            zh: '拒绝访问',     my: 'ဝင်ရောက်ခွင့် မရှိပါ',   th: 'ปฏิเสธการเข้าถึง',  hi: 'पहुँच अस्वीकृत' },
  NOT_FOUND:          { en: 'Not found',                zh: '未找到',         my: 'မတွေ့ပါ',                  th: 'ไม่พบ',          hi: 'नहीं मिला' },
  CONFLICT:           { en: 'Resource already exists',  zh: '资源已存在',     my: 'အရင်ကတည်ရှိနေပြီး',     th: 'ทรัพยากรมีอยู่แล้ว',  hi: 'संसाधन पहले से मौजूद' },
  RATE_LIMITED:       { en: 'Too many requests',        zh: '请求过于频繁',   my: 'တောင်းဆိုချက် အရမ်းများနေသည်', th: 'คำขอมากเกินไป',  hi: 'बहुत सारे अनुरोध' },
  INTERNAL_ERROR:     { en: 'Internal server error',    zh: '服务器错误',     my: 'ဆာဗာ အမှား',                  th: 'เซิร์ฟเวอร์ขัดข้อง',  hi: 'सर्वर त्रुटि' },
};

function detectLang(acceptLanguage?: string): Lang {
  if (!acceptLanguage) return 'en';
  const lower = acceptLanguage.toLowerCase();
  if (lower.startsWith('zh')) return 'zh';
  if (lower.startsWith('my')) return 'my';
  if (lower.startsWith('th')) return 'th';
  if (lower.startsWith('hi')) return 'hi';
  return 'en';
}

export function localizeError(code: string, fallbackMessage: string, acceptLanguage?: string): string {
  const lang = detectLang(acceptLanguage);
  const table = MESSAGES[code];
  if (table) return table[lang] ?? table.en ?? fallbackMessage;
  return fallbackMessage;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: string, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const errors = {
  badRequest: (message = 'Bad request', details?: unknown) =>
    new AppError('BAD_REQUEST', message, 400, details),
  validation: (message = 'Validation failed', details?: unknown) =>
    new AppError('VALIDATION_ERROR', message, 422, details),
  unauthorized: (message = 'Please log in to continue') => new AppError('UNAUTHORIZED', message, 401),
  invalidCredentials: (message = 'Invalid email or password') => new AppError('INVALID_CREDENTIALS', message, 401),
  forbidden: (message = 'Access denied') => new AppError('FORBIDDEN', message, 403),
  notFound: (message = 'Not found') => new AppError('NOT_FOUND', message, 404),
  conflict: (message = 'Resource already exists') => new AppError('CONFLICT', message, 409),
  tooMany: (message = 'Too many requests') => new AppError('RATE_LIMITED', message, 429),
  internal: (message = 'Internal server error') =>
    new AppError('INTERNAL_ERROR', message, 500),
};