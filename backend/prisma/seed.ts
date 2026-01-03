import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import {
  PrismaClient,
  UserRole,
  // VehicleStatus,
  // LicenseType,
} from '@prisma/client';
// import { Decimal } from '@prisma/client/runtime/library';

// Load environment variables from .env
config();

const prisma = new PrismaClient();

// ==================== DATA CONSTANTS ====================
// COMMENTED OUT: Không dùng khi chỉ tạo admin và support
/*
const VIETNAMESE_FIRST_NAMES = [
  'Nguyễn',
  'Trần',
  'Lê',
  'Phạm',
  'Hoàng',
  'Huỳnh',
  'Võ',
  'Đặng',
  'Bùi',
  'Đỗ',
  'Hồ',
  'Ngô',
  'Dương',
  'Lý',
  'Phan',
  'Vương',
  'Trương',
  'Đinh',
  'Đoàn',
  'Phùng',
];

const VIETNAMESE_MIDDLE_NAMES = [
  'Văn',
  'Thị',
  'Minh',
  'Thanh',
  'Hữu',
  'Đức',
  'Công',
  'Quốc',
  'Thành',
  'Đình',
  'Xuân',
  'Hồng',
  'Thu',
  'Hải',
  'Tuấn',
  'Anh',
  'Bảo',
  'Duy',
  'Gia',
  'Khánh',
];

const VIETNAMESE_LAST_NAMES = [
  'An',
  'Bình',
  'Cường',
  'Dũng',
  'Giang',
  'Hùng',
  'Khang',
  'Long',
  'Minh',
  'Nam',
  'Phong',
  'Quân',
  'Sơn',
  'Thành',
  'Tuấn',
  'Vinh',
  'Anh',
  'Bảo',
  'Chi',
  'Dương',
  'Gia',
  'Hân',
  'Khoa',
  'Lan',
  'My',
  'Nhi',
  'Oanh',
  'Phương',
  'Quỳnh',
  'Thảo',
];
*/

// COMMENTED OUT: Không dùng khi chỉ tạo admin và support
/*
const VEHICLE_BRANDS = [
  'Honda',
  'Yamaha',
  'Piaggio',
  'SYM',
  'Suzuki',
  'Kawasaki',
  'Ducati',
  'Vespa',
  'VinFast',
];
const VEHICLE_TYPES = [
  'Xe số',
  'Xe tay ga',
  'Xe phân khối lớn',
  'Xe điện',
  'Xe côn tay',
];
const COLORS = [
  'Đỏ',
  'Xanh dương',
  'Xanh lá',
  'Vàng',
  'Cam',
  'Tím',
  'Đen',
  'Trắng',
  'Bạc',
  'Xám',
  'Nâu',
];

const CITIES_DATA = [
  {
    name: 'Hà Nội',
    lat: 21.0285,
    lng: 105.8542,
    districts: [
      'Ba Đình',
      'Hoàn Kiếm',
      'Hai Bà Trưng',
      'Đống Đa',
      'Cầu Giấy',
      'Thanh Xuân',
    ],
  },
  {
    name: 'Hồ Chí Minh',
    lat: 10.8231,
    lng: 106.6297,
    districts: [
      'Quận 1',
      'Quận 3',
      'Quận 5',
      'Quận 7',
      'Bình Thạnh',
      'Tân Bình',
    ],
  },
  {
    name: 'Đà Nẵng',
    lat: 16.0544,
    lng: 108.2022,
    districts: [
      'Hải Châu',
      'Thanh Khê',
      'Sơn Trà',
      'Ngũ Hành Sơn',
      'Liên Chiểu',
    ],
  },
  {
    name: 'Hải Phòng',
    lat: 20.8449,
    lng: 106.6881,
    districts: ['Hồng Bàng', 'Ngô Quyền', 'Lê Chân', 'Hải An', 'Kiến An'],
  },
  {
    name: 'Cần Thơ',
    lat: 10.0452,
    lng: 105.7469,
    districts: ['Ninh Kiều', 'Bình Thủy', 'Cái Răng', 'Ô Môn', 'Thốt Nốt'],
  },
];

const WARDS = [
  'Phường 1',
  'Phường 2',
  'Phường 3',
  'Phường 4',
  'Phường 5',
  'Xã A',
  'Xã B',
];
*/

// ==================== HELPER FUNCTIONS ====================
// COMMENTED OUT: Không dùng khi chỉ tạo admin và support
/*
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
*/

