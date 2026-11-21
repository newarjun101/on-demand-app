# Database Schema

- **Engine**: PostgreSQL 15 via Prisma ORM (`backend/prisma/schema.prisma`, 742 lines). (VERIFIED)
- **Migrations**: 8 ordered migrations in `backend/prisma/migrations/` (`init`, `add_availability_slots`, `add_boost_and_events`, `add_event_source`, `add_admin_portal`, `add_is_banned`, `add_kyc_document_types`, `add_dynamic_boost_tiers`). (VERIFIED)

## Enums (VERIFIED: `backend/prisma/schema.prisma`)
`Role`, `WorkerVerificationStatus`, `PricingType`, `RequestSchedule`, `RequestStatus`, `QuoteStatus`, `BookingStatus`, `PaymentMethod`, `PaymentStatus`, `NotificationType`, `DisputeStatus`, `DayOfWeek`, `KycDocumentType`, `KycStatus`.

## Models by Domain (VERIFIED: `backend/prisma/schema.prisma`, `docs/PROJECT_KNOWLEDGE.md`)
- **Identity**: `User` (soft-delete via `deletedAt`), `Address`
- **Worker Supply**: `WorkerProfile` (`userId` unique), `WorkerService`, `WorkerAvailability` (unique per day), `WorkingHours`, `WorkerDocument`, `KycDocument`, `PortfolioImage`, `Boost`
- **Catalog**: `ServiceCategory`, `Service` (unique `slug`)
- **Marketplace**: `ServiceRequest`, `RequestPhoto`, `Quote`, `Booking` (1:1 with `requestId` and `quoteId`)
- **Commerce & Trust**: `Payment`, `Review`, `Dispute` (each 1:1 with `Booking`)
- **Communication**: `Conversation` (unique customer + worker + optional request), `Message`, `Notification`
- **Growth**: `Favorite` (unique customer + worker profile), `CustomerEvent`
- **Administration**: `Permission`, `AdminRole`, `RolePermission`, `UserRole`, `AdminAuditLog`, `PlatformConfig` (singleton ID `singleton`)
- **Files**: `FileUpload`
