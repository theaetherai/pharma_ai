/**
 * Debug script for checking the drug database and testing drug matching
 * 
 * To run this script:
 * node scripts/debug-drug-database.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDrugDatabase() {
  console.log('=== Debugging Drug Database ===');
  console.log('This script will check your drug database and test matching functionality\n');

  try {
    // 1. Check if the Drug table exists
    console.log('1. Checking if Drug table exists...');
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'Drug'
      ) as exists;
    `;
    
    const tableExists = tableCheck[0]?.exists;
    console.log(`Drug table exists: ${tableExists ? 'YES ✅' : 'NO ❌'}`);
    
    if (!tableExists) {
      console.log('\nERROR: Drug table does not exist. Please run migrations:');
      console.log('npx prisma migrate dev --name add-drug-table');
      return;
    }

    // 2. Count drugs in the database
    console.log('\n2. Counting drugs in the database...');
    const drugCount = await prisma.drug.count();
    console.log(`Total drugs in database: ${drugCount}`);
    
    if (drugCount === 0) {
      console.log('\nERROR: No drugs in the database. Please run the seed script:');
      console.log('npm run seed');
      return;
    } else {
      console.log(`Database has ${drugCount} drugs ✅`);
    }

    // 3. Sample some drugs
    console.log('\n3. Sampling some drugs from database:');
    const sampleDrugs = await prisma.drug.findMany({
      take: 5,
      orderBy: {
        name: 'asc',
      },
    });
    
    console.table(sampleDrugs.map(drug => ({
      id: drug.id.substring(0, 8) + '...',
      name: drug.name,
      dosage: drug.dosage, 
      form: drug.form,
      price: drug.price,
      stock: drug.stock_quantity
    })));

    // 4. Test some matching queries
    console.log('\n4. Testing drug matching queries:');
    const testQueries = [
      'Acetaminophen 500mg',
      'Ibuprofen 200mg',
      'Amoxicillin',
      'NonExistentDrug 10mg',
    ];

    for (const query of testQueries) {
      console.log(`\nMatching: "${query}"`);
      const { drugName, dosage } = parsePrescription(query);
      console.log(`Parsed as: name="${drugName}", dosage=${dosage || 'none'}`);
      
      // First try with exact match (name + dosage)
      if (dosage) {
        console.log('Trying exact match (name + dosage)...');
        const exactMatches = await prisma.drug.findMany({
          where: {
            name: {
              contains: drugName,
              mode: 'insensitive'
            },
            dosage: {
              contains: dosage,
              mode: 'insensitive'
            }
          },
          take: 1,
          orderBy: {
            stock_quantity: 'desc'
          }
        });
        
        if (exactMatches.length > 0) {
          console.log(`✅ Found exact match: ${exactMatches[0].name} ${exactMatches[0].dosage} (${exactMatches[0].form})`);
          continue;
        }
        
        console.log('No exact match, trying partial match...');
      }
      
      // Try name-only match
      console.log('Trying name-only match...');
      const nameMatches = await prisma.drug.findMany({
        where: {
          name: {
            contains: drugName,
            mode: 'insensitive'
          }
        },
        take: 1,
        orderBy: [
          { stock_quantity: 'desc' },
          { price: 'asc' }
        ]
      });
      
      if (nameMatches.length > 0) {
        console.log(`✅ Found name match: ${nameMatches[0].name} ${nameMatches[0].dosage} (${nameMatches[0].form})`);
      } else {
        console.log('❌ No match found');
      }
    }

    console.log('\n=== Drug Database Check Complete ===');
  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function for parsing prescription strings
function parsePrescription(prescription) {
  if (!prescription) {
    return { drugName: '', dosage: null };
  }
  
  // Common dosage patterns
  const dosagePatterns = [
    /\d+\s*mg/i,      // e.g., "500 mg" or "500mg"
    /\d+\s*mcg/i,      // e.g., "50 mcg" or "50mcg"
    /\d+\s*g/i,        // e.g., "1 g" or "1g"
    /\d+\s*ml/i,       // e.g., "5 ml" or "5ml"
    /\d+\s*%/i,        // e.g., "1 %" or "1%"
    /\d+\s*mg\/ml/i,   // e.g., "5 mg/ml" or "5mg/ml"
  ];
  
  // Try to match any dosage pattern
  let dosage = null;
  let dosageMatch = null;
  
  for (const pattern of dosagePatterns) {
    dosageMatch = prescription.match(pattern);
    if (dosageMatch) {
      dosage = dosageMatch[0].replace(/\s+/g, ''); // Remove spaces
      break;
    }
  }
  
  // Extract drug name
  let drugName = prescription;
  if (dosageMatch) {
    drugName = prescription.replace(dosageMatch[0], '').trim();
  }
  
  // Clean up
  drugName = drugName
    .replace(/[^\w\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ')     // Replace multiple spaces with single
    .trim();
  
  return { drugName, dosage };
}

// Run the debug function
debugDrugDatabase().catch(console.error); 