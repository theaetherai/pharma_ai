/**
 * Script to associate a Clerk ID with an existing user
 * Usage: node scripts/associate-clerk-id.js <email> <clerkId>
 * Example: node scripts/associate-clerk-id.js admin@pharmaai.com user_2wJRcZ4rGH6W2BvoJAvZe8xtjCh
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get arguments from command line
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error('Error: You must provide both email and clerkId arguments');
    console.log('Usage: node scripts/associate-clerk-id.js <email> <clerkId>');
    console.log('Example: node scripts/associate-clerk-id.js admin@pharmaai.com user_2wJRcZ4rGH6W2BvoJAvZe8xtjCh');
    process.exit(1);
  }
  
  const [email, clerkId] = args;
  
  console.log(`Associating Clerk ID ${clerkId} with user ${email}`);
  
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }
    
    // Update user with Clerk ID
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { clerkId },
    });
    
    console.log('User updated successfully:', {
      id: updatedUser.id,
      email: updatedUser.email,
      clerkId: updatedUser.clerkId,
      role: updatedUser.role,
    });
  } catch (error) {
    console.error('Error updating user:', error);
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