// import { PrismaClient } from '@prisma/client';
// import { config } from 'dotenv';

// // Load environment variables
// config();

// const prisma = new PrismaClient();

// async function seedVehicleTypes() {
//   console.log('🌱 Seeding vehicle types...');

//   const vehicleTypes = [
//     {
//       name: 'car',
//       description: 'Ô tô',
//       icon: '🚗',
//     },
//     {
//       name: 'motorcycle',
//       description: 'Xe máy',
//       icon: '🏍️',
//     },
//     {
//       name: 'bicycle',
//       description: 'Xe đạp',
//       icon: '🚲',
//     },
//     {
//       name: 'scooter',
//       description: 'Xe tay ga',
//       icon: '🛵',
//     },
//     {
//       name: 'truck',
//       description: 'Xe tải',
//       icon: '🚚',
//     },
//     {
//       name: 'van',
//       description: 'Xe tải nhỏ',
//       icon: '🚐',
//     },
//   ];

//   for (const vehicleType of vehicleTypes) {
//     const existing = await prisma.vehicleType.findUnique({
//       where: { name: vehicleType.name },
//     });

//     if (existing) {
//       console.log(`✓ VehicleType "${vehicleType.name}" already exists`);
//     } else {
//       await prisma.vehicleType.create({
//         data: vehicleType,
//       });
//       console.log(`✓ Created VehicleType "${vehicleType.name}"`);
//     }
//   }

//   console.log('✅ Vehicle types seeded successfully!');
// }

// seedVehicleTypes()
//   .catch(error => {
//     console.error('❌ Error seeding vehicle types:', error);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
