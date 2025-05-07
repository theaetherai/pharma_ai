/**
 * Script to create an admin user in the database
 * Usage: node scripts/create-admin-user.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Creating admin user in the database...');
  
  try {
    // Check if admin user exists
    const adminExists = await prisma.user.findFirst({
      where: {
        email: 'admin@pharmaai.com',
      },
    });
    
    if (adminExists) {
      console.log('Admin user already exists, updating role to ADMIN');
      
      // Update user to ensure they have admin role
      await prisma.user.update({
        where: { email: 'admin@pharmaai.com' },
        data: { role: 'ADMIN' },
      });
      
      console.log('Admin role updated successfully');
      
      // If user has clerkId, check if it's in the database properly
      if (adminExists.clerkId) {
        console.log(`Admin has Clerk ID: ${adminExists.clerkId}`);
      } else {
        console.log('Admin user has no Clerk ID - please associate a Clerk ID with this user');
      }
      
      return;
    }
    
    // Hash password for new admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    // Create new admin user
    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@pharmaai.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    
    console.log('Admin user created successfully:', {
      id: newAdmin.id,
      email: newAdmin.email,
      role: newAdmin.role,
    });
    
    console.log('\nIMPORTANT: Please associate this user with your Clerk account by updating the clerkId field');
    console.log('in the database to match your Clerk user ID after signing in.');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 