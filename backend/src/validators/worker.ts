import { z } from 'zod';

export const workerSearchSchema = z.object({
  q: z.string().optional(),
  service: z.string().optional(), // slug
  category: z.string().optional(), // slug
  city: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  verifiedOnly: z.coerce.boolean().optional(),
  emergency: z.coerce.boolean().optional(),
  sort: z
    .enum(['RECOMMENDED', 'NEAREST', 'HIGHEST_RATED', 'LOWEST_PRICE', 'MOST_EXPERIENCED'])
    .default('RECOMMENDED'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  latitude: z.coerce.number().gte(-90).lte(90).optional(),
  longitude: z.coerce.number().gte(-180).lte(180).optional(),
});

export const updateWorkerProfileSchema = z.object({
  bio: z.string().max(2000).optional(),
  experienceYears: z.number().int().min(0).max(80).optional(),
  city: z.string().max(80).optional(),
  addressLine: z.string().max(200).optional(),
  latitude: z.number().gte(-90).lte(90).optional(),
  longitude: z.number().gte(-180).lte(180).optional(),
  serviceRadiusKm: z.number().int().min(1).max(200).optional(),
  emergencyAvailable: z.boolean().optional(),
  avatarUrl: z.string().optional(),
});

export const upsertServiceSchema = z.object({
  serviceId: z.string().uuid(),
  pricingType: z.enum(['FIXED', 'STARTING_FROM', 'HOURLY', 'QUOTE_REQUIRED']),
  startingPrice: z.number().int().min(0).optional(),
  hourlyRate: z.number().int().min(0).optional(),
  fixedPrice: z.number().int().min(0).optional(),
  estimatedMinutes: z.number().int().min(5).max(24 * 60).optional(),
  emergencyAvailable: z.boolean().optional(),
  description: z.string().max(1000).optional(),
});

export const upsertAvailabilitySchema = z.object({
  entries: z
    .array(
      z.object({
        day: z.enum([
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
          'FRIDAY',
          'SATURDAY',
          'SUNDAY',
        ]),
        isAvailable: z.boolean(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
        endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
        slots: z
          .array(
            z.object({
              startTime: z.string().regex(/^\d{2}:\d{2}$/),
              endTime: z.string().regex(/^\d{2}:\d{2}$/),
            }),
          )
          .max(6)
          .optional(),
      }),
    )
    .max(7),
});

export const setOnlineSchema = z.object({
  isOnline: z.boolean(),
  isAcceptingJobs: z.boolean().optional(),
});

export const submitKycSchema = z.object({
  type: z.enum(['SELFIE', 'NATIONAL_ID_FRONT', 'NATIONAL_ID_BACK', 'NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'BUSINESS_LICENSE', 'ADDRESS_PROOF', 'OTHER']),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1).max(255),
  documentNumber: z.string().max(100).optional(),
  workerNotes: z.string().max(1000).optional(),
});