import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';

// Load environment variables from .env
config();

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = '123456t@T';

  // Admin info
  const adminPhone = process.env.SEED_ADMIN_PHONE || '0900000001';
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@rentalapp.com';

  // Support info
  const supportPhone = process.env.SEED_SUPPORT_PHONE || '0900000002';
  const supportEmail =
    process.env.SEED_SUPPORT_EMAIL || 'support@rentalapp.com';

  console.log('Seeding initial users...');
  console.log('----------------------------------------');
  console.log('Admin user:');
  console.log(`  Phone   : ${adminPhone}`);
  console.log(`  Email   : ${adminEmail}`);
  console.log(`  Password: ${defaultPassword}`);
  console.log('----------------------------------------');
  console.log('Support user:');
  console.log(`  Phone   : ${supportPhone}`);
  console.log(`  Email   : ${supportEmail}`);
  console.log(`  Password: ${defaultPassword}`);
  console.log('----------------------------------------');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(defaultPassword, salt);

  // Upsert Admin (phone là unique & required)
  const admin = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {},
    create: {
      phone: adminPhone,
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
      isPhoneVerified: true,
      fullName: 'System Admin',
    },
    select: {
      id: true,
      phone: true,
      email: true,
      role: true,
      isActive: true,
      isPhoneVerified: true,
      createdAt: true,
    },
  });

  // Upsert Support
  const support = await prisma.user.upsert({
    where: { phone: supportPhone },
    update: {},
    create: {
      phone: supportPhone,
      email: supportEmail,
      password: hashedPassword,
      role: UserRole.SUPPORT,
      isActive: true,
      isPhoneVerified: true,
      fullName: 'Support Staff',
    },
    select: {
      id: true,
      phone: true,
      email: true,
      role: true,
      isActive: true,
      isPhoneVerified: true,
      createdAt: true,
    },
  });

  console.log('✅ Seed users created/ensured:');
  console.log('Admin:', JSON.stringify(admin, null, 2));
  console.log('Support:', JSON.stringify(support, null, 2));
}

main()
  .catch(error => {
    console.error('❌ Lỗi khi chạy Prisma seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
