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
    city: 'Yangon',
    addressLine: 'Bahan Township',
    lat: 16.8123, lng: 96.1570,
    radius: 15,
    experience: 6,
    services: ['Electrician', 'Appliance Repair', 'AC Repair'],
    prices: { 'Electrician': { pricingType: 'STARTING_FROM', startingPrice: 20000, estimatedMinutes: 60 }, 'Appliance Repair': { pricingType: 'QUOTE_REQUIRED' }, 'AC Repair': { pricingType: 'HOURLY', hourlyRate: 12000, estimatedMinutes: 60 } },
    rating: 4.6, jobs: 89, emergency: true,
    bio: 'Certified electrician. Specialize in home wiring, AC and appliance repairs.',
    portfolio: [],
  },
  {
    email: 'cleaner@demo.com',
    name: 'Ma Thida',
    city: 'Yangon',
    addressLine: 'Kamayut Township',
    lat: 16.8050, lng: 96.1300,
    radius: 8,
    experience: 3,
    services: ['Cleaner', 'Moving Helper'],
    prices: { 'Cleaner': { pricingType: 'HOURLY', hourlyRate: 5000, estimatedMinutes: 120 }, 'Moving Helper': { pricingType: 'HOURLY', hourlyRate: 7000, estimatedMinutes: 180 } },
    rating: 4.9, jobs: 67, emergency: false,
    bio: 'Deep-cleaning specialist. Eco-friendly products and dependable team.',
    portfolio: [],
  },
  {
    email: 'mechanic@demo.com',
    name: 'Kyaw Zin',
    city: 'Mandalay',
    addressLine: 'Chan Aye Tharzan',
    lat: 21.9587, lng: 96.0892,
    radius: 20,
    experience: 10,
    services: ['Mechanic', 'Motorcycle Repair', 'Tire Repair', 'Battery Replacement'],
    prices: { 'Mechanic': { pricingType: 'QUOTE_REQUIRED' }, 'Motorcycle Repair': { pricingType: 'STARTING_FROM', startingPrice: 15000, estimatedMinutes: 90 }, 'Tire Repair': { pricingType: 'FIXED', fixedPrice: 10000, estimatedMinutes: 30 }, 'Battery Replacement': { pricingType: 'FIXED', fixedPrice: 35000, estimatedMinutes: 30 } },
    rating: 4.7, jobs: 211, emergency: true,
    bio: 'ASE-certified mechanic. All vehicle makes and models.',
    portfolio: [],
  },
  {
    email: 'carpenter@demo.com',
    name: 'U Hla',
    city: 'Yangon',
    addressLine: 'Sanchaung',
    lat: 16.8083, lng: 96.1344,
    radius: 10,
    experience: 12,
    services: ['Carpenter', 'Painter'],
    prices: { 'Carpenter': { pricingType: 'QUOTE_REQUIRED' }, 'Painter': { pricingType: 'HOURLY', hourlyRate: 8000, estimatedMinutes: 240 } },
    rating: 4.5, jobs: 154, emergency: false,
    bio: 'Custom furniture, repairs and interior painting.',
    portfolio: [],
  },
  {
    email: 'delivery@demo.com',
    name: 'Ko Aye',
    city: 'Yangon',
    addressLine: 'Hlaing',
    lat: 16.8450, lng: 96.1220,
    radius: 25,
    experience: 2,
    services: ['Package Delivery', 'Part-Time Delivery', 'Errand Runner', 'Moving Helper'],
    prices: { 'Package Delivery': { pricingType: 'FIXED', fixedPrice: 3000, estimatedMinutes: 30 }, 'Part-Time Delivery': { pricingType: 'HOURLY', hourlyRate: 6000, estimatedMinutes: 60 }, 'Errand Runner': { pricingType: 'HOURLY', hourlyRate: 5000, estimatedMinutes: 60 }, 'Moving Helper': { pricingType: 'HOURLY', hourlyRate: 6000, estimatedMinutes: 180 } },
    rating: 4.4, jobs: 73, emergency: false,
    bio: 'Fast and friendly delivery service across Yangon.',
    portfolio: [],
  },
];

async function main() {
  console.log('Seeding...');

  // Clean (only safe in dev)
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

  // Admin
  await prisma.user.create({
    data: {
      role: 'ADMIN',
      email: 'admin@demo.com',
      passwordHash: await hash('Admin@123'),
      fullName: 'Platform Admin',
      isActive: true,
    },
  });

  // Customer
  await prisma.user.create({
    data: {
      role: 'CUSTOMER',
      email: 'customer@demo.com',
      passwordHash: await hash('Customer@123'),
      fullName: 'Zaw Lin',
      phone: '+959123456789',
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

  // Workers
  for (const w of workerSeed) {
    const user = await prisma.user.create({
      data: {
        role: 'WORKER',
        email: w.email,
        passwordHash: await hash('Worker@123'),
        fullName: w.name,
        phone: '+959' + Math.floor(100000000 + Math.random() * 900000000).toString(),
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(w.name)}`,
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });