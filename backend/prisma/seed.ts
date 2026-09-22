import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function hash(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const categories = [
  { name: 'Home Repair', icon: '🏠', services: ['Plumber', 'Electrician', 'Water Pump Repair', 'Toilet Repair', 'Pipe Repair', 'AC Repair', 'Refrigerator Repair', 'Washing Machine Repair', 'Appliance Repair'] },
  { name: 'Home Services', icon: '🧹', services: ['Cleaner', 'Carpenter', 'Painter', 'Gardener', 'Pest Control', 'Moving Assistance'] },
  { name: 'Vehicle', icon: '🚗', services: ['Mechanic', 'Motorcycle Repair', 'Car Wash', 'Tire Repair', 'Battery Replacement'] },
  { name: 'Delivery & Helpers', icon: '📦', services: ['Part-Time Delivery', 'Package Delivery', 'Moving Helper', 'Event Helper', 'Errand Runner', 'General Labor'] },
];

const workerSeed = [
  {
    email: 'plumber@demo.com',
    name: 'Aung Kyaw',
    avatarSlug: 'aung-kyaw',
    city: 'Yangon',
    addressLine: 'No. 12, Ahlone Road',
    lat: 16.7836, lng: 96.1367,
    radius: 12,
    experience: 8,
    services: ['Plumber', 'Toilet Repair', 'Pipe Repair', 'Water Pump Repair'],
    prices: { 'Plumber': { pricingType: 'STARTING_FROM', startingPrice: 15000, estimatedMinutes: 60 }, 'Toilet Repair': { pricingType: 'FIXED', fixedPrice: 25000, estimatedMinutes: 90 }, 'Pipe Repair': { pricingType: 'QUOTE_REQUIRED' }, 'Water Pump Repair': { pricingType: 'STARTING_FROM', startingPrice: 30000, estimatedMinutes: 120 } },
    rating: 4.8, jobs: 142, emergency: true,
    bio: 'Licensed plumber with 8 years of residential and commercial experience. Quick response and fair pricing.',
    portfolio: ['work-1.svg', 'work-2.svg'],
  },
  {
    email: 'electrician@demo.com',
    name: 'Ko Min',
    avatarSlug: 'ko-min',
    city: 'Yangon',
    addressLine: 'Bahan Township',
    lat: 16.8123, lng: 96.1570,
    radius: 15,
    experience: 6,
    services: ['Electrician', 'Appliance Repair', 'AC Repair'],
    prices: { 'Electrician': { pricingType: 'STARTING_FROM', startingPrice: 20000, estimatedMinutes: 60 }, 'Appliance Repair': { pricingType: 'QUOTE_REQUIRED' }, 'AC Repair': { pricingType: 'HOURLY', hourlyRate: 12000, estimatedMinutes: 60 } },
    rating: 4.6, jobs: 89, emergency: true,
    bio: 'Certified electrician. Specialize in home wiring, AC and appliance repairs.',
    portfolio: ['work-3.svg'],
  },
  {
    email: 'cleaner@demo.com',
    name: 'Ma Thida',
    avatarSlug: 'ma-thida',
    city: 'Yangon',
    addressLine: 'Kamayut Township',
    lat: 16.8050, lng: 96.1300,
    radius: 8,
    experience: 3,
    services: ['Cleaner', 'Moving Helper'],
    prices: { 'Cleaner': { pricingType: 'HOURLY', hourlyRate: 5000, estimatedMinutes: 120 }, 'Moving Helper': { pricingType: 'HOURLY', hourlyRate: 7000, estimatedMinutes: 180 } },
    rating: 4.9, jobs: 67, emergency: false,
    bio: 'Deep-cleaning specialist. Eco-friendly products and dependable team.',
    portfolio: ['work-4.svg'],
  },
  {
    email: 'mechanic@demo.com',
    name: 'Kyaw Zin',
    avatarSlug: 'kyaw-zin',
    city: 'Mandalay',
    addressLine: 'Chan Aye Tharzan',
    lat: 21.9587, lng: 96.0892,
    radius: 20,
    experience: 10,
    services: ['Mechanic', 'Motorcycle Repair', 'Tire Repair', 'Battery Replacement'],
    prices: { 'Mechanic': { pricingType: 'QUOTE_REQUIRED' }, 'Motorcycle Repair': { pricingType: 'STARTING_FROM', startingPrice: 15000, estimatedMinutes: 90 }, 'Tire Repair': { pricingType: 'FIXED', fixedPrice: 10000, estimatedMinutes: 30 }, 'Battery Replacement': { pricingType: 'FIXED', fixedPrice: 35000, estimatedMinutes: 30 } },
    rating: 4.7, jobs: 211, emergency: true,
    bio: 'ASE-certified mechanic. All vehicle makes and models.',
    portfolio: ['work-5.svg'],
  },
  {
    email: 'carpenter@demo.com',
    name: 'U Hla',
    avatarSlug: 'u-hla',
    city: 'Yangon',
    addressLine: 'Sanchaung',
    lat: 16.8083, lng: 96.1344,
    radius: 10,
    experience: 12,
    services: ['Carpenter', 'Painter'],
    prices: { 'Carpenter': { pricingType: 'QUOTE_REQUIRED' }, 'Painter': { pricingType: 'HOURLY', hourlyRate: 8000, estimatedMinutes: 240 } },
    rating: 4.5, jobs: 154, emergency: false,
    bio: 'Custom furniture, repairs and interior painting.',
    portfolio: ['work-6.svg'],
  },
  {
    email: 'delivery@demo.com',
    name: 'Ko Aye',
    avatarSlug: 'ko-aye',
    city: 'Yangon',
    addressLine: 'Hlaing',
    lat: 16.8450, lng: 96.1220,
    radius: 25,
    experience: 2,
    services: ['Package Delivery', 'Part-Time Delivery', 'Errand Runner', 'Moving Helper'],
    prices: { 'Package Delivery': { pricingType: 'FIXED', fixedPrice: 3000, estimatedMinutes: 30 }, 'Part-Time Delivery': { pricingType: 'HOURLY', hourlyRate: 6000, estimatedMinutes: 60 }, 'Errand Runner': { pricingType: 'HOURLY', hourlyRate: 5000, estimatedMinutes: 60 }, 'Moving Helper': { pricingType: 'HOURLY', hourlyRate: 6000, estimatedMinutes: 180 } },
    rating: 4.4, jobs: 73, emergency: false,
    bio: 'Fast and friendly delivery service across Yangon.',
    portfolio: ['work-7.svg'],
  },
];

async function main() {
  console.log('Seeding...');

  // Clean (only safe in dev)
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.adminRole.deleteMany();
  await prisma.adminAuditLog.deleteMany();
  await prisma.kycDocument.deleteMany();
  await prisma.platformConfig.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.requestPhoto.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.workerService.deleteMany();
  await prisma.workerDocument.deleteMany();
  await prisma.portfolioImage.deleteMany();
  await prisma.workerAvailability.deleteMany();
  await prisma.workingHours.deleteMany();
  await prisma.workerProfile.deleteMany();
  await prisma.address.deleteMany();
  await prisma.fileUpload.deleteMany();
  await prisma.user.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();

  // Categories + Services
  let order = 1;
  for (const c of categories) {
    const cat = await prisma.serviceCategory.create({
      data: {
        name: c.name,
        slug: slugify(c.name),
        icon: c.icon,
        sortOrder: order++,
      },
    });
    for (const serviceName of c.services) {
      await prisma.service.create({
        data: {
          categoryId: cat.id,
          name: serviceName,
          slug: slugify(serviceName),
        },
      });
    }
  }

  // Customer
  await prisma.user.create({
    data: {
      role: 'CUSTOMER',
      email: 'customer@demo.com',
      passwordHash: await hash('Customer@123'),
      fullName: 'Zaw Lin',
      phone: '+959123456789',
      avatarUrl: '/uploads/avatars/zaw-lin.svg',
      addresses: {
        create: {
          label: 'Home',
          city: 'Yangon',
          addressLine: 'No. 5, Pyay Road, Kamayut',
          latitude: 16.8050,
          longitude: 96.1300,
          isDefault: true,
        },
      },
    },
  });

  // Admin
  await prisma.user.create({
    data: {
      role: 'ADMIN',
      email: 'admin@demo.com',
      passwordHash: await hash('Admin@123'),
      fullName: 'Platform Admin',
      avatarUrl: '/uploads/avatars/admin.svg',
      isActive: true,
    },
  });

  // Workers
  for (const w of workerSeed) {
    const user = await prisma.user.create({
      data: {
        role: 'WORKER',
        email: w.email,
        passwordHash: await hash('Worker@123'),
        fullName: w.name,
        phone: '+959' + Math.floor(100000000 + Math.random() * 900000000).toString(),
        avatarUrl: `/uploads/avatars/${(w as any).avatarSlug ?? slugify(w.name)}.svg`,
        workerProfile: {
          create: {
            bio: w.bio,
            experienceYears: w.experience,
            city: w.city,
            addressLine: w.addressLine,
            latitude: w.lat,
            longitude: w.lng,
            serviceRadiusKm: w.radius,
            emergencyAvailable: w.emergency,
            isOnline: true,
            isAcceptingJobs: true,
            verificationStatus: 'APPROVED',
            verifiedAt: new Date(),
            completedJobs: w.jobs,
            ratingAverage: w.rating,
            ratingCount: Math.max(1, Math.floor(w.jobs / 3)),
            responseRate: 0.9,
            availability: {
              create: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((d) => ({
                day: d as any,
                isAvailable: true,
                startTime: '08:00',
                endTime: '18:00',
              })),
            },
          },
        },
      },
      include: { workerProfile: true },
    });

    const profile = user.workerProfile!;

    // Services
    for (const serviceName of w.services) {
      const svc = await prisma.service.findUnique({ where: { slug: slugify(serviceName) } });
      if (!svc) continue;
      const p: any = (w.prices as any)[serviceName] ?? { pricingType: 'QUOTE_REQUIRED' };
      await prisma.workerService.create({
        data: {
          workerProfileId: profile.id,
          serviceId: svc.id,
          pricingType: p.pricingType,
          startingPrice: p.startingPrice,
          hourlyRate: p.hourlyRate,
          fixedPrice: p.fixedPrice,
          estimatedMinutes: p.estimatedMinutes,
          emergencyAvailable: w.emergency,
        },
      });
    }

    // Portfolio
    for (const file of w.portfolio) {
      await prisma.portfolioImage.create({
        data: {
          workerProfileId: profile.id,
          imageUrl: `/uploads/portfolio/${file}`,
          caption: 'Sample work',
        },
      });
    }
  }

  console.log('Done. Demo credentials:');
  console.log('  Admin    : admin@demo.com / Admin@123');
  console.log('  Customer : customer@demo.com / Customer@123');
  console.log('  Workers  : plumber@demo.com, electrician@demo.com, cleaner@demo.com, mechanic@demo.com, carpenter@demo.com, delivery@demo.com / Worker@123');

  // -------------------------------------------------------------------
  // Admin portal: permissions, roles, and the default PlatformConfig.
  // -------------------------------------------------------------------
  await bootstrapAdminPortal();
}

async function bootstrapAdminPortal() {
  const PERMISSIONS: { key: string; resource: string; action: string; description: string }[] = [
    // Users
    { key: 'users:view',          resource: 'users', action: 'view',          description: 'View user accounts' },
    { key: 'users:edit',          resource: 'users', action: 'edit',          description: 'Edit user details' },
    { key: 'users:ban',           resource: 'users', action: 'ban',           description: 'Ban or suspend a user' },
    { key: 'users:delete',        resource: 'users', action: 'delete',        description: 'Delete a user account' },
    { key: 'users:impersonate',   resource: 'users', action: 'impersonate',   description: 'Log in as another user' },

    // Workers (verification)
    { key: 'workers:view',         resource: 'workers', action: 'view',         description: 'View worker profiles' },
    { key: 'workers:verify',       resource: 'workers', action: 'verify',       description: 'Approve or reject worker verification' },
    { key: 'workers:suspend',      resource: 'workers', action: 'suspend',      description: 'Suspend a worker' },
    { key: 'workers:edit_profile', resource: 'workers', action: 'edit_profile', description: 'Edit a worker profile on their behalf' },
    { key: 'workers:delete',       resource: 'workers', action: 'delete',       description: 'Delete a worker account' },

    // KYC documents
    { key: 'kyc:view',    resource: 'kyc', action: 'view',    description: 'View KYC documents' },
    { key: 'kyc:approve', resource: 'kyc', action: 'approve', description: 'Approve or reject KYC documents' },

    // Bookings
    { key: 'bookings:view',     resource: 'bookings', action: 'view',     description: 'View all bookings' },
    { key: 'bookings:refund',   resource: 'bookings', action: 'refund',   description: 'Issue a refund' },
    { key: 'bookings:cancel',   resource: 'bookings', action: 'cancel',   description: 'Cancel a booking' },

    // Reviews
    { key: 'reviews:view',   resource: 'reviews', action: 'view',   description: 'View all reviews' },
    { key: 'reviews:delete', resource: 'reviews', action: 'delete', description: 'Delete a review' },

    // Disputes
    { key: 'disputes:view',     resource: 'disputes', action: 'view',     description: 'View disputes' },
    { key: 'disputes:resolve',   resource: 'disputes', action: 'resolve',   description: 'Resolve a dispute' },

    // Categories
    { key: 'categories:view',   resource: 'categories', action: 'view',   description: 'View service categories' },
    { key: 'categories:create', resource: 'categories', action: 'create', description: 'Create a new service category' },
    { key: 'categories:edit',   resource: 'categories', action: 'edit',   description: 'Edit a service category' },
    { key: 'categories:delete', resource: 'categories', action: 'delete', description: 'Delete a service category' },

    // Boosts
    { key: 'boost_tiers:view',   resource: 'boost_tiers', action: 'view',   description: 'View boost pricing tiers' },
    { key: 'boost_tiers:edit',   resource: 'boost_tiers', action: 'edit',   description: 'Edit boost pricing tiers' },

    // Payments / finance
    { key: 'payments:view',      resource: 'payments', action: 'view',      description: 'View all payments' },
    { key: 'payments:refund',    resource: 'payments', action: 'refund',    description: 'Refund a payment' },

    // Analytics
    { key: 'analytics:view',     resource: 'analytics', action: 'view',     description: 'View platform analytics' },
    { key: 'analytics:export',   resource: 'analytics', action: 'export',   description: 'Export analytics data' },

    // Notifications
    { key: 'notifications:view',    resource: 'notifications', action: 'view',    description: 'View notifications' },
    { key: 'notifications:broadcast', resource: 'notifications', action: 'broadcast', description: 'Send a broadcast notification' },

    // Configuration
    { key: 'config:view',   resource: 'config', action: 'view',   description: 'View platform configuration' },
    { key: 'config:edit',   resource: 'config', action: 'edit',   description: 'Edit platform configuration' },

    // Roles & permissions (super-admin only)
    { key: 'roles:view',   resource: 'roles', action: 'view',   description: 'View roles' },
    { key: 'roles:create', resource: 'roles', action: 'create', description: 'Create a new role' },
    { key: 'roles:edit',   resource: 'roles', action: 'edit',   description: 'Edit a role' },
    { key: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete a role' },
    { key: 'roles:assign', resource: 'roles', action: 'assign', description: 'Assign or revoke roles for users' },

    // Audit log
    { key: 'audit:view', resource: 'audit', action: 'view', description: 'View admin audit log' },
  ];

  // Upsert all permissions
  const permMap = new Map<string, string>(); // key -> id
  for (const p of PERMISSIONS) {
    const upserted = await prisma.permission.upsert({
      where: { key: p.key },
      update: { resource: p.resource, action: p.action, description: p.description },
      create: p,
    });
    permMap.set(p.key, upserted.id);
  }

  // Default built-in roles
  const ROLES: { slug: string; name: string; description: string; permissions: string[] }[] = [
    {
      slug: 'super_admin',
      name: 'Super Admin',
      description: 'Full access to everything including role management',
      permissions: PERMISSIONS.map((p) => p.key),
    },
    {
      slug: 'admin',
      name: 'Admin',
      description: 'Manage users, workers, KYC, bookings, disputes, analytics, config',
      permissions: [
        'users:view', 'users:edit', 'users:ban',
        'workers:view', 'workers:verify', 'workers:suspend', 'workers:edit_profile',
        'kyc:view', 'kyc:approve',
        'bookings:view', 'bookings:refund', 'bookings:cancel',
        'reviews:view', 'reviews:delete',
        'disputes:view', 'disputes:resolve',
        'categories:view', 'categories:create', 'categories:edit', 'categories:delete',
        'boost_tiers:view', 'boost_tiers:edit',
        'payments:view', 'payments:refund',
        'analytics:view', 'analytics:export',
        'notifications:view', 'notifications:broadcast',
        'config:view', 'config:edit',
        'audit:view',
      ],
    },
    {
      slug: 'kyc_officer',
      name: 'KYC Officer',
      description: 'Review and approve KYC documents and worker verifications',
      permissions: [
        'users:view',
        'workers:view', 'workers:verify',
        'kyc:view', 'kyc:approve',
        'bookings:view',
      ],
    },
    {
      slug: 'support',
      name: 'Support',
      description: 'View user accounts, bookings and disputes; help resolve issues',
      permissions: [
        'users:view',
        'workers:view',
        'bookings:view',
        'reviews:view',
        'disputes:view', 'disputes:resolve',
        'analytics:view',
      ],
    },
    {
      slug: 'finance',
      name: 'Finance',
      description: 'View payments, refunds, and platform analytics',
      permissions: [
        'payments:view', 'payments:refund',
        'bookings:view',
        'analytics:view', 'analytics:export',
      ],
    },
    {
      slug: 'content_moderator',
      name: 'Content Moderator',
      description: 'Review and moderate reviews, categories, and content',
      permissions: [
        'reviews:view', 'reviews:delete',
        'categories:view', 'categories:create', 'categories:edit',
        'notifications:view', 'notifications:broadcast',
      ],
    },
  ];

  const roleMap = new Map<string, string>(); // slug -> id
  for (const r of ROLES) {
    const created = await prisma.adminRole.upsert({
      where: { slug: r.slug },
      update: { name: r.name, description: r.description, isBuiltIn: true },
      create: {
        slug: r.slug,
        name: r.name,
        description: r.description,
        isBuiltIn: true,
        // Permission assignments are created separately below
      },
    });
    roleMap.set(r.slug, created.id);
    // Wipe existing permissions and re-insert (so editing the seed takes effect)
    await prisma.rolePermission.deleteMany({ where: { roleId: created.id } });
    for (const pkey of r.permissions) {
      const pid = permMap.get(pkey);
      if (!pid) continue;
      await prisma.rolePermission.create({ data: { roleId: created.id, permissionId: pid } });
    }
  }

  // Assign the super_admin role to the seeded admin user
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@demo.com' } });
  if (adminUser) {
    const superId = roleMap.get('super_admin');
    if (superId) {
      const existing = await prisma.userRole.findFirst({
        where: { userId: adminUser.id, roleId: superId },
      });
      if (!existing) {
        await prisma.userRole.create({
          data: { userId: adminUser.id, roleId: superId, assignedBy: 'system' },
        });
      }
    }
  }

  // PlatformConfig singleton
  await prisma.platformConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });

  console.log(`  Roles seeded:        ${ROLES.length}`);
  console.log(`  Permissions seeded:  ${PERMISSIONS.length}`);
  console.log('  PlatformConfig:      singleton');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });