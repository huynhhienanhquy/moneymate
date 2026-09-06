import { PrismaClient, CategoryType } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  // Income Categories
  { name: 'Lương', type: CategoryType.INCOME, color: '#4CAF50', icon: 'briefcase' },
  { name: 'Kinh doanh', type: CategoryType.INCOME, color: '#8BC34A', icon: 'trending-up' },
  { name: 'Đầu tư', type: CategoryType.INCOME, color: '#009688', icon: 'dollar-sign' },
  { name: 'Quà tặng', type: CategoryType.INCOME, color: '#E91E63', icon: 'gift' },
  { name: 'Khác (Thu nhập)', type: CategoryType.INCOME, color: '#9E9E9E', icon: 'more-horizontal' },

  // Expense Categories
  { name: 'Ăn uống', type: CategoryType.EXPENSE, color: '#FF5722', icon: 'utensils' },
  { name: 'Thuê nhà', type: CategoryType.EXPENSE, color: '#795548', icon: 'home' },
  { name: 'Hóa đơn & Tiện ích', type: CategoryType.EXPENSE, color: '#FFC107', icon: 'receipt' },
  { name: 'Di chuyển', type: CategoryType.EXPENSE, color: '#03A9F4', icon: 'car' },
  { name: 'Giải trí', type: CategoryType.EXPENSE, color: '#9C27B0', icon: 'gamepad-2' },
  { name: 'Sức khỏe', type: CategoryType.EXPENSE, color: '#F44336', icon: 'heart-pulse' },
  { name: 'Giáo dục', type: CategoryType.EXPENSE, color: '#3F51B5', icon: 'graduation-cap' },
  { name: 'Mua sắm', type: CategoryType.EXPENSE, color: '#673AB7', icon: 'shopping-bag' },
  { name: 'Khác (Chi tiêu)', type: CategoryType.EXPENSE, color: '#607D8B', icon: 'more-horizontal' }
];

async function main() {
  console.log('Start seeding standard system categories...');

  for (const cat of defaultCategories) {
    // System categories have userId = null
    const existing = await prisma.category.findFirst({
      where: {
        userId: null,
        name: cat.name,
        type: cat.type
      }
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          type: cat.type,
          color: cat.color,
          icon: cat.icon,
          userId: null
        }
      });
      console.log(`Created default category: ${cat.name} (${cat.type})`);
    } else {
      console.log(`Category already exists: ${cat.name} (${cat.type})`);
    }
  }

  console.log('Seeding standard categories completed.');
  console.log('Account seeding is disabled; use registration or a separate secure admin bootstrap.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
