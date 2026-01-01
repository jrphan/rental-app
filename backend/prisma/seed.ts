import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import {
  PrismaClient,
  UserRole,
  VehicleStatus,
  RentalStatus,
  KycStatus,
  LicenseType,
  TransactionType,
  TransactionStatus,
  ReviewType,
  NotificationType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Load environment variables from .env
config();

const prisma = new PrismaClient();

// ==================== DATA CONSTANTS ====================

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

// ==================== HELPER FUNCTIONS ====================

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

function generateCitizenId(): string {
  return String(randomInt(100000000000, 999999999999));
}

function generateDriverLicense(): string {
  return `${String(randomInt(100000, 999999))}-${String(randomInt(1000, 9999))}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

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

  // ==================== 3. CREATE KYC RECORDS ====================
  console.log('📋 Creating KYC records...');

  const kycUsers = users.slice(2).slice(0, 60); // 60 users có KYC
  let kycCount = 0;

  for (const userId of kycUsers) {
    const statuses: KycStatus[] = [
      KycStatus.PENDING,
      KycStatus.APPROVED,
      KycStatus.REJECTED,
      KycStatus.NEEDS_UPDATE,
    ];
    const status = randomElement(statuses);

    try {
      await prisma.kyc.create({
        data: {
          userId,
          citizenId: generateCitizenId(),
          driverLicense: generateDriverLicense(),
          fullNameInId: generateVietnameseName(),
          dob: randomDate(new Date(1990, 0, 1), new Date(2000, 11, 31)),
          addressInId: `${randomElement(WARDS)}, ${randomElement(CITIES_DATA).name}`,
          licenseType: randomElement([
            LicenseType.A1,
            LicenseType.A2,
            LicenseType.A3,
            LicenseType.A4,
          ]),
          idCardFront: 'https://via.placeholder.com/400x250?text=ID+Card+Front',
          idCardBack: 'https://via.placeholder.com/400x250?text=ID+Card+Back',
          licenseFront:
            'https://via.placeholder.com/400x250?text=License+Front',
          licenseBack: 'https://via.placeholder.com/400x250?text=License+Back',
          selfieImg: 'https://via.placeholder.com/400x400?text=Selfie',
          status,
          rejectionReason:
            status === KycStatus.REJECTED
              ? 'Ảnh không rõ ràng, vui lòng chụp lại'
              : null,
          reviewedBy:
            status === KycStatus.APPROVED || status === KycStatus.REJECTED
              ? admin.id
              : null,
          reviewedAt:
            status === KycStatus.APPROVED || status === KycStatus.REJECTED
              ? new Date()
              : null,
        },
      });
      kycCount++;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code !== 'P2002'
      ) {
        throw error;
      }
    }
  }

  console.log(`✅ Created ${kycCount} KYC records\n`);

  // ==================== 4. CREATE VEHICLES ====================
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

  // ==================== 5. CREATE VEHICLE UNAVAILABILITIES ====================
  console.log('🚫 Creating vehicle unavailabilities...');

  const unavailableVehicles = vehicleIds.slice(
    0,
    Math.floor(vehicleIds.length * 0.3),
  );
  let unavailabilityCount = 0;

  for (const vehicleId of unavailableVehicles) {
    const startDate = randomDate(new Date(), addDays(new Date(), 30));
    const endDate = addDays(startDate, randomInt(1, 5));

    try {
      await prisma.vehicleUnavailability.create({
        data: {
          vehicleId,
          startDate,
          endDate,
          reason: randomElement([
            'Bảo trì',
            'Sửa chữa',
            'Chủ xe sử dụng',
            'Không có sẵn',
          ]),
        },
      });
      unavailabilityCount++;
    } catch {
      // Skip on error
    }
  }

  console.log(`✅ Created ${unavailabilityCount} vehicle unavailabilities\n`);

  // ==================== 6. CREATE RENTALS ====================
  console.log('📅 Creating rentals...');

  const NUM_RENTALS = 150;
  const rentalIds: string[] = [];
  const renterUsers = users.slice(2); // All regular users can be renters

  for (let i = 0; i < NUM_RENTALS; i++) {
    const vehicleId = randomElement(vehicleIds);
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) continue;

    const renterId = randomElement(renterUsers);
    const ownerId = vehicle.ownerId;

    const startDate = randomDate(
      addDays(new Date(), -60),
      addDays(new Date(), 30),
    );
    const endDate = addDays(startDate, randomInt(1, 7));
    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const durationMinutes = durationDays * 24 * 60;

    const pricePerDay = Number(vehicle.pricePerDay);
    const deliveryFee =
      vehicle.deliveryAvailable && Math.random() > 0.6
        ? randomInt(50000, 200000)
        : 0;
    const discountAmount = Math.random() > 0.7 ? randomInt(50000, 100000) : 0;
    const insuranceFee = randomInt(50000, 150000);

    const totalPrice =
      pricePerDay * durationDays + deliveryFee - discountAmount;
    const depositPrice = Number(vehicle.depositAmount);
    const platformFeeRatio = 0.15;
    const platformFee = totalPrice * platformFeeRatio;
    const ownerEarning = totalPrice - platformFee;

    const statuses: RentalStatus[] = [
      RentalStatus.COMPLETED,
      RentalStatus.COMPLETED,
      RentalStatus.ON_TRIP,
      RentalStatus.CONFIRMED,
      RentalStatus.PENDING_PAYMENT,
      RentalStatus.CANCELLED,
    ];
    const status = randomElement(statuses);

    try {
      const rental = await prisma.rental.create({
        data: {
          renterId,
          ownerId,
          vehicleId,
          startDate,
          endDate,
          durationMinutes,
          currency: 'VND',
          pricePerDay: new Decimal(pricePerDay),
          deliveryFee: new Decimal(deliveryFee),
          discountAmount: new Decimal(discountAmount),
          insuranceFee: new Decimal(insuranceFee),
          totalPrice: new Decimal(totalPrice),
          depositPrice: new Decimal(depositPrice),
          platformFeeRatio: new Decimal(platformFeeRatio),
          platformFee: new Decimal(platformFee),
          ownerEarning: new Decimal(ownerEarning),
          status,
          startOdometer:
            status !== RentalStatus.PENDING_PAYMENT
              ? randomInt(1000, 50000)
              : null,
          endOdometer:
            status === RentalStatus.COMPLETED ? randomInt(1000, 50000) : null,
          cancelReason:
            status === RentalStatus.CANCELLED
              ? randomElement([
                  'Thay đổi kế hoạch',
                  'Xe không phù hợp',
                  'Giá quá cao',
                ])
              : null,
          deliveryAddress:
            vehicle.deliveryAvailable && deliveryFee > 0
              ? {
                  address: `${randomInt(1, 999)} ${randomElement(['Đường', 'Phố'])} ${generateVietnameseName().split(' ')[2]}`,
                  ward: randomElement(WARDS),
                  district: randomElement(CITIES_DATA).districts[0],
                  city: randomElement(CITIES_DATA).name,
                  lat: randomFloat(10, 22),
                  lng: randomFloat(105, 110),
                }
              : undefined,
        },
      });

      rentalIds.push(rental.id);

      // Create chat for rental
      await prisma.chat.create({
        data: {
          rentalId: rental.id,
          renterId,
          ownerId,
        },
      });

      if ((i + 1) % 30 === 0) {
        console.log(`  Created ${i + 1}/${NUM_RENTALS} rentals...`);
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code !== 'P2002'
      ) {
        const message =
          'message' in error && typeof error.message === 'string'
            ? error.message
            : 'Unknown error';
        console.error(`Error creating rental ${i}:`, message);
      }
    }
  }

  console.log(`✅ Created ${rentalIds.length} rentals\n`);

  // ==================== 7. CREATE TRANSACTIONS ====================
  console.log('💰 Creating transactions...');

  let transactionCount = 0;

  for (const rentalId of rentalIds) {
    const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
    if (!rental) continue;

    const types: TransactionType[] = [
      TransactionType.DEPOSIT,
      TransactionType.PAYMENT,
      TransactionType.PAYOUT,
    ];
    const transactionType = randomElement(types);

    let amount = 0;
    let userId = '';

    if (transactionType === TransactionType.DEPOSIT) {
      amount = Number(rental.depositPrice);
      userId = rental.renterId;
    } else if (transactionType === TransactionType.PAYMENT) {
      amount = Number(rental.totalPrice);
      userId = rental.renterId;
    } else if (transactionType === TransactionType.PAYOUT) {
      amount = Number(rental.ownerEarning);
      userId = rental.ownerId;
    }

    const statuses: TransactionStatus[] = [
      TransactionStatus.SUCCESS,
      TransactionStatus.SUCCESS,
      TransactionStatus.PENDING,
      TransactionStatus.SUCCESS,
    ];
    const status = randomElement(statuses);

    try {
      await prisma.transaction.create({
        data: {
          rentalId,
          userId,
          amount: new Decimal(amount),
          currency: 'VND',
          type: transactionType,
          status,
          description: `Transaction for rental ${rentalId.substring(0, 8)}`,
          stripeIntentId:
            status === TransactionStatus.SUCCESS
              ? `pi_${Math.random().toString(36).substring(2, 15)}`
              : null,
        },
      });
      transactionCount++;
    } catch {
      // Skip on error
    }
  }

  console.log(`✅ Created ${transactionCount} transactions\n`);

  // ==================== 8. CREATE REVIEWS ====================
  console.log('⭐ Creating reviews...');

  const completedRentals = rentalIds.slice(
    0,
    Math.floor(rentalIds.length * 0.6),
  );
  let reviewCount = 0;

  for (const rentalId of completedRentals) {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { vehicle: true },
    });
    if (!rental) continue;

    // Renter reviews vehicle (and indirectly owner)
    if (Math.random() > 0.3) {
      try {
        await prisma.review.create({
          data: {
            rentalId,
            type: ReviewType.RENTER_TO_VEHICLE,
            authorId: rental.renterId,
            revieweeId: rental.ownerId,
            vehicleId: rental.vehicleId,
            rating: randomInt(3, 5),
            content: randomElement([
              'Xe rất tốt, chủ xe thân thiện!',
              'Xe mới, sạch sẽ, rất hài lòng',
              'Dịch vụ tốt, sẽ thuê lại',
              'Xe đẹp, giá hợp lý',
              'Chủ xe nhiệt tình, xe chất lượng',
            ]),
          },
        });
        reviewCount++;
      } catch {
        // Skip duplicate
      }
    }

    // Owner reviews renter
    if (Math.random() > 0.4) {
      try {
        await prisma.review.create({
          data: {
            rentalId,
            type: ReviewType.OWNER_TO_RENTER,
            authorId: rental.ownerId,
            revieweeId: rental.renterId,
            rating: randomInt(4, 5),
            content: randomElement([
              'Khách hàng tốt, trả xe đúng giờ',
              'Rất lịch sự và trách nhiệm',
              'Hài lòng với khách hàng này',
            ]),
          },
        });
        reviewCount++;
      } catch {
        // Skip duplicate
      }
    }
  }

  console.log(`✅ Created ${reviewCount} reviews\n`);

  // ==================== 9. CREATE FAVORITES ====================
  console.log('❤️ Creating favorites...');

  let favoriteCount = 0;
  const favoriteUsers = renterUsers.slice(0, 50);

  for (const userId of favoriteUsers) {
    const numFavorites = randomInt(1, 5);
    const userFavorites = vehicleIds
      .sort(() => 0.5 - Math.random())
      .slice(0, numFavorites);

    for (const vehicleId of userFavorites) {
      try {
        await prisma.vehicleFavorite.create({
          data: {
            userId,
            vehicleId,
          },
        });
        favoriteCount++;
      } catch {
        // Skip duplicate
      }
    }
  }

  console.log(`✅ Created ${favoriteCount} favorites\n`);

  // ==================== 10. CREATE NOTIFICATIONS ====================
  console.log('🔔 Creating notifications...');

  let notificationCount = 0;

  for (let i = 0; i < 200; i++) {
    const userId = randomElement(users);
    const types: NotificationType[] = [
      NotificationType.RENTAL_UPDATE,
      NotificationType.PAYMENT,
      NotificationType.PROMOTION,
      NotificationType.SYSTEM,
      NotificationType.KYC_UPDATE,
    ];
    const type = randomElement(types);

    const messages: Record<
      NotificationType,
      { title: string; message: string }
    > = {
      [NotificationType.RENTAL_UPDATE]: {
        title: 'Cập nhật đơn thuê',
        message: 'Đơn thuê của bạn đã được xác nhận',
      },
      [NotificationType.PAYMENT]: {
        title: 'Thanh toán thành công',
        message: 'Bạn đã thanh toán thành công 500.000 VNĐ',
      },
      [NotificationType.PROMOTION]: {
        title: 'Khuyến mãi mới',
        message: 'Giảm 20% cho đơn thuê đầu tiên',
      },
      [NotificationType.SYSTEM]: {
        title: 'Thông báo hệ thống',
        message: 'Hệ thống sẽ bảo trì vào ngày mai',
      },
      [NotificationType.KYC_UPDATE]: {
        title: 'Cập nhật KYC',
        message: 'Hồ sơ KYC của bạn đã được duyệt',
      },
    };

    const notif = messages[type];

    try {
      await prisma.notification.create({
        data: {
          userId,
          title: notif.title,
          message: notif.message,
          type,
          isRead: Math.random() > 0.4,
          readAt: Math.random() > 0.4 ? new Date() : null,
          data: {
            rentalId: randomElement(rentalIds),
          },
        },
      });
      notificationCount++;
    } catch {
      // Skip on error
    }
  }

  console.log(`✅ Created ${notificationCount} notifications\n`);

  // ==================== SUMMARY ====================
  console.log('═══════════════════════════════════════');
  console.log('✅ SEED COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════');
  console.log(
    `👤 Users: ${users.length} (2 staff + ${users.length - 2} regular)`,
  );
  console.log(`📋 KYC Records: ${kycCount}`);
  console.log(`🛵 Vehicles: ${vehicleIds.length}`);
  console.log(`🚫 Unavailabilities: ${unavailabilityCount}`);
  console.log(`📅 Rentals: ${rentalIds.length}`);
  console.log(`💰 Transactions: ${transactionCount}`);
  console.log(`⭐ Reviews: ${reviewCount}`);
  console.log(`❤️ Favorites: ${favoriteCount}`);
  console.log(`🔔 Notifications: ${notificationCount}`);
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