// COMMENTED OUT: Không dùng khi chỉ tạo admin và support
/*
function randomFloat(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(6));
}

function generateVietnameseName(): string {
  const firstName = randomElement(VIETNAMESE_FIRST_NAMES);
  const middleName = randomElement(VIETNAMESE_MIDDLE_NAMES);
  const lastName = randomElement(VIETNAMESE_LAST_NAMES);
  return `${firstName} ${middleName} ${lastName}`;
}

function generatePhoneNumber(): string {
  const prefix = [
    '090',
    '091',
    '092',
    '093',
    '094',
    '095',
    '096',
    '097',
    '098',
    '099',
    '032',
    '033',
    '034',
    '035',
    '036',
    '037',
    '038',
    '039',
    '070',
    '076',
    '077',
    '078',
    '079',
    '081',
    '082',
    '083',
    '084',
    '085',
    '086',
    '088',
  ];
  const prefixNum = randomElement(prefix);
  const suffix = String(randomInt(1000000, 9999999));
  return `${prefixNum}${suffix}`;
}

function generateEmail(fullName: string): string {
  const domains = [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'zoho.com',
    'icloud.com',
    'protonmail.com',
  ];

  // Chuyển tên thành email format: nguyenvannam -> nguyenvannam@gmail.com
  const nameParts = fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .split(' ')
    .filter(part => part.length > 0);

  // Tạo username từ tên (bỏ dấu, gộp lại)
  const username = nameParts.join('').replace(/[^a-z0-9]/g, '');

  // Thêm số ngẫu nhiên để tránh trùng lặp
  const randomNum = randomInt(100, 99999);
  const finalUsername = `${username}${randomNum}`;

  const domain = randomElement(domains);
  return `${finalUsername}@${domain}`;
}

function generateLicensePlate(): string {
  const prefixes = [
    '29',
    '30',
    '31',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38',
    '39',
    '40',
    '41',
    '43',
    '47',
    '48',
    '49',
    '50',
    '51',
    '52',
    '53',
    '54',
    '55',
    '56',
    '57',
    '58',
    '59',
    '61',
    '62',
    '63',
    '64',
    '65',
    '66',
    '67',
    '68',
    '69',
    '70',
    '71',
    '72',
    '73',
    '74',
    '75',
    '76',
    '77',
    '78',
    '79',
    '80',
    '81',
    '82',
    '83',
    '84',
    '85',
    '86',
    '87',
    '88',
    '89',
    '90',
    '92',
    '93',
    '94',
    '95',
  ];
  const letters = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'K',
    'L',
    'M',
    'N',
    'P',
    'S',
    'T',
    'U',
    'V',
    'X',
    'Y',
    'Z',
  ];
  const prefix = randomElement(prefixes);
  const letter = randomElement(letters);
  // Format: XXA-XXXXX (2 số + 1 chữ + gạch ngang + 5 số)
  const numbers = String(randomInt(10000, 99999)).padStart(5, '0');
  return `${prefix}${letter}-${numbers}`;
}
*/

// ==================== MAIN SEED FUNCTION ====================

