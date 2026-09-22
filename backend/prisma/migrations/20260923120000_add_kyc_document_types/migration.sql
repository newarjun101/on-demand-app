-- Add document types needed for complete worker identity verification.
ALTER TYPE "KycDocumentType" ADD VALUE IF NOT EXISTS 'SELFIE';
ALTER TYPE "KycDocumentType" ADD VALUE IF NOT EXISTS 'NATIONAL_ID_FRONT';
ALTER TYPE "KycDocumentType" ADD VALUE IF NOT EXISTS 'NATIONAL_ID_BACK';
