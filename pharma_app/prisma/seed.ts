import { PrismaClient } from '@prisma/client';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';

// Define the PrescriptionStatus enum if it's not exported by the Prisma client
enum PrescriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

const prisma = new PrismaClient();

// Common drug names
const drugNames = [
  'Acetaminophen', 'Ibuprofen', 'Aspirin', 'Amoxicillin', 'Lisinopril', 
  'Atorvastatin', 'Metformin', 'Levothyroxine', 'Amlodipine', 'Simvastatin',
  'Omeprazole', 'Albuterol', 'Hydrochlorothiazide', 'Metoprolol', 'Losartan',
  'Gabapentin', 'Sertraline', 'Fluoxetine', 'Montelukast', 'Pantoprazole',
  'Escitalopram', 'Bupropion', 'Prednisone', 'Citalopram', 'Furosemide',
  'Cetirizine', 'Loratadine', 'Fexofenadine', 'Tramadol', 'Naproxen',
  'Meloxicam', 'Clonazepam', 'Alprazolam', 'Zolpidem', 'Trazodone',
  'Warfarin', 'Clopidogrel', 'Rosuvastatin', 'Doxycycline', 'Azithromycin',
  'Ciprofloxacin', 'Levofloxacin', 'Metronidazole', 'Sulfamethoxazole', 'Tamsulosin',
  'Venlafaxine', 'Duloxetine', 'Paroxetine', 'Cyclobenzaprine', 'Carvedilol'
];

// Dosage forms
const forms = [
  'tablet', 'capsule', 'syrup', 'injectable', 'cream', 'ointment', 
  'patch', 'solution', 'suspension', 'gel', 'spray'
];

// Common dosages
const dosages = [
  '5mg', '10mg', '20mg', '25mg', '50mg', '75mg', '100mg', '150mg', '200mg', '250mg',
  '300mg', '400mg', '500mg', '600mg', '800mg', '1g', '2g', '5g', '10g',
  '5mg/ml', '10mg/ml', '20mg/ml', '50mg/ml', '100mg/ml',
  '1%', '2%', '5%', '10%', '20%'
];

// Define drug data interface
interface DrugData {
  name: string;
  dosage: string;
  form: string;
  price: number;
  stock_quantity: number;
}

// Helper to get a random item from an array
const getRandomItem = <T>(items: T[]): T => {
  return items[Math.floor(Math.random() * items.length)];
};

// Generate a random price between $2 and $50 with 2 decimal places
const getRandomPrice = (): number => {
  return Number((Math.random() * 48 + 2).toFixed(2));
};

// Generate a random stock quantity between 10 and 500
const getRandomStock = (): number => {
  return randomInt(10, 501);
};

async function seedDrugs() {
  console.log('🌱 Seeding drugs...');
  
  try {
    // Delete all existing drugs first
    await prisma.$executeRaw`TRUNCATE TABLE "Drug" CASCADE;`;
    console.log('Cleared existing drug records');
  } catch (error) {
    console.warn('Table might not exist yet, continuing with seeding...');
  }
  
  const drugData: DrugData[] = [];
  
  // Generate 100 drugs with random but realistic values
  for (let i = 0; i < 100; i++) {
    const name = getRandomItem(drugNames);
    const dosage = getRandomItem(dosages);
    const form = getRandomItem(forms);
    
    // Make sure we don't create exact duplicates
    const existingDrug = drugData.find(
      drug => drug.name === name && drug.dosage === dosage && drug.form === form
    );
    
    if (!existingDrug) {
      drugData.push({
        name,
        dosage,
        form,
        price: getRandomPrice(),
        stock_quantity: getRandomStock(),
      });
    } else {
      // Try again if we've created this exact drug already
      i--;
    }
  }
  
  // Insert drugs one by one instead of using createMany, which is more compatible with different Prisma setups
  let createdCount = 0;
  for (const drug of drugData) {
    try {
      await prisma.$executeRaw`
        INSERT INTO "Drug" (id, name, dosage, form, price, stock_quantity, "createdAt", "updatedAt") 
        VALUES (gen_random_uuid(), ${drug.name}, ${drug.dosage}, ${drug.form}, ${drug.price}, ${drug.stock_quantity}, NOW(), NOW())
      `;
      createdCount++;
    } catch (error) {
      console.error(`Failed to insert drug: ${drug.name} ${drug.dosage}`, error);
    }
  }
  
  console.log(`✅ Created ${createdCount} drugs`);
}

