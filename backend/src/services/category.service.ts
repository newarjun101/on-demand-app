import { prisma } from '../config/prisma';

export const categoryService = {
  async listCategories() {
    return prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });
  },

  async listServices(categorySlug?: string) {
    return prisma.service.findMany({
      where: {
        isActive: true,
        category: categorySlug ? { slug: categorySlug } : { isActive: true },
      },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  },

  async getServiceBySlug(slug: string) {
    return prisma.service.findUnique({
      where: { slug },
      include: { category: true },
    });
  },
};