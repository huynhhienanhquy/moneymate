import { PrismaClient, CategoryType, WalletType, Role } from '@prisma/client';

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

  // Create admin user
  console.log('Checking for admin user...');
  const adminEmail = 'admin@moneymate.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    console.log('Creating admin user...');
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        fullName: 'Admin',
        avatarUrl: null,
        role: Role.ADMIN
      }
    });
    console.log('Admin user created (admin@moneymate.com / password)');
  } else {
    console.log('Admin user already exists.');
  }

  // Create a default demo user for testing/mocking
  console.log('Checking for demo user...');
  const demoEmail = 'demo@moneymate.com';
  const existingDemoUser = await prisma.user.findUnique({
    where: { email: demoEmail }
  });

  if (!existingDemoUser) {
    console.log('Creating demo user...');
    const demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        fullName: 'Demo User',
        avatarUrl: null
      }
    });

    console.log(`Demo user created. ID: ${demoUser.id}`);

    // Create default wallets for demo user
    console.log('Creating default wallets for demo user...');
    const cashWallet = await prisma.wallet.create({
      data: {
        userId: demoUser.id,
        name: 'Tiền mặt',
        type: WalletType.CASH,
        currency: 'VND',
        initialBalance: 2000000.00
      }
    });

    const bankWallet = await prisma.wallet.create({
      data: {
        userId: demoUser.id,
        name: 'Techcombank',
        type: WalletType.BANK,
        currency: 'VND',
        initialBalance: 15000000.00
      }
    });

    console.log(`Created wallets: ${cashWallet.name}, ${bankWallet.name}`);

    // Create a demo transaction for this user
    const foodCategory = await prisma.category.findFirst({
      where: { name: 'Ăn uống', type: CategoryType.EXPENSE }
    });

    if (foodCategory) {
      await prisma.transaction.create({
        data: {
          userId: demoUser.id,
          walletId: cashWallet.id,
          categoryId: foodCategory.id,
          amount: 150000.00,
          type: 'EXPENSE',
          note: 'Ăn tối cuối tuần',
          transactionDate: new Date()
        }
      });
      console.log('Created sample transaction.');
    }
  } else {
    console.log('Demo user already exists.');
  }

  console.log('Database Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
