import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

// Load environment variables
config();

async function createAdmin() {
  // Use dynamic import for CommonJS Prisma client
  const prismaModule = await import('../generated/prisma/index.js');
  const { PrismaClient, UserRole } = prismaModule;

  const prisma = new PrismaClient();
  // Get email and password from command line arguments or use defaults
  const email = process.argv[2] || 'admin@rentalapp.com';
  const password = process.argv[3] || 'admin123456';

  console.log('Creating admin user...');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log(`❌ Admin với email ${email} đã tồn tại!`);
      console.log('Nếu muốn tạo admin mới, hãy sử dụng email khác.');
      process.exit(1);
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
        // isPhoneVerified: false,
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

    console.log('✅ Admin user đã được tạo thành công!');
    console.log('Thông tin admin:');
    console.log(JSON.stringify(admin, null, 2));
    console.log('\n📝 Bạn có thể đăng nhập với:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
  } catch (error) {
    console.error('❌ Lỗi khi tạo admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin().catch((error: unknown) => {
  console.error('❌ Lỗi khi chạy script:', error);
  process.exit(1);
});
