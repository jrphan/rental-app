import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';

// Load environment variables from .env
config();

const prisma = new PrismaClient();

async function main() {
  // You can override these via env or CLI if needed
  const defaultEmail = 'admin@rentalapp.com';
  const defaultPassword = 'admin123456';

  // Prefer explicit env vars if provided
  const email = process.env.SEED_ADMIN_EMAIL || defaultEmail;
  const password = process.env.SEED_ADMIN_PASSWORD || defaultPassword;

  console.log('Seeding initial data...');
  console.log('----------------------------------------');
  console.log('Admin user:');
  console.log(`  Email   : ${email}`);
  console.log(`  Password: ${password}`);
  console.log('----------------------------------------');

  // Check if an admin already exists with this email
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log(
      `✅ Admin with email ${email} already exists, skipping creation.`,
    );
    return;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
      isVerified: true, // Admin không cần verify email
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
    },
  });

  console.log('✅ Admin user đã được seed thành công!');
  console.log('Thông tin admin:');
  console.log(JSON.stringify(admin, null, 2));
  console.log('\n📝 Bạn có thể đăng nhập với:');
  console.log(`   Email   : ${email}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch(error => {
    console.error('❌ Lỗi khi chạy Prisma seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