async function main() {
  const defaultPassword = '123456t@T';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(defaultPassword, salt);

  console.log('🌱 Starting seed process...\n');

  // ==================== 1. ADMIN & SUPPORT USERS ====================
  console.log('👤 Creating admin and support users...');

  const adminPhone = process.env.SEED_ADMIN_PHONE || '0900000001';
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@rentalapp.com';
  const supportPhone = process.env.SEED_SUPPORT_PHONE || '0900000002';
  const supportEmail =
    process.env.SEED_SUPPORT_EMAIL || 'support@rentalapp.com';

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
  });

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
  });

  console.log(`✅ Created admin: ${admin.phone}`);
  console.log(`✅ Created support: ${support.phone}\n`);

  // ==================== 2. CREATE REGULAR USERS ====================
  // COMMENTED OUT: Chỉ tạo admin và support
  /*
  console.log('👥 Creating regular users...');

  const NUM_USERS = 100;
  const users: string[] = [admin.id, support.id]; // Store user IDs

  for (let i = 1; i <= NUM_USERS; i++) {
    const fullName = generateVietnameseName();
    const phone = generatePhoneNumber();
    const email = generateEmail(fullName);
    const isVendor = Math.random() > 0.6; // 40% là vendor

    try {
      const user = await prisma.user.create({
        data: {
          phone,
          email,
          password: hashedPassword,
          fullName,
          role: UserRole.USER,
          isActive: Math.random() > 0.05, // 95% active
          isPhoneVerified: Math.random() > 0.2, // 80% verified
          isVendor,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`,
        },
      });
      users.push(user.id);

      if (i % 20 === 0) {
        console.log(`  Created ${i}/${NUM_USERS} users...`);
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        // Duplicate phone or email, skip
        continue;
      }
      throw error;
    }
  }

  console.log(`✅ Created ${users.length - 2} regular users\n`);
  */

  // ==================== 3. CREATE VEHICLES ====================
  // COMMENTED OUT: Chỉ tạo admin và support
  /*
  console.log('🛵 Creating vehicles...');

  const NUM_VEHICLES = 80;
  const vehicleIds: string[] = [];
  const vendorUsers = users
    .filter((_, index) => index >= 2 && Math.random() > 0.6)
    .slice(0, 40);

  const vehicleModels: Record<string, string[]> = {
    Honda: [
      'Vision',
      'Lead',
      'SH',
      'PCX',
      'Air Blade',
      'Wave',
      'Future',
      'Winner',
    ],
    Yamaha: [
      'Grande',
      'Janus',
      'Latroz',
      'NMAX',
      'FreeGo',
      'Jupiter',
      'Sirius',
      'Exciter',
    ],
    Piaggio: ['Vespa', 'Liberty', 'Medley', 'Beverly'],
    SYM: ['Attila', 'Galaxy', 'Sherry'],
    Suzuki: ['Hayate', 'Address', 'Satria'],
    Kawasaki: ['Ninja', 'Z', 'Versys'],
    Ducati: ['Monster', 'Panigale'],
    Vespa: ['GTS', 'Sprint', 'Primavera'],
    VinFast: ['Klara', 'Theon', 'Feliz'],
  };

  for (let i = 0; i < NUM_VEHICLES; i++) {
    const cityData = randomElement(CITIES_DATA);
    const brand = randomElement(VEHICLE_BRANDS);
    const models = vehicleModels[brand] || ['Model X', 'Model Y'];
    const model = randomElement(models);
    const licensePlate = generateLicensePlate();

    // Distribute vehicles across vendors
    const ownerId = randomElement(
      vendorUsers.length > 0 ? vendorUsers : users.slice(2),
    );

    const pricePerDay = randomInt(150000, 500000);
    const depositAmount = pricePerDay * randomInt(3, 7);
    const statuses: VehicleStatus[] = [
      VehicleStatus.APPROVED,
      VehicleStatus.APPROVED,
      VehicleStatus.APPROVED,
      VehicleStatus.PENDING,
      VehicleStatus.APPROVED,
    ]; // Mostly approved
    const status = randomElement(statuses);

    try {
      const vehicle = await prisma.vehicle.create({
        data: {
          ownerId,
          type: randomElement(VEHICLE_TYPES),
          brand,
          model,
          year: randomInt(2018, 2024),
          color: randomElement(COLORS),
          licensePlate,
          engineSize: randomInt(50, 300),
          requiredLicense: randomElement([
            LicenseType.A1,
            LicenseType.A2,
            LicenseType.A3,
          ]),
          address: `${randomInt(1, 999)} ${randomElement(['Đường', 'Phố'])} ${generateVietnameseName().split(' ')[2]}`,
          district: randomElement(cityData.districts),
          ward: randomElement(WARDS),
          city: cityData.name,
          fullAddress: `${randomInt(1, 999)} ${randomElement(['Đường', 'Phố'])} ${generateVietnameseName().split(' ')[2]}, ${randomElement(WARDS)}, ${randomElement(cityData.districts)}, ${cityData.name}`,
          lat: cityData.lat + randomFloat(-0.1, 0.1),
          lng: cityData.lng + randomFloat(-0.1, 0.1),
          pricePerDay: new Decimal(pricePerDay),
          depositAmount: new Decimal(depositAmount),
          instantBook: false,
          deliveryAvailable: Math.random() > 0.4,
          deliveryFeePerKm: new Decimal(randomInt(5000, 15000)),
          deliveryRadiusKm: randomElement([null, randomInt(5, 20)]),
          status,
          description: `Xe ${brand} ${model} ${randomInt(2018, 2024)} màu ${randomElement(COLORS)}, tình trạng tốt, đầy đủ phụ tùng. Phù hợp cho việc di chuyển trong thành phố và đi du lịch.`,
          cavetFront: 'https://via.placeholder.com/600x400?text=Cavet+Front',
          cavetBack: 'https://via.placeholder.com/600x400?text=Cavet+Back',
          images: {
            create: [
              {
                url: 'https://via.placeholder.com/800x600?text=Vehicle+Front+1',
                isPrimary: true,
                order: 0,
              },
              {
                url: 'https://via.placeholder.com/800x600?text=Vehicle+Side+2',
                isPrimary: false,
                order: 1,
              },
              {
                url: 'https://via.placeholder.com/800x600?text=Vehicle+Back+3',
                isPrimary: false,
                order: 2,
              },
              ...(Math.random() > 0.3
                ? [
                    {
                      url: 'https://via.placeholder.com/800x600?text=Vehicle+Detail+4',
                      isPrimary: false,
                      order: 3,
                    },
                  ]
                : []),
            ],
          },
        },
      });

      vehicleIds.push(vehicle.id);

      if ((i + 1) % 20 === 0) {
        console.log(`  Created ${i + 1}/${NUM_VEHICLES} vehicles...`);
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        // Duplicate license plate, skip
        continue;
      }
      throw error;
    }
  }

  console.log(`✅ Created ${vehicleIds.length} vehicles\n`);
  */

  // ==================== SUMMARY ====================
  console.log('═══════════════════════════════════════');
  console.log('✅ SEED COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════');
  console.log('👤 Users: 2 (1 admin + 1 support)');
  console.log('═══════════════════════════════════════');
  console.log('\n🔐 Default password for all users: ' + defaultPassword);
  console.log('📱 Admin phone: ' + adminPhone);
  console.log('📱 Support phone: ' + supportPhone);
}

main()
  .catch(error => {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