async function main() {
  console.log('Seeding database...');
  
  // First seed some drugs
  await seedDrugs();
  
  // Check if default admin user exists
  const adminExists = await prisma.user.findFirst({
    where: {
      email: 'admin@pharmaai.com',
    },
  });
  
  // Create admin user if it doesn't exist
  if (!adminExists) {
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    await prisma.user.create({
      data: {
        email: 'admin@pharmaai.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
  }

  // Check if default user exists
  const userExists = await prisma.user.findFirst({
    where: {
      email: 'user@example.com',
    },
  });
  
  // Create a test user if it doesn't exist
  let userId: string;
  if (!userExists) {
    console.log('Creating test user...');
    const hashedPassword = await bcrypt.hash('User123!', 10);
    const user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'USER',
      },
    });
    userId = user.id;
  } else {
    userId = userExists.id;
  }

  try {
    // Create prescriptions for the user
    console.log('Creating sample prescriptions...');
    
    // Sample active prescriptions
    const activePrescriptions = [
      {
        userId,
        medication: 'Amoxicillin',
        dosage: '500mg',
        frequency: '3 times daily',
        prescribedAt: new Date('2025-06-15'),
        endDate: new Date('2025-06-29'),
        doctorName: 'Dr. Sarah Johnson',
        refills: 2,
        status: PrescriptionStatus.ACTIVE,
        instructions: 'Take with food. Complete the full course of antibiotics.',
      },
      {
        userId,
        medication: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        prescribedAt: new Date('2025-05-22'),
        endDate: new Date('2025-11-22'),
        doctorName: 'Dr. Michael Chen',
        refills: 5,
        status: PrescriptionStatus.ACTIVE,
        instructions: 'Take in the morning with water. Monitor blood pressure regularly.',
      },
      {
        userId,
        medication: 'Metformin',
        dosage: '850mg',
        frequency: 'Twice daily',
        prescribedAt: new Date('2025-05-15'),
        endDate: new Date('2025-08-15'),
        doctorName: 'Dr. Emily Rodriguez',
        refills: 3,
        status: PrescriptionStatus.ACTIVE,
        instructions: 'Take with meals to minimize stomach upset.',
      },
      {
        userId,
        medication: 'Atorvastatin',
        dosage: '20mg',
        frequency: 'Once daily at bedtime',
        prescribedAt: new Date('2025-04-10'),
        endDate: new Date('2025-10-10'),
        doctorName: 'Dr. Michael Chen',
        refills: 2,
        status: PrescriptionStatus.ACTIVE,
        instructions: 'Take at night. Avoid grapefruit juice.',
      }
    ];
    
    for (const prescription of activePrescriptions) {
      await (prisma as any).prescription.upsert({
        where: {
          id: `${prescription.medication}-${userId}`.toLowerCase().replace(/\s+/g, '-'),
        },
        update: prescription,
        create: {
          ...prescription,
          id: `${prescription.medication}-${userId}`.toLowerCase().replace(/\s+/g, '-'),
        },
      });
    }
    
    // Sample past/expired prescriptions
    const pastPrescriptions = [
      {
        userId,
        medication: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'As needed for pain',
        prescribedAt: new Date('2025-04-08'),
        endDate: new Date('2025-04-22'),
        doctorName: 'Dr. Emily Rodriguez',
        refills: 0,
        status: PrescriptionStatus.EXPIRED,
        instructions: 'Take with food. Do not exceed 1200mg in 24 hours.',
      },
      {
        userId,
        medication: 'Azithromycin',
        dosage: '250mg',
        frequency: 'Once daily',
        prescribedAt: new Date('2025-03-12'),
        endDate: new Date('2025-03-19'),
        doctorName: 'Dr. Sarah Johnson',
        refills: 0,
        status: PrescriptionStatus.COMPLETED,
        instructions: 'Take on an empty stomach. Complete the full course.',
      },
      {
        userId,
        medication: 'Prednisone',
        dosage: '20mg',
        frequency: 'Once daily, tapering schedule',
        prescribedAt: new Date('2025-02-15'),
        endDate: new Date('2025-02-25'),
        doctorName: 'Dr. David Wilson',
        refills: 0,
        status: PrescriptionStatus.COMPLETED,
        instructions: 'Follow the tapering schedule exactly. Take with food in the morning.',
      }
    ];
    
    for (const prescription of pastPrescriptions) {
      await (prisma as any).prescription.upsert({
        where: {
          id: `${prescription.medication}-${userId}-past`.toLowerCase().replace(/\s+/g, '-'),
        },
        update: prescription,
        create: {
          ...prescription,
          id: `${prescription.medication}-${userId}-past`.toLowerCase().replace(/\s+/g, '-'),
        },
      });
    }
    
    console.log('✅ Created prescriptions successfully');
  } catch (error) {
    console.error('❌ Error creating prescriptions:', error);
  }

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 